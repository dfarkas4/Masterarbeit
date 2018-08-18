'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash'),
    location = Object.freeze({
        BERLIN: 'test_collection',
        WATERLOO: 'test_collection2'
    }),
    definedKitchens = [
        'Asiatisch',
        'Fast Food',
        'Griechisch',
        'Indisch',
        'Italienisch'
    ];

function buildQuery(filters) {
    let query = {};

    if (!_.isUndefined(filters.distance) && filters.distance > 0) {
        query.distance = { $lte: filters.distance * 1000 }; // number
    }
    if (!_.isUndefined(filters.price) && filters.price > 0) {
        query.price = { $lte: Number(filters.price) }; // number
    }
    if (!_.isUndefined(filters.kitchenStyle) && filters.kitchenStyle.length > 0) {
        if (_.includes(filters.kitchenStyle, 'Sonstige')) {
            query.kitchen_style = { $nin: _.difference(definedKitchens, filters.kitchenStyle) }; // array of strings
        } else {
            query.kitchen_style = { $in: filters.kitchenStyle }; // array of strings
        }
    }

    if (!_.isUndefined(filters.ingredients) && filters.ingredients.length > 0) {
        _.forEach(filters.ingredients, (ingredient) => {
            query['ingredients'+'.'+ingredient] = false;
        });
    }

    if (!_.isUndefined(filters.diet) && filters.diet.length > 0) {
        _.forEach(filters.diet, (type) => {
            query['diet'+'.'+type] = true;
        });
    }

    console.log('query', query);

    return query;
}

async function attachAccuracy(dishes, location, netToken, dbConnection) {
    let accuracyList = await dbConnection.db()
        .collection('accuracies')
        .find({
                netToken: netToken,
                'dishCollection.name': location
            },
            {
                projection: {
                    '_id': 0,
                    'dishCollection.accuracyList': 1
                }
            })
        .toArray();

    if (accuracyList.length < 1) {
        return;
    }

    accuracyList = accuracyList[0].dishCollection.accuracyList;

    let accuracyListObject = _.keyBy(accuracyList, 'dishId');

    for (let i = 0; i < dishes.length; i++) {
        dishes[i].accuracy = accuracyListObject[dishes[i].id_num].accuracy;
    }
}

async function getFilteredResults(payload) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        result;

    const query = buildQuery(payload);

    result = payload.resultCountOnly ?
        await dbConnection.db().collection(location[payload.location]).find(query).count()
        :
        await dbConnection.db().collection(location[payload.location]).find(query).toArray();

    if (!payload.resultCountOnly) {
        await attachAccuracy(result, location[payload.location], payload.token, dbConnection);
    }

    await dbConnection.close(true);

    return result;
}

module.exports = getFilteredResults;