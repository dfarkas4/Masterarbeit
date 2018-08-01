'use strict';

const brain = require('brain.js'),
    _ = require('lodash');

//provide optional config object (or undefined). Defaults shown.
// TO-DO -> schauen wie man das gut konfiguriert und konfigurieren
const config = {
    learingRate: 0.5, // ¯\_(ツ)_/¯
    iterations: 200,
    hiddenLayers: [28],     // array of ints for the sizes of the hidden layers in the network. #38 currently
    activation: 'sigmoid' // Supported activation types ['sigmoid', 'relu', 'leaky-relu', 'tanh']
};

function trainBrain(trainingData) {
    //create a simple feed forward neural network with backpropagation
    let net = new brain.NeuralNetwork(config);

    net.train(trainingData);

    return net;
}

function saveBrain(net) {
    const networkJson = net.toJSON();

    // TO-DO -> save to db
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