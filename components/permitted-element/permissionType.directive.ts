import { Directive, Input, HostBinding, OnInit, Renderer2, AfterViewInit } from '@angular/core';
import { UserPermissionsService } from 'app/Expert/user-permissions/user-permissions.service';
import { User } from 'entities/user';
import { AuthenticationService } from 'app/_service/Authentication/authentication.service';
import { PermissionTypes } from 'entities/rolePermissions';
import { Component, ElementRef } from '@angular/core';
import { RoleTypes } from 'app/_service/General/enums';

@Directive({
  selector: '[permissionType]',
  // host: {
  //   '(click)':'click()'
  // }
})
export class PermissionTypeDirective implements AfterViewInit {

  private loggedUser: User;

  @Input('permissionType') permissionType: keyof typeof PermissionTypes;
  @HostBinding('disabled') disabled: boolean;

  constructor(private el: ElementRef, private renderer: Renderer2, private authService: AuthenticationService) {
    this.loggedUser = this.authService.currentUserValue;
  }

  ngAfterViewInit(): void {
    if (this.loggedUser.RoleId === RoleTypes.Anonymous || this.loggedUser.isPermissionDisabled(PermissionTypes[this.permissionType])) {
      this.el.nativeElement.disabled = true;
      document.removeEventListener('click', this.el.nativeElement, false);
    }
  }
}
