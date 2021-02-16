import { OrganizationService } from "app/_service/_serviceExpert/organization.service";

export class TreeItemNode {
    name: string;
    guid: string;
    remark: string;
    children: TreeItemNode[];
    model_name: string;
    model_guid: string;
    expandable: boolean;
    parent: TreeItemNode;
    model_component_type: number;
    professional_instruction: string;
    description_type: number;
    org_type:number;
    descriptions: any[];
    models: any[];
    data: any;
    activities: any[];
    level: number;
    parent_guid: string;
    permission_units: string[];
}

export class TodoItemNode {
    name: string;
    guid: string;
    remark: string;
    children: TreeItemNode[];
    model_name: string;
    model_guid: string;
    expandable: boolean;
    parent: TreeItemNode;
    parent_guid: string;
    model_component_type: number;
    professional_instruction: string;
    description_type: number;
    org_type:number;
    descriptions: any[];
    models: any[];
    data: any;
    activities: any[];
    level: number;
    permission_units: string[];
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
    model_name: string;
    level: number;
    expandable: boolean;
    model_guid: string;
    parent: TodoItemFlatNode;
    parent_guid: string;
    model_component_type: number;
    professional_instruction: string;
    description_type: number;
    org_type:number;
    descriptions: any[];
    models: any[];
    children: TodoItemFlatNode[];
    data: any;
    name: string;
    guid: string;
    remark: string;
    activities: any[];
    permission_units: string[];
}

class Person {
    firstName = 'John';
    lastName = 'Doe';
}

class Factory {
    create<T extends OrganizationService>(type: (new () => T)): T {
        return new type();
    }
}

export class ModelTreeItemNode {
    name: string;
    guid: string;
    remark: string;
    children: ModelTreeItemNode[];
    model_name: string;
    model_guid: string;
    expandable: boolean;
    parent: ModelTreeItemNode;
    parent_guid: string;
    component_type: number;
    professional_instruction: string;
    description_type: number;
    org_type:number;
    descriptions: any[];
    models: any[];
    data: any;
    activities: any[];
    permission_units: string[];
}

export class ModelTreeItemFlatNode {
    name: string;
    guid: string;
    remark: string;
    children: ModelTreeItemNode[];
    expandable: boolean;
    parent: ModelTreeItemNode;
    parent_guid: string;
    component_type: number;
    professional_instruction: string;
    description_type: number;
    org_type:number;
    descriptions: any[];
    models: any[];
    data: any;
    activities: any[];
    level: number;
    permission_units: string[];
}

export interface TreeSelectionResult {
    multipleSelection: boolean;
    childNodesSelection: boolean;
    selectedNodes: TreeItemNode[];
    selectedNode: TreeItemNode;
    isSelectedNode: boolean;
    event: Event;
    checkListSelection: any,
}
