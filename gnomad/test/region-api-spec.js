import expect from 'expect'
import fetch from 'isomorphic-fetch'

const API_URL = 'http://127.0.0.1:5002'

describe('region api', () => {
  const regionId = '22-46615715-46615880'
  const URL = `${API_URL}/region/${regionId}`
  it('gets region object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(Object.keys(data))
        expect(Object.keys(data)).toEqual([
          'chrom',
          'coverage',
          'genes_in_region',
          'start',
          'stop',
          'variants_in_region'
        ])
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets region data', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(data.chrom).toBe('22')
        expect(data.genes_in_region).toEqual([{
          canonical_transcript: 'ENST00000396000',
          chrom: '22',
          full_gene_name: 'peroxisome proliferator-activated receptor alpha',
          gene_id: 'ENSG00000186951',
          gene_name: 'PPARA',
          gene_name_upper: 'PPARA',
          omim_accession: '170998',
          omim_description: ' PEROXISOME PROLIFERATOR-ACTIVATED RECEPTOR-ALPHA; PPARA',
          other_names: ['PPAR', 'HPPAR', 'NR1C1'],
          start: 46546425,
          stop: 46639654,
          strand: '+',
          xstart: 22046546425,
          xstop: 22046639654
        }])
        expect(data.coverage.length).toBe(166)
        expect(data.coverage[0]).toEqual({
          1: 1,
          10: 0.9994,
          100: 0.137,
          15: 0.9974,
          20: 0.9893,
          25: 0.969,
          30: 0.9338,
          5: 1,
          50: 0.7262,
          has_coverage: true,
          mean: 64.82,
          median: 64,
          pos: 46615715
        })
        expect(data.start).toBe(46615715)
        expect(data.stop).toBe(46615880)
        expect(data.variants_in_region.length).toBe(21)
        expect(data.variants_in_region[0]).toEqual({
          CANONICAL: 'YES',
          HGVS: 'p.Arg172His',
          HGVSc: 'c.515G>A',
          HGVSp: 'p.Arg172His',
          ac_female: '0',
          ac_male: '2',
          allele_count: 2,
          allele_freq: 0.00001650955077512341,
          allele_num: 121142,
          alt: 'A',
          an_female: '53930',
          an_male: '67212',
          category: 'missense_variant',
          chrom: '22',
          filter: 'PASS',
          flags: [],
          hom_count: 0,
          major_consequence: 'missense_variant',
          pop_acs: {
            African: 0,
            'East Asian': 0,
            'European (Finnish)': 0,
            'European (Non-Finnish)': 2,
            Latino: 0,
            Other: 0,
            'South Asian': 0
          },
          pop_ans: {
            African: 10370,
            'East Asian': 8638,
            'European (Finnish)': 6612,
            'European (Non-Finnish)': 66550,
            Latino: 11562,
            Other: 908,
            'South Asian': 16502
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
          pos: 46615715,
          quality_metrics: {
            BaseQRankSum: '2.34',
            ClippingRankSum: '-1.766e+00',
            DP: '1758483',
            FS: '3.308',
            InbreedingCoeff: '-0.0001',
            MQ: '59.67',
            MQRankSum: '0.287',
            QD: '13.49',
            ReadPosRankSum: '1.99',
            VQSLOD: '0.509'
          },
          ref: 'G',
          rsid: '.',
          variant_id: '22-46615715-G-A'
        })
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
