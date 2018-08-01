'use strict';

const _ = require('lodash');

function getRandomDishList(dishList, limit) {
    let newDishList = new Set(),
        randomIndex = _.random(0, dishList.length - 1, false);

    let i = 0;

    while(newDishList.size !== limit) {
        i++;
        newDishList.add(dishList[randomIndex]);
        randomIndex = _.random(0, dishList.length - 1, false);
    }

    return [...newDishList];
}

module.exports = getRandomDishList;