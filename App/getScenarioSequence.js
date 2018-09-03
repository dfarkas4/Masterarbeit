'use strict';

require('dotenv').config();

const _ = require('lodash');

async function getMax(dbConnection) {
    let scenariosLatinSquare = await dbConnection.db().collection('latin_square').find({ "entry_id": "FFFBBB" }).limit(1).toArray();

    scenariosLatinSquare = scenariosLatinSquare[0];

    const maxCount = _.maxBy(scenariosLatinSquare.sequences, 'count');

    return maxCount.count;
}

async function getNextSequence(dbConnection, maxCount) {
    let res;
    let scenariosLatinSquare = await dbConnection.db().collection('latin_square').find({ "entry_id": "FFFBBB" }).limit(1).toArray();

    scenariosLatinSquare = scenariosLatinSquare[0];

    let seqsToPickFrom = [];

    // Get all sequences that have catching up to do
    for (let i = 0; i < 5; i++) {
        if (scenariosLatinSquare.sequences[i].count === maxCount - 1) {
            seqsToPickFrom.push(i);
        }
    }
    
    if (seqsToPickFrom.length > 0) {
        const randomIndex = Math.floor(Math.random() * (seqsToPickFrom.length));
        res = {
            seqId: seqsToPickFrom[randomIndex],
            sequenceString: scenariosLatinSquare.sequences[seqsToPickFrom[randomIndex]].sequence,
            newSequenceCount: scenariosLatinSquare.sequences[seqsToPickFrom[randomIndex]].count + 1
        };
    } else {
        // If array is empty
        const randomIndex = Math.floor(Math.random() * (4 + 1));
        res = {
            seqId: randomIndex,
            sequenceString: scenariosLatinSquare.sequences[randomIndex].sequence,
            newSequenceCount: scenariosLatinSquare.sequences[randomIndex].count + 1
        };
    }

    return res;
}

async function getScenarioSequence(dbConnection) {
    let res = '';

    let maxCount = await getMax(dbConnection);

    const firstSequenceObject = await getNextSequence(dbConnection, maxCount);

    let update = { "$set": {} };

    update["$set"]["sequences." + firstSequenceObject.seqId] = {
        sequence: firstSequenceObject.sequenceString,
        count: firstSequenceObject.newSequenceCount
    };

    // update db
    await dbConnection.db().collection('latin_square').update(
        { "entry_id": "FFFBBB" },
        update
    );

    res = firstSequenceObject['sequenceString']; // first finished

    maxCount = await getMax(dbConnection);

    let secondSequenceObject = await getNextSequence(dbConnection, maxCount);

    while (secondSequenceObject['sequenceString'] === res) {
        secondSequenceObject = await getNextSequence(dbConnection, maxCount);
    }

    let update2 = { "$set": {} };

    update2["$set"]["sequences." + secondSequenceObject.seqId] = {
        sequence: secondSequenceObject.sequenceString,
        count: secondSequenceObject.newSequenceCount
    };

    await dbConnection.db().collection('latin_square').update(
        { "entry_id": "FFFBBB" },
        update2
    );

    res = res + secondSequenceObject['sequenceString'];

    return res;
}

module.exports = getScenarioSequence;