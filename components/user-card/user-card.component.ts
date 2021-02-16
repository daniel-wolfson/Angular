import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, Renderer2, ChangeDetectorRef, AfterViewInit, Inject, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ControlValueAccessor } from '@angular/forms';
import { UserPermissionsService } from '../user-permissions/user-permissions.service';
import { User } from 'entities/user';
import { Role } from 'entities/rolePermissions';
import { TreeSelectionResult } from 'app/Components/units-tree/units-tree.models';
import { AuthenticationService } from 'app/_service/Authentication/authentication.service';
import { Localizer } from 'app/modules/localization.module';
import { UserType } from 'app/entites/UserType';
import { RoleTypes, UserTypes } from 'app/_service/General/enums';
import { GeneralService } from 'app/_service/General/general.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserCardData } from '../user-permissions/user-permissions.models';
import { MessageService } from 'primeng/api';

type RoleDisplayItem = { label: string, value: number };

@Component({
    selector: 'user-card',
    templateUrl: './user-card.component.html',
    styleUrls: ['./user-card.component.scss']
})
export class UserCardComponent implements OnInit, OnDestroy {
    loggedUser: User;
    dataLoading = true;
    convertLoading = false;
    userForm: FormGroup;
    submitted = false;
    //isDialogValidSubject = new BehaviorSubject(undefined);
    //isDialogValid = this.isDialogValidSubject.asObservable();

    rolesData: Role[] = [];
    userRoles: Role[] = [];
    rolesItems: RoleDisplayItem[] = [];
    permissionsData = []; //the route-resolved model data
    selectedValue: string;
    // permission table columns
    permissionsColumns = [
        //{ field: 'RoleId', header: Localizer.get('UserCard.SystemRole') },
        { field: 'RoleName', header: Localizer.get('UserCard.SystemRole') }
    ];

    // user table columns
    rolesColumns = [
        { field: 'OrgName', header: Localizer.get('UserCard.OrgName') },
        { field: 'Description', header: Localizer.get('UserCard.Description') },
        { field: 'UpdateDate', header: Localizer.get('UserCard.UpdateDate') },
        { field: 'UpdateUserFullName', header: Localizer.get('UserCard.UpdateUserFullName') },
        { field: 'Status', header: Localizer.get('UserCard.Status') }
    ];

    @ViewChild("userCardPassword", { static: false }) userCardPasswordRef: ElementRef;
    currentRoleId: number | undefined = undefined;
    currentJobTitleGuid: string;
    currentUnit: any;
    defaultRoleId: number;
    currentUnitGuid: string;
    currentUnitName: string;
    currentOrgGuid: string;
    currentPassword: string;
    currentUserIsNew: boolean;
    userDataTreeLoaded = false;
    userTypes: UserType[];
    userData: User;
    selectedLanguage: string;

