'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectID,
    _ = require('lodash');

async function getDishesByObjectOfIds(dishIdsObject, collectionName) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        result;

    const dishIdArray = _.map(_.keys(dishIdsObject), (key) => ObjectId(key));

    result = await dbConnection.db()
        .collection(collectionName)
        .find({"_id" : {"$in" : dishIdArray}})
        .toArray();

    await dbConnection.close(true);

    return result;
}

function attachNetOutputToDishes(dishes, outputs) {
    for (let i = 0; i < dishes.length; i++) {
        let netOutput = {};

        //console.log(outputs[dishes[i]._id.toString()], 'qweweqeqwew');
        if (Number(outputs[dishes[i]._id.toString()]) === 1) {
            netOutput['yes'] = 1;
        } else {
            netOutput['no'] = 1;
        }

        dishes[i].netOutput = netOutput;
    }
}

async function getMinOrMaxValue(field, collectionName, sorter) {
    const sortBy = {},
        dbConnection = await mongoClient.connect(process.env.DB_STR);

    sortBy[field] = sorter;

    const result = await dbConnection.db().collection(collectionName)
        .find().sort(sortBy)
        .limit(1).toArray();

    await dbConnection.close();

    return result[0][field];
}

exports.getDishesByObjectOfIds = getDishesByObjectOfIds;
exports.attachNetOutputToDishes = attachNetOutputToDishes;
exports.getMinOrMaxValue = getMinOrMaxValue;