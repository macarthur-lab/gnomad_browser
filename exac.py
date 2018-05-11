import itertools
import json
import os
import pymongo
import pysam
import gzip
from parsing import *
import logging
import lookups
import random
import sys
import requests
from tqdm import tqdm
from utils import *

import warnings
from flask.exthook import ExtDeprecationWarning
warnings.simplefilter('ignore', ExtDeprecationWarning)

from flask import Flask, request, session, g, redirect, url_for, abort, render_template, flash, jsonify, send_from_directory
from flask_compress import Compress
from flask_runner import Runner
from flask_errormail import mail_on_500
from flask_cors import CORS, cross_origin

from flask import Response
from collections import defaultdict, OrderedDict
from werkzeug.contrib.cache import SimpleCache

from multiprocessing import Process
import glob
import sqlite3
import traceback
import time

logging.getLogger().addHandler(logging.StreamHandler())
logging.getLogger().setLevel(logging.INFO)

ADMINISTRATORS = (
    'exac.browser.errors@gmail.com',
)

app = Flask(__name__)
mail_on_500(app, ADMINISTRATORS)
Compress(app)
CORS(app)
app.config['COMPRESS_DEBUG'] = True
cache = SimpleCache()

DEPLOYMENT_ENVIRONMENT = os.getenv('DEPLOYMENT_ENV', 'development')

MONGO_HOST = os.getenv('MONGO_HOST', 'mongo')
MONGO_PORT = os.getenv('MONGO_PORT', 27017)
MONGO_URL = 'mongodb://%s:%s' % (MONGO_HOST, MONGO_PORT)

if DEPLOYMENT_ENVIRONMENT == 'development':
     EXOME_FILES_DIRECTORY = '/Users/msolomon/Projects/exacg/feb2017releasetestdata/170226/exomes/'
     GENOME_FILES_DIRECTORY = '/Users/msolomon/Projects/exacg/feb2017releasetestdata/170226/genomes/'
     EXOMES_SITES_VCFS = glob.glob(os.path.join(os.path.dirname(__file__), EXOME_FILES_DIRECTORY, 'gnomad.exomes.sites.X.vcf.bgz'))
     GENOMES_SITES_VCFS = glob.glob(os.path.join(os.path.dirname(__file__), GENOME_FILES_DIRECTORY, 'gnomad.genomes.sites.coding.X.vcf.bgz'))

if DEPLOYMENT_ENVIRONMENT == 'production':
    EXOME_FILES_DIRECTORY = '/var/data/loading_data/exomes'
    GENOME_FILES_DIRECTORY = '/var/data/loading_data/genomes'
    EXOMES_SITES_VCFS = glob.glob(os.path.join(os.path.dirname(__file__), EXOME_FILES_DIRECTORY, os.getenv('EXOMES_SINGLE_VCF')))
    GENOMES_SITES_VCFS = glob.glob(os.path.join(os.path.dirname(__file__), GENOME_FILES_DIRECTORY, os.getenv('GENOMES_VCF_GLOB')))

if DEPLOYMENT_ENVIRONMENT == 'production_test':
    EXOME_FILES_DIRECTORY = '/var/data/loading_data/exomes'
    GENOME_FILES_DIRECTORY = '/var/data/loading_data/genomes'
    EXOMES_SITES_VCFS = glob.glob(os.path.join(os.path.dirname(__file__), EXOME_FILES_DIRECTORY, os.getenv('EXOMES_SINGLE_VCF_TEST')))
    GENOMES_SITES_VCFS = glob.glob(os.path.join(os.path.dirname(__file__), GENOME_FILES_DIRECTORY, os.getenv('GENOMES_VCF_GLOB_TEST')))

SHARED_FILES_DIRECTORY = '../data/loading_data/shared_files'
READ_VIZ_DIRECTORY = '../data/readviz'

REGION_LIMIT = 1E5
EXON_PADDING = 50
# Load default config and override config from an environment variable
app.config.update(dict(
    DB_HOST='localhost',
    DB_PORT=27017,
    DB_NAME='exac',
    DEBUG=True,
    SECRET_KEY='development key',
    LOAD_DB_PARALLEL_PROCESSES = int(os.getenv('LOAD_DB_PARALLEL_PROCESSES_NUMB', 2)),
    # contigs assigned to threads, so good to make this a factor of 24 (eg. 2,3,4,6,8)
    EXOMES_SITES_VCFS=EXOMES_SITES_VCFS,
    GENOMES_SITES_VCFS=GENOMES_SITES_VCFS,
    # GENOMES_SITES_VCFS=glob.glob(os.path.join(os.path.dirname(__file__), GENOME_FILES_DIRECTORY, 'one_gene/*.gz')),
    GENCODE_GTF=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'gencode.gtf.gz'),
    CANONICAL_TRANSCRIPT_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'canonical_transcripts.txt.gz'),
    OMIM_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'omim_info.txt.gz'),
    EXOME_BASE_COVERAGE_FILES=glob.glob(os.path.join(os.path.dirname(__file__), EXOME_FILES_DIRECTORY, 'coverage', 'exacv2.*.cov.txt.gz')),
    GENOME_BASE_COVERAGE_FILES=glob.glob(os.path.join(os.path.dirname(__file__), GENOME_FILES_DIRECTORY, 'coverage', '*.genome.coverage.txt.gz')),
    DBNSFP_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'dbNSFP2.6_gene.gz'),
    CONSTRAINT_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'forweb_cleaned_exac_r03_march16_z_data_pLI_CNV-final.txt.gz'),
    MNP_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'MNPs_NotFiltered_ForBrowserRelease.txt.gz'),
    CNV_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'exac-gencode-exon.cnt.final.pop3'),
    CNV_GENE_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'exac-final-cnvs.gene.rank'),

    # How to get a dbsnp142.txt.bgz file:
    #   wget ftp://ftp.ncbi.nlm.nih.gov/snp/organisms/human_9606_b142_GRCh37p13/database/organism_data/b142_SNPChrPosOnRef_105.bcp.gz
    #   zcat b142_SNPChrPosOnRef_105.bcp.gz | awk '$3 != ""' | perl -pi -e 's/ +/\t/g' | sort -k2,2 -k3,3n | bgzip -c > dbsnp142.txt.bgz
    #   tabix -s 2 -b 3 -e 3 dbsnp142.txt.bgz
    DBSNP_FILE=os.path.join(os.path.dirname(__file__), SHARED_FILES_DIRECTORY, 'dbsnp142.txt.bgz'),

    #READ_VIZ_DIR=os.path.abspath(os.path.join(os.path.dirname(__file__), EXOME_FILES_DIRECTORY, "readviz")),
    READ_VIZ_DIR=os.path.abspath(READ_VIZ_DIRECTORY),
))

