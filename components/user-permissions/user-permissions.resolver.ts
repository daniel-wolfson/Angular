import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { User } from 'entities/user';
import { BaseService } from '../../_service/base.service';
import { UserPermissionsService } from './user-permissions.service';
import { AuthenticationService } from '../../_service/Authentication/authentication.service';

@Injectable()
export class UserPermissionsResolve implements Resolve<any> {
    currentUser: User;

    constructor(
        private baseService: BaseService, 
        private authservice: AuthenticationService,
        private userService: UserPermissionsService) {

        this.authservice.loggedUser.subscribe(x => this.currentUser = x);
    }

    async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        //const userGuid = route.routeConfig.path === 'userCard/:userGuid' ? route.params.userGuid : "";
        const loggedUser = this.authservice.currentUserValue;
        const users = await this.userService.loadUsers(loggedUser.UserGuid);
        const roles = await this.userService.loadRoles(loggedUser.RoleId);
        const userTypes = await this.userService.GetUserTypes();
        return { users, roles, userTypes };
    }
}