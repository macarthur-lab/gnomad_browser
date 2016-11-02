import re
from utils import *

SEARCH_LIMIT = 10000


def get_gene(db, gene_id):
    return db.genes.find_one({'gene_id': gene_id}, projection={'_id': False})


def get_gene_by_name(db, gene_name):
    # try gene_name field first
    gene = db.genes.find_one({'gene_name': gene_name}, projection={'_id': False})
    if gene:
        return gene
    # if not, try gene['other_names']
    return db.genes.find_one({'other_names': gene_name}, projection={'_id': False})


def get_transcript(db, transcript_id):
    transcript = db.transcripts.find_one({'transcript_id': transcript_id}, projection={'_id': False})
    if not transcript:
        return None
    transcript['exons'] = get_exons_in_transcript(db, transcript_id, sort=True)
    return transcript


def get_raw_variant(db, source, xpos, ref, alt, get_id=False):
    if source == 'exac':
        exac_variant = db.variants.find_one({'xpos': xpos, 'ref': ref, 'alt': alt}, projection={'_id': get_id})
        return exac_variant
    if source == 'gnomad':
        gnomad_variant = db.gnomadVariants2.find_one({'xpos': xpos, 'ref': ref, 'alt': alt}, projection={'_id': get_id})
        return gnomad_variant


def get_variant(db, source, xpos, ref, alt):
    variant = get_raw_variant(db, source, xpos, ref, alt, False)
    if variant is None or 'rsid' not in variant:
        return variant
    if variant['rsid'] == '.' or variant['rsid'] is None:
        rsid = db.dbsnp.find_one({'xpos': xpos})
        if rsid:
            variant['rsid'] = 'rs%s' % rsid['rsid']
    return variant


def get_variants_by_rsid(db, rsid):
    if not rsid.startswith('rs'):
        return None
    try:
        int(rsid.lstrip('rs'))
    except Exception, e:
        return None
    exomeVariants = list(db.variants.find({'rsid': rsid}, projection={'_id': False}))
    for variant in exomeVariants:
            variant['dataset'] = 'ExAC'
    genomeVariants = list(db.gnomadVariants2.find({'rsid': rsid}, projection={'_id': False}))
    for variant in genomeVariants:
            variant['dataset'] = 'gnomAD'
    variants = exomeVariants + genomeVariants
    add_consequence_to_variants(variants)
    return variants


def get_variants_from_dbsnp(db, rsid):
    if not rsid.startswith('rs'):
        return None
    try:
        rsid = int(rsid.lstrip('rs'))
    except Exception, e:
        return None
    position = db.dbsnp.find_one({'rsid': rsid})
    if position:
        exomeVariants = list(db.variants.find({'xpos': {'$lte': position['xpos'], '$gte': position['xpos']}}, projection={'_id': False}))
        for variant in exomeVariants:
                variant['dataset'] = 'ExAC'
        genomeVariants = list(db.variants.find({'xpos': {'$lte': position['xpos'], '$gte': position['xpos']}}, projection={'_id': False}))
        for variant in genomeVariants:
                variant['dataset'] = 'gnomAD'
        if variants:
            variants = exomeVariants + genomeVariants
            add_consequence_to_variants(variants)
            return variants
    return []


def get_coverage_for_bases(db, collection, xstart, xstop=None):
    """
    Get the coverage for the list of bases given by xstart->xstop, inclusive
    Returns list of coverage dicts
    xstop can be None if just one base, but you'll still get back a list
    """
    if xstop is None:
        xstop = xstart
    coverages = {
        doc['xpos']: doc for doc in db[collection].find(
            {'xpos': {'$gte': xstart, '$lte': xstop}},
            projection={'_id': False}
        )
    }
    ret = []
    for i in range(xstart, xstop+1):
        if i in coverages:
            ret.append(coverages[i])
        else:
            ret.append({'xpos': i, 'pos': xpos_to_pos(i)})
    for item in ret:
        item['has_coverage'] = 'mean' in item
        del item['xpos']
    return ret


def get_coverage_for_transcript(db, collection, xstart, xstop=None):
    """

    :param db:
    :param genomic_coord_to_exon:
    :param xstart:
    :param xstop:
    :return:
    """
    coverage_array = get_coverage_for_bases(db, collection, xstart, xstop)
    # only return coverages that have coverage (if that makes any sense?)
    # return coverage_array
    covered = [c for c in coverage_array if c['has_coverage']]
    for c in covered:
        del c['has_coverage']
    return covered


def get_constraint_for_transcript(db, transcript):
    return db.constraint.find_one({'transcript': transcript}, projection={'_id': False})


def get_exons_cnvs(db, transcript_name):
   return list(db.cnvs.find({'transcript': transcript_name}, projection={'_id': False}))

