'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectID,
    _ = require('lodash');

function isKnown(known) {
    if (known >= 2) {
        return false;
    }

    return true;
}

async function writeNoveltyToDb() {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        dishMap = new Map();

    const noveltyScoresList = await dbConnection.db().collection('novelty_scores').find({}).toArray();

    //TO-DO attach calculated scientific novelty score to each dish (und eaten?)
    for (let i = 0; i < noveltyScoresList.length; i++) {
        for (let dish in noveltyScoresList[i].novelty) {
            if (dishMap.has(dish)) {
                let currDish = dishMap.get(dish),
                    known = isKnown(noveltyScoresList[i].novelty[dish].known) ? 1 : 0;

                currDish.seen = currDish.seen + 1;
                currDish.known = currDish.known + known;
            } else {
                let entry = {
                    seen: 1,
                    known: isKnown(noveltyScoresList[i].novelty[dish].known) ? 1 : 0,
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
            seen: db1Dishes[i][1].seen
        };

        await dbConnection.db()
            .collection('test_collection')
            .update({ 'id_num': db1Dishes[i][0] }, { $set: { novelty: entry } }, { upsert : true });
    }

    for (let i = 0; i < db2Dishes.length; i++) {
        let entry = {
            known: db2Dishes[i][1].known,
            seen: db2Dishes[i][1].seen
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