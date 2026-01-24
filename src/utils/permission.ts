export function buildPermissionTreeOptions(tree = []) {
  return tree.map((node) => {
    const children = node.children?.length ? buildPermissionTreeOptions(node.children) : undefined
    if (children) {
      return {
        label: node.name,
        key: node.code,
        children,
      }
    }
    return {
      label: node.name,
      key: node.code,
    }
  })
}

export function collectPermissionCodes(tree = [], roleCode) {
  const codes = new Set()
  const stack = [...tree]
  while (stack.length) {
    const node = stack.pop()
    if (!node) {
      continue
    }
    if (roleCode && node.roles?.includes(roleCode)) {
      codes.add(node.code)
    }
    if (node.children?.length) {
      stack.push(...node.children)
    }
  }
  return Array.from(codes)
}
