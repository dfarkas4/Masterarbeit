'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    possibleChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Not used anymore due to self generated userToken
function randomString(length, chars) {
    let result = '';
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

async function generateToken(userToken) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);
    //const generatedString = randomString(12, possibleChars); // Not used anymore due to self generated userToken

    const tokenExists = await dbConnection.db().collection('neural_net_token').find({ token: userToken }).count();
    if (tokenExists < 1) {
        await dbConnection.db().collection('neural_net_token').insert({ token: userToken });
    }
    await dbConnection.close();

    //return generatedString; // Not used anymore due to self generated userToken
}

module.exports = generateToken;