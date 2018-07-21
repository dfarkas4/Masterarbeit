'use strict';

require('dotenv').config();

const csvtojson = require('csvtojson'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection2']),
    testCollection = db.collection('test_collection2'),
    file = 'Meals-Waterloo.csv';

csvtojson()
    .fromFile('./Files/' + file)
    .then((json) => {
        testCollection.save(json, function(err, asd) {
            process.exit(0);
        });
    });
