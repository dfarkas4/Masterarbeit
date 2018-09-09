'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash');

async function unsetNovelty() {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);

    await dbConnection.db().collection('test_collection2').update({}, {$unset: {novelty: 1}} , {multi: true});

    console.log('-----------------------------------------------');
    dbConnection.close();
    console.log('done');
}

unsetNovelty();