GENE_CACHE_DIR = os.path.join(os.path.dirname(__file__), 'gene_cache')
GENES_TO_CACHE = {l.strip('\n') for l in open(os.path.join(os.path.dirname(__file__), 'genes_to_cache.txt'))}

def environment_test():
     print app.config['LOAD_DB_PARALLEL_PROCESSES']
     print DEPLOYMENT_ENVIRONMENT

def connect_db():
    """
    Connects to the specific database.
    """
    if DEPLOYMENT_ENVIRONMENT == 'production' or DEPLOYMENT_ENVIRONMENT == 'production_test' :
        client = pymongo.MongoClient(MONGO_URL)
    elif DEPLOYMENT_ENVIRONMENT == 'development':
        client = pymongo.MongoClient(host=app.config['DB_HOST'], port=app.config['DB_PORT'])
    return client[app.config['DB_NAME']]

def parse_tabix_file_subset(tabix_filenames, subset_i, subset_n, record_parser):
    """
    Returns a generator of parsed record objects (as returned by record_parser) for the i'th out n subset of records
    across all the given tabix_file(s). The records are split by files and contigs within files, with 1/n of all contigs
    from all files being assigned to this the i'th subset.

    Args:
        tabix_filenames: a list of one or more tabix-indexed files. These will be opened using pysam.Tabixfile
        subset_i: zero-based number
        subset_n: total number of subsets
        record_parser: a function that takes a file-like object and returns a generator of parsed records
    """
    start_time = time.time()
    open_tabix_files = [pysam.Tabixfile(tabix_filename) for tabix_filename in tabix_filenames]
    tabix_file_contig_pairs = [(tabix_file, contig) for tabix_file in open_tabix_files for contig in tabix_file.contigs]
    tabix_file_contig_subset = tabix_file_contig_pairs[subset_i : : subset_n]  # get every n'th tabix_file/contig pair
    short_filenames = ", ".join(map(os.path.basename, tabix_filenames))
    num_file_contig_pairs = len(tabix_file_contig_subset)
    print(("Loading subset %(subset_i)s of %(subset_n)s total: %(num_file_contig_pairs)s contigs from "
           "%(short_filenames)s") % locals())
    counter = 0
    for tabix_file, contig in tabix_file_contig_subset:
        header_iterator = tabix_file.header
        records_iterator = tabix_file.fetch(contig, 0, 10**9, multiple_iterators=True)
        for parsed_record in record_parser(itertools.chain(header_iterator, records_iterator)):
            counter += 1
            yield parsed_record

            if counter % 100000 == 0:
                seconds_elapsed = int(time.time()-start_time)
                print(("Loaded %(counter)s records from subset %(subset_i)s of %(subset_n)s from %(short_filenames)s "
                       "(%(seconds_elapsed)s seconds)") % locals())

    print("Finished loading subset %(subset_i)s from  %(short_filenames)s (%(counter)s records)" % locals())


def load_individual_coverage_files(coverage_files, collection):
    def load_coverage(coverage_files, collection, i, n, db):
        coverage_generator = parse_tabix_file_subset(coverage_files, i, n, get_base_coverage_from_file)
        try:
            db[collection].insert(coverage_generator, w=0)
        except pymongo.errors.InvalidOperation:
            pass  # handle error when coverage_generator is empty

    db = get_db()
    db[collection].drop()
    print("Dropped db.%s" % collection)
    # load coverage first; variant info will depend on coverage
    db[collection].ensure_index('xpos')
    print coverage_files
    procs = []
    num_procs = app.config['LOAD_DB_PARALLEL_PROCESSES']
    # if num_procs > 2:
    #     num_procs = 2
    random.shuffle(coverage_files)
    for i in range(num_procs):
        p = Process(target=load_coverage, args=(coverage_files, collection, i, num_procs, db))
        p.start()
        procs.append(p)
    return procs
    print 'Done loading coverage. Took %s seconds' % int(time.time() - start_time)

def load_base_coverage_exomes():
    coverage_files = app.config['EXOME_BASE_COVERAGE_FILES']
    return load_individual_coverage_files(coverage_files, 'exome_coverage')

def load_base_coverage_genomes():
    coverage_files = app.config['GENOME_BASE_COVERAGE_FILES']
    print coverage_files
    return load_individual_coverage_files(coverage_files, 'genome_coverage')

def load_variants_in_file_using_tabix(sites_file, i, n, db_collection):
    variants_generator = parse_tabix_file_subset([sites_file], i, n, get_variants_from_sites_vcf)
    try:
        db_collection.insert(variants_generator, w=0)
    except pymongo.errors.InvalidOperation:
        pass  # handle error when variant_generator is empty

def load_variants_single_vcf(sites_vcfs, collection_name):
    def load_variants(sites_file, i, n, collection_name):
        db = get_db()
        variants_generator = parse_tabix_file_subset([sites_file], i, n, get_variants_from_sites_vcf)
        try:
            db[collection_name].insert(variants_generator, w=0)
        except pymongo.errors.InvalidOperation:
            pass  # handle error when variant_generator is empty
    db = get_db()
    db[collection_name].ensure_index('xpos')
    db[collection_name].ensure_index('xstart')
    db[collection_name].ensure_index('xstop')
    db[collection_name].ensure_index('rsid')
    db[collection_name].ensure_index('genes')
    db[collection_name].ensure_index('transcripts')
    procs = []
    num_procs = app.config['LOAD_DB_PARALLEL_PROCESSES']
    if num_procs > 24:
        num_procs = 24
    for i in range(num_procs):
        p = Process(target=load_variants, args=(sites_vcfs[0], i, num_procs, collection_name))
        p.start()
        procs.append(p)
    return procs

def load_all_variants_in_file(sites_file, collection_name):
    db = get_db()
    db[collection_name].ensure_index('xpos')
    db[collection_name].ensure_index('xstart')
    db[collection_name].ensure_index('xstop')
    db[collection_name].ensure_index('rsid')
    db[collection_name].ensure_index('genes')
    db[collection_name].ensure_index('transcripts')

    with gzip.open(sites_file) as f:
        variants_generator = get_variants_from_sites_vcf(f)
        try:
            db[collection_name].insert(variants_generator, w=0)
        except pymongo.errors.InvalidOperation:
            pass  # handle error when variant_generator is empty

