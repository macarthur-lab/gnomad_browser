import combineVariantData from './combineVariantData'

import { VARIANT_PAGE_FIELDS } from '../constants'

export const combineDataForVariantPage = (exac, gnomad) => {
  const { variant_id } = exac
  exac = { ...exac, dataset: 'exac' }
  gnomad = { ...gnomad, dataset: 'gnomad' }
  const variants = [exac, gnomad]
  return combineVariantData(VARIANT_PAGE_FIELDS, variants)[variant_id]
}