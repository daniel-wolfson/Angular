import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { User } from 'entities/user';
import { AuthenticationService } from '../../_service/Authentication/authentication.service';
import { UserPermissionsService } from '../user-permissions/user-permissions.service';
import { OrganizationService } from 'app/_service/_serviceExpert/organization.service';
import { TreeBuilder } from 'app/Components/units-tree/units-tree.builder';
import { Role } from 'entities/rolePermissions';

@Injectable()
export class UnitPermissionsResolve implements Resolve<any> {
    currentUser: User;

    constructor(
        private authservice: AuthenticationService,
        private userService: UserPermissionsService,
        private orgService: OrganizationService,
        private treeBuilder: TreeBuilder,
    ) {
        this.authservice.loggedUser.subscribe(x => this.currentUser = x);
    }

    async resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const loggedUser = this.authservice.currentUserValue;

        // const unitDataSource = await this.orgService.GetOrganizationAsync();
        // const units = this.treeBuilder.flatten(unitDataSource.children);
        // const roles = await this.userService.loadRoles();
        // const role = roles.find(x => x.RoleId == 4);
        const userTypes = await this.userService.GetUserTypes();

        return { userTypes };
    }
}