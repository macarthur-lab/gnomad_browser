import R from 'ramda'

import combineVariantData from './combineVariantData'

import {
  CATEGORY_DEFINITIONS,
  VARIANTS_TABLE_FIELDS,
} from '../constants'

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
    combineVariantData(VARIANTS_TABLE_FIELDS),
    convertToList,
    addQualityResults,
  )(variants)
}

export const combineDataForTable = (
  variants
) => {
  return R.pipe(
    combineVariantData(VARIANTS_TABLE_FIELDS),
    convertToList,
    addQualityResults,
  )(variants)
}
