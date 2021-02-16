import { Component, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserPermissionsService } from '../../Expert/user-permissions/user-permissions.service';
import { Role } from 'entities/rolePermissions';
import { GeneralService } from '../../_service/General/general.service';
import { AuthenticationService } from '../../_service/Authentication/authentication.service';
import { TreeSelectionResult } from '../../Components/units-tree/units-tree.models';
import { Localizer } from '../../modules/localization.module';
import { User } from 'entities/user';
import { UserType } from '../../entites/UserType';
import { MatDialog } from '@angular/material/dialog';
import { UserCardComponent } from '../user-card/user-card.component';
import { ConfirmationService, MessageService } from 'primeng/api';

// tslint:disable-next-line: interface-over-type-literal
type DropDownListItem = { label: string, value: number };

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'user-permissions',
  templateUrl: './user-permissions.component.html',
  styleUrls: ['./user-permissions.component.scss'],
  providers: [ConfirmationService, MessageService]
})

export class UserPermissionsComponent {
  private _selectedUsers: User[];

  isNavigationLoading = false;
  loadingPercent = 0;
  selectedUser: User;

  usersData = []; // the route-resolved model data
  rolesData: Role[]; // the route-resolved model data
  rolesItems: DropDownListItem[]; // ddl roles

  userTypesData: UserType[];
  userTypesDisplayItems: DropDownListItem[]; // ddl userTypes

  selectedRole: Role;
  loggedUser: User;
  selectedUserType = -1;

  @ViewChild('dt', { static: false }) dtRef: ElementRef;

  // user table columns
  tableColumns = [
    { field: 'UserId', header: Localizer.get('Common.UserId') },
    { field: 'UserName', header: Localizer.get('Common.UserName') },
    { field: 'UserFirstName', header: Localizer.get('Common.FirstName') },
    { field: 'UserLastName', header: Localizer.get('Common.LastName') },
    { field: 'UserEmail', header: Localizer.get('Common.Email') },
    { field: 'RoleNameText', header: Localizer.get('Common.Role') },
    { field: 'UserCreateDate', header: Localizer.get('Common.LastUpdate') },
    { field: 'UserStatus', header: Localizer.get('Common.Status') },
    { field: 'UnitGuid', header: Localizer.get('Common.Organization') },
  ];

  get selectedUsers(): User[] {
    return this._selectedUsers;
  }
  set selectedUsers(v: User[]) {
    this._selectedUsers = v;
  }

  get currentTextAlign(): string {
    return Localizer.settings.position;
  }
  get currentDirection(): string {
    return Localizer.settings.direction;
  }

  // tslint:disable-next-line: member-ordering
  private _loading = false;
  public get loading(): boolean {
    return this._loading;
  }
  public set loading(value: boolean) {
    let interval: NodeJS.Timeout;
    if (value) {
      interval = setInterval(() => {
        this.loadingPercent = this.loadingPercent + 30;
        if (this.loadingPercent >= 100) {
          this.loadingPercent = 100;
          clearInterval(interval);
        }
      }, 200);
    } else {
      this.loadingPercent = 0;
      clearInterval(interval);
    }
    this._loading = value;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserPermissionsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private authservice: AuthenticationService,
    private dialog: MatDialog
  ) {
    const _self = this;
    this.loggedUser = this.authservice.currentUserValue;
    this.usersData = this.route.snapshot.data['modelData'].users;
    this.rolesData = this.route.snapshot.data['modelData'].roles as Role[];
    this.userTypesData = this.route.snapshot.data['modelData'].userTypes as UserType[];

    this.userTypesDisplayItems = this.userTypesData.map(x => ({ label: x.TypeName, value: x.UserTypeId }))
    this.userTypesDisplayItems.push({ label: Localizer.get('Common.All'), value: -1 });

    this.rolesItems = this.rolesData.map(role => ({
      label: Localizer.language === 'en' ? role.RoleName : role.Description,
      value: role.RoleId
    }))
    this.rolesItems.push({ label: Localizer.get('Common.All'), value: -1 });

    document.getElementById('spinnerRouter').style.display = 'none';

    // subscribe to users changes
    this.userService.userDataSource.subscribe((data) => {
      if (data === null) { return; }
      _self.usersData = data;
      const selectedUsersGuids = _self.selectedUsers && _self.selectedUsers.length
        ? _self.selectedUsers.map(u => u.UserGuid)
        : [];
      _self.selectedUsers = _self.usersData.filter((u) => selectedUsersGuids.indexOf(u.UserGuid) >= 0);
      _self.selectedUser = _self.selectedUsers.length ? _self.selectedUsers[0] : undefined;
    });
  }

  async activateUsers() {
    if (!this.selectedUsers.length) { return; }
    this.loading = true;
    const result = await this.userService.activateUsers(this.selectedUsers);
    if (result) {
      this.messageService.add({ key: 'msg', severity: 'success', summary: '', detail: 'success' });
    } else {
      this.messageService.add({ key: 'msg', severity: 'error', summary: '', detail: 'error' });
    }
    this.loading = false;
  }

