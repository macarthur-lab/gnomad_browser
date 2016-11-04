/* eslint-disable  */

// db.combinedVariants.drop()

var mapVariantsGenomes = function() {
  var values = {
    /**
     * Constant fields
     */
    xpos: Number(this.xpos),
    xstart: Number(this.xstart),
    xstop: Number(this.xstop),
    chrom: Number(this.chrom),
    alt: this.alt,
    genes: this.genes,
    pos: Number(this.pos),
    ref: this.ref,
    rsid: this.rsid,
    orig_alt_alleles: this.orig_alt_alleles,
    transcripts: this.transcripts,
    // vep_annotations: this.vep_annotations,
    variant_id: this.variant_id,

    /**
     * Sum fields
     */
    ac_female: Number(this.ac_female),
    ac_male: Number(this.ac_male),
    allele_count: Number(this.allele_count),
    allele_freq: Number(this.allele_freq),
    allele_num: Number(this.allele_num),
    an_female: Number(this.an_female),
    an_male: Number(this.an_male),
    hom_count: Number(this.hom_count),
    // hemi_count: Number(this.hemi_count),

    /**
    * Nested sum fields
    */
    pop_acs: this.pop_acs,
    pop_ans: this.pop_ans,
    pop_homs: this.pop_homs,
    // pop_hemis: this.pop_hemis,

    /**
    * Unique fields
    */
    dataset: 'gnomAD',
    datasets: ['all', 'gnomAD'],
    all: {
      filter: this.filter,
      site_quality: this.site_quality,
      genotype_depths: this.genotype_depths,
      genotype_qualities: this.genotype_qualities,
      quality_metrics: this.quality_metrics,
      ac_female: Number(this.ac_female),
      ac_male: Number(this.ac_male),
      allele_count: Number(this.allele_count),
      allele_freq: Number(this.allele_freq),
      allele_num: Number(this.allele_num),
      an_female: Number(this.an_female),
      an_male: Number(this.an_male),
      hom_count: Number(this.hom_count),
      // hemi_count: Number(this.hemi_count),
      pop_acs: this.pop_acs,
      pop_ans: this.pop_ans,
      pop_homs: this.pop_homs,
      // pop_hemis: this.pop_hemis,
    },
    gnomAD: {
      filter: this.filter,
      site_quality: this.site_quality,
      genotype_depths: this.genotype_depths,
      genotype_qualities: this.genotype_qualities,
      quality_metrics: this.quality_metrics,
      ac_female: Number(this.ac_female),
      ac_male: Number(this.ac_male),
      allele_count: Number(this.allele_count),
      allele_freq: Number(this.allele_freq),
      allele_num: Number(this.allele_num),
      an_female: Number(this.an_female),
      an_male: Number(this.an_male),
      hom_count: Number(this.hom_count),
      // hemi_count: Number(this.hemi_count),
      pop_acs: this.pop_acs,
      pop_ans: this.pop_ans,
      pop_homs: this.pop_homs,
      // pop_hemis: this.pop_hemis,
    }

    /**
    * Computed fields
    */
    // CANONICAL: this.CANONICAL,
    // HGVS: this.HGVS,
    // HGVSc: this.HGVSc,
    // HGVSp: this.HGVSp,
    // category: this.category,
    // flags: this.flags,
    // indel: this.indel,
    // major_consequence: this.major_consequence,
  }


  emit(this.variant_id, values)
}
var mapVariantsExomes = function() {
  var values = {
    /**
     * Constant fields
     */
    xpos: Number(this.xpos),
    xstart: Number(this.xstart),
    xstop: Number(this.xstop),
    chrom: Number(this.chrom),
    alt: this.alt,
    genes: this.genes,
    pos: Number(this.pos),
    ref: this.ref,
    rsid: this.rsid,
    orig_alt_alleles: this.orig_alt_alleles,
    transcripts: this.transcripts,
    // vep_annotations: this.vep_annotations,
    variant_id: this.variant_id,

    /**
     * Sum fields
     */
    ac_female: Number(this.ac_female),
    ac_male: Number(this.ac_male),
    allele_count: Number(this.allele_count),
    allele_freq: Number(this.allele_freq),
    allele_num: Number(this.allele_num),
    an_female: Number(this.an_female),
    an_male: Number(this.an_male),
    hom_count: Number(this.hom_count),
    // hemi_count: Number(this.hemi_count),

    /**
    * Nested sum fields
    */
    pop_acs: this.pop_acs,
    pop_ans: this.pop_ans,
    pop_homs: this.pop_homs,
    // pop_hemis: this.pop_hemis,

    /**
    * Unique fields
    */
    dataset: 'ExAC',
    datasets: ['all', 'ExAC'],
    all: {
      filter: this.filter,
      site_quality: this.site_quality,
      genotype_depths: this.genotype_depths,
      genotype_qualities: this.genotype_qualities,
      quality_metrics: this.quality_metrics,
      ac_female: Number(this.ac_female),
      ac_male: Number(this.ac_male),
      allele_count: Number(this.allele_count),
      allele_freq: Number(this.allele_freq),
      allele_num: Number(this.allele_num),
      an_female: Number(this.an_female),
      an_male: Number(this.an_male),
      hom_count: Number(this.hom_count),
      // hemi_count: Number(this.hemi_count),
      pop_acs: this.pop_acs,
      pop_ans: this.pop_ans,
      pop_homs: this.pop_homs,
      // pop_hemis: this.pop_hemis,
    },
    ExAC: {
      filter: this.filter,
      site_quality: this.site_quality,
      genotype_depths: this.genotype_depths,
      genotype_qualities: this.genotype_qualities,
      quality_metrics: this.quality_metrics,
      ac_female: Number(this.ac_female),
      ac_male: Number(this.ac_male),
      allele_count: Number(this.allele_count),
      allele_freq: Number(this.allele_freq),
      allele_num: Number(this.allele_num),
      an_female: Number(this.an_female),
      an_male: Number(this.an_male),
      hom_count: Number(this.hom_count),
      // hemi_count: Number(this.hemi_count),
      pop_acs: this.pop_acs,
      pop_ans: this.pop_ans,
      pop_homs: this.pop_homs,
      // pop_hemis: this.pop_hemis,
    }

    /**
    * Computed fields
    */
    // CANONICAL: this.CANONICAL,
    // HGVS: this.HGVS,
    // HGVSc: this.HGVSc,
    // HGVSp: this.HGVSp,
    // category: this.category,
    // flags: this.flags,
    // indel: this.indel,
    // major_consequence: this.major_consequence,
  }


  emit(this.variant_id, values)
}

