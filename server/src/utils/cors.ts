function parseCorsOrigins(value) {
  const items = (value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)

  if (items.includes('*')) {
    return { allowAll: true, origins: new Set() }
  }

  return { allowAll: false, origins: new Set(items) }
}

export function isOriginAllowed(origin, allowedValue) {
  const { allowAll, origins } = parseCorsOrigins(allowedValue)
  if (!origin) {
    return false
  }
  if (allowAll) {
    return true
  }
  return origins.has(origin)
}

export function resolveCorsOrigin(origin, allowedValue) {
  if (!origin) {
    return undefined
  }
  return isOriginAllowed(origin, allowedValue) ? origin : undefined
}