  async deactivateUsers() {
    if (!this.selectedUsers.length) { return; }
    this.loading = true;
    const result = await this.userService.deactivateUsers(this.selectedUsers);
    if (result) {
      this.messageService.add({ key: 'msg', severity: 'success', summary: '', detail: 'success' });
    } else {
      this.messageService.add({ key: 'msg', severity: 'error', summary: '', detail: 'error' });
    }
    this.loading = false;
  }

  async sendEmails() {
    if (!this.selectedUsers.length) { return; }
    this.loading = true;
    const result = await this.userService.sendEmails(this.selectedUsers);
    this.loading = false;
  }

  async GetCandidateByInterFace() {
    this.confirmationService.confirm({
      message: Localizer.get('UserPermissions.ImportConfirmMessage'),
      header: Localizer.get('UserPermissions.ImportConfirmHeader'),
      icon: null,
      accept: async () => {
        this.loading = true;
        const result = await this.userService.GetCandidateByInterFace();
        this.loading = false;
        if (result === true) {
          this.messageService.add({
            severity: 'success',
            summary: Localizer.get('UserPermissions.SummaryImport'),
            detail: Localizer.get('UserPermissions.Detail1')
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: Localizer.get('UserPermissions.SummaryImport'),
            detail: Localizer.get('UserPermissions.Detail2')
          });
        }
      },
      reject: () => {
      }
    });
  }

  async deleteUsers() {
    if (!this.selectedUsers.length) { return; }

    const _this = this;
    const message = _this.selectedUsers.length > 1
      ? Localizer.get('UserPermissions.DlgDeleteManyQuestion', _this.selectedUsers.length)
      : Localizer.get('UserPermissions.DlgDeleteSingleQuestion', _this.selectedUsers[0].UserName)

    this.confirmationService.confirm({
      message: message,
      header: Localizer.get('UserPermissions.DlgTitle'),
      icon: null,
      accept: async () => {
        _this.loading = true;
        await _this.userService.deleteUsers(_this.selectedUsers);
        _this.loading = false;
      },
      reject: () => {
      }
    });
  }

  createUser() {
    this.selectedUser = User.default;
    this.openUserCard(this.selectedUser, new Event('createUser'));
  }

  saveUser(userModel: User) {
    if (!this.selectedUsers.length) { return; }
    this.userService.updateUser(userModel);
  }

  filterDataTable(tableData: any, fieldName: string, event: any) {
    if (event.value < 0) {
      tableData.filter(event.value, fieldName, 'notEquals') // 'RoleId'
    } else {
      tableData.filter(event.value, fieldName, 'equals')
    }
  }

  openUserCard(user: User, event: any) {
    this.selectedUser = user;

    this.rolesData = this.route.snapshot.data['modelData'].roles;
    this.userTypesData = this.route.snapshot.data['modelData'].userTypes;

    const dialogRef = this.dialog.open(UserCardComponent, {
      width: '1250px', height: '680px', disableClose: true,
      panelClass: 'page-card-dialog',
      backdropClass: 'backdropBackground',
      data: {
        roles: this.rolesData, userTypes: this.userTypesData, userData: this.selectedUser
      }
    });

    dialogRef.afterClosed().subscribe((userData: boolean | undefined) => {
      if (userData === true) {
        this.messageService.add({
          key: 'msg', severity: 'success',
          detail: Localizer.get('ToastMessage.ActionSuccess')
        });
        dialogRef.close();
      } else if (userData === false) {
        this.messageService.add({
          key: 'msg', severity: 'success',
          detail: Localizer.get('ToastMessage.ActionFailed')
        });
      }
    });
  }

  onRowSelect(event: any) {
    this.selectedUser = event.data;
  }

  onRowUnselect(event: any) {
    if (this.selectedUsers.length === 0) {
      this.selectedUser = undefined;
    }
  }

  onUnitsTreeDataChange(data) {
  }

  onUnitsTreeSelectedChange(tableData: any, result: TreeSelectionResult) {

    if (result.multipleSelection) {
      const selectedGuids = result.selectedNodes.map(x => x.guid);
      const usersDataSource = this.userService.getUsers();

      if (result.selectedNodes.length > 0) {
        this.usersData = usersDataSource.filter((item) => selectedGuids.some(s => s === item.UnitGuid));
      } else {
        this.usersData = Array.from(usersDataSource);
        tableData.filter('', 'UnitGuid', 'notEquals');
      }
    } else if (!result.multipleSelection && result.isSelectedNode) {
      tableData.filter(result.selectedNode.guid, 'UnitGuid', 'equals');
    } else {
      tableData.filter('', 'UnitGuid', 'notEquals');
    }
  }

  onUserNameFilterChange(tableData, data: any) {
    if (data && data.length > 1) {
      tableData.filter(data, 'UserFirstName', 'contains');
    } else {
      tableData.filter('', 'UserFirstName, UserLastName', 'notEquals');
    }
  }

  exportToExel() {
  }

  navigate(url: string) {
    this.isNavigationLoading = true;
    this.router.navigateByUrl(url);
  }
}
