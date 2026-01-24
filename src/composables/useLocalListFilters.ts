import { computed, unref } from 'vue'

function normalize(value) {
  if (value === null || value === undefined)
    return ''
  return String(value).trim().toLowerCase()
}

function isEmptyFilter(value) {
  if (value === null || value === undefined)
    return true
  if (typeof value === 'string')
    return value.trim() === ''
  return false
}

function matchEquals(filterValue, rowValue) {
  if (isEmptyFilter(filterValue))
    return true
  return normalize(filterValue) === normalize(rowValue)
}

function matchIncludes(filterValue, values) {
  if (isEmptyFilter(filterValue))
    return true
  const needle = normalize(filterValue)
  return values.some(value => normalize(value).includes(needle))
}

/**
 * @typedef {object} FilterRule
 * @property {string} key
 * @property {'equals'|'includes'} type
 * @property {(row: any) => any} [getter]
 * @property {Array<(row: any) => any>} [getters]
 */

/**
 * @param {object} params
 * @param {import('vue').Ref<Array<any>>|Array<any>} params.rows
 * @param {object} params.filters
 * @param {Array<FilterRule>} params.rules
 */
export function useLocalListFilters({ rows, filters, rules = [] }) {
  return computed(() => {
    const items = unref(rows) || []
    if (!items.length)
      return items

    return items.filter((row) => {
      return rules.every((rule) => {
        const filterValue = filters[rule.key]
        if (rule.type === 'equals') {
          const getter = rule.getter || (item => item?.[rule.key])
          return matchEquals(filterValue, getter(row))
        }
        if (rule.type === 'includes') {
          const getters = rule.getters || [rule.getter || (item => item?.[rule.key])]
          const values = getters.map(getter => getter(row))
          return matchIncludes(filterValue, values)
        }
        return true
      })
    })
  })
}