def load_variants_chunks(sites_vcfs, collection_name):
    procs = []
    num_procs = app.config['LOAD_DB_PARALLEL_PROCESSES']
    for sites_vcf in sites_vcfs:
        print sites_vcf
        p = Process(target=load_all_variants_in_file, args=(sites_vcf, collection_name))
        p.start()
        procs.append(p)
        if len(procs) > num_procs:
            print("Waiting for: " + str(p))
            procs[0].join()
            del procs[0]
            print("Done waiting for: " + str(p))
    return procs

def load_variants(sites_vcfs, collection_name):
    if len(sites_vcfs) == 0:
        raise IOError("No vcf file found")
    elif len(sites_vcfs) == 1:
        return load_variants_single_vcf(sites_vcfs, collection_name)
    else:
        return load_variants_chunks(sites_vcfs, collection_name)

def load_exome_variants():
    exomes_sites_vcfs = app.config['EXOMES_SITES_VCFS']
    return load_variants(exomes_sites_vcfs, 'exome_variants')

def load_genome_variants():
    genomes_sites_vcfs = app.config['GENOMES_SITES_VCFS']
    return load_variants(genomes_sites_vcfs, 'genome_variants')

def drop_exome_variants():
    db = get_db()
    db.exome_variants.drop()
    print("Dropped db.exome_variants")

def drop_genome_variants():
    db = get_db()
    db.genome_variants.drop()
    print("Dropped db.genome_variants")

def load_mnps():
    db = get_db()
    start_time = time.time()

    db.exome_variants.ensure_index('has_mnp')
    print 'Done indexing.'
    while db.exome_variants.find_and_modify({'has_mnp' : True}, {'$unset': {'has_mnp': '', 'mnps': ''}}):
        pass
    print 'Deleted MNP data.'

    with gzip.open(app.config['MNP_FILE']) as mnp_file:
        for mnp in get_mnp_data(mnp_file):
            variant = lookups.get_raw_variant(db, mnp['xpos'], mnp['ref'], mnp['alt'], True)
            db.exome_variants.find_and_modify({'_id': variant['_id']}, {'$set': {'has_mnp': True}, '$push': {'mnps': mnp}}, w=0)

    db.exome_variants.ensure_index('has_mnp')
    print 'Done loading MNP info. Took %s seconds' % int(time.time() - start_time)

def load_constraint_information():
    db = get_db()

    db.constraint.drop()
    print 'Dropped db.constraint.'

    start_time = time.time()

    with gzip.open(app.config['CONSTRAINT_FILE']) as constraint_file:
        for transcript in get_constraint_information(constraint_file):
            db.constraint.insert(transcript, w=0)

    db.constraint.ensure_index('transcript')
    print 'Done loading constraint info. Took %s seconds' % int(time.time() - start_time)
    return []

def load_gene_models():
    db = get_db()

    db.genes.drop()
    db.transcripts.drop()
    db.exons.drop()
    print 'Dropped db.genes, db.transcripts, and db.exons.'

    start_time = time.time()

    canonical_transcripts = {}
    with gzip.open(app.config['CANONICAL_TRANSCRIPT_FILE']) as canonical_transcript_file:
        for gene, transcript in get_canonical_transcripts(canonical_transcript_file):
            canonical_transcripts[gene] = transcript

    omim_annotations = {}
    with gzip.open(app.config['OMIM_FILE']) as omim_file:
        for fields in get_omim_associations(omim_file):
            if fields is None:
                continue
            gene, transcript, accession, description = fields
            omim_annotations[gene] = (accession, description)

    dbnsfp_info = {}
    with gzip.open(app.config['DBNSFP_FILE']) as dbnsfp_file:
        for dbnsfp_gene in get_dbnsfp_info(dbnsfp_file):
            other_names = [other_name.upper() for other_name in dbnsfp_gene['gene_other_names']]
            dbnsfp_info[dbnsfp_gene['ensembl_gene']] = (dbnsfp_gene['gene_full_name'], other_names)

    print 'Done loading metadata. Took %s seconds' % int(time.time() - start_time)

    # grab genes from GTF
    start_time = time.time()
    with gzip.open(app.config['GENCODE_GTF']) as gtf_file:
        for gene in get_genes_from_gencode_gtf(gtf_file):
            gene_id = gene['gene_id']
            if gene_id in canonical_transcripts:
                gene['canonical_transcript'] = canonical_transcripts[gene_id]
            if gene_id in omim_annotations:
                gene['omim_accession'] = omim_annotations[gene_id][0]
                gene['omim_description'] = omim_annotations[gene_id][1]
            if gene_id in dbnsfp_info:
                gene['full_gene_name'] = dbnsfp_info[gene_id][0]
                gene['other_names'] = dbnsfp_info[gene_id][1]
            db.genes.insert(gene, w=0)

    print 'Done loading genes. Took %s seconds' % int(time.time() - start_time)

    start_time = time.time()
    db.genes.ensure_index('gene_id')
    db.genes.ensure_index('gene_name_upper')
    db.genes.ensure_index('gene_name')
    db.genes.ensure_index('other_names')
    db.genes.ensure_index('xstart')
    db.genes.ensure_index('xstop')
    print 'Done indexing gene table. Took %s seconds' % int(time.time() - start_time)

    # and now transcripts
    start_time = time.time()
    with gzip.open(app.config['GENCODE_GTF']) as gtf_file:
        db.transcripts.insert((transcript for transcript in get_transcripts_from_gencode_gtf(gtf_file)), w=0)
    print 'Done loading transcripts. Took %s seconds' % int(time.time() - start_time)

    start_time = time.time()
    db.transcripts.ensure_index('transcript_id')
    db.transcripts.ensure_index('gene_id')
    print 'Done indexing transcript table. Took %s seconds' % int(time.time() - start_time)

    # Building up gene definitions
    start_time = time.time()
    with gzip.open(app.config['GENCODE_GTF']) as gtf_file:
        db.exons.insert((exon for exon in get_exons_from_gencode_gtf(gtf_file)), w=0)
    print 'Done loading exons. Took %s seconds' % int(time.time() - start_time)

    start_time = time.time()
    db.exons.ensure_index('exon_id')
    db.exons.ensure_index('transcript_id')
    db.exons.ensure_index('gene_id')
    print 'Done indexing exon table. Took %s seconds' % int(time.time() - start_time)

    return []


def load_cnv_models():
    db = get_db()

    db.cnvs.drop()
    print 'Dropped db.cnvs.'

    start_time = time.time()
    with open(app.config['CNV_FILE']) as cnv_txt_file:
        for cnv in get_cnvs_from_txt(cnv_txt_file):
            db.cnvs.insert(cnv, w=0)
            #progress.update(gtf_file.fileobj.tell())
        #progress.finish()

    print 'Done loading CNVs. Took %s seconds' % int(time.time() - start_time)
    return []

