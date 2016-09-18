import expect from 'expect'
import fetch from 'isomorphic-fetch'
import R from 'ramda'
import metricsExample from './exampleData/metricsExample'

const API_URL = 'http://127.0.0.1:5002'

describe('variant api', () => {
  const variantId = '22-46615880-T-C'
  const URL = `${API_URL}/variant/${variantId}`
  it('gets variant object with keys', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(Object.keys(data))
        expect(Object.keys(data)).toEqual([
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
  it('gets variant data', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(Object.keys(data.variant)).toEqual([
          'CANONICAL',
          'HGVS',
          'HGVSc',
          'HGVSp',
          'ac_female',
          'ac_male',
          'allele_count',
          'allele_freq',
          'allele_num',
          'alt',
          'an_female',
          'an_male',
          'category',
          'chrom',
          'filter',
          'flags',
          'genes',
          'genotype_depths',
          'genotype_qualities',
          'hom_count',
          'major_consequence',
          'orig_alt_alleles',
          'pop_acs',
          'pop_ans',
          'pop_homs',
          'pos',
          'quality_metrics',
          'ref',
          'rsid',
          'site_quality',
          'transcripts',
          'variant_id',
          'vep_annotations',
          'xpos',
          'xstart',
          'xstop'
        ])
        const longFieldsDropped = R.omit(
          ['genotype_depths', 'genotype_qualities', 'vep_annotations'],
          data.variant
        )
        expect(longFieldsDropped).toEqual({
          CANONICAL: 'YES',
          HGVS: 'p.Val227Ala',
          HGVSc: 'c.680T>C',
          HGVSp: 'p.Val227Ala',
          ac_female: '653,1',
          ac_male: '510,0',
          allele_count: 1163,
          allele_freq: 0.009612682459127503,
          allele_num: 120986,
          alt: 'C',
          an_female: '53850',
          an_male: '67136',
          category: 'missense_variant',
          chrom: '22',
          filter: 'PASS',
          flags: [],
          genes: ['ENSG00000186951'],
          hom_count: 39,
          major_consequence: 'missense_variant',
          orig_alt_alleles: ['22-46615880-T-C', '22-46615880-T-A'],
          pop_acs: {
            African: 6,
            'East Asian': 361,
            'European (Finnish)': 22,
            'European (Non-Finnish)': 73,
            Latino: 649,
            Other: 10,
            'South Asian': 42
          },
          pop_ans: {
            African: 10294,
            'East Asian': 8618,
            'European (Finnish)': 6606,
            'European (Non-Finnish)': 66602,
            Latino: 11522,
            Other: 904,
            'South Asian': 16440
          },
          pop_homs: {
            African: 0,
            'East Asian': 8,
            'European (Finnish)': 1,
            'European (Non-Finnish)': 0,
            Latino: 28,
            Other: 0,
            'South Asian': 2
          },
          pos: 46615880,
          quality_metrics: {
            BaseQRankSum: '2.51',
            ClippingRankSum: '-1.210e-01',
            DP: '1780042',
            FS: '0.526',
            InbreedingCoeff: '0.0568',
            MQ: '59.82',
            MQRankSum: '0.251',
            QD: '13.75',
            ReadPosRankSum: '0.345',
            VQSLOD: '5.06'
          },
          ref: 'T',
          rsid: 'rs1800234',
          site_quality: 1209806.67,
          transcripts: ['ENST00000434345',
            'ENST00000262735',
            'ENST00000407236',
            'ENST00000420804',
            'ENST00000396000',
            'ENST00000493286',
            'ENST00000402126'
          ],
          variant_id: '22-46615880-T-C',
          xpos: 22046615880,
          xstart: 22046615880,
          xstop: 22046615880
        })
        done()
         // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets variant vep_annotations', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(data.variant.vep_annotations.length).toBe(6)
        expect(data.variant.vep_annotations[0]).toEqual({
          AA_MAF: 'C:0.0002',
          AFR_MAF: 'C:0',
          ALLELE_NUM: '1',
          AMR_MAF: 'C:0.0576',
          ASN_MAF: '',
          Allele: 'C',
          Amino_acids: 'V/A',
          BIOTYPE: 'protein_coding',
          CANONICAL: '',
          CCDS: 'CCDS33669.1',
          CDS_position: '680',
          CLIN_SIG: '',
          Codons: 'gTc/gCc',
          Consequence: 'missense_variant',
          DISTANCE: '',
          DOMAINS: 'Superfamily_domains:SSF48508&hmmpanther:PTHR24082&hmmpanther:PTHR24082:SF197',
          EAS_MAF: 'C:0.0427',
          EA_MAF: 'C:0.0008',
          ENSP: 'ENSP00000262735',
          EUR_MAF: 'C:0.001',
          EXON: '6/8',
          Existing_variation: 'rs1800234&CM021318',
          Feature: 'ENST00000262735',
          Feature_type: 'Transcript',
          GMAF: 'C:0.0170',
          Gene: 'ENSG00000186951',
          HGNC_ID: '9232',
          HGVS: 'p.Val227Ala',
          HGVS_OFFSET: '',
          HGVSc: 'ENST00000262735.5:c.680T>C',
          HGVSp: 'ENSP00000262735.5:p.Val227Ala',
          HIGH_INF_POS: '',
          IMPACT: 'MODERATE',
          INTRON: '',
          LoF: '',
          LoF_filter: '',
          LoF_flags: '',
          LoF_info: '',
          MINIMISED: '',
          MOTIF_NAME: '',
          MOTIF_POS: '',
          MOTIF_SCORE_CHANGE: '',
          PHENO: '0&1',
          PUBMED: '18541586&20414453&18401448&19217440',
          PolyPhen: 'benign(0)',
          Protein_position: '227',
          SAS_MAF: 'C:0.001',
          SIFT: 'tolerated(1)',
          SOMATIC: '',
          STRAND: '1',
          SWISSPROT: 'PPARA_HUMAN',
          SYMBOL: 'PPARA',
          SYMBOL_SOURCE: 'HGNC',
          TREMBL: 'F1D8S4_HUMAN&B0QYX2_HUMAN',
          TSL: '',
          UNIPARC: 'UPI000000D8E0',
          VARIANT_CLASS: 'SNV',
          ancestral: '',
          cDNA_position: '862',
          context: 'GTC',
          major_consequence: 'missense_variant'
        })
        done()
        // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets metrics', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(Object.keys(data.metrics)).toEqual([
          'BaseQRankSum',
          'ClippingRankSum',
          'DP',
          'FS',
          'InbreedingCoeff',
          'MQ',
          'MQRankSum',
          'QD',
          'ReadPosRankSum',
          'Site Quality',
          'VQSLOD'
        ])
        expect(data.metrics).toEqual(metricsExample)
        done()
        // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets consequences', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(Object.keys(data.consequences)).toEqual([
          'intron_variant',
          'missense_variant',
          'non_coding_transcript_exon_variant'
        ])
        expect(Object.keys(data.consequences.intron_variant)).toEqual([ 'ENSG00000186951' ])
        expect(
          // vep annotation array
          data.consequences.intron_variant.ENSG00000186951[0].major_consequence
        ).toEqual('intron_variant')
        done()
        // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets read_viz', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(data.read_viz).toEqual({
          het: {
            all_samples_missing: true,
            n_available: 0,
            n_expected: -1,
            readgroups: [],
            urls: []
          },
          hom: {
            all_samples_missing: true,
            n_available: 0,
            n_expected: -1,
            readgroups: [],
            urls: []
          }
        })
        done()
        // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets any_covered', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(data.any_covered).toBe(true)
        done()
        // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
  it('gets base_coverage', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(data.base_coverage).toEqual([{
          '1': 1,
          '5': 1,
          '10': 0.9994,
          '15': 0.9972,
          '20': 0.9893,
          '25': 0.9629,
          '30': 0.9127,
          '50': 0.4992,
          '100': 0.106,
          has_coverage: true,
          mean: 54.56,
          median: 49,
          pos: 46615880
        }])
        done()
        // eslint-disable-next-line
      }).catch(error => console.log(error))
  })
})
