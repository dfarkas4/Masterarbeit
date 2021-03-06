'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash'),
    getScenarioSequence = require('./getScenarioSequence');

async function getStudySequence(userToken) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        currSequence = {};

    let latinSquare = await dbConnection.db().collection('latin_square').find({ "entry_id": "FFFAAA" }).limit(1).toArray();

    latinSquare = latinSquare[0];

    if (latinSquare.current_token === userToken) {
        currSequence.currentSequence = latinSquare[latinSquare.current_sequence + ''] + latinSquare[((latinSquare.current_sequence + 1) % 5) + ''];
        currSequence.currentStartingLocation = latinSquare.current_starting_location;
        let latinScenarioSquare = await dbConnection.db().collection('latin_square').find({ "entry_id": "FFFBBB" }).limit(1).toArray();
        currSequence.scenarioSequence = latinScenarioSquare[0].current_sequence;
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
        let scenarioSequence = await getScenarioSequence(dbConnection);
        currSequence.scenarioSequence = scenarioSequence;
    }

    return currSequence;
}

module.exports = getStudySequence;