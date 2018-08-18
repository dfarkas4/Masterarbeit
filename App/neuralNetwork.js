'use strict';

const brain = require('brain.js'),
    _ = require('lodash'),
    mongoClient = require('mongodb').MongoClient,
    mapToNetworkData = require('./mapToNetworkData');

function trainBrain(trainingData, collectionName) {
    let HiddenLayerNum = 20;

    if (collectionName === 'test_collection2') {
        HiddenLayerNum = 20;
    } else if (collectionName === 'test_collection') {
        HiddenLayerNum = 23;
    }

    //provide optional config object (or undefined). Defaults shown.
    // TO-DO -> schauen wie man das gut konfiguriert und konfigurieren
    const config = {
        learingRate: 0.5, // ¯\_(ツ)_/¯
        iterations: 200,
        hiddenLayers: [HiddenLayerNum],     // array of ints for the sizes of the hidden layers in the network. #38 currently
        activation: 'sigmoid' // Supported activation types ['sigmoid', 'relu', 'leaky-relu', 'tanh']
    };

    //create a simple feed forward neural network with backpropagation
    let net = new brain.NeuralNetwork(config);

    net.train(trainingData);

    return net;
}

async function saveBrain(netToken, net, totalAccuracy, collectionName, minMaxValues, trainingAndTestDataUnmapped) {
    const entry = {},
        networkJson = net.toJSON(),
        dbConnection = await mongoClient.connect(process.env.DB_STR),
        fullDishList = await dbConnection.db().collection(collectionName).find({}).toArray(),
        fullDishListNetData = _.map(fullDishList, (dish) => {
            return {
                mappedDishData: mapToNetworkData(dish, collectionName, minMaxValues, true),
                id_num: dish.id_num
            }
        }),
        fullDishListAccuracy = [];

    for (let i = 0; i < fullDishListNetData.length; i++) {
        let dishAccuracy = testBrain(net, fullDishListNetData[i].mappedDishData),
            dishObject = {
                accuracy: dishAccuracy.yes,
                dishId: fullDishListNetData[i].id_num
            };

        fullDishListAccuracy.push(dishObject);
    }

    fullDishListAccuracy.sort((a, b) => b.accuracy - a.accuracy);

    entry.netToken = netToken;
    entry.net = networkJson;
    entry.trainingDataUnmapped = trainingAndTestDataUnmapped[0];
    entry.testDataUnmapped = trainingAndTestDataUnmapped[1];
    entry.totalAccuracy = totalAccuracy;
    entry.dishCollection = {
        name: collectionName,
        accuracyList: fullDishListAccuracy
    };

    await dbConnection.db()
        .collection('accuracies')
        .update({ 'netToken': netToken, 'dishCollection.name': collectionName }, entry, { upsert : true });

    dbConnection.close();
}

function loadBrain(netJson) {
    let net = new brain.NeuralNetwork(config);
    net.fromJSON(netJson);

    // TO-DO -> load from db
}

function testBrain(net, testData) {
    const output = net.run(testData);  // [0.987]

    return output;
}

function getAccuracy(net, testDataArr, realOutput) {
    let hits = 0;

    for (let i = 0; i < testDataArr.length; i++) {
        const output = testBrain(net, testDataArr[i]);

        console.log('TESTERBRAIN', output, realOutput[i].netOutput);

        if (!_.isUndefined(realOutput[i].netOutput.yes)) {
            console.log('yes', Math.round(output.yes), realOutput[i].netOutput.yes);
            realOutput[i].netOutput.yes === Math.round(output.yes) ? hits++ : null;
        } else {
            realOutput[i].netOutput.no === Math.round(output.no) ? hits++ : null;
        }
    }

    console.log('HITS', hits);

    return hits / testDataArr.length;
}

exports.trainBrain = trainBrain;
exports.saveBrain = saveBrain;
exports.loadBrain = loadBrain;
exports.testBrain = testBrain;
exports.getAccuracy = getAccuracy;