def drop_cnv_genes():
    db = get_db()
    start_time = time.time()
    db.cnvgenes.drop()
    return []

def load_cnv_genes():
    db = get_db()
    start_time = time.time()
    with open(app.config['CNV_GENE_FILE']) as cnv_gene_file:
        for cnvgene in get_cnvs_per_gene(cnv_gene_file):
            db.cnvgenes.insert(cnvgene, w=0)
            #progress.update(gtf_file.fileobj.tell())
        #progress.finish()

    print 'Done loading CNVs in genes. Took %s seconds' % int(time.time() - start_time)
    return []

def load_dbsnp_file():
    db = get_db()

    def load_dbsnp(dbsnp_file, i, n, db):
        if os.path.isfile(dbsnp_file + ".tbi"):
            dbsnp_record_generator = parse_tabix_file_subset([dbsnp_file], i, n, get_snp_from_dbsnp_file)
            try:
                db.dbsnp.insert(dbsnp_record_generator, w=0)
            except pymongo.errors.InvalidOperation:
                pass  # handle error when coverage_generator is empty

        else:
            with gzip.open(dbsnp_file) as f:
                db.dbsnp.insert((snp for snp in get_snp_from_dbsnp_file(f)), w=0)

    db.dbsnp.drop()
    db.dbsnp.ensure_index('rsid')
    db.dbsnp.ensure_index('xpos')
    start_time = time.time()
    dbsnp_file = app.config['DBSNP_FILE']

    print "Loading dbsnp from %s" % dbsnp_file
    if os.path.isfile(dbsnp_file + ".tbi"):
        num_procs = app.config['LOAD_DB_PARALLEL_PROCESSES']
    else:
        # see if non-tabixed .gz version exists
        if os.path.isfile(dbsnp_file):
            print(("WARNING: %(dbsnp_file)s.tbi index file not found. Will use single thread to load dbsnp."
                "To create a tabix-indexed dbsnp file based on UCSC dbsnp, do: \n"
                "   wget http://hgdownload.soe.ucsc.edu/goldenPath/hg19/database/snp141.txt.gz \n"
                "   gzcat snp141.txt.gz | cut -f 1-5 | bgzip -c > snp141.txt.bgz \n"
                "   tabix -0 -s 2 -b 3 -e 4 snp141.txt.bgz") % locals())
            num_procs = 1
        else:
            raise Exception("dbsnp file %s(dbsnp_file)s not found." % locals())

    procs = []
    for i in range(num_procs):
        p = Process(target=load_dbsnp, args=(dbsnp_file, i, num_procs, db))
        p.start()
        procs.append(p)

    return procs
    #print 'Done loading dbSNP. Took %s seconds' % int(time.time() - start_time)

    #start_time = time.time()
    #db.dbsnp.ensure_index('rsid')
    #print 'Done indexing dbSNP table. Took %s seconds' % int(time.time() - start_time)


def load_db():
    """
    Load the database
    """
    # Initialize database
    # Don't need to explicitly create tables with mongo, just indices
    # confirm = raw_input('This will drop the database and reload. Are you sure you want to continue? [no] ')
    confirm = 'yes'
    if not confirm.startswith('y'):
        print('Exiting...')
        sys.exit(1)
    all_procs = []
    for load_function in [load_exome_variants, load_genome_variants, load_dbsnp_file, load_base_coverage_exomes, load_base_coverage_genomes, load_gene_models, load_constraint_information, load_cnv_models, load_cnv_genes]:
        procs = load_function()
        all_procs.extend(procs)
        print("Started %s processes to run %s" % (len(procs), load_function.__name__))

    [p.join() for p in all_procs]
    print('Done! Loading MNPs...')
    load_mnps()
    print('Done! Creating cache...')
    create_cache()
    print('Done!')


def create_cache():
    """
    This is essentially a compile step that generates all cached resources.
    Creates files like autocomplete_entries.txt
    Should be run on every redeploy.
    """
    # create autocomplete_entries.txt
    autocomplete_strings = []
    for gene in get_db().genes.find():
        autocomplete_strings.append(gene['gene_name'])
        if 'other_names' in gene:
            autocomplete_strings.extend(gene['other_names'])
    f = open(os.path.join(os.path.dirname(__file__), 'autocomplete_strings.txt'), 'w')
    for s in sorted(autocomplete_strings):
        f.write(s+'\n')
    f.close()

    # create static gene pages for genes in
    if not os.path.exists(GENE_CACHE_DIR):
        os.makedirs(GENE_CACHE_DIR)

    # get list of genes ordered by num_variants
    for gene_id in GENES_TO_CACHE:
        try:
            page_content = get_gene_page_content(gene_id)
        except Exception as e:
            print e
            continue
        f = open(os.path.join(GENE_CACHE_DIR, '{}.html'.format(gene_id)), 'w')
        f.write(page_content)
        f.close()


def precalculate_metrics(variant_collection, metric_collection, chrom=None):
    import numpy
    db = get_db()
    print 'Reading %s variants...' % db[variant_collection].count()
    metrics = defaultdict(list)
    binned_metrics = defaultdict(list)
    progress = 0
    start_time = time.time()
    for variant in tqdm(db[variant_collection].find(projection=['chrom', 'quality_metrics', 'site_quality', 'allele_num', 'allele_count']), unit=" variants", total=db[variant_collection].count()):
        if chrom is not None and variant["chrom"] != chrom:
            continue
        for metric, value in variant['quality_metrics'].iteritems():
            metrics[metric].append(float(value))
        qual = float(variant['site_quality'])
        metrics['site_quality'].append(qual)
        if variant['allele_num'] == 0: continue
        if variant['allele_count'] == 1:
            binned_metrics['singleton'].append(qual)
        elif variant['allele_count'] == 2:
            binned_metrics['doubleton'].append(qual)
        else:
            for af in AF_BUCKETS:
                if float(variant['allele_count'])/variant['allele_num'] < af:
                    binned_metrics[af].append(qual)
                    break
        progress += 1
        if not progress % 100000:
            print 'Read %s variants. Took %s seconds' % (progress, int(time.time() - start_time))
    print 'Done reading variants. Dropping metrics database... '

    db[metric_collection].drop()
    print 'Dropped metrics database. Calculating metrics...'
    for metric in metrics:
        bin_range = None
        data = map(numpy.log, metrics[metric]) if metric == 'DP' else metrics[metric]
        if metric == 'FS':
            bin_range = (0, 20)
        elif metric == 'VQSLOD':
            bin_range = (-20, 20)
        elif metric == 'InbreedingCoeff':
            bin_range = (0, 1)
        if bin_range is not None:
            data = [x if (x > bin_range[0]) else bin_range[0] for x in data]
            data = [x if (x < bin_range[1]) else bin_range[1] for x in data]
        hist = numpy.histogram(data, bins=40, range=bin_range)
        edges = hist[1]
        # mids = [(edges[i]+edges[i+1])/2 for i in range(len(edges)-1)]
        lefts = [edges[i] for i in range(len(edges)-1)]
        db[metric_collection].insert({
            'metric': metric,
            'mids': lefts,
            'hist': list(hist[0])
        })
    for metric in binned_metrics:
        hist = numpy.histogram(map(numpy.log, binned_metrics[metric]), bins=40)
        edges = hist[1]
        mids = [(edges[i]+edges[i+1])/2 for i in range(len(edges)-1)]
        db[metric_collection].insert({
            'metric': 'binned_%s' % metric,
            'mids': mids,
            'hist': list(hist[0])
        })
    db[metric_collection].ensure_index('metric')
    # print 'Done pre-calculating metrics!'

