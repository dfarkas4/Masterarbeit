'use strict';

// price, distance, kitchenstyle[7], dishtype[7], n_ingredients[12], main_preparation[6], misc_attributes[4]
// kitchenstyle:        Asiatisch, International, Französisch, Fast Food, Indisch, Amerikanisch, Italienisch
// dishtype:            Hauptspeise, Vorspeise, Salat, Suppe, Sandwich, Pizza, Beilage
// n_ingredients:       Red Meat(0),Poultry(1),Fish(2),Seafood(3),Pasta(4),Bread(5),Rice(6),Legumes(7),Vegetables(8),Dairy(9),Fruits(10),Mushrooms(11)
// main_preparation:    cooked(0),baked(1),fried(2),deep fried(3),grilled(4),smoked(5)
// misc_attributes:     sweet(0),spicy(1),cold(2),bones(3)

const _ = require('lodash'),
    kitchenStyleEnum = Object.freeze({
        'Amerikanisch': 0,
        'Asiatisch': 1,
        'Fast Food': 2,
        'Französisch': 3,
        'Indisch': 4,
        'International': 5,
        'Italienisch': 6
    }),
    dishTypeEnum = Object.freeze({
        'Beilage': 0,
        'Hauptspeise': 1,
        'Salat': 2,
        'Sandwich': 3,
        'Suppe': 4,
        'Pizza': 5,
        'Vorspeise': 6
    });

require('dotenv').config();

function scaleValue(value, min, max) {
    return (value - min) / (max - min);
}

function mapData(rawData, collectionName, minMaxValues, isInputOnly) {
    let res = [], // price, distance, kitchen, dishType
        kitchenArr,
        dishTypeArr;

    if (collectionName === 'test_collection2') {
        kitchenArr = _.range(7).map(() => 0);
        dishTypeArr = _.range(7).map(() => 0);
    } else {
        // TO-DO implement other two food db variants
        //kitchenArr = _.range(7).map(() => 0);
        //dishTypeArr = _.range(8).map(() => 0);
    }

    /*console.log(minMaxValues.minDistance, '###minDist###');
    console.log(minMaxValues.maxDistance, '###maxDist###');*/

    res.push(scaleValue(rawData.price, minMaxValues.minPrice, minMaxValues.maxPrice));
    res.push(scaleValue(rawData.distance, minMaxValues.minDistance, minMaxValues.maxDistance));
    kitchenArr[kitchenStyleEnum[rawData.kitchen_style]] = 1;
    //console.log(kitchenArr);
    res = _.concat(res, kitchenArr);
    dishTypeArr[dishTypeEnum[rawData.type]] = 1;
    res = _.concat(res, dishTypeArr);

    const n_ingredients = rawData.n_ingredients.split('').map(Number),
        main_preparation = rawData.main_preparation.split('').map(Number),
        misc_attributes = rawData.misc_attributes.split('').map(Number);

    res = _.concat(res, n_ingredients);
    //res = _.concat(res, main_preparation);
    //res = _.concat(res, misc_attributes);

        if (!isInputOnly) {
        res = {
            input: res,
            output: rawData.netOutput
        }
    }

    //console.log('RESRESRES', res);

    /*console.log('###################')
    console.log('price', rawData.price);
    console.log('distance', rawData.distance);
    console.log('RESULT: ', res);
    console.log('###################')*/

    return res;
}

module.exports = mapData;