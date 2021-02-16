import { BehaviorSubject } from "rxjs";
import { TreeItemNode, TodoItemFlatNode } from "app/Components/units-tree/units-tree.models";
import { OrganizationService } from "app/_service/_serviceExpert/organization.service";
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class TreeBuilder {

    TREE_DATA = [];
    OrgTREE_DATA = [];
    dataSourceChange: BehaviorSubject<TreeItemNode[]>;
    dataNodesChange: BehaviorSubject<TreeItemNode[]>;

    get dataSource(): TreeItemNode[] { return this.dataSourceChange.value; }
    get dataItems(): TreeItemNode[] { return this.dataNodesChange.value; }

    constructor(private orgService: OrganizationService) {
        this.dataSourceChange = new BehaviorSubject<TreeItemNode[]>([]);
        this.dataNodesChange = new BehaviorSubject<TreeItemNode[]>([]);
    }

    async getOrganizationDBTree() {
        let data = await this.orgService.GetOrganizationAsync();
        data.expandable = true;
        data.parent_guid = undefined;
        data.level = 0;
        return [data];
    }

    initialize() {
        // Build the tree nodes from Json object. The result is a list of `TreeItemNode` with nested
        //     file node as children.
        const data = this.buildFileTree(this.TREE_DATA, 0);

        // Notify the change.
        this.dataSourceChange.next(data);
        return data;
    }

    initializeOrg(data: any) {
        // Build the tree nodes from Json object. The result is a list of `TreeItemNode` with nested
        //     file node as children.
        //const data = this.buildOrganizationsTree(this.OrgTREE_DATA, 0);
        this.OrgTREE_DATA[0] = data;

        // Notify the change.
        this.dataNodesChange.next(data);
        return data;
    }

    buildFileTree(obj: object, level: number): TreeItemNode[] {
        return Object.keys(obj).reduce<TreeItemNode[]>((accumulator, key) => {
            const value = obj[key];
            const node = new TreeItemNode();
            node.model_name = key;

            if (value != null) {
                if (typeof value !== 'object') {
                    node.children = this.buildFileTree(value, level + 1);
                } else {
                    node.model_name = value.data.name;
                    node.model_guid = value.data.model_component_guid;
                    node.parent = value.parent;
                    node.model_component_type = value.model_component_type;
                    node.children = value.children;
                    node.expandable = value.expandable;
                    node.professional_instruction = value.professional_instruction;
                    node.description_type = value.description_type;
                    node.org_type = value.org_type;
                    node.descriptions = value.descriptions;
                    node.models = value.model;
                    node.data = value.data;
                    node.permission_units = value.permission_units;
                }
            }

            return accumulator.concat(node);
        }, []);
    }

    //TODO: temp
    flatten_temp4 = function* flatten(array, depth) {
        if (depth === undefined) depth = 1;
        for (const item of array) {
            if (Array.isArray(item) && depth > 0) {
                yield* flatten(item, depth - 1);
            } else {
                yield item;
            }
        }
    }

    flatten(arr) {
        const result = arr.reduce((acc, item) => {

            if (Array.isArray(item.children) && item.children.length > 0)
                acc = acc.concat(this.flatten(item.children));
            else
                acc.push(item);

            return acc;
        }, []);

        return result;
    }

    unflatten(arr: TodoItemFlatNode[]) {
        var tree: TodoItemFlatNode[] = [];
        var mappedArr = {}, //arrElem,
            mappedElem;

        // First map the nodes of the array to an object -> create a hash table.
        arr.forEach(arrElem => {
            if (arrElem.permission_units != null)
                arrElem.permission_units = arrElem.permission_units.map(x => (x.split("-").join("")))
            mappedArr[arrElem.guid] = arrElem;
            mappedArr[arrElem.guid]['children'] = [];
        });
        // for (var i = 0, len = arr.length; i < len; i++) {
        //     arrElem = arr[i];
        //     mappedArr[arrElem.guid] = arrElem;
        //     mappedArr[arrElem.guid]['children'] = [];
        // }-

        for (var id in mappedArr) {
            if (mappedArr.hasOwnProperty(id)) {
                mappedElem = mappedArr[id];
                // If the element is not at the root level, add it to its parent array of children.
                if (mappedElem.parent_guid) {
                    mappedArr[mappedElem['parent_guid']]['children'].push(mappedElem);
                }
                // If the element is at the root level, add it to first level elements array.
                else {
                    tree.push(mappedElem as TodoItemFlatNode);
                }
            }
        }
        return tree;
    }

    /** Add an item to to-do list */
    insertItem(parent: TreeItemNode, name: string, guid: string): TreeItemNode {
        if (!parent.children) {
            parent.children = [];
        }

        const newItem = { name: name, parent: parent, guid: guid } as TreeItemNode;
        parent.children.push(newItem);
        this.dataSourceChange.next(this.dataSource);
        return newItem;
    }

    insertItemAbove(node: TreeItemNode, name: string, guid: string): TreeItemNode {
        const parentNode = this.getParentFromNodes(node);
        const newItem = { name: name, guid: guid } as TreeItemNode;
        if (parentNode != null) {
            parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
        } else {
            this.dataSource.splice(this.dataSource.indexOf(node), 0, newItem);
        }
        this.dataSourceChange.next(this.dataSource);
        return newItem;
    }

    insertItemBelow(node: TreeItemNode, name: string, guid: string): TreeItemNode {
        const parentNode = this.getParentFromNodes(node);
        const newItem = { name: name, guid: guid } as unknown as TreeItemNode;
        if (parentNode != null) {
            parentNode.children.splice(parentNode.children.indexOf(node) + 1, 0, newItem);
        } else {
            this.dataSource.splice(this.dataSource.indexOf(node) + 1, 0, newItem);
        }
        this.dataSourceChange.next(this.dataSource);
        return newItem;
    }

    getParentFromNodes(node: TreeItemNode): TreeItemNode {
        for (let i = 0; i < this.dataSource.length; ++i) {
            const currentRoot = this.dataSource[i];
            const parent = this.getParent2(currentRoot, node);
            if (parent != null) {
                return parent;
            }
        }
        return null;
    }

    getParent2(currentRoot: TreeItemNode, node: TreeItemNode): TreeItemNode {
        if (currentRoot.children && currentRoot.children.length > 0) {
            for (let i = 0; i < currentRoot.children.length; ++i) {
                const child = currentRoot.children[i];
                if (child === node) {
                    return currentRoot;
                } else if (child.children && child.children.length > 0) {
                    const parent = this.getParent2(child, node);
                    if (parent != null) {
                        return parent;
                    }
                }
            }
        }
        return null;
    }

    updateItem(node: TreeItemNode, name: string) {
        node.name = name;
        this.dataSourceChange.next(this.dataSource);
    }

    deleteItem(node: TreeItemNode) {
        this.deleteNode(this.dataSource, node);
        this.dataSourceChange.next(this.dataSource);
    }

    copyPasteItem(from: TreeItemNode, to: TreeItemNode): TreeItemNode {
        const newItem = this.insertItem(to, from.name, from.guid);
        if (from.children) {
            from.children.forEach(child => {
                this.copyPasteItem(child, newItem);
            });
        }
        return newItem;
    }

    copyPasteItemAbove(from: TreeItemNode, to: TreeItemNode): TreeItemNode {
        const newItem = this.insertItemAbove(to, from.name, from.guid);
        if (from.children) {
            from.children.forEach(child => {
                this.copyPasteItem(child, newItem);
            });
        }
        return newItem;
    }

    copyPasteItemBelow(from: TreeItemNode, to: TreeItemNode): TreeItemNode {
        const newItem = this.insertItemBelow(to, from.name, from.guid);
        if (from.children) {
            from.children.forEach(child => {
                this.copyPasteItem(child, newItem);
            });
        }
        return newItem;
    }

    deleteNode(nodes: TreeItemNode[], nodeToDelete: TreeItemNode) {
        const index = nodes.indexOf(nodeToDelete, 0);
        if (index > -1) {
            nodes.splice(index, 1);
        } else {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    this.deleteNode(node.children, nodeToDelete);
                }
            });
        }
    }

    onDestroy() {
        this.dataSourceChange.unsubscribe();
        this.dataNodesChange.unsubscribe();
    }
}