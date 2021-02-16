import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthenticationService } from 'app/_service/Authentication/authentication.service';
import { User } from "entities/user";
import { RoleTypes } from 'app/_service/General/enums';
import { PermissionTypes } from 'entities/rolePermissions';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    constructor(
        private router: Router,
        private authenticationService: AuthenticationService
    ) {
    }

    async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const path = route.routeConfig.path
        let roleId = route.queryParams['roleId'];
        let loggedUser: User = this.authenticationService.currentUserValue;

        // can activate route for form/:guid and roleId parameter
        if (roleId && path === "form/:guid") {
            loggedUser = this.authenticationService.currentUserValue;

            if (loggedUser && loggedUser.islogged) {
                this.authenticationService.logout();
            }
            await this.authenticationService.loginAsync("Anonymous", "Anonymous", 1);
            loggedUser = this.authenticationService.currentUserValue;
        }

        // navigate to login for not relevant path's
        if (loggedUser && loggedUser.RoleId === RoleTypes.Anonymous && path !== "form/:guid" && roleId) {
            this.authenticationService.logout();
            this.router.navigate(['/Login'], { queryParams: {} });
            return false;
        }
        // validate token
        else if (loggedUser && !this.authenticationService.validateToken()) {
            this.authenticationService.currentUserSubject.next(null);
            loggedUser = this.authenticationService.currentUserValue;
        }

        let isRoutePermitted = true;

        // isRoutePermitted for the roleType UserEval
        if (loggedUser && loggedUser.RoleId === RoleTypes.UserEval && state.url.indexOf('reportExt') >= 0) {
            return isRoutePermitted;
        }

        // define permissoms for current route
        if (loggedUser && loggedUser.RoleId !== RoleTypes.Anonymous) {
            var routePermissionTypeName = PermissionTypes[this.urlToPermissionTypeName(state.url)];
            if (loggedUser?.RolePermissions?.length && routePermissionTypeName) {
                if (loggedUser.isPermissionDisabled(routePermissionTypeName)) {
                    isRoutePermitted = false;
                }
            }
        }

        // can navigate
        if (loggedUser && isRoutePermitted) {
            return true;
        }

        if (loggedUser && loggedUser.islogged) {
            this.authenticationService.logout();
        }

        // can not navigate in so redirect to login page with the return url
        this.router.navigate(['/Login']); // , { queryParams: { returnUrl: state.url } }
        return false;
    }

    private urlToPermissionTypeName(url: string): string {
        let text = url.replace('/', '');
        text = text.replace(/[-_\s.]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
        return "Open_" + text.substr(0, 1).toUpperCase() + text.substr(1);
    }
}