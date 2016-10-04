import expect from 'expect'
import fetch from 'isomorphic-fetch'
import config from 'config'

const API_URL = config.get('GNOMAD_API_URL')

describe('gnomad gene api', () => {
  const geneId = 'ENSG00000186951'
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
          'uuid_lists',
          'variants_in_gene',
          'variants_in_transcript'
        ])
        expect(data.variants_in_gene.length).toBe(595)
        expect(data.uuid_lists.exac.length).toBe(575)
        expect(data.uuid_lists.gnomad.length).toBe(20)
        expect(data.uuid_lists.all.length).toBe(595)
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets exome and genome coverage stats', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        const expectedFirstThreePositions = [
          {
            '1': 0.9992,
            '5': 0.9961,
            '10': 0.9863,
            '15': 0.9611,
            '20': 0.9356,
            '25': 0.9227,
            '30': 0.9086,
            '50': 0.8548,
            '100': 0.5065,
            mean: 82.54,
            median: 100,
            pos: 46594230
          }, {
            '1': 0.9992,
            '5': 0.9964,
            '10': 0.9863,
            '15': 0.9621,
            '20': 0.9362,
            '25': 0.9227,
            '30': 0.9092,
            '50': 0.8573,
            '100': 0.5275,
            mean: 83.07,
            median: 100,
            pos: 46594231
          }, {
            '1': 0.9994,
            '5': 0.9964,
            '10': 0.987,
            '15': 0.9625,
            '20': 0.937,
            '25': 0.9234,
            '30': 0.91,
            '50': 0.8594,
            '100': 0.5479,
            mean: 83.54,
            median: 100,
            pos: 46594232
          }
        ]
        expect(data.coverage_stats.exomes.length).toEqual(2112)
        expect(data.coverage_stats.genomes.length).toEqual(2112)
        expect(data.coverage_stats.exomes.slice(0, 3)).toEqual(expectedFirstThreePositions)
        expect(data.coverage_stats.genomes.slice(0, 3)).toEqual(expectedFirstThreePositions)
        expect().toBe()

        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
