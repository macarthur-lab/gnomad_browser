import expect from 'expect'
import fetch from 'isomorphic-fetch'

const API_URL = 'http://127.0.0.1:5002'

describe('gene api', () => {
  const geneId = 'ENSG00000169174'
  const URL = `${API_URL}/gene/${geneId}`
  it('delivers object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
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