var reduce = function(key, variants) {
  var fields = {
    constantFields: [
      'xpos',
      'xstart',
      'xstop',
      'chrom',
      // 'CANONICAL',
      // 'HGVS',
      // 'HGVSc',
      // 'HGVSp',
      'alt',
      // 'category',
      // 'flags',
      // 'indel',
      'genes',
      // 'major_consequence',
      'pos',
      'ref',
      'rsid',
      'orig_alt_alleles',
      'transcripts',
      // 'vep_annotations',
      'variant_id',
    ],
    sumFields: [
      'ac_female',
      'ac_male',
      'allele_count',
      'allele_freq',
      'allele_num',
      'an_female',
      'an_male',
      'hom_count',
      // 'hemi_count',
    ],
    nestedSumFields: [
      'pop_acs',
      'pop_ans',
      'pop_homs',
      // 'pop_hemis',
    ],
    uniqueFields: [
      'ac_female',
      'ac_male',
      'allele_count',
      'allele_freq',
      'allele_num',
      'an_female',
      'an_male',
      'pop_acs',
      'pop_ans',
      'pop_homs',
      // 'pop_hemis',
      'filter',
      // 'site_quality',
      // 'genotype_depths',
      // 'genotype_qualities',
      // 'quality_metrics',
    ],
    populations: [
      "European (Non-Finnish)",
      "East Asian",
      "Other",
      "African",
      "Latino",
      "South Asian",
      "European (Finnish)",
    ]
  }
  // dataset = 'ExAC'
  var result = {
    datasets: ['all'],
    // dataset: '',
    all: {},
  }
  fields.constantFields.forEach(function(constantField) {
    result[constantField] = null
  })
  fields.sumFields.forEach(function(sumField) {
    result['all'][sumField] = null
  })
  fields.nestedSumFields.forEach(function(nestedSumField) {
    // result[nestedSumField] = {}
    // result[dataset][nestedSumField] = {}
    result['all'][nestedSumField] = {}
    fields.populations.forEach(function(population) {
      // result[nestedSumField][population] = null
      // result[dataset][nestedSumField][population] = null
      result['all'][nestedSumField][population] = null
    })
  })
  variants.forEach(function (variant) {
    result[variant.dataset] = {}
    result.datasets.push(variant.dataset)
    fields.constantFields.forEach(function(constantField) {
      result[constantField] = variant[constantField]
    })
    fields.sumFields.forEach(function(sumField) {
      result['all'][sumField] += Number(variant[sumField])
    })
    result[variant.dataset] = variant[variant.dataset]
    fields.nestedSumFields.forEach(function(nestedSumField) {
      fields.populations.forEach(function(pop) {
        // result[nestedSumField][pop] += Number(variant[nestedSumField][pop])
        result['all'][nestedSumField][pop] += Number(variant[variant.dataset][nestedSumField][pop])
      })
    })
  });
  return result
}

db.gnomadVariants.mapReduce(mapVariantsGenomes, reduce, {
  'out': { 'reduce': 'combinedVariants' }
})
db.pparaExacVariants.mapReduce(mapVariantsExomes, reduce, {
  'out': { 'reduce': 'combinedVariants' }
})

