'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash');

function buildInput(payload, metaData) {
    let input = {
            email: metaData.email,
            time: metaData.time,
            remote_address: metaData.remote_address,
            datenschutz: metaData.datenschutz
        },
        dishList = {};

    for (let dish in payload) {
        if (!_.includes(dish, '_gegessen') && !_.includes(dish, '_location')) {
            dishList[dish] = {
                location: payload[dish + '_location'],
                known: Number(payload[dish]),
                eaten: Number(payload[dish + '_gegessen'])
            }
        }
    }

    input.novelty = dishList;

    return input;
}

async function saveNoveltyResult(payload, metaData) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);

    const emailCount = await dbConnection.db().collection('novelty_scores').find({ email: metaData.email }).count();

    if (emailCount > 0) {
        return 'Diese E-Mail Adresse wurde schon verwendet.'
    }

    const input = buildInput(payload, metaData);

    await dbConnection.db().collection('novelty_scores').insert(input);
    await dbConnection.close(true);

    return 'Danke für die Teilnahme. Du wirst per E-Mail benachrichtigt, ob du gewonnen hast.';
}

module.exports = saveNoveltyResult;