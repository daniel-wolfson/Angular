import { Injectable } from '@angular/core';
import { BaseService } from '../../_service/base.service';

import { BehaviorSubject, Observable } from 'rxjs';
import { Role } from 'entities/rolePermissions';
import { User } from 'entities/user';
import { StatusCodes } from 'http-status-codes';
//import { HttpClient } from '@angular/common/http';
//import { UserType } from 'app/entites/UserType';

@Injectable({ providedIn: 'root' })
export class UserPermissionsService extends BaseService {
  private userItems$: BehaviorSubject<User[]> = new BehaviorSubject<User[]>(null);
  private roleItems$: BehaviorSubject<Role[]> = new BehaviorSubject<Role[]>(null);
  // private userTypeItems$: BehaviorSubject<UserType[]> = new BehaviorSubject<UserType[]>(null);
  
  public userDataSource: Observable<User[]> = this.userItems$.asObservable();
  public roleDataSource: Observable<Role[]> = this.roleItems$.asObservable();
  // public userTypeDataSource: Observable<UserType[]> = this.userTypeItems$.asObservable();

  async loadUsers(userGuid: string = undefined, isReload = false): Promise<User[]> {
    const url = userGuid ? `/api/ExpertApi/GetUsers/${userGuid}` : `/api/ExpertApi/GetUsers`;
 
    if (isReload) {
      this.cacheClear(url);
      this.cacheClearContains("user");
    }

    const cacheExist = this.cacheKeyContains(url);
    const results = await this.getResultAsync<User[]>(url);

    if (isReload || !cacheExist) {
      this.userItems$.next(results);
    }

    return results;
  }

  async GetUserTypes() {  
    const url = `/api/ExpertApi/GetUsersTypes`;
    const results = await this.getAsync<any[]>(url);
    return results;
  }
  
  async loadRoles(roleId: number | undefined = undefined, isReload = false): Promise<Role[]> {
    const url = `/api/ExpertApi/GetRoles/${roleId ?? ''}`;
    
    if (isReload) {
      this.cacheClear(url);
      this.cacheClearContains("roles");
    }

    const cacheExist = this.cacheKeyContains(url);
    const results = await this.getResultAsync<Role[]>(url);
    
    if (isReload || !cacheExist) {
      this.roleItems$.next(results);
    }
    
    return results;
  }

  async loadUnits(isReload = false): Promise<any[]> {
    const url = `/api/ExpertApi/GetOrganizationTree`;

    if (isReload) {
      this.cacheClear(url);
      this.cacheClearContains("user");
    }

      const results = await this.getResultAsync<any>(url);
    return results;
  }

  async activateUsers(users: User[]): Promise<boolean> {
    const userGuids = Array.from(users.map((user) => user.UserGuid));
    const url = `/api/ExpertApi/ActivateUsers`;
    const result = await this.postAsync<boolean>(url, userGuids);
    await this.loadUsers(undefined, true);
    return result;
  }

  async deactivateUsers(data: User[]): Promise<boolean> {
    const userGuids = data.map((user) => user.UserGuid);
    const url = `/api/ExpertApi/DeactivateUsers`;
    const result = await this.postAsync<boolean>(url, userGuids);
    await this.loadUsers(undefined, true);
    return result;
  }

  async deleteUsers(users: User[]): Promise<boolean> {
    if (!users.length) return;
    const userGuids = users.map((user) => user.UserGuid);
    const url = `/api/ExpertApi/DeleteUsers`;
    const result = await this.postAsync<boolean>(url, userGuids);
    await this.loadUsers(undefined, true);
    return result;
  }

  async sendEmails(users: User[]): Promise<boolean> {
    if (!users.length) return;
    const userGuids = users.map((user) => user.UserGuid);
    let result = await this.postAsync<boolean>(`/api/ExpertApi/SendEmails`, userGuids);
    return result;
  }

  async GetCandidateByInterFace(): Promise<boolean> {
    let result = await this.getAsync<boolean>(`/api/ExpertApi/InterfaceGetCandidates`);
    await this.loadUsers(undefined, true);
    return result;
  }

  async exportToExcel(users: User[]) {
    if (!users.length) return;
    const userGuids = users.map((user) => user.UserGuid);
    let result = await this.postAsync(`/api/ExpertApi/DeleteUsers`, userGuids);
    return result;
  }

  async updateUser(userDetails: User): Promise<boolean> {
    if (!userDetails) return;

    const result = await this.postAsync<boolean>('/api/ExpertApi/UpdateUser', userDetails);
    await this.loadUsers(undefined, true);

    return result;
  }  
  
  async updateRoles(units: string[]): Promise<boolean> {
    if (!units || units.length == 0) return;

    const result = await this.postAsync<boolean>('/api/ExpertApi/UpdateRoles', units);
    return result;
  }

  async togglePassword(passwordText: string) {
    let url = `/api/ExpertApi/TogglePassword`;
    const result = await this.postAsync<any>(url, { PasswordText : passwordText });
    return result;
  }

  resultValidate(result: any): boolean {
    const isValid = ((typeof result === "boolean" && result === true)
      || (result !== undefined && result !== null && result.length));
    return isValid;
  }

  getUsers() {
    return this.userItems$.value;
  }

  getRoles() {
    return this.roleItems$.value;
  }
}
