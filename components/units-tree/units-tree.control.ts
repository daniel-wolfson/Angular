import { FlatTreeControl } from '@angular/cdk/tree';
import { TodoItemFlatNode } from '../General_Tree/general_tree';

export class UnitFlatTreeControl<T extends TodoItemFlatNode> extends FlatTreeControl<T> {
  /**
   * Recursively expand all parents of the passed node.
   */
  expandParents(node: T) {
    const parent = this.getParent(node);
    this.expand(parent);

    if (parent && this.getLevel(parent) > 0) {
      this.expandParents(parent);
    }
  }

  filterParents(node: T) {
    const parent = this.getParent(node);
    const parentChildren = parent.children;
    parent.children = parentChildren.filter(n => n.guid === node.guid); 
    // const index = this.dataNodes.indexOf(parent);
    // this.dataNodes[index] = parent;

    if (parent && this.getLevel(parent) > 0) {
      this.filterParents(parent);
    }
  }

  /**
   * Iterate over each node in reverse order and return the first node that has a lower level than the passed node.
   */
  getParent(node: T) {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }

  getParents(node: T) {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
  }
}