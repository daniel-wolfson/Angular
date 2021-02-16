import {
  Component, OnInit, ElementRef, Input,
  Output, EventEmitter, forwardRef, AfterViewInit, Renderer2, ViewChild, OnChanges, SimpleChanges
} from '@angular/core';
import { MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { OrganizationService } from 'app/_service/_serviceExpert/organization.service';
import { SelectionModel } from '@angular/cdk/collections';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { AuthenticationService } from 'app/_service/Authentication/authentication.service';
import { User } from 'entities/user';
import { TreeBuilder } from './units-tree.builder';
import { TodoItemFlatNode, TodoItemNode, TreeSelectionResult } from './units-tree.models';
import { FlatTreeControl } from '@angular/cdk/tree';
import { RoleTypes } from 'app/_service/General/enums';

import { Localizer } from 'app/modules/localization.module';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserPermissionsService } from 'app/Expert/user-permissions/user-permissions.service';
import { UnitFlatTreeControl } from './units-tree.control';

export interface TreeComponentData {
  treeControl: FlatTreeControl<TodoItemFlatNode>;
  treeBuilder: TreeBuilder;
  multipleSelection: boolean;
  checkListSelection: SelectionModel<TodoItemFlatNode>;
}

declare var $: any;

@Component({
  selector: 'units-tree',
  templateUrl: './units-tree.component.html',
  styleUrls: ['./units-tree.component.scss'],
  providers: [
    ConfirmationService, MessageService, OrganizationService, TreeBuilder,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UnitsTreeComponent),
      multi: true
    }
  ]
})

export class UnitsTreeComponent implements OnInit, AfterViewInit, TreeComponentData { //ControlValueAccessor
  private _title: string;
  private _isValueBind = false;
  private currentElementName: string;

  public loggedUser: User;
  public selectedItem;
  public selectedUnit = "";
  public dataTreeLoaded = false;
  public selectedNode: TodoItemFlatNode;
  public selectedNodes: TodoItemFlatNode[];

  @ViewChild('unitsTree') unitsTreeDivRef: ElementRef;
  @Input() disabled: boolean;
  @Input() width: number;
  @Input() height: number;
  @Input() minHeight = 25;
  @Input() maxHeight: number = this.currentHeight;
  @Input() styles: any;
  @Input() dir = 'rtl';
  @Input() titleEnabled = true;
  @Input() isValid = false;
  @Input() searchEnabled: boolean;
  @Input() startExpandAll = false;
  @Input() childNodesSelection = false;
  @Input() multipleSelection = false;
  @Input() filterRole: string;
  @Input() toolbarEnabled = false;

  private _selectedItems: any[] = [];
  public get selectedItems(): any[] {
    return this._selectedItems;
  }
  @Input()
  public set selectedItems(value: any[]) {
    if (this.dataTreeLoaded && JSON.stringify(this._selectedItems) === JSON.stringify(value)) {
        return;
    }

    this._selectedItems = value;

    if (this.dataTreeLoaded) {
      this.onChangeSelection(new Event("selectionChanged"));
    }
  }

  @Input()
  public get title(): string { return this._title + this.selectedUnit; }
  public set title(v: string) { this._title = v; }

  private _visible = false;
  @Input()
  public get visible(): boolean { return this._visible }
  public set visible(v: boolean) { this._visible = v; }

  @Output() selectedChange = new EventEmitter<TreeSelectionResult>();
  @Output() dataChange = new EventEmitter();
  @Output() treeLoaded = new EventEmitter();

  private _selectedUnitSet: Set<string> = new Set<string>();
  public get selectedUnits(): string[] {
    return Array.from(this._selectedUnitSet.values());
  }

  private _value: string;
  @Input()
  public get value(): string { return this._value }
  public set value(value: string) {
    if (value === null) return;

    this._isValueBind = value !== undefined && value !== null;

    this._value = value;

    if (this.dataTreeLoaded) {
      this.onChangeValue(value, new Event("valueChanged"));
    }
  }

  public get currentHeight(): number {
    var height = window.innerHeight
      || document.documentElement.clientHeight
      || document.body.clientHeight;
    return height;
  }

