'use strict';

require('dotenv').config();

const csvtojson = require('csvtojson'),
    mongojs = require('mongojs'),
    db = mongojs(process.env.DB_STR, ['test_collection']),
    testCollection = db.collection('test_collection'),
    file = 'meals-seb.csv';

csvtojson()
    .fromFile('./files/' + file)
    .then((json) => {
        testCollection.save(json, function(err, asd) {
            process.exit(0);
        });
    });