def get_cnvs(db, gene_name):
   return list(db.cnvgenes.find({'gene': gene_name}, projection={'_id': False}))


def get_awesomebar_suggestions(g, query):
    """
    This generates autocomplete suggestions when user
    query is the string that user types
    If it is the prefix for a gene, return list of gene names
    """
    regex = re.compile('^' + re.escape(query), re.IGNORECASE)
    results = [r for r in g.autocomplete_strings if regex.match(r)][:20]
    return results


# 1:1-1000
R1 = re.compile(r'^(\d+|X|Y|M|MT)\s*:\s*(\d+)-(\d+)$')
R2 = re.compile(r'^(\d+|X|Y|M|MT)\s*:\s*(\d+)$')
R3 = re.compile(r'^(\d+|X|Y|M|MT)$')
# R4 = re.compile(r'^(\d+|X|Y|M|MT)\s*[-:]\s*(\d+)-([ATCG]+)-([ATCG]+)$')
R4 = re.compile(r'^\s*(\d+|X|Y|M|MT)\s*[-:]\s*(\d+)[-:\s]*([ATCG]+)\s*[-:/]\s*([ATCG]+)\s*$')


def get_awesomebar_result(db, query):
    """
    Similar to the above, but this is after a user types enter
    We need to figure out what they meant - could be gene, variant, region

    Return tuple of (datatype, identifier)
    Where datatype is one of 'gene', 'variant', or 'region'
    And identifier is one of:
    - ensembl ID for gene
    - variant ID string for variant (eg. 1-1000-A-T)
    - region ID string for region (eg. 1-1000-2000)

    Follow these steps:
    - if query is an ensembl ID, return it
    - if a gene symbol, return that gene's ensembl ID
    - if an RSID, return that variant's string


    Finally, note that we don't return the whole object here - only it's identifier.
    This could be important for performance later

    """
    query = query.strip()
    print 'Query: %s' % query

    # Variant
    variant = get_variants_by_rsid(db, query.lower())
    if variant:
        if len(variant) == 1:
            return 'variant', variant[0]['variant_id']
        else:
            return 'dbsnp_variant_set', variant[0]['rsid']
    variant = get_variants_from_dbsnp(db, query.lower())
    if variant:
        return 'variant', variant[0]['variant_id']
    # variant = get_variant(db, )
    # TODO - https://github.com/brettpthomas/exac_browser/issues/14

    gene = get_gene_by_name(db, query)
    if gene:
        return 'gene', gene['gene_id']

    # From here out, all should be uppercase (gene, tx, region, variant_id)
    query = query.upper()
    gene = get_gene_by_name(db, query)
    if gene:
        return 'gene', gene['gene_id']

    # Ensembl formatted queries
    if query.startswith('ENS'):
        # Gene
        gene = get_gene(db, query)
        if gene:
            return 'gene', gene['gene_id']

        # Transcript
        transcript = get_transcript(db, query)
        if transcript:
            return 'transcript', transcript['transcript_id']

    # From here on out, only region queries
    if query.startswith('CHR'):
        query = query.lstrip('CHR')
    # Region
    m = R1.match(query)
    if m:
        if int(m.group(3)) < int(m.group(2)):
            return 'region', 'invalid'
        return 'region', '{}-{}-{}'.format(m.group(1), m.group(2), m.group(3))
    m = R2.match(query)
    if m:
        return 'region', '{}-{}-{}'.format(m.group(1), m.group(2), m.group(2))
    m = R3.match(query)
    if m:
        return 'region', '{}'.format(m.group(1))
    m = R4.match(query)
    if m:
        return 'variant', '{}-{}-{}-{}'.format(m.group(1), m.group(2), m.group(3), m.group(4))

    return 'not_found', query


def get_genes_in_region(db, chrom, start, stop):
    """
    Genes that overlap a region
    """
    xstart = get_xpos(chrom, start)
    xstop = get_xpos(chrom, stop)
    genes = db.genes.find({
        'xstart': {'$lte': xstop},
        'xstop': {'$gte': xstart},
    }, projection={'_id': False})
    return list(genes)


def get_variants_in_region(db, chrom, start, stop):
    """
    Variants that overlap a region
    Unclear if this will include CNVs
    """
    xstart = get_xpos(chrom, start)
    xstop = get_xpos(chrom, stop)

    exomeVariants = list(db.variants.find({
        'xpos': {'$lte': xstop, '$gte': xstart}
    }, projection={'_id': False}, limit=SEARCH_LIMIT))
    for variant in exomeVariants:
        variant['dataset'] = 'ExAC'
    genomeVariants = list(db.gnomadVariants2.find({
        'xpos': {'$lte': xstop, '$gte': xstart}
    }, projection={'_id': False}, limit=SEARCH_LIMIT))
    for variant in genomeVariants:
        variant['dataset'] = 'gnomAD'
    variants = exomeVariants + genomeVariants
    add_consequence_to_variants(variants)
    for variant in variants:
        remove_extraneous_information(variant)

    return list(variants)


