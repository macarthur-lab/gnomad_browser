import expect from 'expect'
import fetch from 'isomorphic-fetch'
import config from 'config'

const API_URL = config.get('EXAC_API_URL')

describe('transcript api', () => {
  const transcriptId = 'ENST00000407236'
  const URL = `${API_URL}/transcript/${transcriptId}`
  it('gets transcript object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(Object.keys(data))
        // similar to gene schema
        // no constraint field
        // additional `json` fields...
        expect(Object.keys(data)).toEqual([
          'cnvgenes',
          'cnvgenes_json',
          'cnvs',
          'cnvs_json',
          'coverage_stats',
          'coverage_stats_json',
          'gene',
          'gene_json',
          'transcript',
          'transcript_json',
          'variants_in_transcript',
          'variants_in_transcript_json'
        ])
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets variants in transcript', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(Object.keys(data))
        // similar to gene schema
        // no constraint field
        // additional `json` fields...
        expect(data.variants_in_transcript.length).toBe(575)
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})