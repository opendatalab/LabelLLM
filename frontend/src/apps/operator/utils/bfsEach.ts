interface BFSOption<ChildField extends string = 'children'> {
  childrenField: ChildField;
}

export type TreeTypeWithChildrenField<TreeNode, ChildField extends string> = TreeNode &
  Record<ChildField, TreeTypeWithChildrenField<TreeNode, ChildField>[]>;

/**
 * 广度优先遍历树节点
 * @param input 树
 * @param iteratee 回调函数
 * @param option
 * @returns void
 */
export function bfsEach<TreeNode, ChildField extends string = 'children'>(
  input: TreeTypeWithChildrenField<TreeNode, ChildField>[],
  iteratee: (
    node: TreeTypeWithChildrenField<TreeNode, ChildField>,
    i: number,
    input: TreeTypeWithChildrenField<TreeNode, ChildField>[],
    parentPath: (string | number)[],
  ) => void,
  option: BFSOption<ChildField> = { childrenField: 'children' as ChildField },
  path: (string | number)[] = [],
) {
  if (!Array.isArray(input)) {
    console.warn('bfsEach input must be an array');
    return;
  }

  const { childrenField } = option;

  const leaf: TreeTypeWithChildrenField<TreeNode, ChildField>[] = [];

  for (let i = 0; i < input.length; i += 1) {
    if (Array.isArray(input[i][childrenField])) {
      leaf.push(...input[i][childrenField]);
    }

    iteratee(input[i], i, input, [...path, i.toString()]);

    if (leaf.length > 0 && i === input.length - 1) {
      bfsEach(leaf, iteratee, option, [...path, childrenField]);
    }
  }
}
