import expect from 'expect'
import R from 'ramda'
import _ from 'underscore'
import fetch from 'isomorphic-fetch'

const API_URL = 'http://127.0.0.1:5003'

const csq_order = [
  'transcript_ablation',
  'splice_acceptor_variant',
  'splice_donor_variant',
  'stop_gained',
  'frameshift_variant',
  'stop_lost',
  'start_lost',
  'inframe_insertion',
  'inframe_deletion',
  'missense_variant',
  'protein_altering_variant',
  'incomplete_terminal_codon_variant',
  'stop_retained_variant',
  'synonymous_variant',
  'coding_sequence_variant',
  'mature_miRNA_variant',
  '5_prime_UTR_variant',
  '3_prime_UTR_variant',
  'non_coding_transcript_exon_variant',
  'non_coding_exon_variant',
  'NMD_transcript_variant',
  'non_coding_transcript_variant',
  'nc_transcript_variant',
  'downstream_gene_variant',
  'TFBS_ablation',
  'TFBS_amplification',
  'TF_binding_site_variant',
  'regulatory_region_ablation',
  'regulatory_region_amplification',
  'feature_elongation',
  'regulatory_region_variant',
  'feature_truncation',
  'intergenic_variant',
  ''
]
const categoryDefinitions = {
  all: csq_order,
  lof: csq_order.slice(0, csq_order.indexOf('frameshift_variant')),
  missense: csq_order.slice(0, csq_order.indexOf('synonymous_variant')),
  indel: ['inframe_insertion', 'inframe_deletion']
}

function uniqueMajorConsequences(variants_in_gene) {
  return _.uniq(variants_in_gene.map(function(variant) {
    return variant.major_consequence
  }))
}

describe('consequence flitering', () => {
  const geneId = 'ENSG00000169174'
  const URL = `${API_URL}/gene/${geneId}`
  it('plucks categories', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(uniqueMajorConsequences(data.variants_in_gene)).toEqual([
          '5_prime_UTR_variant',
          'missense_variant',
          'synonymous_variant',
          'inframe_deletion',
          'inframe_insertion',
          'frameshift_variant',
          'intron_variant',
          'splice_region_variant',
          'splice_acceptor_variant',
          'stop_gained',
          'splice_donor_variant',
          'non_coding_transcript_exon_variant',
          '3_prime_UTR_variant',
          'stop_lost',
          'downstream_gene_variant'
        ])
        done()
      }).catch(error => console.log(error))
  })
  it('knows category definitions ', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        expect(categoryDefinitions).toEqual({
          all: ['transcript_ablation',
            'splice_acceptor_variant',
            'splice_donor_variant',
            'stop_gained',
            'frameshift_variant',
            'stop_lost',
            'start_lost',
            'inframe_insertion',
            'inframe_deletion',
            'missense_variant',
            'protein_altering_variant',
            'incomplete_terminal_codon_variant',
            'stop_retained_variant',
            'synonymous_variant',
            'coding_sequence_variant',
            'mature_miRNA_variant',
            '5_prime_UTR_variant',
            '3_prime_UTR_variant',
            'non_coding_transcript_exon_variant',
            'non_coding_exon_variant',
            'NMD_transcript_variant',
            'non_coding_transcript_variant',
            'nc_transcript_variant',
            'downstream_gene_variant',
            'TFBS_ablation',
            'TFBS_amplification',
            'TF_binding_site_variant',
            'regulatory_region_ablation',
            'regulatory_region_amplification',
            'feature_elongation',
            'regulatory_region_variant',
            'feature_truncation',
            'intergenic_variant',
            ''
          ],
          lof: ['transcript_ablation',
            'splice_acceptor_variant',
            'splice_donor_variant',
            'stop_gained'
          ],
          missense: ['transcript_ablation',
            'splice_acceptor_variant',
            'splice_donor_variant',
            'stop_gained',
            'frameshift_variant',
            'stop_lost',
            'start_lost',
            'inframe_insertion',
            'inframe_deletion',
            'missense_variant',
            'protein_altering_variant',
            'incomplete_terminal_codon_variant',
            'stop_retained_variant'
          ],
          indel: ['inframe_insertion', 'inframe_deletion']
        })
        done()
      }).catch(error => console.log(error))
  })
  it('pluck maj conseq', (done) => {
    fetch(URL)
      .then(response => response.json())
      .then(data => {
        // console.log(R.pluck('ref', data.variants_in_gne))
        // console.log(R.pluck('alt', data.variants_in_gene))
        done()
      }).catch(error => console.log(error))
  })
})

