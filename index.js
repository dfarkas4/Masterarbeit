'use strict';

require('dotenv').config();

const Hapi = require('hapi'),
    Path = require('path'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection', 'test_collection2']),
    testCollection = db.collection('test_collection'),
    testCollection2 = db.collection('test_collection2'),
    _ = require('lodash'),
    getFilteredResults = require('./App/getFilteredResults');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    address: '0.0.0.0'
});

function getRandomDishList(dishList, limit) {
    let newDishList = new Set(),
        randomIndex = _.random(0, dishList.length - 1, false);

    let i = 0;

    while(newDishList.size !== limit) {
        i++;
        newDishList.add(dishList[randomIndex]);
        randomIndex = _.random(0, dishList.length - 1, false);
    }

    console.log('i', i);

    return [...newDishList];
}

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
        let asd = await getFilteredResults(request.payload);
        return JSON.stringify(asd);
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