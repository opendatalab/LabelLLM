import type { TreeTypeWithChildrenField } from './bfsEach';

export interface MapTreeIterateeArg<TreeNode> {
  index: number;
  treeNodes: TreeNode[];
  depth: number;
  parent: TreeNode | null;
  preNode: TreeNode | undefined;
}

export interface MapTreeOptions<TreeNode, ChildField extends string = 'children'> {
  depth?: number;
  parent?: TreeTypeWithChildrenField<TreeNode, ChildField> | null;
  childrenField: ChildField;
}

/**
 * 树的map遍历
 * @param treeNodes
 * @param iteratee
 * @returns
 */
export function mapTree<TreeNode, ChildField extends string = 'children'>(
  treeNodes: TreeTypeWithChildrenField<TreeNode, ChildField>[] = [],
  iteratee: (
    node: TreeTypeWithChildrenField<TreeNode, ChildField>,
    iterateeArgs: MapTreeIterateeArg<TreeTypeWithChildrenField<TreeNode, ChildField>>,
  ) => TreeTypeWithChildrenField<TreeNode, ChildField>,
  options: MapTreeOptions<TreeNode, ChildField> = { childrenField: 'children' as ChildField },
): TreeTypeWithChildrenField<TreeNode, ChildField>[] {
  const { depth = 0, parent = null, childrenField } = options || {};
  const newNodes = [];

  for (let i = 0; i < treeNodes.length; i += 1) {
    const node = iteratee(treeNodes[i], {
      index: i,
      treeNodes,
      depth,
      parent,
      preNode: newNodes[newNodes.length - 1],
    });

    if (node === null) {
      continue;
    }

    if (Array.isArray(node[childrenField])) {
      node[childrenField] = mapTree(node[childrenField], iteratee, {
        depth: depth + 1,
        parent: node,
        childrenField,
      }) as TreeTypeWithChildrenField<TreeNode, ChildField>[ChildField];
    }

    newNodes.push(node);
  }

  return newNodes;
}