def precalculate_metrics_exomes():
    precalculate_metrics('exome_variants', 'exome_metrics')

def precalculate_metrics_genomes():
    precalculate_metrics('genome_variants', 'genome_metrics')


def get_db():
    """
    Opens a new database connection if there is none yet for the
    current application context.
    """
    if not hasattr(g, 'db_conn'):
        g.db_conn = connect_db()
    return g.db_conn


# @app.teardown_appcontext
# def close_db(error):
#     """Closes the database again at the end of the request."""
#     if hasattr(g, 'db_conn'):
#         g.db_conn.close()


@app.route('/')
def homepage():
    return render_template('homepage.html')


@app.route('/autocomplete/<query>')
def awesome_autocomplete(query):
    if not hasattr(g, 'autocomplete_strings'):
        g.autocomplete_strings = [s.strip() for s in open(os.path.join(os.path.dirname(__file__), 'autocomplete_strings.txt'))]
    suggestions = lookups.get_awesomebar_suggestions(g, query)
    return Response(json.dumps([{'value': s} for s in suggestions]),  mimetype='application/json')


@app.route('/awesome')
def awesome():
    db = get_db()
    query = request.args.get('query')
    datatype, identifier = lookups.get_awesomebar_result(db, query)

    print "Searched for %s: %s" % (datatype, identifier)
    if datatype == 'gene':
        return redirect('/gene/{}'.format(identifier))
    elif datatype == 'transcript':
        return redirect('/transcript/{}'.format(identifier))
    elif datatype == 'variant':
        return redirect('/variant/{}'.format(identifier))
    elif datatype == 'region':
        return redirect('/region/{}'.format(identifier))
    elif datatype == 'dbsnp_variant_set':
        return redirect('/dbsnp/{}'.format(identifier))
    elif datatype == 'error':
        return redirect('/error/{}'.format(identifier))
    elif datatype == 'not_found':
        return redirect('/not_found/{}'.format(identifier))
    else:
        raise Exception

def variant_data(variant_str, source):
    db = get_db()
    chrom, pos, ref, alt = variant_str.split('-')
    pos = int(pos)
    # pos, ref, alt = get_minimal_representation(pos, ref, alt)
    xpos = get_xpos(chrom, pos)
    variant = lookups.get_variant(db, source, xpos, ref, alt)

    if variant is None:
        variant = {
            'chrom': chrom,
            'pos': pos,
            'xpos': xpos,
            'ref': ref,
            'alt': alt
        }
    consequences = OrderedDict()
    if 'vep_annotations' in variant:
        add_consequence_to_variant(variant)
        variant['vep_annotations'] = remove_extraneous_vep_annotations(variant['vep_annotations'])
        variant['vep_annotations'] = order_vep_by_csq(variant['vep_annotations'])  # Adds major_consequence
        for annotation in variant['vep_annotations']:
            annotation['HGVS'] = get_proper_hgvs(annotation)
            consequences.setdefault(annotation['major_consequence'], {}).setdefault(annotation['Gene'], []).append(annotation)
    if source == 'exac':
        base_coverage = lookups.get_coverage_for_bases(db, 'exome_coverage', xpos, xpos + len(ref) - 1)
    if source == 'gnomad':
        base_coverage = lookups.get_coverage_for_bases(db, 'genome_coverage', xpos, xpos + len(ref) - 1)

    any_covered = any([x['has_coverage'] for x in base_coverage])
    metrics = lookups.get_metrics(db, variant, source)

    # check the appropriate sqlite db to get the *expected* number of
    # available bams and *actual* number of available bams for this variant
    all_read_viz_dict = { 'total_available': 0, 'total_expected': 0 }
    for genomes_or_exomes in ('genomes', 'exomes'):
        sqlite_db_path = os.path.join(
            app.config["READ_VIZ_DIR"],
            "combined_bams_%s" % genomes_or_exomes,
            "combined_bams",
            chrom,
            "combined_chr%s_%03d.db" % (chrom, pos % 1000))
        logging.info(sqlite_db_path)
        try:
            read_viz_db = sqlite3.connect(sqlite_db_path)
            n_het = read_viz_db.execute("select n_expected_samples, n_available_samples from t "
                                        "where chrom=? and pos=? and ref=? and alt=? and het_or_hom_or_hemi=?", (chrom, pos, ref, alt, 'het')).fetchone()
            n_hom = read_viz_db.execute("select n_expected_samples, n_available_samples from t "
                                        "where chrom=? and pos=? and ref=? and alt=? and het_or_hom_or_hemi=?", (chrom, pos, ref, alt, 'hom')).fetchone()
            n_hemi = read_viz_db.execute("select n_expected_samples, n_available_samples from t "
                                         "where chrom=? and pos=? and ref=? and alt=? and het_or_hom_or_hemi=?", (chrom, pos, ref, alt, 'hemi')).fetchone()
            read_viz_db.close()
        except Exception, e:
            logging.error("Error when accessing sqlite db: %s - %s", sqlite_db_path, e)
            n_het = n_hom = n_hemi = None

        read_viz_dict = {
            'het': {'n_expected':   n_het[0] if n_het is not None and n_het[0] is not None else 0,
                    'n_available':  n_het[1] if n_het is not None and n_het[1] is not None else 0,},
            'hom': {'n_expected':   n_hom[0] if n_hom is not None and n_hom[0] is not None else 0,
                    'n_available':  n_hom[1] if n_hom is not None  and n_hom[1] is not None else 0,},
            'hemi': {'n_expected':  n_hemi[0] if n_hemi is not None and n_hemi[0] is not None else 0,
                     'n_available': n_hemi[1] if n_hemi is not None and n_hemi[1] is not None else 0,},
        }

        total_available = 0
        total_expected = 0
        for het_or_hom_or_hemi in ('het', 'hom', 'hemi'):
            total_available += read_viz_dict[het_or_hom_or_hemi]['n_available']
            total_expected += read_viz_dict[het_or_hom_or_hemi]['n_expected']

            read_viz_dict[het_or_hom_or_hemi]['readgroups'] = [
                '%(chrom)s-%(pos)s-%(ref)s-%(alt)s_%(het_or_hom_or_hemi)s%(i)s' % locals()
                for i in range(read_viz_dict[het_or_hom_or_hemi]['n_available'])

            ]   #eg. '1-157768000-G-C_hom1',

            read_viz_dict[het_or_hom_or_hemi]['urls'] = [
                os.path.join('combined_bams_%s' % genomes_or_exomes, 'combined_bams', chrom, 'combined_chr%s_%03d.bam' % (chrom, pos % 1000))
                for i in range(read_viz_dict[het_or_hom_or_hemi]['n_available'])
            ]

        read_viz_dict['total_available'] = total_available
        read_viz_dict['total_expected'] = total_expected
        all_read_viz_dict[genomes_or_exomes] = read_viz_dict
        all_read_viz_dict['total_available'] += total_available
        all_read_viz_dict['total_expected'] += total_expected

    print 'Rendering variant: %s' % variant_str
    return {
        'variant': variant,
        'base_coverage': base_coverage,
        'consequences': consequences,
        'any_covered': any_covered,
        'metrics': metrics,
        'read_viz_dict': all_read_viz_dict,
    }

