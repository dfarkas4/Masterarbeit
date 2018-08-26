'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    ingredientsList = ['fisch', 'meeresfrüchte', 'pilze', 'knoblauch', 'zwiebel', 'innereien', 'kohlarten', 'koriander'],
    dietList = ['vegan', 'vegetarisch', 'halal', 'pescetarisch'];

function convertBinaryToObject(binarySeq, field) {
    const splitBinary = binarySeq.split(''),
        res = {};

    if (field === 'ingredients') {
        for (let i = 0; i < ingredientsList.length; i++) {
            res[ingredientsList[i]] = splitBinary[i] === '1' ? true : false;
        }
    } else {
        for (let i = 0; i < dietList.length; i++) {
            res[dietList[i]] = splitBinary[i] === '1' ? true : false;
        }
    }

    return res;
}

async function convertFilterBinaryToObjects(collectionName) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR);

    const dishes = await dbConnection.db().collection(collectionName).find();

    await dishes.forEach(async function(document) {
        await dbConnection.db().collection(collectionName).update(
            { "_id": document._id },
            { "$set":
                    {
                        "ingredients": convertBinaryToObject(document.ingredients, 'ingredients'),
                        "diet": convertBinaryToObject(document.diet, 'diet')
                    }
            }
        );
    });

    console.log('-----------------------------------------------');
    dbConnection.close();
    console.log('done');
}

convertFilterBinaryToObjects('test_collection');