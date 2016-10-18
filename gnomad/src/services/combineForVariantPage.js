import combineVariantData from './combineVariantData'

import { VARIANT_PAGE_FIELDS } from '../constants'

export const combineDataForVariantPage = (exac, gnomad) => {
  const { variant_id } = exac
  exac = { ...exac, dataset: 'exac' }
  gnomad = { ...gnomad, dataset: 'gnomad' }
  if (!exac.variant_id) {
    return {
      ...gnomad,
      all: gnomad,
      gnomad,
      exac: {
        filter: 'No variant'
      }
    }
  }
  if (!gnomad.variant_id) {
    return {
      ...exac,
      all: exac,
      exac,
      gnomad: {
        filter: 'No variant'
      }
    }
  }
  const variants = [exac, gnomad]
  return combineVariantData(VARIANT_PAGE_FIELDS, variants)[variant_id]
}