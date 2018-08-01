'use strict';

require('dotenv').config();

const Hapi = require('hapi'),
    Path = require('path'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection', 'test_collection2']),
    testCollection = db.collection('test_collection'),
    testCollection2 = db.collection('test_collection2'),
    _ = require('lodash'),
    getFilteredResults = require('./App/getFilteredResults'),
    getRandomDishList = require('./App/getRandomDishList'),
    helperFunctions = require('./App/helperFunctions'),
    mapToNetworkData = require('./App/mapToNetworkData'),
    neuralNetwork = require('./App/neuralNetwork');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    address: '0.0.0.0'
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
    path: '/trainbrain',
    handler: async (request, h) => {
        const db2 = await new Promise((resolve, reject) => {
            testCollection2.find({}, {}, function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        const randomDishes = getRandomDishList(db2, 60);

        console.log(randomDishes.length);

        const dishInput = {
            dishes: randomDishes
        };

        return h.view('trainbrain', dishInput);
    }
});

server.route({
    method: 'POST',
    path: '/trainbrainresults',
    handler: async (request, h) => {
        console.log(request.payload);

        let dishArr = await helperFunctions.getDishesByObjectOfIds(request.payload, 'test_collection2'),
            minMaxValues = {};
        helperFunctions.attachNetOutputToDishes(dishArr, request.payload);

        let splitDishArr = _.chunk(dishArr, 45); // trainingdata, testdata

        minMaxValues.minPrice = await helperFunctions.getMinOrMaxValue('price', 'test_collection2', +1);
        minMaxValues.maxPrice = await helperFunctions.getMinOrMaxValue('price', 'test_collection2', -1);
        minMaxValues.minDistance = await helperFunctions.getMinOrMaxValue('distance', 'test_collection2', +1);
        minMaxValues.maxDistance = await helperFunctions.getMinOrMaxValue('distance', 'test_collection2', -1);

        let mappedNetworkTrainingDishArr = _.map(splitDishArr[0], (dish) => mapToNetworkData(dish, 'test_collection2', minMaxValues)),
            mappedNetworkTestDishArr = _.map(splitDishArr[1], (dish) => mapToNetworkData(dish, 'test_collection2', minMaxValues, true));

        var netwuuurk = neuralNetwork.trainBrain(mappedNetworkTrainingDishArr);

        console.log('asdasdasd1');

        /*for (let i = 0; i < mappedNetworkTestDishArr.length; i++) {
            const output = neuralNetwork.testBrain(netwuuurk, mappedNetworkTestDishArr[i]);

            console.log('dish: ', splitDishArr[1][i].title);
            console.log('suggested accuracy', output);
            console.log('real accuracy', splitDishArr[1][i].netOutput);
        }*/

        const totalAccuracy = neuralNetwork.getAccuracy(netwuuurk, mappedNetworkTestDishArr, splitDishArr[1]);

        console.log('asdasdasd2', totalAccuracy);

        return 'Thx für die Teilnahme.\n' + JSON.stringify(request.payload);
    }
});

server.route({
    method: 'GET',
    path: '/asd',
    handler: async (request, h) => {

        //return 'Hello, ' + encodeURIComponent(request.params.name) + '!';

        //return 'lol';

        return new Promise((resolve, reject) => {
            testCollection.find(function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }
});

server.route({
    method: 'GET',
    path: '/asd2',
    handler: async (request, h) => {
        return new Promise((resolve, reject) => {
            testCollection2.find(function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
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