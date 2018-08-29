'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash'),
    hashStr = require('string-hash');

async function saveEmail(email, ip) {
    let dbConnection = await mongoClient.connect(process.env.DB_EMAIL),
        input = {};

    const hashedIp = hashStr(ip);

    input.email = email;
    input.hashed_ip = hashedIp;

    await dbConnection.db().collection('novelty_emails').insert(input);

    await dbConnection.close(true);
}

module.exports = saveEmail;