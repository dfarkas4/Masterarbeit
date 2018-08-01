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
    // TO-DO remove, war nur als info hier für mich
    /*ingredientsList = ['fisch', 'meeresfrüchte', 'pilze', 'knoblauch', 'zwiebel', 'innereien', 'kohlarten', 'koriander'],
    dietList = ['vegan', 'vegetarisch', 'halal', 'pescetarisch'];*/

function buildQuery(filters) {
    let query = {};

    if (!_.isUndefined(filters.distance) && filters.distance.length > 0) {
        query.distance = { $lte: filters.distance * 1000 }; // number
    }
    if (!_.isUndefined(filters.price) && filters.price.length > 0) {
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
            query['ingredients'+'.'+ingredient] = true;
        });
    }

    if (!_.isUndefined(filters.diet) && filters.diet.length > 0) {
        _.forEach(filters.diet, (type) => {
            query['diet'+'.'+type] = true;
        });
    }

    return query;
}

async function getFilteredResults(payload) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        result;

    const query = buildQuery(payload);

    console.log('query', query); // TO-DO remove this later

    result = payload.resultCountOnly ?
        await dbConnection.db().collection(location[payload.location]).find(query).count()
        :
        await dbConnection.db().collection(location[payload.location]).find(query).toArray();

    console.log('ASDASDASDASDASDASD', result.length); // TO-DO remove this later

    await dbConnection.close(true);

    console.log('db connection closed', !dbConnection.isConnected()); // TO-DO remove this later

    return result;
}

module.exports = getFilteredResults;