    constructor(private formBuilder: FormBuilder, private route: ActivatedRoute,
        private userService: UserPermissionsService, private messageService: MessageService,
        private authService: AuthenticationService,
        private generalService: GeneralService, // using into html
        public dialogRef: MatDialogRef<UserCardComponent, boolean | undefined>,
        @Inject(MAT_DIALOG_DATA) public dialogData: UserCardData
    ) {

        this.dataLoading = false;
        this.visible = true;
        this.rolesData = dialogData.roles;
        this.userData = dialogData.userData;
        this.userTypes = dialogData.userTypes;
        this.currentUnit = dialogData.userData.UnitGuid;
        this.loggedUser = this.authService.currentUserValue;
        this.selectedLanguage = Localizer.language;

        // subscribe to roles changes
        this.userService.roleDataSource.subscribe((data) => {
            this.rolesData = data;
            this.rolesData.forEach((role) => {
                this.rolesItems.push({ 
                    label: Localizer.language === 'en' ? role.RoleName : role.Description, 
                    value: role.RoleId 
                });
            });
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.userForm.controls; }

    @Input() visible: boolean;
    @Output() errorValidation = new EventEmitter();

    async ngOnInit() {
        document.getElementById('spinnerRouter').style.display = 'none';

        // userForm
        this.userForm = this.formBuilder.group({
            UserGuid: [''],
            UserId: ['', Validators.required],
            UserName: ['', Validators.required],
            UserFirstName: ['', Validators.required],
            UserLastName: ['', Validators.required],
            UserMail: [''], //, [Validators.required, Validators.email]
            UserMobilePhone: ['', Validators.required],
            RoleId: ['', Validators.required],
            Password: ['', Validators.required],
            PasswordSource: [''],
            UserBusinessPhone: [''],
            UserNotes: [''],
            UserStatus: [''],
            UnitGuid: ['', Validators.required],
            UserType: ['']
        });

        try {
            this.userForm.patchValue({
                UserGuid: this.userData.UserGuid,
                UserId: this.userData.UserId,
                UserName: this.userData.UserName,
                UserFirstName: this.userData.UserFirstName,
                UserLastName: this.userData.UserLastName,
                UserMail: this.userData.UserMail,
                UserMobilePhone: this.userData.UserMobilePhone,
                UserBusinessPhone: this.userData.UserBusinessPhone,
                Password: this.userData.Password,
                UserNotes: this.userData.UserNotes,
                UserStatus: this.userData.UserStatus,
                RoleId: this.userData.RoleId,
                UnitGuid: this.userData.UnitGuid,
                UserType: this.userData.UserType
            });
            this.userForm.get('UserType').valueChanges.subscribe(
                selectedValue => {
                    const userType = this.userForm.value.UserType;
                    if (selectedValue !== userType) {
                        this.filterRoleItems(selectedValue);
                    }
                }
            );
        } catch (error) {
            this.errorValidation.emit("userForm validation of userData error")
        }

        if (this.userData.UserGuid === "")
            this.userForm.patchValue({ UserId: "" });

        this.currentRoleId = this.userData.RoleId;
        this.defaultRoleId = this.userData.RoleId;
        this.currentUnitGuid = this.userData.UnitGuid;
        this.currentUnitName = this.userData.UnitName || '';
        this.currentJobTitleGuid = this.userData.JobTitleGuid;
        this.permissionsData = this.userData.RolePermissions;
        this.currentPassword = this.userData.Password;

        if (this.currentRoleId && this.currentRoleId !== undefined)
            this.userRoles = this.filterRoles(this.currentRoleId);

        if (this.currentPassword) {
            const data = await this.userService.togglePassword(this.currentPassword);
            this.userForm.patchValue({ Password: data });
        }
    }

    // Work against memory leak if component is destroyed
    ngOnDestroy() {
    }

    filterRoles(roleId: number) {
        const results = this.rolesData
            .filter((role: Role) => {
                return role.RoleId === roleId;
            }, this)
            .map((role: Role) => {
                role.OrgName = this.currentUnitName;
                return role;
            });
        return results;
    }

    filterRoleItems(userType: number) {
        this.rolesItems = this.rolesData
            .map((role) => { 
                return { label: Localizer.language === 'en' ? role.RoleName : role.Description, value: role.RoleId } 
            });

        if (userType === UserTypes.HR) {
            this.rolesItems = this.rolesItems.filter(x => x.value === RoleTypes.NoPermissions);
            this.userForm.patchValue({ RoleId: 0 });
        }
        else if (userType === UserTypes.UserHR) {
            this.rolesItems = this.rolesItems.filter(x => x.value === RoleTypes.ClientUser 
                || x.value === RoleTypes.PermissionManager || x.value === RoleTypes.UserEval);
        this.userForm.patchValue({ RoleId: 4 });
        }
        else { // userType=UserTypes.User
            this.userForm.patchValue({ RoleId: this.defaultRoleId });
        }
    }

    selectRole(event) {
        this.userForm.patchValue({ RoleId: this.currentRoleId });
    }

    async passwordOnFocus(event) {
        event.preventDefault();

        if (!event.currentTarget.classList.contains('password-source')) {
            this.convertLoading = true;

            const passwordLostFocus = async (event: Event) => {
                event.currentTarget.removeEventListener("focusout", passwordLostFocus);
            }
            event.currentTarget.addEventListener("focusout", passwordLostFocus);
        }
    }

    togglePassword = async () => {
        const customPassword = this.userForm.get("Password").value;

        if (customPassword) {
            const passwordText = await this.userService.togglePassword(customPassword);
            this.userForm.patchValue({ Password: passwordText });
        }
        this.convertLoading = false;
    }

    public get currentDirection(): string {
        return Localizer.settings.direction;
    }

    async onShow() {
    }

    onUnitsTreeSelectedChange(result: TreeSelectionResult) {
        if (result && result.selectedNode && result.isSelectedNode) {
            this.currentUnitGuid = result.selectedNode.guid;
            this.currentUnitName = result.selectedNode.name;
        }
        else {
            this.currentUnitGuid = '';
            this.currentUnitName = Localizer.get('UserCard.NotSelected');
        }

        this.userForm.patchValue({ UnitGuid: this.currentUnitGuid });

        if (this.currentRoleId && this.currentRoleId != undefined)
            this.userRoles = this.filterRoles(this.currentRoleId);
    }

    onUnitsTreeDataChange(data) {
        this.userDataTreeLoaded = data && data.lenght > 0;
    }

    @HostListener('window:keyup.esc') onKeyUp() {
        this.dialogRef.close();
    }

    onClose() {
        this.dialogRef.close();
    }

    async onSubmit() {
        this.submitted = true;
        this.dataLoading = true;

        if (this.userForm.invalid) {
            this.messageService.add({
                key: "notify-user-card", 
                severity: 'error', summary: '', 
                detail: Localizer.get('UserCard.VerificationFailed') 
            });
        }
        else {
            const user = this.userForm.value as User;
            user.UnitGuid = this.currentUnitGuid;
            user.RoleId = this.currentRoleId;
            user.UserAdminPermission = this.currentRoleId;

            this.dataLoading = true;
            const result = await this.userService.updateUser(user);
            this.dataLoading = false;

            if (result === true) {
                this.dialogRef.close(result);
            }
        }
    }
}
