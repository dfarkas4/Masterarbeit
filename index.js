'use strict';

const Hapi = require('hapi'),
    mongojs = require('mongojs'),
    db = mongojs('mongodb://david:asd111@ds129541.mlab.com:29541/rs_food', ['test_collection']),
    testCollection = db.collection('test_collection');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    host: 'localhost'
});

server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {

        return 'Hello, world!';
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

const init = async () => {

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();