@app.route('/variant/<variant_str>')
def variant_page(variant_str):
    try:
        exac = variant_data(variant_str, 'exac')
        gnomad = variant_data(variant_str, 'gnomad')
        print 'Rendering variant: %s' % variant_str
        return render_template(
            'variant.html',
            variant=(exac['variant'] if 'variant_id' in exac['variant'] else gnomad['variant']),
            exac=exac,
            gnomad=gnomad,
            any_covered=(exac['any_covered'] or gnomad['any_covered']),  # if this variant is in gnomad, consider it covered

            base_coverage=exac['base_coverage'], # TODO clean these up
            exac_base_coverage=exac['base_coverage'],
            gnomad_base_coverage=gnomad['base_coverage'],

            consequences=exac['consequences'], # TODO clean these up
            exac_consequences=exac['consequences'],
            gnomad_consequences=gnomad['consequences'],

            metrics=exac['metrics'], # TODO clean these up
            exac_metrics=exac['metrics'],
            gnomad_metrics=gnomad['metrics'],

            read_viz=exac['read_viz_dict'],
        )
    except Exception:
        print 'Failed on variant:', variant_str, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/api/variant/<variant_str>')
def variant_api(variant_str):
    try:
        exacVariant = variant_data(variant_str, 'exac')
        gnomadVariant = variant_data(variant_str, 'gnomad')

        print 'Sending json for variant: %s' % variant_str
        return jsonify(
            exac=exacVariant,
            gnomad=gnomadVariant
        )
    except Exception:
        print 'Failed on variant:', variant_str, ';Error=', traceback.format_exc()
        abort(404)

def get_gene_data(db, gene_id, gene, request_type, cache_key):
    try:
        transcript_id = gene['canonical_transcript']
        transcripts_in_gene = lookups.get_transcripts_in_gene(db, gene_id)
        variant_data  = lookups.get_variants_in_gene_or_transcript(db, gene_id=gene_id)
        variants_in_transcript = variant_data["all_variants"]

        # Get some canonical transcript and corresponding info
        transcript = lookups.get_transcript(db, transcript_id)
        coverage_stats_exomes = lookups.get_coverage_for_transcript(db, 'exome_coverage', transcript['xstart'] - EXON_PADDING, transcript['xstop'] + EXON_PADDING)
        # change base_coverage to e.g. genome_base_coverage when the data gets here
        coverage_stats_genomes = lookups.get_coverage_for_transcript(db, 'genome_coverage', transcript['xstart'] - EXON_PADDING, transcript['xstop'] + EXON_PADDING)
        coverage_stats = {
            'exomes': coverage_stats_exomes,
            'genomes': coverage_stats_genomes
        }
        add_transcript_coordinate_to_variants(db, variants_in_transcript, transcript_id)
        constraint_info = lookups.get_constraint_for_transcript(db, transcript_id)
        if request_type == 'template':
            result = render_template(
                'gene.html',
                gene=gene,
                transcript=transcript,
                variants_in_transcript=variants_in_transcript,
                transcripts_in_gene=transcripts_in_gene,
                coverage_stats=coverage_stats,
                constraint=constraint_info,
                uuid_lists=variant_data['uuid_lists']
            )
        if request_type == 'json':
            result = jsonify(
                gene=gene,
                transcript=transcript,
                variants_in_transcript=variants_in_transcript,
                transcripts_in_gene=transcripts_in_gene,
                coverage_stats=coverage_stats,
                constraint=constraint_info,
                uuid_lists=variant_data['uuid_lists']
            )
        cache.set(cache_key, result, timeout=1000*60)
        return result
    except Exception, e:
        print 'Failed on gene:', gene_id, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/gene/<gene_id>')
def gene_page(gene_id):
    # if gene_id in GENES_TO_CACHE:
    #
    #     return open(os.path.join(GENE_CACHE_DIR, '{}.html'.format(gene_id))).read()
    #     print 'accessing from gene page'
    # else:
    db = get_db()
    gene = lookups.get_gene(db, gene_id)
    if gene is None:
        abort(404)
    cache_key = 'template-gene-{}'.format(gene_id)
    template = cache.get(cache_key)
    if template is None:
        template = get_gene_data(db, gene_id, gene, 'template', cache_key)
    print 'Rendering gene: %s' % gene_id
    return template

@app.route('/api/gene/<gene_id>')
def gene_api(gene_id):
    db = get_db()
    gene = lookups.get_gene(db, gene_id)
    if gene is None:
        abort(404)
    cache_key = 'json-gene-{}'.format(gene_id)
    json = cache.get(cache_key)
    if json is None:
        json = get_gene_data(db, gene_id, gene, 'json', cache_key)
    print 'Sending json for gene: %s' % gene_id
    return json

