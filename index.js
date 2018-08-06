'use strict';

require('dotenv').config();

const Hapi = require('hapi'),
    Path = require('path'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection', 'test_collection2', 'neural_net_token']),
    testCollection = db.collection('test_collection'),
    testCollection2 = db.collection('test_collection2'),
    netTokenCollection = db.collection('neural_net_token'),
    _ = require('lodash'),
    getFilteredResults = require('./App/getFilteredResults'),
    getRandomDishList = require('./App/getRandomDishList'),
    helperFunctions = require('./App/helperFunctions'),
    mapToNetworkData = require('./App/mapToNetworkData'),
    neuralNetwork = require('./App/neuralNetwork'),
    generateNetToken = require('./App/generateNetToken');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    address: '0.0.0.0'
});

server.route({
    method: 'GET',
    path: '/generatenettoken',
    handler: async (request, h) => {
        let response = {
            response: await generateNetToken()
        };
        return response;
    }
});

server.route({
    method: 'GET',
    path: '/novelty',
    handler: async (request, h) => {
        const db1 = await new Promise((resolve, reject) => {
            testCollection.find({}, { title: 1, description_title: 1, image_url: 1 }, function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        const db2 = await new Promise((resolve, reject) => {
            testCollection2.find({}, { title: 1, description_title: 1, image_url: 1 }, function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        const dbs = _.union(db1, db2);

        const randomDishes = getRandomDishList(dbs, 5);

        console.log('dbs', dbs.length);
        console.log(randomDishes.length);

        const studyInput = {
            dishes: randomDishes
        };

        return h.view('novelty', studyInput);
    }
});

server.route({
    method: 'POST',
    path: '/studyresults',
    handler: (request, h) => {
        console.log(request.payload);
        return 'Thx für die Teilnahme.\n' + JSON.stringify(request.payload);
    }
});

server.route({
    method: 'GET',
    path: '/trainbrain/{db}/{token}',
    handler: async (request, h) => {
        let collection;

        if (_.isUndefined(request.params.token)) {
            return 'Token is missing.'
        }

        let netToken = await new Promise((resolve, reject) => {
            netTokenCollection.find({ token: request.params.token }, { token: 1, _id: 0 }, function (err, docs) {
                if (err) {
                    return 'Token not found.';
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        if (_.isEmpty(netToken)) {
            return 'Token not found.';
        }

        netToken = netToken[0].token;

        if (request.params.db === '1') {
            collection = testCollection;
        } else if (request.params.db === '2') {
            collection = testCollection2;
        } else if (request.params.db === '3') {
            // TO-DO db3
        } else {
            return 'No Db specified in url.'
        }

        const db = await new Promise((resolve, reject) => {
            collection.find({}, {}, function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        const randomDishes = getRandomDishList(db, 20);

        const dishInput = {
            dishes: randomDishes,
            dbCollection: request.params.db,
            netToken: netToken
        };

        return h.view('trainbrain', dishInput);
    }
});

server.route({
    method: 'POST',
    path: '/trainbrainresults',
    handler: async (request, h) => {
        const currDb = request.payload.dbCollection,
            currNetToken = request.payload.netToken;

        let collectionName;

        if (currDb === '1') {
            collectionName = 'test_collection';
        } else if (currDb === '2') {
            collectionName = 'test_collection2';
        } else if (currDb === '3') {
            // TO-DO db3
        } else {
            return 'No Db specified.'
        }

        delete request.payload.dbCollection;
        delete request.payload.netToken;

        let dishArr = await helperFunctions.getDishesByObjectOfIds(request.payload, collectionName),
            minMaxValues = {};
        helperFunctions.attachNetOutputToDishes(dishArr, request.payload);

        let splitDishArr = _.chunk(dishArr, 15); // trainingdata, testdata

        minMaxValues.minPrice = await helperFunctions.getMinOrMaxValue('price', collectionName, +1);
        minMaxValues.maxPrice = await helperFunctions.getMinOrMaxValue('price', collectionName, -1);
        minMaxValues.minDistance = await helperFunctions.getMinOrMaxValue('distance', collectionName, +1);
        minMaxValues.maxDistance = await helperFunctions.getMinOrMaxValue('distance', collectionName, -1);

        let mappedNetworkTrainingDishArr = _.map(splitDishArr[0], (dish) => mapToNetworkData(dish, collectionName, minMaxValues)),
            mappedNetworkTestDishArr = _.map(splitDishArr[1], (dish) => mapToNetworkData(dish, collectionName, minMaxValues, true));

        let neuralNet = neuralNetwork.trainBrain(mappedNetworkTrainingDishArr);

        /*for (let i = 0; i < mappedNetworkTestDishArr.length; i++) {
            const output = neuralNetwork.testBrain(netwuuurk, mappedNetworkTestDishArr[i]);

            console.log('dish: ', splitDishArr[1][i].title);
            console.log('suggested accuracy', output);
            console.log('real accuracy', splitDishArr[1][i].netOutput);
        }*/

        const totalAccuracy = neuralNetwork.getAccuracy(neuralNet, mappedNetworkTestDishArr, splitDishArr[1]);

        console.log('totalAccuracy', totalAccuracy);

        await neuralNetwork.saveBrain(currNetToken, neuralNet, totalAccuracy, collectionName, minMaxValues);

        return 'Thx für die Teilnahme.\n' + JSON.stringify(request.payload);
    }
});

server.route({
    method: 'POST',
    path: '/filteredresults',
    handler: async (request, h) => {
        console.log(request.payload); // TO-DO remove this later
        let response = {
            response: await getFilteredResults(request.payload)
        };

        console.log('RESPONSE', response);
        return response;
    }
});

const init = async () => {

    await server.register(require('vision'));
    server.views({
        relativeTo: 'Templates',
        engines: {
            hbs: require('handlebars')
        },
        isCached: false
    });
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();