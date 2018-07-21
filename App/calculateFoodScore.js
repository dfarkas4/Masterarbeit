'use strict';

const _ = require('lodash');

const nutrientConstants = Object.freeze({
        INTERCEPT: 0.710,
        TOTAL_FAT: 0.0538, // g
        SATURATED_FAT: 0.423, // g
        CHOLESTEROL: 0.00398, // mg
        SODIUM: 0.00254, // mg
        TOTAL_CARBOHYDRATE: 0.0300, // g
        FIBER: 0.561, // g
        SUGAR: 0.0245, // g
        PROTEIN: 0.123, // g
        VITAMIN_A: 0.00562, // %DV
        VITAMIN_C: 0.0137, // %DV
        CALCIUM: 0.0685, // %DV
        IRON: 0.0186 // %DV
    });

function calculateNutrientScore(nutrientConstant, nutrientValue) {
    if(_.isUndefined(nutrientValue)) {
        return 0;
    }

    return nutrientConstant * nutrientValue;
}

function calculateFoodScore(nutrients, ignoreMissingNutrients) {
    if (!ignoreMissingNutrients && nutrients.hasMissingValues) {
        console.log('ASD')
        return null;
    }

    return nutrientConstants.INTERCEPT
        - calculateNutrientScore(nutrientConstants.TOTAL_FAT, nutrients.TOTAL_FAT)
        - calculateNutrientScore(nutrientConstants.SATURATED_FAT, nutrients.SATURATED_FAT)
        - calculateNutrientScore(nutrientConstants.CHOLESTEROL, nutrients.CHOLESTEROL)
        - calculateNutrientScore(nutrientConstants.SODIUM, nutrients.SODIUM)
        - calculateNutrientScore(nutrientConstants.TOTAL_CARBOHYDRATE, nutrients.TOTAL_CARBOHYDRATE)
        + calculateNutrientScore(nutrientConstants.FIBER, nutrients.FIBER)
        - calculateNutrientScore(nutrientConstants.SUGAR, nutrients.SUGAR)
        + calculateNutrientScore(nutrientConstants.PROTEIN, nutrients.PROTEIN)
        + calculateNutrientScore(nutrientConstants.VITAMIN_A, nutrients.VITAMIN_A)
        + calculateNutrientScore(nutrientConstants.VITAMIN_C, nutrients.VITAMIN_C)
        + calculateNutrientScore(nutrientConstants.CALCIUM, nutrients.CALCIUM)
        - calculateNutrientScore(nutrientConstants.IRON, nutrients.IRON);
}

module.exports = calculateFoodScore;