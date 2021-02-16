import { User } from "entities/user";

export interface TreeTableData {
    JobTitle: string;
    JobTitleGuid: string;
    Language: number;
    OrgGuid: string;
    OrgName: string;
    Password: string;
    RoleId: number;
    RoleItems: any[]
    RoleName: string;
    RoleNameText: string;
    RolePermissions: [];
    UnitGuid: string;
    UnitName: string;
    UserAdminPermission: 8
    UserAdminPermissionText: string;
    UserBusinessPhone: string;
    UserCreateDate: string;
    UserFirstName: string;
    UserGuid: string;
    UserId: string;
    UserImg: string;
    UserLastName: string;
    UserMail: string;
    UserMobilePhone: string;
    UserName: string;
    UserNotes: string;
    UserStatus: string;
    UserStatusSaveCode: number
}

export interface UserCardData {
    roles: any[];
    userTypes: any[];
    userData: User;
  }