def get_transcript_data(db, transcript_id, transcript, request_type, cache_key):
    try:
        gene = lookups.get_gene(db, transcript['gene_id'])
        gene['transcripts'] = lookups.get_transcripts_in_gene(db, transcript['gene_id'])
        variant_data = lookups.get_variants_in_gene_or_transcript(db, transcript_id=transcript_id)
        variants_in_transcript = variant_data['all_variants']
        coverage_stats_exomes = lookups.get_coverage_for_transcript(db, 'exome_coverage', transcript['xstart'] - EXON_PADDING, transcript['xstop'] + EXON_PADDING)
        # change base_coverage to e.g. genome_base_coverage when the data gets here
        coverage_stats_genomes = lookups.get_coverage_for_transcript(db, 'genome_coverage', transcript['xstart'] - EXON_PADDING, transcript['xstop'] + EXON_PADDING)
        coverage_stats = {
            'exomes': coverage_stats_exomes,
            'genomes': coverage_stats_genomes
        }
        add_transcript_coordinate_to_variants(db, variants_in_transcript, transcript_id)
        if request_type == 'template':
            result = render_template(
                'transcript.html',
                transcript=transcript,
                variants_in_transcript=variants_in_transcript,
                coverage_stats=coverage_stats,
                gene=gene,
            )
        if request_type == 'json':
            result = jsonify(
                transcript=transcript,
                variants_in_transcript=variants_in_transcript,
                coverage_stats=coverage_stats,
                gene=gene,
            )
        cache.set(cache_key, result, timeout=1000*60)
        return result
    except Exception, e:
        print 'Failed on transcript:', transcript_id, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/transcript/<transcript_id>')
def transcript_template(transcript_id):
    db = get_db()
    transcript = lookups.get_transcript(db, transcript_id)
    if transcript is None:
        abort(404)
    cache_key = 'template-transcript-{}'.format(transcript_id)
    template = cache.get(cache_key)
    if template is None:
        template = get_transcript_data(db, transcript_id, transcript, 'template', cache_key)
    print 'Sending template for transcript: %s' % transcript_id
    return template


@app.route('/api/transcript/<transcript_id>')
def transcript_api(transcript_id):
    db = get_db()
    transcript = lookups.get_transcript(db, transcript_id)
    if transcript is None:
        abort(404)
    cache_key = 'json-transcript-{}'.format(transcript_id)
    json = cache.get(cache_key)
    if json is None:
        json = get_transcript_data(db, transcript_id, transcript, 'json', cache_key)
    print 'Sending json for transcript: %s' % transcript_id
    return json


@app.route('/region/<region_id>')
def region_page(region_id):
    db = get_db()
    try:
        region = region_id.split('-')
        cache_key = 't-region-{}'.format(region_id)
        t = cache.get(cache_key)
        if t is None:
            chrom = region[0]
            start = None
            stop = None
            if len(region) == 3:
                chrom, start, stop = region
                start = int(start)
                stop = int(stop)
            if start is None or stop - start > REGION_LIMIT or stop < start:
                return render_template(
                    'region.html',
                    genes_in_region=None,
                    variants_in_region=None,
                    chrom=chrom,
                    start=start,
                    stop=stop,
                    coverage=None
                )
            if start == stop:
                start -= 20
                stop += 20
            genes_in_region = lookups.get_genes_in_region(db, chrom, start, stop)
            variants_in_region = lookups.get_variants_in_region(db, chrom, start, stop)
            xstart = get_xpos(chrom, start)
            xstop = get_xpos(chrom, stop)
            coverage_stats_exomes = lookups.get_coverage_for_bases(db, 'exome_coverage', xstart, xstop)
            coverage_stats_genomes = lookups.get_coverage_for_bases(db, 'genome_coverage', xstart, xstop)
            coverage_stats = {
                "exomes": coverage_stats_exomes,
                "genomes": coverage_stats_genomes
            }
            t = render_template(
                'region.html',
                genes_in_region=genes_in_region,
                variants_in_region=variants_in_region,
                chrom=chrom,
                start=start,
                stop=stop,
                coverage=coverage_stats
            )
        print 'Rendering region: %s' % region_id
        return t
    except Exception, e:
        print 'Failed on region:', region_id, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/api/region/<region_id>')
def region_json(region_id):
    db = get_db()
    try:
        region = region_id.split('-')
        cache_key = 't-region-{}'.format(region_id)
        t = cache.get(cache_key)
        if t is None:
            chrom = region[0]
            start = None
            stop = None
            if len(region) == 3:
                chrom, start, stop = region
                start = int(start)
                stop = int(stop)
            if start is None or stop - start > REGION_LIMIT or stop < start:
                return render_template(
                    'region.html',
                    genes_in_region=None,
                    variants_in_region=None,
                    chrom=chrom,
                    start=start,
                    stop=stop,
                    coverage=None
                )
            if start == stop:
                start -= 20
                stop += 20
            genes_in_region = lookups.get_genes_in_region(db, chrom, start, stop)
            variants_in_region = lookups.get_variants_in_region(db, chrom, start, stop)
            xstart = get_xpos(chrom, start)
            xstop = get_xpos(chrom, stop)
            coverage_stats_exomes = lookups.get_coverage_for_bases(db, 'exome_coverage', xstart, xstop)
            coverage_stats_genomes = lookups.get_coverage_for_bases(db, 'genome_coverage', xstart, xstop)
            coverage_stats = {
                "exomes": coverage_stats_exomes,
                "genomes": coverage_stats_genomes
            }
            t = jsonify(
                genes_in_region=genes_in_region,
                variants_in_region=variants_in_region,
                chrom=chrom,
                start=start,
                stop=stop,
                coverage=coverage_stats
            )
        print 'Rendering region: %s' % region_id
        return t
    except Exception, e:
        print 'Failed on region:', region_id, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/dbsnp/<rsid>')
def dbsnp_page(rsid):
    db = get_db()
    try:
        variants = lookups.get_variants_by_rsid(db, rsid)
        if not variants:
            variants = lookups.get_variants_from_dbsnp(db, rsid)
        if not variants:
            raise(Exception('No variants found!'))
        chrom = None
        start = None
        stop = None
        print 'Rendering rsid: %s' % rsid
        return render_template(
            'region.html',
            rsid=rsid,
            variants_in_region=variants,
            chrom=chrom,
            start=start,
            stop=stop,
            coverage=None,
            genes_in_region=None
        )
    except Exception, e:
        print 'Failed on rsid:', rsid, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/api/dbsnp/<rsid>')
def dbsnp_json(rsid):
    db = get_db()
    try:
        variants = lookups.get_variants_by_rsid(db, rsid)
        if variants == []:
            raise(Exception('No variants found!'))
        chrom = None
        start = None
        stop = None
        print 'Rendering rsid: %s' % rsid
        return jsonify(
            rsid=rsid,
            variants_in_region=variants,
            chrom=chrom,
            start=start,
            stop=stop,
            coverage=None,
            genes_in_region=None
        )
    except Exception, e:
        print 'Failed on rsid:', rsid, ';Error=', traceback.format_exc()
        abort(404)


