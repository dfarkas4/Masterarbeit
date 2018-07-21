'use strict';

require('dotenv').config();

const Hapi = require('hapi'),
    Path = require('path'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection', 'test_collection2']),
    testCollection = db.collection('test_collection'),
    testCollection2 = db.collection('test_collection2');

const server = Hapi.server({
    port: process.env.PORT || 4000,
    address: '0.0.0.0'
});

const testdata = {
    kek: 'dfksdjfj34fj8isdfjia',
    posts: [
        {
            o: 'asd'
        },
        {
            o: 'qwe'
        },
        {
            o: 'zxc'
        }
    ]
};

server.route({
    method: 'GET',
    path: '/123',
    handler: (request, h) => {
        //return 'Hello, world!';
        return h.view('home', testdata);
    }
});

server.route({
    method: 'POST',
    path: '/456',
    handler: (request, h) => {
        console.log(request.payload);
        return '';
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

const init = async () => {

    await server.register(require('vision'));
    server.views({
        relativeTo: 'Templates',//Path.join(__dirname, 'templates'),
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