import expect from 'expect'
import fetch from 'isomorphic-fetch'
import R from 'ramda'
import config from 'config'

import metricsExample from '../exampleData/metricsExample'

const API_URL = config.get('GNOMAD_API_URL')

describe('gnomad/exac variant api', () => {
  // const variantId = "22-46594230-T-A"
  // const variantId = '22-46615880-T-C'
  const variantId = '22-46594241-G-T'
  const URL = `${API_URL}/variant/${variantId}`
  it('gets variant object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(Object.keys(data.gnomadVariant.variant))
        // console.log(Object.keys(data.exacVariant.metrics))
        // console.log(data.exacVariant.metrics)
        // console.log(Object.keys(data.exacVariant.variant.quality_metrics))
        // console.log(data.exacVariant.variant.quality_metrics)
        expect(Object.keys(data)).toEqual([
          'exac',
          'gnomad',
        ])
        expect(Object.keys(data.exac)).toEqual([
          'any_covered',
          'base_coverage',
          'consequences',
          'metrics',
          'read_viz',
          'variant'
        ])
        expect(Object.keys(data.gnomad)).toEqual([
          'any_covered',
          'base_coverage',
          'consequences',
          'metrics',
          'read_viz',
          'variant'
        ])
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
