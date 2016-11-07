/* eslint-disable no-console */

/**
 * Generate json files for making mongo collection subsets
 */

import fs from 'fs'
import R from 'ramda'
import geneSubsets from '../testCases/testGenes'
import mongodb from 'mongodb'

const url = 'mongodb://127.0.0.1:27017/exac'

const exomeVariantCollectionName = 'variants'
const genomeVariantCollectionName = 'gnomadVariants'

const exomeCoverageCollectionName = 'exome_coverage'
const genomeCoverageCollectionName = 'genome_coverage'

const genes = R.pipe(
  R.pluck('genes'),
  R.flatten,
    R.tap(console.log),
  R.pluck('name'),
)(geneSubsets)

const m = mongodb.MongoClient

const getGenes = (geneList, cb) => {
  console.log('Retrieving genes', geneList)
  m.connect(url, (error, db) => {
    const geneResults = db.collection('genes')
    const results = geneResults.find({
      gene_name: {
        $in: geneList,
      },
    })
    results.toArray((error, data) => {
      if (error) {
        console.log(error)
        cb(error, null)
      }
      cb(null, data)
      db.close()
    })
  })
}

const getVariantsForGenes = (geneList, collection, cb) => {
  console.log('Retrieving variants for genes', geneList)
  m.connect(url, (error, db) => {
    const variants = db.collection(collection)
    const results = variants.find({
      genes: {
        $in: geneList,
      },
    })
    results.toArray((error, data) => {
      if (error) {
        console.log(error)
        cb(error, null)
      }
      cb(null, data)
      db.close()
    })
  })
}

const getCoverageForGenes = (geneList, collection, cb) => {
  console.log('Retrieving coverage for genes', geneList)
  m.connect(url, (error, db) => {
    const coverage = db.collection(collection).find({
      xpos: {
        '$gte': Number(xstart),
        '$lte': Number(xstop)
      }
    }).toArray((error, data) => {
      if (error) {
        console.log(error)
        cb(error, null)
      }
      cb(null, data)
      db.close()
    })
  })
}

const generateDatabaseSubsetsJSONs = (geneList) => {
  getGenes(geneList, (error, data) => {
    fs.writeFile('./jsonSubset/geneDatabaseSubset.json', JSON.stringify(data))
    const ids = R.flatten(data.map(gene => gene.gene_id))
    getVariants(ids, (error, data) => {
      fs.writeFile('./jsonSubset/variantsDatabaseSubset.json', JSON.stringify(data))
    })
  })
}

generateDatabaseSubsetsJSONs(genes)