def get_metrics(db, variant):
    if 'allele_count' not in variant or variant['allele_num'] == 0:
        return None
    metrics = {}
    for metric in METRICS:
        metrics[metric] = db.metrics.find_one({'metric': metric}, projection={'_id': False})

    metric = None
    if variant['allele_count'] == 1:
        metric = 'singleton'
    elif variant['allele_count'] == 2:
        metric = 'doubleton'
    else:
        for af in AF_BUCKETS:
            if float(variant['allele_count'])/variant['allele_num'] < af:
                metric = af
                break
    if metric is not None:
        metrics['Site Quality'] = db.metrics.find_one({'metric': 'binned_%s' % metric}, projection={'_id': False})
    return metrics


def remove_extraneous_information(variant):
    del variant['genotype_depths']
    del variant['genotype_qualities']
    del variant['transcripts']
    del variant['genes']
    del variant['orig_alt_alleles']
    del variant['xpos']
    del variant['xstart']
    del variant['xstop']
    del variant['site_quality']
    del variant['vep_annotations']

def get_variants_in_gene_or_transcript(db, gene_id=None, transcript_id=None):
    """Return ExAC and gnomad variants in a gene or transcript
    Args:
        db: The mongo database object
        gene_id, transcript_id: one and only one of these 2 arguments must be specified. This function will 
             query for variants in the exons of the given gene or the transcript depending on which one is specified. 
    """

    all_variants = []
    exac_variant_uuids = []
    gnomad_variant_uuids = []

    if gene_id is not None and transcript_id is not None:
        raise ValueError("Both gene_id and transcript_id args are not None")
    if gene_id is not None: 
        exons = get_exons_in_gene(db, gene_id)
    elif transcript_id is not None:
        exons = get_exons_in_transcript(db, transcript_id)
    else:
        raise ValueError("Both gene_id and transcript_id args = None")
    
    query_limit_to_exon_ranges = {'$or': [{'$and': [{'xpos': {'$gt': int(exon['xstart'])-75}}, {'xpos': {'$lt': int(exon['xstop'])+75}}]} for exon in exons]}
    query = {'$and': [{'genes': gene_id} if gene_id is not None else {'transcripts': transcript_id}, query_limit_to_exon_ranges]}



    results = list(db.variants.find(query))
    print("Retrieving %s ExAC v2 variants in %s exons of %s" % (len(results), len(exons), gene_id or transcript_id))
    for variant in results:
        variant['vep_annotations'] = [x for x in variant['vep_annotations'] if (x['Gene'] == gene_id or x['Feature'] == transcript_id)]
        variant['uuid'] = str(variant['_id'])
        variant['dataset'] = 'ExAC'
        del variant['_id']
        add_consequence_to_variant(variant)
        remove_extraneous_information(variant)
        exac_variant_uuids.append(variant['uuid'])
        all_variants.append(variant)
    
    results = list(db.gnomadVariants2.find(query))
    print("Retrieving %s gnomad variants in %s exons of %s" % (len(results), len(exons), gene_id or transcript_id))
    for variant in results:
        variant['vep_annotations'] = [x for x in variant['vep_annotations'] if  (x['Gene'] == gene_id or x['Feature'] == transcript_id)]
        variant['uuid'] = str(variant['_id'])
        variant['dataset'] = 'gnomAD'
        del variant['_id']
        add_consequence_to_variant(variant)
        remove_extraneous_information(variant)
        gnomad_variant_uuids.append(variant['uuid'])
        all_variants.append(variant)
    print("Returning %s variants" % len(all_variants))
    return {
        'all_variants': all_variants,
        'uuid_lists': {
            'all': exac_variant_uuids + gnomad_variant_uuids,
            'exac': exac_variant_uuids,
            'gnomad': gnomad_variant_uuids
        }
    }

def get_transcripts_in_gene(db, gene_id):
    """
    """
    return list(db.transcripts.find({'gene_id': gene_id}, projection={'_id': False}))


def get_exons_in_transcript(db, transcript_id, sort=True):
    results = db.exons.find({'transcript_id': transcript_id, 'feature_type': { "$in": ['CDS', 'UTR', 'exon'] }}, projection={'_id': False})
    if sort:        
        return sorted(results, key=lambda k: k['start'])
    else:
        return results

def get_exons_in_gene(db, gene_id, sort=False):
    results = list(db.exons.find({'gene_id': gene_id, 'feature_type': { "$in": ['CDS', 'UTR', 'exon'] }}, projection={'_id': False}))
    if sort:
        return sorted(results, key=lambda k: k['start'])
    else:
        return results
