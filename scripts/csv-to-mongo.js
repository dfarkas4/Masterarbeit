'use strict';

const csvtojson = require('csvtojson'),
    mongojs = require('mongojs'),
    db = mongojs('mongodb://david:asd111@ds129541.mlab.com:29541/rs_food', ['test_collection']),
    testCollection = db.collection('test_collection'),
    file = 'meals-seb.csv';

csvtojson()
    .fromFile('./files/' + file)
    .then((json) => {
        testCollection.save(json, function(err, asd) {
            process.exit(0);
        });
    });
