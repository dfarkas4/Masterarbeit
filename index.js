'use strict';

require('dotenv').config();

const Hapi = require('hapi'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection']),
    testCollection = db.collection('test_collection');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    address: '0.0.0.0'
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