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
        const expectedFirstThreePositionsExAC = [
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
        const expectedFirstThreePositionsGnomad = [
          {
            '1': 0.8317,
            '5': 0.8317,
            '10': 0.8317,
            '15': 0.8193,
            '20': 0.7649,
            '25': 0.6485,
            '30': 0.4579,
            '50': 0.0248,
            '100': 0,
            mean: 25.99,
            median: 28,
            pos: 46594230
          }, {
            '1': 0.8688,
            '5': 0.8688,
            '10': 0.8688,
            '15': 0.849,
            '20': 0.7822,
            '25': 0.6658,
            '30': 0.4455,
            '50': 0.0198,
            '100': 0,
            mean: 26.51,
            median: 28,
            pos: 46594231
          }, {
            '1': 0.8911,
            '5': 0.8911,
            '10': 0.8886,
            '15': 0.8713,
            '20': 0.7946,
            '25': 0.6683,
            '30': 0.4604,
            '50': 0.0173,
            '100': 0,
            mean: 26.96,
            median: 28.5,
            pos: 46594232
          }
        ]
        expect(data.coverage_stats.exomes.length).toEqual(2112)
        expect(data.coverage_stats.genomes.length).toEqual(2118)
        expect(data.coverage_stats.exomes.slice(0, 3)).toEqual(expectedFirstThreePositionsExAC)
        expect(data.coverage_stats.genomes.slice(0, 3)).toEqual(expectedFirstThreePositionsGnomad)
        expect().toBe()

        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
