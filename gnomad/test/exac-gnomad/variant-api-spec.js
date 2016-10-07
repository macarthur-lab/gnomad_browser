import expect from 'expect'
import fetch from 'isomorphic-fetch'
import R from 'ramda'
import config from 'config'

import metricsExample from '../exampleData/metricsExample'

const API_URL = config.get('GNOMAD_API_URL')

describe('gnomad/exac variant api', () => {
  // const variantId = "22-46594230-T-A"
  const variantId = '22-46615880-T-C'
  const URL = `${API_URL}/variant/${variantId}`
  it('gets variant object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(data)
        expect(Object.keys(data)).toEqual([
          'exacVariant',
          'gnomadVariant',
        ])
        expect(Object.keys(data.exacVariant)).toEqual([
          'any_covered',
          'base_coverage',
          'consequences',
          'metrics',
          'read_viz',
          'variant'
        ])
        expect(Object.keys(data.gnomadVariant)).toEqual([
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
