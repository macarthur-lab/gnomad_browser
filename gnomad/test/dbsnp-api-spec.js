import expect from 'expect'
import fetch from 'isomorphic-fetch'

const API_URL = 'http://127.0.0.1:5002'

describe('dbsnp api', () => {
  const dbsnpId = '22-46615715-46615880'
  const URL = `${API_URL}/dbsnp/${dbsnpId}`
  it('gets dbsnp object with keys and data', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(Object.keys(data)).toEqual([
          'chrom',
          'coverage',
          'genes_in_region',
          'rsid',
          'start',
          'stop',
          'variants_in_region'
        ])
        expect(data.rsid).toBe('22-46615715-46615880')
        expect(data.chrom).toBe(null)
        expect(data.coverage).toBe(null)
        expect(data.genes_in_region).toBe(null)
        expect(data.start).toBe(null)
        expect(data.stop).toBe(null)
        expect(data.variants_in_region).toBe(null)
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
