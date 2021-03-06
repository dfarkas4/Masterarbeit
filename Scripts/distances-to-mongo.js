'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    geolib = require('geolib'),
    startingLocations = Object.freeze({
        WATERLOO_LATITUDE: 43.475349,
        WATERLOO_LONGITUDE: -80.532862,
        BERLIN_LATITUDE: 52.498500,
        BERLIN_LONGITUDE: 13.405806
    });

function getGeoDistance(latitude, longitude) {
    return geolib.getDistance(
        { latitude: latitude, longitude: longitude },
        { latitude: startingLocations.BERLIN_LATITUDE, longitude: startingLocations.BERLIN_LONGITUDE },
    );
}

async function writeDistancesToDishDb(collectionName) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);

    const dishes = await dbConnection.db().collection(collectionName).find();

    await dishes.forEach(async function(document) {
        await dbConnection.db().collection(collectionName).update(
            { "_id": document._id },
            { "$set": { "distance": getGeoDistance(document.latitude, document.longitude) } }
        );
    });

    console.log('-----------------------------------------------');
    console.log('done');
}

writeDistancesToDishDb('test_collection');