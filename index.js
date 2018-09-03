'use strict';

require('dotenv').config();

const Hapi = require('hapi'),
    Path = require('path'),
    requestPromise = require('request-promise'),
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
    generateNetToken = require('./App/generateNetToken'),
    saveNoveltyResult = require('./App/saveNoveltyResult'),
    getWishList = require('./App/getWishList'),
    getStudySequence = require('./App/getStudySequence');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    address: '0.0.0.0'
});

// Not used anymore due to self generated userToken
/*server.route({
    method: 'GET',
    path: '/generatenettoken',
    handler: async (request, h) => {
        let response = {
            response: await generateNetToken()
        };
        return response;
    }
});*/

server.route({
    method: 'POST',
    path: '/wakeup',
    handler: async (request, h) => {
        return 'ich bin wach';
    }
});

server.route({
    method: 'GET',
    path: '/novelty',
    handler: async (request, h) => {
        const db1 = await new Promise((resolve, reject) => {
            testCollection.find({}, { id_num: 1, title: 1, description_title: 1, image_url: 1 }, function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        const newDb1 = _.map(db1, function(dish) {
            return _.extend({}, dish, { location: 'test_collection' });
        });

        const db2 = await new Promise((resolve, reject) => {
            testCollection2.find({}, { id_num: 1, title: 1, description_title: 1, image_url: 1 }, function (err, docs) {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });

        const newDb2 = _.map(db2, function(dish) {
            return _.extend({}, dish, { location: 'test_collection2' });
        });

        const dbs = _.union(newDb1, newDb2);

        const randomDishes = getRandomDishList(dbs, 50);

        const studyInput = {
            dishes: randomDishes
        };

        return h.view('novelty', studyInput);
    }
});

server.route({
    method: 'POST',
    path: '/studyresults',
    handler: async (request, h) => {
        if (request.payload['g-recaptcha-response'] === undefined ||
            request.payload['g-recaptcha-response'] === '' ||
            request.payload['g-recaptcha-response'] === null) {
            return 'plz select captcha';
        }

        // Secret Key
        const secretCaptchaKey = process.env.RECAPTCHA_SECRET;

        var options = {
            uri: 'https://google.com/recaptcha/api/siteverify',
            qs: {
                secret: secretCaptchaKey,
                response: request.payload['g-recaptcha-response'],
                remoteip: request.info.remoteAddress
            },
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        };

        const result = await requestPromise(options)
            .then(async function (res) {
                if (res.success) {
                    const metaData = {
                        /*remote_address: request.info.remoteAddress,*/
                        time: res.challenge_ts,
                        /*email: request.payload.email,
                        datenschutz: request.payload.datenschutz*/
                        age: request.payload.alter,
                        sex: request.payload.geschlecht,
                        education: request.payload.bildung,
                        remoteAddress: request.info.remoteAddress
                    };

                    let email = undefined;
                    if (!_.isEmpty(request.payload.email) && !_.isUndefined(request.payload.email)) {
                        metaData.email = request.payload.email;
                    }

                    delete request.payload.email;
                    delete request.payload.captcha;
                    delete request.payload['g-recaptcha-response'];
                    delete request.payload.alter;
                    delete request.payload.geschlecht;
                    delete request.payload.bildung;
                    /*delete request.payload.datenschutz;*/

                    return await saveNoveltyResult(request.payload, metaData);
                } else {
                    console.log('fgt1');
                    return 'failed captcha verification';
                }
            })
            .catch(function (err) {
                console.log(err);
                return 'failed captcha verification';
            });

        return result;
    }
});

server.route({
    method: 'GET',
    path: '/trainbrain/{db}',
    handler: async (request, h) => {
        let collection;

        if (request.params.db === '1') {
            collection = testCollection;
        } else if (request.params.db === '2') {
            collection = testCollection2;
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

        const randomDishes = getRandomDishList(db, 60);

        const dishInput = {
            dishes: randomDishes,
            dbCollection: request.params.db
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

        await generateNetToken(currNetToken);

        let collectionName;

        if (currDb === '1') {
            collectionName = 'test_collection';
        } else if (currDb === '2') {
            collectionName = 'test_collection2';
        } else {
            return 'No Db specified.'
        }

        delete request.payload.dbCollection;
        delete request.payload.netToken;

        let dishArr = await helperFunctions.getDishesByObjectOfIds(request.payload, collectionName),
            minMaxValues = {};
        helperFunctions.attachNetOutputToDishes(dishArr, request.payload);

        let splitDishArr = _.chunk(dishArr, 45); // trainingdata, testdata

        minMaxValues.minPrice = await helperFunctions.getMinOrMaxValue('price', collectionName, +1);
        minMaxValues.maxPrice = await helperFunctions.getMinOrMaxValue('price', collectionName, -1);
        minMaxValues.minDistance = await helperFunctions.getMinOrMaxValue('distance', collectionName, +1);
        minMaxValues.maxDistance = await helperFunctions.getMinOrMaxValue('distance', collectionName, -1);

        let mappedNetworkTrainingDishArr = _.map(splitDishArr[0], (dish) => mapToNetworkData(dish, collectionName, minMaxValues)),
            mappedNetworkTestDishArr = _.map(splitDishArr[1], (dish) => mapToNetworkData(dish, collectionName, minMaxValues, true));

        let neuralNet = neuralNetwork.trainBrain(mappedNetworkTrainingDishArr);

        const totalAccuracy = neuralNetwork.getAccuracy(neuralNet, mappedNetworkTestDishArr, splitDishArr[1]);

        console.log('totalAccuracy', totalAccuracy);

        await neuralNetwork.saveBrain(currNetToken, neuralNet, totalAccuracy, collectionName, minMaxValues, splitDishArr);

        return 'Training wurde erfolgreich abgeschlossen. Danke für die Teilnahme.';
    }
});

server.route({
    method: 'POST',
    path: '/filteredresults',
    handler: async (request, h) => {
        if (_.isUndefined(request.payload.token)) {
            console.log('Token is missing.'); //return 'Token is missing.'; reverse later
        }

        let netToken = await new Promise((resolve, reject) => {
            netTokenCollection.find({ token: request.payload.token }, { token: 1, _id: 0 }, function (err, docs) {
                if (err) {
                    console.log('Token not found.'); //return 'Token not found.'; reverse later
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        }),
        studySequence = '';

        if (_.isEmpty(netToken)) {
            console.log('Token not found.'); //return 'Token not found.'; reverse later
        } else {
            netToken = netToken[0].token;
            studySequence = await getStudySequence(netToken, request.payload.location);
        }

        console.log(request.payload); // TO-DO remove this later
        let response = {
            response: await getFilteredResults(request.payload)
        };

        response.studySequence = studySequence;

        console.log('RESPONSE', response);
        return response;
    }
});

server.route({
    method: 'POST',
    path: '/getwishlist',
    handler: async (request, h) => {
        const currDb = request.payload.location;
        let collectionName,
            minMaxValues = {};

        if (currDb === 'BERLIN') {
            collectionName = 'test_collection';
        } else if (currDb === 'WATERLOO') {
            collectionName = 'test_collection2';
        } else {
            return 'No Db specified.'
        }

        if (_.isUndefined(request.payload.token)) {
            console.log('Token is missing.'); //return 'Token is missing.'; reverse later
        }

        let netToken = await new Promise((resolve, reject) => {
            netTokenCollection.find({ token: request.payload.token }, { token: 1, _id: 0 }, function (err, docs) {
                if (err) {
                    console.log('Token not found.'); //return 'Token not found.'; reverse later
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
            }),
            studySequence = '';

        if (_.isEmpty(netToken)) {
            console.log('Token not found.'); //return 'Token not found.'; reverse later
        } else {
            netToken = netToken[0].token;
            studySequence = await getStudySequence(netToken, request.payload.location);
        }

        minMaxValues.minPrice = await helperFunctions.getMinOrMaxValue('price', collectionName, +1);
        minMaxValues.maxPrice = await helperFunctions.getMinOrMaxValue('price', collectionName, -1);
        minMaxValues.minDistance = await helperFunctions.getMinOrMaxValue('distance', collectionName, +1);
        minMaxValues.maxDistance = await helperFunctions.getMinOrMaxValue('distance', collectionName, -1);

        let response = {
            response: await getWishList(collectionName, minMaxValues)
        };

        response.studySequence = studySequence;

        return response;
    }
});

server.route({
    method: 'POST',
    path: '/getsequence',
    handler: async (request, h) => {
        if (_.isUndefined(request.payload.token)) {
            return 'Token is missing.';
        }

        let netToken = await new Promise((resolve, reject) => {
                netTokenCollection.find({ token: request.payload.token }, { token: 1, _id: 0 }, function (err, docs) {
                    if (err) {
                        console.log('Token not found.'); //return 'Token not found.'; reverse later
                        reject(err);
                    } else {
                        resolve(docs);
                    }
                });
            }),
            studySequence = '';

        if (_.isEmpty(netToken)) {
            return 'Token not found.';
        } else {
            netToken = netToken[0].token;
            studySequence = await getStudySequence(netToken);
        }

        let response = {
            response: studySequence
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