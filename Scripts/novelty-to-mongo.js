'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    _ = require('lodash');

function isKnown(known) {
    if (known > 2) {
        return true;
    }

    return false;
}

function calculateNovelty(known, eaten) {
    const preNoveltyMax = -Math.log2(0.7*(1 / 4) + 0.3*(1 / 4)),
        preNoveltyMin = -Math.log2(0.7*(4 / 4) + 0.3*(4 / 4));

    let preNovelty = -Math.log2(0.7*(known / 4) + 0.3*(eaten / 4));

    return (preNovelty - preNoveltyMin) / (preNoveltyMax - preNoveltyMin); // (value - min) / (max - min);
}

// Formula: https://math.stackexchange.com/questions/22348/how-to-add-and-subtract-values-from-an-average
// TO-DO muss noch mit mehrere getestet werden
function updateAverageNovelty(avgNovelty, noveltyEntry, seen) {
    return avgNovelty + ((noveltyEntry - avgNovelty) / (seen + 1));
}

async function writeNoveltyToDb() {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        dishMap = new Map();

    const noveltyScoresList = await dbConnection.db().collection('novelty_scores').find({}).toArray();

    for (let i = 0; i < noveltyScoresList.length; i++) {
        for (let dish in noveltyScoresList[i].novelty) {
            if (dishMap.has(dish)) {
                let currDish = dishMap.get(dish),
                    known = isKnown(noveltyScoresList[i].novelty[dish].known) ? 1 : 0,
                    noveltyEntry = calculateNovelty(
                        noveltyScoresList[i].novelty[dish].known,
                        noveltyScoresList[i].novelty[dish].eaten);

                currDish.seen = currDish.seen + 1;
                currDish.known = currDish.known + known;
                currDish.avgNovelty = updateAverageNovelty(currDish.avgNovelty, noveltyEntry, currDish.seen);
            } else {
                let entry = {
                    seen: 1,
                    known: isKnown(noveltyScoresList[i].novelty[dish].known) ? 1 : 0,
                    avgNovelty: calculateNovelty(
                        noveltyScoresList[i].novelty[dish].known,
                        noveltyScoresList[i].novelty[dish].eaten),
                    location: noveltyScoresList[i].novelty[dish].location
                };

                dishMap.set(dish, entry);
            }
        }
    }

    let dishArr = [...dishMap];

    let db1Dishes = _.filter(dishArr, function(element) {
        return element[1].location === 'test_collection';
    });

    let db2Dishes = _.filter(dishArr, function(element) {
        return element[1].location === 'test_collection2';
    });

    for (let i = 0; i < db1Dishes.length; i++) {
        let entry = {
            known: db1Dishes[i][1].known,
            seen: db1Dishes[i][1].seen,
            novelty_score: db1Dishes[i][1].avgNovelty
        };

        await dbConnection.db()
            .collection('test_collection')
            .update({ 'id_num': db1Dishes[i][0] }, { $set: { novelty: entry } }, { upsert : true });
    }

    for (let i = 0; i < db2Dishes.length; i++) {
        let entry = {
            known: db2Dishes[i][1].known,
            seen: db2Dishes[i][1].seen,
            novelty_score: db2Dishes[i][1].avgNovelty
        };

        await dbConnection.db()
            .collection('test_collection2')
            .update({ 'id_num': db2Dishes[i][0] }, { $set: { novelty: entry } }, { upsert : true });
    }

    console.log('-----------------------------------------------');
    dbConnection.close();
    console.log('done');
}

writeNoveltyToDb();

