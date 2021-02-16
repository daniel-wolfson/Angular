import { Component, ViewChild, ElementRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Role } from 'entities/rolePermissions';
import { AuthenticationService } from '../../_service/Authentication/authentication.service';
import { TreeSelectionResult } from '../../Components/units-tree/units-tree.models';
import { Localizer } from '../../modules/localization.module';
import { User } from 'entities/user';
import { UserType } from '../../entites/UserType';
import { ConfirmationService, MessageService } from 'primeng/api';
import { OrganizationService } from 'app/_service/_serviceExpert/organization.service';
import { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } from 'http-status-codes';
import { TreeBuilder } from 'app/Components/units-tree/units-tree.builder';
import { LocalStorageService } from 'app/_service/local-storage.services';

// tslint:disable-next-line: interface-over-type-literal
type DropDownListItem = { label: string, value: number };

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'unit-permissions',
  templateUrl: './unit-permissions.component.html',
  styleUrls: ['./unit-permissions.component.scss'],
  providers: [ConfirmationService, MessageService]
})

export class UnitPermissionsComponent implements OnInit {
  isNavigationLoading = false;
  loadingPercent = 0;

  selectedOwnerUnit: string;
  selectedPermissionUnits: any[] = [];
  selectedListUnits: any[] = [];
  unitsData = []; // the route-resolved model data
  rolesData: Role[]; // the route-resolved model data
  rolesItems: DropDownListItem[]; // ddl roles

  userTypesData: UserType[];
  userTypesDisplayItems: DropDownListItem[]; // ddl userTypes

  selectedRoleId: number; // { label: string; value: number};
  loggedUser: User;
  selectedUserType = -1;

  @ViewChild('dt', { static: false }) dtRef: ElementRef;

  // user table columns
  tableColumns = [
    { field: 'guid', header: Localizer.get('Common.Id') },
    { field: 'name', header: Localizer.get('Common.Organization') }
  ];


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
    private orgService: OrganizationService,
    private localStorageService: LocalStorageService,
    private authservice: AuthenticationService,
    private messageService: MessageService
  ) {
    this.loggedUser = this.authservice.currentUserValue;
    this.userTypesData = this.route.snapshot.data['modelData'].userTypes as UserType[];

    this.userTypesDisplayItems = this.userTypesData.map(x => ({ label: x.TypeName, value: x.UserTypeId }))
    this.selectedOwnerUnit = this.localStorageService.get('unitsSelectedOwner');

    document.getElementById('spinnerRouter').style.display = 'none';
  }

  async ngOnInit() {
    await this.orgService.GetOrganizationAsync();
  }

  async save() {
    this.messageService.add({ key: 'msg', severity: 'info', detail: '...wait', summary: '' });
    
    const statusCode: StatusCodes =
      await this.orgService.UpdatePermissionUnits(this.selectedOwnerUnit, this.selectedPermissionUnits);
    const detail = Localizer.get("Common.Saving") + Localizer.get("StatusCodes." + statusCode);
    let severity = "";

    if (statusCode == StatusCodes.OK) {
      const loggedUser = this.authservice.currentUserValue;
      this.orgService.cacheClear("/api/ExpertApi/GetOrganizationTree");
      
      severity = 'success';
    } else if (statusCode == StatusCodes.NOT_MODIFIED) {
      severity = 'warn';
    } else {
      severity = 'error';
    }

    this.messageService.clear();
    this.messageService.add({ key: 'msg', severity: severity, detail: detail, summary: '' });

    if (statusCode == StatusCodes.OK)  {
      //this.router.navigate(['/units'],{relativeTo:this.route})
      //this.ngOnInit();
      await this.router.navigateByUrl('/users', { skipLocationChange: true });
      this.router.navigateByUrl('/units');
    }
  }

  public get saveEnabled(): boolean {
    return this.selectedOwnerUnit !== undefined && this.selectedOwnerUnit !== '';
  }

  onRowSelect(event: any) {
  }

  onRowUnselect(event: any) {
    if (this.selectedPermissionUnits.length === 0) {
    }
  }

  async onOwnerUnitsTreeSelectedChange(tableData: any, result: TreeSelectionResult) {
    if (result.selectedNodes.length) {
      this.selectedOwnerUnit = result.selectedNode.guid;
      setTimeout(() => {
        this.selectedPermissionUnits = result.selectedNode.permission_units ? result.selectedNode.permission_units : [];
      }, 1000);
    } else {
      this.selectedOwnerUnit = undefined;
      this.selectedPermissionUnits = [];
    }

    this.localStorageService.set('unitsSelectedOwner', this.selectedOwnerUnit);
  }

  async onPermissionUnitsTreeSelectedChange(tableData: any, result: TreeSelectionResult) {
    if (result.selectedNodes.length) {
      this.selectedPermissionUnits = result.selectedNodes.map(node => (node.guid));
      this.selectedListUnits = result.selectedNodes.map(node => ({ guid: node.guid, name: node.name }));
    } else {
      this.selectedListUnits = [];
      this.selectedPermissionUnits = [];
    }
  }

  exportToExel() {
  }

  searchSelectedGuid(data: any, event: any) {
  }

  navigate(url: string) {
    this.isNavigationLoading = true;
    this.router.navigateByUrl(url);
  }
}
