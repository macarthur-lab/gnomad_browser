import expect from 'expect'
import fetch from 'isomorphic-fetch'
import config from 'config'

import {
  sumTableStats,
  combineDataForTable,
 } from '../../src/combineDataForTable'

const API_URL = config.get('GNOMAD_API_URL')
describe('sumTableStats', () => {
  const geneId = 'ENSG00000186951'
  const URL = `${API_URL}/gene/${geneId}`
  it('reduces/sums variant array from multiple data sources', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        const { variants_in_gene } = data
        const result = sumTableStats(variants_in_gene)
        expect(Object.keys(result).length).toBe(579)
        const variant = result['22-46594241-G-T']
        expect(
          variant.allele_num
        ).toBe(variant.ExAC.allele_num + variant.gnomAD.allele_num)
        // console.log(result['22-46594241-G-T'])
        expect(result['22-46594241-G-T']).toEqual({
          chrom : '22',
          CANONICAL : '',
          HGVS : 'c.-39-1G>T',
          HGVSc : 'c.-39-1G>T',
          HGVSp : '',
          alt : 'T',
          category : 'lof_variant',
          flags : ['LC LoF'],
          indel: false,
          major_consequence : 'splice_acceptor_variant',
          pos : 46594241,
          ref : 'G',
          rsid : '.',
          variant_id : '22-46594241-G-T',
          ac_female : 0,
          ac_male : 2,
          allele_count : 2,
          allele_num : 240332,
          an_female : 106592,
          an_male : 133740,
          hom_count : 0,
          hemi_count : NaN,
          pop_acs : {
            African: 0,
            'East Asian': 2,
            'European (Finnish)': 0,
            'European (Non-Finnish)': 0,
            Latino: 0,
            Other: 0,
            'South Asian': 0
          },
          pop_ans : {
            African: 20192,
            'East Asian': 17208,
            'European (Finnish)': 13212,
            'European (Non-Finnish)': 131912,
            Latino: 23068,
            Other: 1804,
            'South Asian': 32936
          },
          pop_homs : {
            African: 0,
            'East Asian': 0,
            'European (Finnish)': 0,
            'European (Non-Finnish)': 0,
            Latino: 0,
            Other: 0,
            'South Asian': 0
          },
          allele_freq : 0.000008321821480285606,
          datasets : [
            'ExAC', 'gnomAD'
          ],
          ExAC : {
            ac_female: '0',
            ac_male: '1',
            allele_count: 1,
            allele_freq: 0.000008321821480285606,
            allele_num: 120166,
            an_female: '53296',
            an_male: '66870',
            pop_acs: {
              African: 0,
              'East Asian': 1,
              'European (Finnish)': 0,
              'European (Non-Finnish)': 0,
              Latino: 0,
              Other: 0,
              'South Asian': 0
            },
            pop_ans: {
              African: 10096,
              'East Asian': 8604,
              'European (Finnish)': 6606,
              'European (Non-Finnish)': 65956,
              Latino: 11534,
              Other: 902,
              'South Asian': 16468
            },
            pop_homs: {
              African: 0,
              'East Asian': 0,
              'European (Finnish)': 0,
              'European (Non-Finnish)': 0,
              Latino: 0,
              Other: 0,
              'South Asian': 0
            },
            filter: 'PASS',
            quality_metrics: {
              BaseQRankSum: '-7.680e+00',
              ClippingRankSum: '0.845',
              DP: '1920534',
              FS: '1.526',
              InbreedingCoeff: '0.0023',
              MQ: '59.69',
              MQRankSum: '2.36',
              QD: '13.50',
              ReadPosRankSum: '1.09',
              VQSLOD: '-6.268e-01'
            }
          },
          gnomAD : {
            ac_female: '0',
            ac_male: '1',
            allele_count: 1,
            allele_freq: 0.000008321821480285606,
            allele_num: 120166,
            an_female: '53296',
            an_male: '66870',
            pop_acs: {
              African: 0,
              'East Asian': 1,
              'European (Finnish)': 0,
              'European (Non-Finnish)': 0,
              Latino: 0,
              Other: 0,
              'South Asian': 0
            },
            pop_ans: {
              African: 10096,
              'East Asian': 8604,
              'European (Finnish)': 6606,
              'European (Non-Finnish)': 65956,
              Latino: 11534,
              Other: 902,
              'South Asian': 16468
            },
            pop_homs: {
              African: 0,
              'East Asian': 0,
              'European (Finnish)': 0,
              'European (Non-Finnish)': 0,
              Latino: 0,
              Other: 0,
              'South Asian': 0
            },
            filter: 'PASS',
            quality_metrics: {
              BaseQRankSum: '-7.680e+00',
              ClippingRankSum: '0.845',
              DP: '1920534',
              FS: '1.526',
              InbreedingCoeff: '0.0023',
              MQ: '59.69',
              MQRankSum: '2.36',
              QD: '13.50',
              ReadPosRankSum: '1.09',
              VQSLOD: '-6.268e-01'
            }
          }
        })
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  xit('works with variants_in_transcript', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        const { variants_in_transcript } = data
        const result = sumTableStats(variants_in_transcript)
        expect(Object.keys(result).length).toBe(579)
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})

describe('combineDataForTable', () => {
  const geneId = 'ENSG00000186951'
  const URL = `${API_URL}/gene/${geneId}`
  it('filters/reduces/flattens variant array from multiple data sources based on filter state', (done) => {
    const filters = {
      dataset: 'all',
      filter: 'any',
      indel: 'all',
      consequence: 'all'
    }
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        const { variants_in_gene, uuid_lists } = data
        const result = combineDataForTable(
          filters,
          uuid_lists,
          variants_in_gene
        )
        expect(result.length).toBe(579)
        done()
      }).catch(error => console.log(error))
  })
  it('select only exac', (done) => {
    const filters = {
      dataset: 'exac',
      filter: 'any',
      indel: 'all',
      consequence: 'all'
    }
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        const { variants_in_gene, uuid_lists } = data
        const result = combineDataForTable(
          filters,
          uuid_lists,
          variants_in_gene
        )
        expect(result.length).toBe(575)
        done()
      }).catch(error => console.log(error))
  })
  it('select only gnomad', (done) => {
    const filters = {
      dataset: 'gnomad',
      filter: 'any',
      indel: 'all',
      consequence: 'all'
    }
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        const { variants_in_gene, uuid_lists } = data
        const result = combineDataForTable(
          filters,
          uuid_lists,
          variants_in_gene
        )
        expect(result.length).toBe(20)
        done()
      }).catch(error => console.log(error))
  })
})