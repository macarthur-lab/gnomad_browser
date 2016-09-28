import R from 'ramda'

import {
  TABLE_CONSTANT_FIELDS,
  TABLE_CUMULATIVE_FIELDS,
  TABLE_NESTED_CUMULATIVE_FIELDS,
  TABLE_UNIQUE_FIELDS,
  CATEGORY_DEFINITIONS,
} from './constants'

const add = (next, variant, field) => {
  if (!next[field]) {
    return Number(variant[field])
  }
  return Number(next[field]) + Number(variant[field])
}

const addNested = (next, variant, field) => {
  const keys = Object.keys(variant[field])
  if (!next[field]) return variant[field]
  return keys.reduce((acc, key) => ({
    ...acc,
    [key]: next[field][key] + variant[field][key]
  }), {})
}

export const sumTableStats = R.reduce((acc, variant) => {
  const { variant_id } = variant
  const next = { ...acc[variant_id] }
  TABLE_CONSTANT_FIELDS.forEach(field =>
    next[field] = variant[field])
  TABLE_CUMULATIVE_FIELDS.forEach(field =>
    next[field] = add(next, variant, field))
  TABLE_NESTED_CUMULATIVE_FIELDS.forEach(field =>
    next[field] = addNested(next, variant, field))
  next['allele_freq'] = next.allele_count / next.allele_num
  if (!next['datasets']) {
    next['datasets'] = [variant.dataset]
  } else {
    next['datasets'] = [...next['datasets'], variant.dataset]
  }
  next[variant.dataset] = TABLE_UNIQUE_FIELDS.reduce((acc, field) => ({
    ...acc,
    [field]: variant[field]
  }), {})
  return {
    ...acc,
    [variant_id]: next,
  }
}, {})

const isInSelectedDataSets = (uuid, uuidLists, selection) =>
  R.contains(uuid, uuidLists[selection])

const passesQualityFilterSelection = (variantQuality, selection) => {
  if (selection === 'PASS' && variantQuality !== 'PASS') {
    return false
  }
  return true
}

const passesIndelOrSnpSelection = (indel, selection) => {
  if (selection === 'snp' && indel) {
    return false
  }
  if (selection === 'indel' && !indel) {
    return false
  }
  return true
}

let passesCategorySelection = R.curry((
  categoryDefinitions,
  majorConsequence,
  selection
) => {
  const result = R.contains(majorConsequence, categoryDefinitions[selection])
  return result
})
passesCategorySelection = passesCategorySelection(CATEGORY_DEFINITIONS)

export const combineDataForTable = (
  filters,
  uuid_lists,
  variants
) => {
  return R.pipe(
    R.filter(variant =>
      isInSelectedDataSets(variant.uuid, uuid_lists, filters.dataset) &&
      passesQualityFilterSelection(variant.filter, filters.filter) &&
      passesIndelOrSnpSelection(variant.indel, filters.indel) &&
      passesCategorySelection(variant.major_consequence, filters.consequence)
    ),
    sumTableStats,
    (mergedVariants) => Object.keys(mergedVariants).map(v => mergedVariants[v]),
  )(variants)
}
