'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    possibleChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomString(length, chars) {
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

async function generateToken() {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);
    const generatedString = randomString(12, possibleChars);

    await dbConnection.db().collection('neural_net_token').insert({ token: generatedString });
    await dbConnection.close();

    return generatedString;
}

module.exports = generateToken;