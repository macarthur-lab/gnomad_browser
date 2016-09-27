import expect from 'expect'
import fetch from 'isomorphic-fetch'
import config from 'config'

const API_URL = config.get('GNOMAD_API_URL')

describe('gnomad gene api', () => {
  const geneId = 'ENSG00000169174'
  const URL = `${API_URL}/gene/${geneId}`
  it('gets gene object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(Object.keys(data))
        expect(Object.keys(data)).toEqual([
          'cnvgenes',
          'cnvs',
          'constraint',
          'coverage_stats',
          'gene',
          'transcript',
          'transcripts_in_gene',
          'variants_in_gene',
          'variants_in_transcript',
        ])
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
