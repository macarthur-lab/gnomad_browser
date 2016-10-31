import { MongoClient } from 'mongodb'
import { combineDataForTable } from './combineDataForTable'

const MONGO_URL='mongodb://localhost:27017/exac'

const find = (db) => {
  let exacVariants
  let gnomadVariants
  db.collection('variants')
    .find({ genes: 'ENSG00000169174' })
    .toArray((error, variants) => {
      if (error) throw error
    console.log(variants)

    })
}

MongoClient.connect(MONGO_URL, (error, database) => {
  if (error) throw error
  const db = database
  find(db)
})
