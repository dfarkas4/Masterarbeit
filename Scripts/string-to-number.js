'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient;

async function convertStringValuesToNumber(collectionName) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);

    const dishes = await dbConnection.db().collection(collectionName).find();

    await dishes.forEach(async function(document) {
        await dbConnection.db().collection(collectionName).update(
            { "_id": document._id },
            { "$set": { "price": Number(document.price) } }
        );
    });

    console.log('-----------------------------------------------');
    console.log('done');
}

convertStringValuesToNumber('test_collection');