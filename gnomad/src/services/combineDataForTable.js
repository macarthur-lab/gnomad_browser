import R from 'ramda'

import {
  TABLE_CONSTANT_FIELDS,
  TABLE_CUMULATIVE_FIELDS,
  TABLE_NESTED_CUMULATIVE_FIELDS,
  TABLE_UNIQUE_FIELDS,
  CATEGORY_DEFINITIONS,
} from '../constants'

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
    next['datasets'] = ['all', variant.dataset]
  } else {
    next['datasets'] = [...next['datasets'], variant.dataset]
  }
  next[variant.dataset] = TABLE_UNIQUE_FIELDS.reduce((acc, field) => ({
    ...acc,
    [field]: variant[field]
  }), {})
  next.all = TABLE_UNIQUE_FIELDS.reduce((acc, field) => ({
    ...acc,
    [field]: next[field]
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

const filterVariants = R.curry((filters, uuid_lists, variants) =>
  R.filter(variant =>
    isInSelectedDataSets(variant.uuid, uuid_lists, filters.dataset) &&
    passesQualityFilterSelection(variant.filter, filters.filter) &&
    passesIndelOrSnpSelection(variant.indel, filters.indel) &&
    passesCategorySelection(variant.major_consequence, filters.consequence)
  )(variants)
)

const convertToList = (mergedVariants) => Object.keys(mergedVariants).map(v => mergedVariants[v])

const addQualityResults = R.map(variant => {
  const results = variant.datasets.slice(1, variant.datasets.length).map(dataset => ({
    dataset,
    filter: variant[dataset].filter
  }))
  const resultList = R.pluck('filter', results)
  let pass
  if (R.all(result => result === 'PASS', resultList)) {
    pass = 'all'
  } else if ((R.none(result => result === 'PASS', resultList))) {
    pass = 'none'
  } else {
    pass = results.find(result => result.filter === 'PASS').dataset
  }
  return {
    ...variant,
    pass,
  }
})

export const filterAndCombineData = (
  filters,
  uuid_lists,
  variants
) => {
  return R.pipe(
    filterVariants(filters, uuid_lists),
    sumTableStats,
    convertToList,
    addQualityResults,
  )(variants)
}

export const combineDataForTable = (
  variants
) => {
  return R.pipe(
    sumTableStats,
    convertToList,
    addQualityResults,
  )(variants)
}
