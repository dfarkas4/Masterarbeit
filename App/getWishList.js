'use strict';

require('dotenv').config();

const mongoClient = require('mongodb').MongoClient,
    mapToNetworkData = require('./mapToNetworkData'),
    _ = require('lodash');


/**
 * WATERLOO 20 digits, BERLIN 23 digits
 * ---
 * WATERLOO:
 * price, distance, kitchenstyle[7], dishtype[7], n_ingredients[4] -> 5x20% mit 20, 20, 2.86*7, 2.86*7, 4*5
 * -
 * BERLIN:
 * price, distance, kitchenstyle[9], dishtype[8], n_ingredients[4] -> 5x20% mit 20, 20, 2.22*9, 8*2.5, 4*5
 */
const weightsWaterloo = [
        20, 20, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 2.86, 5, 5, 5, 5
    ],
    weightsBerlin = [
        20, 20, 2.22, 2.22, 2.22, 2.22, 2.22, 2.22, 2.22, 2.22, 2.22, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 5, 5, 5, 5
    ],
    chunkSize = 4;

function getEuclideanDistance(a, b, collectionName) {
    const weights = collectionName === 'test_collection' ? weightsBerlin : weightsWaterloo;
    let sum = 0;

    for (let i = 0; i < weights.length; i++) {
        sum += (weights[i] / 100) * Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(sum);
}

function getSortedEuclideanDistanceList(a, input, collectionName, order = 'asc') {
    let list = [];

    for (let i = 0; i < input.length; i++) {
        let entry = {
            eucDistance: getEuclideanDistance(a, input[i].mappedDish, collectionName),
            element: input[i],
            id_num: input[i].id_num
        };

        list.push(entry);
    }

    return _.orderBy(list, ['eucDistance'], [order]);
}

function getFirstArrayElements(arr, num) {
    return arr.splice(0, num);
}

function filterByIdList(mappedDishes, elements) {
    let res = [];

    for (let i = 0; i < elements.length; i++) {
        let entry = _.filter(mappedDishes, ['id_num', elements[i].id_num])[0]; // 0 because it returns an array

        entry.eucDistance = elements[i].eucDistance;

        res.push(entry);
    }

    return res;
}

function removeByIdList(mappedDishes, elements) {
    let res = mappedDishes;

    for (let i = 0; i < elements.length; i++) {
        res = _.filter(res, (mappedDish) => mappedDish.id_num !== elements[i].id_num);
    }

    return res;
}

function avgFeatures(dishes) {
    let res = [];

    for (let i = 0; i < dishes[0].mappedDish.length; i++) {
        let currNum = 0;
        for (let j = 0; j < dishes.length; j++) {
            currNum += dishes[j].mappedDish[i];
        }
        currNum = currNum / dishes.length;
        res.push(currNum);
    }

    return res;
}

async function getWishList(collectionName, minMaxValues) {
    let dbConnection = await mongoClient.connect(process.env.DB_STR),
        dishes,
        res = [];

    dishes = await dbConnection.db().collection(collectionName).find({}).toArray();

    let mappedDishes = _.map(dishes, (dish) => ({
        id_num: dish.id_num,
        dishData: dish,
        mappedDish: mapToNetworkData(dish, collectionName, minMaxValues, true)
    }));

    let initialDish = mappedDishes.splice(_.random(0, mappedDishes.length - 1, false), 1)[0], // [0] weil splice immer ein array zurückgibt
        currDistanceList = getSortedEuclideanDistanceList(initialDish.mappedDish, mappedDishes, collectionName, 'asc');

    const firstGroup = getFirstArrayElements(currDistanceList, chunkSize - 1); // weil initialDish schon eine Stelle belegt

    res.push(initialDish);
    res = _.concat(res, filterByIdList(mappedDishes, firstGroup));

    let currAvgFeatures;
    let currGroup;

    while (mappedDishes.length > chunkSize - 1) {
        currAvgFeatures = avgFeatures(res);
        currDistanceList = getSortedEuclideanDistanceList(currAvgFeatures, mappedDishes, collectionName, 'desc');
        currGroup = getFirstArrayElements(currDistanceList, chunkSize);
        res = _.concat(res, filterByIdList(mappedDishes, currGroup));
        mappedDishes = removeByIdList(mappedDishes, currGroup);
    }

    if (mappedDishes.length > 0) {
        res = _.concat(res, mappedDishes);
    }

    /*console.log('curravgfeatures2', currAvgFeatures);
    console.log('leetng', mappedDishes.length);*/

    for (let i = 0; i < res.length; i++) {
        //res[i] = _.pick(res[i], 'dishData');
        res[i] = res[i].dishData;
    }

    return res;

    /**
     * TO-DO#2 neue einträge zur currAvgFeatures hinzuzählen, dazu eine neue funktion schreiben
     * while mappedDishes.length > chunkSize - 1 loop schreiben bis es leer ist
     * dazu sonderfall 0 element bleibt übrig beachten am schluss bzw. restliche elemente einfach beliebig hinzufügen am ende
     * anscheinend gibt es einen bug mit z.64 eucdistance
     */

    /**
     * TO-DO random gericht holen, danach die 3 ähnlichsten nehmen. durchschnitt der werte ziehen, danach die 4 unähnlichsten nehmen
     * durchschnitt nehmne, wieder die 4 unähnlichsten nehmen. usw bis keine gerichte mehr in der liste übrig sind.
     * Was muss dazu gemacht werden?
     * Diese Formel für jeden Feature anwenden https://math.stackexchange.com/questions/22348/how-to-add-and-subtract-values-from-an-average
     * Die Hamming-Distanz gibts nicht mehr und die einzelne Features werden als normale Werte beachtet. Dabei werden die Kategorische Werte
     * zusammengefasst und deren Features schlechter gewichtet als die anderen, die sich aber aufsummieren
     * L2 wird dafür verwendet und implementiert mit Gewichtungen s.o. 
     * Alle Werte sind schon skaliert
     */
}

module.exports = getWishList;