  /******************** definition of organization-tree begin ********************/
  nodesListSearch: TodoItemFlatNode[] = [];
  nodeListAfterSearch = [];
  currentSearchIndex = 0;
  treeControl: UnitFlatTreeControl<TodoItemFlatNode>;
  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;
  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  //TreeControllTemp: CustomFlatTreeControl<TodoItemFlatNode>;
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();
  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();
  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;
  /** The new item's name */
  newItemName = '';
  /** The selection for checklist */
  checkListSelection: SelectionModel<TodoItemFlatNode>;
  /* Drag and drop */
  dragNode: any;
  dragNodeExpandOverWaitTimeMs = 300;
  dragNodeExpandOverNode: any;
  dragNodeExpandOverTime: number;
  dragNodeExpandOverArea: string;

  getLevel = (node: TodoItemFlatNode) => node.level;
  isExpandable = (node: TodoItemFlatNode) => node.expandable;
  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;
  hasChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable;
  addNewRowChild = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.expandable = true;
  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) => _nodeData.name != undefined ? _nodeData.name === '' : _nodeData.model_name === '';

  /* Transformer to convert nested node to flat node. Record the nodes in maps for later use. */
  transformer = (node: TodoItemNode, level: number) => {
    let flatNode: TodoItemNode | TodoItemFlatNode;
    const existingNode = this.nestedNodeMap.get(node);
    const parentNode = (level > 0) ? this.treeFlattener.flattenNodes[level - 1] : node;

    if (node.name != undefined) {
      flatNode = existingNode && existingNode.name === node.name
        ? existingNode
        : new TodoItemNode();

      flatNode.name = node.name;
      flatNode.guid = node.guid;
      flatNode.parent = node.parent;
      flatNode.parent_guid = node.parent_guid;
      flatNode.model_component_type = node.model_component_type;
      flatNode.remark = node.remark;
      flatNode.description_type = node.description_type;
      flatNode.org_type = node.org_type;
      flatNode.descriptions = node.descriptions;
      flatNode.models = node.models;
    }
    else {
      flatNode = existingNode && existingNode.model_name === node.model_name
        ? existingNode
        : new TodoItemNode();

      flatNode.data = node.data;
      flatNode.model_name = node.data.name;
      flatNode.model_guid = node.data.model_component_guid;
      flatNode.parent = node.data.guid; //TODO: ???
      flatNode.model_component_type = node.data.model_component_type;
      flatNode.professional_instruction = node.data.professional_instruction;
      flatNode.description_type = node.data.description_type;
      flatNode.org_type = node.data.org_type;
      flatNode.descriptions = node.data.description_list;
    }

    flatNode.permission_units = node.permission_units;
    flatNode.children = node.children;
    flatNode.level = level;
    flatNode.expandable = (node.children && node.children.length > 0);
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }
  /******************** definition of organization-tree end ********************/

  get data(): TodoItemFlatNode[] { return this.dataSource.data; }
  set data(value: TodoItemFlatNode[]) {
    this.treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private unitsTreeRef: ElementRef,
    private authService: AuthenticationService,
    private orgService: OrganizationService,
    public treeBuilder: TreeBuilder) {

    this.loggedUser = this.authService.currentUserValue;
    this.treeFlattener = new MatTreeFlattener(this.transformer.bind(this), this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new UnitFlatTreeControl<TodoItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener, []);
    this.dataSource.data = [];
    this.treeBuilder.dataNodesChange.subscribe(this.treeDataNodesChange.bind(this));
    this.treeBuilder.dataSourceChange.subscribe(data => { });
  }

  async ngOnInit() {
    this.dir = Localizer.direction;
    this.multipleSelection = Boolean(JSON.parse(this.multipleSelection + ""));
    this.checkListSelection = new SelectionModel<TodoItemNode>(this.multipleSelection /* multiple */);

    if (!this.dataTreeLoaded) {
      await this.loadDataAsync();

      if (this.value && this.value !== "") {
        this.onChangeValue(this.value, new Event("valueChanged"));
      }
      else if (this.selectedItems && this.selectedItems.length) {
        this.onChangeValue(this.value, new Event("selectionChanged"));
      }
    }
  }

  ngAfterViewInit() {
    this.currentElementName = this.unitsTreeRef.nativeElement.getAttribute('id');
    // const height = this.unitsTreeRef.nativeElement.parentElement.offsetHeight;
    // this.treeBodyHeight = height - (this.toolbarEnabled ? 40 : 0) - (this.searchEnabled ? 30 : 0) - (this.titleEnabled ? 0 : 0);

    this.treeLoaded.next({
      treeControl: this.treeControl,
      treeBuilder: this.treeBuilder,
      multipleSelection: this.multipleSelection,
      checkListSelection: this.checkListSelection,
    } as TreeComponentData);

    if (this._isValueBind || this._selectedItems.length) {
      //this.treeControl.expand(node);
      setTimeout(() => {
        this.scrollToView(this.value, new Event("ngAfterViewInit"));
      }, 1300);
    }
  }

  // Work against memory leak if component is destroyed
  ngOnDestroy() {
    this.selectedChange.unsubscribe();
    this.treeBuilder.onDestroy();
  }

  // load data async, initvalue is guid
  async loadDataAsync() {
    this.dataSource.data = [];
    this.dataSource.data = await this.treeBuilder.getOrganizationDBTree();

    const flattenNodes = [...this.treeControl.dataNodes];
    let data = this.treeBuilder.unflatten(flattenNodes);

    if (!this.loggedUser.isNew() && this.loggedUser.RoleId === RoleTypes.ClientUser) {

      this.loggedUser = this.authService.currentUserValue;
      //const units = await this.orgService.GetOrganizationAsync();
      const owner = this.treeControl.dataNodes.find(x => x.guid == this.loggedUser.UnitGuid);
      const unitGuids = owner.permission_units.map(x => (x.split('-').join('')));

      data = this.setfilterRole(this.loggedUser.UnitGuid, unitGuids);
      this.startExpandAll = true;
    }

    data = this.treeBuilder.initializeOrg(data);
    this.dataChange.emit(data);

    this.dataTreeLoaded = true;
  }

  setfilterRole(guid: string, specialGuids: string[]): TodoItemNode[] {
    const dataNodes = [...this.treeControl.dataNodes];

    let node = dataNodes.find(x => x.guid === guid);
    node = this.applyFilterRole(node, this.getLevel(node));

    const specialNodes = specialGuids.length
      ? dataNodes.filter(x => (specialGuids.indexOf(x.guid) >= 0)).map(x => { x.children = undefined; return x; })
      : undefined;

    this.dataSource.data = [node, ...specialNodes]; // this.treeBuilder.unflatten(dataNodes);;
    this.nodesListSearch = [...this.treeControl.dataNodes]; ///this.treeBuilder.flatten([node]);

    return this.dataSource.data;
  }

  // recursive filter role
  applyFilterRole(node: TodoItemFlatNode, level: number): TodoItemFlatNode {
    if (node && level < 0) return node;

    const parent = this.getParent(node);
    if (parent) {
      if (parent.children) {
        parent.children = parent.children.filter(n => { return n.guid === node.guid; });
      }
      return this.applyFilterRole(parent, this.getLevel(parent) - 1);
    }
  }

  getParent(node: TodoItemFlatNode) {
    if (node && !node.parent_guid) return undefined;
    const parent = this.treeControl.dataNodes.find(x => x.guid === node.parent_guid);
    return parent;
  }

  treeDataNodesChange(data) {
    if (data.length === 0) return;

    this.dataSource.data = data;
    this.nodesListSearch = [...this.treeControl.dataNodes];

    if (this.startExpandAll)
      this.treeControl.expandAll();
    else {
      const root = this.treeControl.dataNodes[0];
      this.treeControl.expand(root);
    }
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  treeItemSelectionToggle(node: TodoItemFlatNode): void {
    let nodeGuid: string;

    this.checkListSelection.toggle(node);

    if (this.checkListSelection.isSelected(node)) {
      this.checkListSelection.select(node);

      if (this.childNodesSelection) {
        const descendants = this.treeControl.getDescendants(node);
        this.checkListSelection.select(...descendants);
      }

      nodeGuid = node.guid;
    }
    else {
      this.checkListSelection.deselect(node);

      if (this.childNodesSelection) {
        const descendants = this.treeControl.getDescendants(node);
        this.checkListSelection.deselect(...descendants);
      }

      const selectedCount = this.checkListSelection.selected.length;
      if (this.multipleSelection && selectedCount > 0) {
        nodeGuid = this.checkListSelection.selected[this.checkListSelection.selected.length - 1].guid;
      }
      else if (selectedCount === 0) {
        nodeGuid = undefined;
      }
    }

    if (this.checkListSelection.selected.length)
      this.selectedItems = this.checkListSelection.selected.map(x => x.guid);

    this.onChangeValue(nodeGuid, new Event("treeItemSelectionToggle"));
  }

  filterChanged(e, node) {
    this.treeControl.expandAll();
    this.nodeListAfterSearch = [];
    this.currentSearchIndex = 0;

    const element = document.querySelector(`.units-tree .searchMark`);
    if (element) {
      element.classList.toggle("searchMark");
    }

    if (e.trim() === "") {
      return;
    }

    this.nodesListSearch.forEach(element => {
      if (element.name.includes(e)) {
        this.nodeListAfterSearch.push(element);
      }
    });
  }

  gotoNextNode(e) {
    if ((e.keyCode != 13 && e.type != "click")
      || this.nodeListAfterSearch.length === 0) return;

    this.treeControl.expandAll();

    if (this.currentSearchIndex === this.nodeListAfterSearch.length) {
      this.currentSearchIndex = 0;
    }

    let currentNode = this.nodeListAfterSearch[this.currentSearchIndex];
    if (currentNode.guid === undefined || currentNode.guid === null) {
      currentNode = this.nodeListAfterSearch[this.currentSearchIndex + 1];
      this.currentSearchIndex += 1;
    }

    this.scrollToView(currentNode.guid, new Event("gotoNextNode"));
  }

  private scrollToView(unitGuid: string, event: Event) {
    try {
      //var foundNode = this.nodesListSearch.find(x => x.guid == currentNode.guid);
      const id = this.unitsTreeRef.nativeElement.getAttribute('id');

      const elements = Array.from(document.querySelectorAll(`[id="${id}"] .searchMark`));
      elements.map(el => el.classList.toggle("searchMark"));

      const element = document.querySelector(`[id="${id}"] [id="${unitGuid}"]`);
      if (element) {
        //this.unitsTreeRef.nativeElement.focus();
        if (event.type !== "ngAfterViewInit") {
          element.classList.toggle("searchMark");
        }
        element.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
        this.currentSearchIndex++;
      }
    } catch (error) {
      console.log(error);
    }
  }

  /* Test */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  clearSelectedNodes() {
    this.onChangeSelection(new Event("selectionClear"));
  }

  onChangeSelection(event: Event) {
    let node = undefined;
    if (this.multipleSelection) {
      if (event.type == "selectionChanged" && this.selectedItems?.length) {
        this.selectedNodes = this.selectedItems.map(item => this.nodesListSearch.find(x => x.guid == item));
        this.checkListSelection.clear();
        this.checkListSelection.select(...this.selectedNodes);
        this.selectedNodes.map(node => this.treeControl.expandParents(node));
        this._value = this.selectedItems[0];
        this._isValueBind = this._value !== undefined && this._value !== null;
        node = this.nodesListSearch.find(x => x.guid == this._value);
      }
      else if (event.type == "selectionChanged" && !this.selectedItems?.length) {
        this.selectedNodes = [];
        this.checkListSelection.clear();
        this._value = undefined;
        this._isValueBind = false;
      }
      else if (event.type == "selectionClear" && this.selectedItems?.length) {
        this.selectedNodes = this.selectedItems.map(item => this.nodesListSearch.find(x => x.guid == item));
        this.checkListSelection.deselect(...this.selectedNodes);
        this.selectedNodes = [];
        this._selectedItems = [];
        this.checkListSelection.clear();
        this._value = undefined;
        this._isValueBind = false;
      }
    }
    else if (!this.multipleSelection && event.type == "selectionClear" && this._value != undefined && this._value != "") {
      this.checkListSelection.clear();
    }

    this.onSelectedChange(node, event);
  }

  onChangeValue(value: any, event: Event): Promise<void> {
    if (value === null) return;

    let node: any;
    if (value !== undefined && value !== "") {
      node = this.nodesListSearch.find(x => x.guid == value);
      if (node) {
        this._value = node.guid;
        this.checkListSelection.select(node);

        if (this._isValueBind) {
          this.selectedNode = node;
          this.treeControl.expandParents(node);
        }
      }
      else {
        this._value = undefined;
      }
    }
    else if (this.value !== undefined && this.value !== "") {
      node = this.nodesListSearch.find(x => x.guid == this.value);
      if (this.checkListSelection.isSelected(node))
        this.checkListSelection.deselect(node);
      this._value = value;
    }

    this.selectedUnit = (node && node.name) || '';

    this.onSelectedChange(node, event);
  }

  onSelectedChange(node, event) {
    this.currentElementName = this.unitsTreeRef.nativeElement.getAttribute('id');
    this.selectedChange.emit({
      elementName: this.currentElementName,
      multipleSelection: this.multipleSelection,
      childNodesSelection: this.childNodesSelection,
      isSelectedNode: node ? this.checkListSelection.isSelected(node) : false,
      selectedNode: { ...node },
      selectedNodes: Array.from(this.checkListSelection.selected) || [],
      checkListSelection: this.checkListSelection,
      event
    } as TreeSelectionResult);
  }
}
