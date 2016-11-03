/* eslint-disable  */

// db.combinedVariants.drop()

var mapVariants = function() {
  var values = {
    /**
     * Constant fields
     */
    xpos: this.xpos,
    xstart: this.xstart,
    xstop: this.xstop,
    chrom: this.chrom,
    alt: this.alt,
    genes: this.genes,
    major_consequence: this.major_consequence,
    pos: this.pos,
    ref: this.ref,
    rsid: this.rsid,
    orig_alt_alleles: this.orig_alt_alleles,
    transcripts: this.transcripts,
    vep_annotations: this.vep_annotations,
    variant_id: this.variant_id,

    /**
     * Sum fields
     */
    ac_female: this.ac_female,
    ac_male: this.ac_male,
    allele_count: this.allele_count,
    allele_freq: this.allele_freq,
    allele_num: this.allele_num,
    an_female: this.an_female,
    an_male: this.an_male,
    hom_count: this.hom_count,
    hemi_count: this.hemi_count,

    /**
    * Nested sum fields
    */
    pop_acs: this.pop_acs,
    pop_ans: this.pop_ans,
    pop_homs: this.pop_homs,
    pop_hemis: this.pop_hemis,

    /**
    * Unique fields
    */
    filter: this.filter,
    site_quality: this.site_quality,
    genotype_depths: this.genotype_depths,
    genotype_qualities: this.genotype_qualities,
    quality_metrics: this.quality_metrics,

    /**
    * Computed fields
    */
    datasets: []
    // CANONICAL: this.CANONICAL,
    // HGVS: this.HGVS,
    // HGVSc: this.HGVSc,
    // HGVSp: this.HGVSp,
    // category: this.category,
    // flags: this.flags,
    // indel: this.indel,
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
      'vep_annotations',
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
      'hemi_count',
    ],
    nestedSumFields: [
      'pop_acs',
      // 'pop_ans',
      // 'pop_homs',
      // 'pop_hemis',
    ],
    uniqueFields: [
      // 'ac_female',
      // 'ac_male',
      // 'allele_count',
      // 'allele_freq',
      // 'allele_num',
      // 'an_female',
      // 'an_male',
      // 'pop_acs',
      // 'pop_ans',
      // 'pop_homs',
      // 'pop_hemis',
      'filter',
      // 'site_quality',
      // 'genotype_depths',
      // 'genotype_qualities',
      // 'quality_metrics',
    ],

  }
  // var result = {filters: [], datasets: [], allele_count: 0};
  var result = {}
  fields.constantFields.forEach(function(constantField) {
    result[constantField] = null
  })
  fields.sumFields.forEach(function(sumField) {
    result[sumField] = null
  })
  fields.nestedSumFields.forEach(function(nestedSumField) {
    result[nestedSumField] = null
  })
  fields.uniqueFields.forEach(function(uniqueField) {
    result[uniqueField] = null
  })
  variants.forEach(function (variant) {
    variant.dataset = 'gnomAD';
    // fields.constantFields.forEach(function (field) {
    //   return next[field] = variant[field];
    // });
    // fields.sumFields.forEach(function (field) {
    //   return next[field] = add(next, variant, field);
    // });
    // fields.nestedSumFields.forEach(function (field) {
    //   return next[field] = addNested(next, variant, field);
    // });
    // if (!next['datasets']) {
    //   next['datasets'] = ['all', variant.dataset];
    // } else {
    //   next['datasets'] = [].concat(_toConsumableArray(next['datasets']), [variant.dataset]);
    // }
    // next[variant.dataset] = fields.uniqueFields.reduce(function (acc, field) {
    //   return _extends({}, acc, _defineProperty({}, field, variant[field]));
    // }, {});
    // next.all = fields.uniqueFields.reduce(function (acc, field) {
    //   return _extends({}, acc, _defineProperty({}, field, next[field]));
    // }, {});
    fields.constantFields.forEach(function(constantField) {
      result[constantField] = variant[constantField]
    })
    fields.sumFields.forEach(function(sumField) {
      result[sumField] += variant[sumField]
    })
    // result.filters.push(variant.filter)
    // result.datasets.push(variant.dataset)
    // result.allele_count += variant.allele_count
  });
  return result
}

db.gnomadVariants.mapReduce(mapVariants, reduce, {
  'out': { 'reduce': 'combinedVariants' }
})
// db.gnomadVariants.mapReduce(mapVariants, reduce, {
//   'out': { 'reduce': 'combinedVariants' }
// })
db.combinedVariants.find().pretty()
