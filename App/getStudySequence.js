'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash');

async function getStudySequence(userToken) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        currSequence = {};

    let latinSquare = await dbConnection.db().collection('latin_square').find({ "entry_id": "FFFAAA" }).limit(1).toArray();

    latinSquare = latinSquare[0];

    if (latinSquare.current_token === userToken) {
        currSequence.currentSequence = latinSquare[latinSquare.current_sequence + ''] + latinSquare[((latinSquare.current_sequence + 1) % 5) + ''];
        currSequence.currentStartingLocation = latinSquare.current_starting_location;
    } else if (latinSquare.current_token !== userToken) {
        currSequence.currentStartingLocation = latinSquare.current_starting_location === 'BERLIN' ? 'WATERLOO' : 'BERLIN';
        currSequence.currentSequence = latinSquare[((latinSquare.current_sequence + 2) % 5) + ''] + latinSquare[((latinSquare.current_sequence + 3) % 5) + ''];
        await dbConnection.db().collection('latin_square').update(
            { "entry_id": "FFFAAA" },
            { "$set": {
                    "current_sequence": ((latinSquare.current_sequence + 2) % 5),
                    "current_token": userToken,
                    "current_starting_location": currSequence.currentStartingLocation
            }}
        );
    }

    return currSequence;
}

module.exports = getStudySequence;