@app.route('/not_found/<query>')
@app.errorhandler(404)
def not_found_page(query):
    return render_template(
        'not_found.html',
        query=query
    ), 404


@app.route('/error/<query>')
@app.errorhandler(404)
def error_page(query):
    return render_template(
        'error.html',
        query=query
    ), 404


@app.errorhandler(400)
def page_not_found(error):
    logging.error('400 error: %s', error)
    return render_template(
        'error.html',
        query=""
    ), 400

@app.route('/downloads')
def downloads_page():
    return render_template('downloads.html')

@app.route('/about')
def about_page():
    return render_template('about.html')


@app.route('/participants')
def participants_page():
    return render_template('about.html')


@app.route('/terms')
def terms_page():
    return render_template('terms.html')


@app.route('/contact')
def contact_page():
    return render_template('contact.html')


@app.route('/faq')
def faq_page():
    return render_template('faq.html')

@app.route('/<path:path>')
def loader_verification(path):
    return send_from_directory('static', path)

@app.route('/text')
def text_page():
    db = get_db()
    query = request.args.get('text')
    datatype, identifier = lookups.get_awesomebar_result(db, query)
    if datatype in ['gene', 'transcript']:
        gene = lookups.get_gene(db, identifier)
        link = "http://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=chr%(chrom)s%%3A%(start)s-%(stop)s" % gene
        output = '''Searched for %s. Found %s.
%s; Canonical: %s.
%s''' % (query, identifier, gene['full_gene_name'], gene['canonical_transcript'], link)
        output += '' if 'omim_accession' not in gene else '''
In OMIM: %(omim_description)s
http://omim.org/entry/%(omim_accession)s''' % gene
        return output
    elif datatype == 'error' or datatype == 'not_found':
        return "Gene/transcript %s not found" % query
    else:
        return "Search types other than gene transcript not yet supported"


@app.route('/read_viz/<path:path>')
def read_viz_files(path):
    full_path = os.path.abspath(os.path.join(app.config["READ_VIZ_DIR"], path))

    # security check - only files under READ_VIZ_DIR should be accsessible
    if not full_path.startswith(app.config["READ_VIZ_DIR"]):
        return "Invalid path: %s" % path

    # handle igv.js Range header which it uses to request a subset of a .bam
    range_header = request.headers.get('Range', None)
    if not range_header:
        return send_from_directory(app.config["READ_VIZ_DIR"], path)

    m = re.search('(\d+)-(\d*)', range_header)
    if not m:
        error_msg = "ERROR: unexpected range header syntax: %s" % range_header
        logging.error(error_msg)
        return error_msg

    size = os.path.getsize(full_path)
    offset = int(m.group(1))
    length = int(m.group(2) or size) - offset

    data = None
    with open(full_path, 'rb') as f:
        f.seek(offset)
        data = f.read(length)

    rv = Response(data, 206, mimetype="application/octet-stream", direct_passthrough=True)
    rv.headers.add('Content-Range', 'bytes {0}-{1}/{2}'.format(offset, offset + length - 1, size))

    logging.info("readviz: range request: %s-%s %s" % (m.group(1), m.group(2), full_path))
    return rv


# @app.after_request
# def apply_caching(response):
#     # prevent click-jacking vulnerability identified by BITs
#     response.headers["X-Frame-Options"] = "SAMEORIGIN"
#     return response

@app.route('/report/<dataset>/<variant_id>')
def report_variant(variant_id, dataset):
    db = get_db()
    chrom, pos, ref, alt = variant_id.split('-')
    pos = int(pos)
    # pos, ref, alt = get_minimal_representation(pos, ref, alt)
    xpos = get_xpos(chrom, pos)
    variant = lookups.get_variant(db, dataset, xpos, ref, alt)

    if variant is None:
        variant = {
            'chrom': chrom,
            'pos': pos,
            'xpos': xpos,
            'ref': ref,
            'alt': alt
        }
    try:
        print 'Rendering variant_id: %s' % variant_id
        return render_template(
            'report_variant.html',
            variant=variant,
        )
    except Exception, e:
        print 'Failed on variant_id:', variant_id, ';Error=', traceback.format_exc()
        abort(404)

@app.route('/report/<dataset>/<variant_id>')

@app.route('/report/submit_variant_report', methods=['POST'])


def submit_variant_report():
    data = {
        'name': request.form.get('name'),
        'institution': request.form.get('institution'),
        'city': request.form.get('city'),
        'state': request.form.get('state'),
        'email': request.form.get('email'),
        'variant_issue': request.form.get('variant-issue'),
        'concern': request.form.get('concern'),
        'expected_phenotype': request.form.get('expected-phenotype'),
        'additional_info': request.form.get('additional-info'),
        'variant_id': request.form.get('variant-id')
    }

    slack_message = '''{
    "attachments": [
        {
            "fallback": "Required plain-text summary of the attachment.",
            "color": "#36a64f",
            "title": "Variant reported: ",
            "fields": [
                  {
                     "title": "Name",
                     "value": "%s",
                     "short": true
                  },
                  {
                     "title": "Institution",
                     "value": "%s",
                     "short": true
                  },
                  {
                     "title": "Email",
                     "value": "%s",
                     "short": true
                  },
                  {
                     "title": "Variant ID",
                     "value": "%s",
                     "short": true
                  },
                  {
                     "title": "Expected phenotype",
                     "value": "%s",
                     "short": true
                  },
                  {
                     "title": "Variant Issue",
                     "value": "%s",
                     "short": false
                  },
                  {
                     "title": "Concern",
                     "value": "%s",
                     "short": false
                  },
                  {
                     "title": "Additional info",
                     "value": "%s",
                     "short": false
                  }
            ],
            "footer": "gnomAD browser",
            "footer_icon": ":gnome:",
        }
    ]}''' % (data['name'], data['institution'], data['email'], data['variant_id'], data['expected_phenotype'], data['variant_issue'], data['concern'], data['additional_info'])

    headers = { "Content-type": "application/json" }
    with open('slack_notification_url.txt') as slack_url_file:
        slack_url = slack_url_file.readline().rstrip()
        response = requests.post(slack_url, data=slack_message, headers=headers)

    logging.info("Variant report: ")
    logging.info(data)
    return render_template(
        'thank_you.html',
        name=request.form.get('name'),
    )

if __name__ == "__main__":
    runner = Runner(app)  # adds Flask command line options for setting host, port, etc.
    runner.run()
