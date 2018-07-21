'use strict';

const unirest = require('unirest'),
    _ = require('lodash'),
    Promise = require('bluebird'),
    calculateFoodScore = require('../App/calculateFoodScore.js');

require('dotenv').config();

const nutrientConstants = Object.freeze({
        TOTAL_FAT: 'Fat', // g
        SATURATED_FAT: 'Saturated Fat', // g
        CHOLESTEROL: 'Cholesterol', // mg
        SODIUM: 'Sodium', // mg
        TOTAL_CARBOHYDRATE: 'Carbohydrates', // g
        FIBER: 'Fiber', // g
        SUGAR: 'Sugar', // g
        PROTEIN: 'Protein', // g
        VITAMIN_A: 'Vitamin A', // %DV
        VITAMIN_C: 'Vitamin C', // %DV
        CALCIUM: 'Calcium', // %DV
        IRON: 'Iron' // %DV
    }),
    foodDB = Object.freeze({
        BERLIN: 0,
        MUNICH: 1,
        TORONTO: 2
    });

function spoonacularToMongo(db, objectId, recipeId, writeToDb) {
    unirest.get(`https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/${recipeId}/information?includeNutrition=true`)
        .header("X-Mashape-Key", process.env.SPOONACULAR_API_KEY)
        .header("Accept", "application/json")
        .end(function (result) {
            console.log(_.map(result.body.nutrition.ingredients, 'name'));
            console.log(result.body.nutrition.nutrients);

            let unfilteredIngredients = _.map(result.body.nutrition.ingredients, 'name'),
                kcal = getCalories(result.body.nutrition.nutrients),
                filteredNutrients = getFilteredNutrients(result.body.nutrition.nutrients),
                foodScore = calculateFoodScore(filteredNutrients);

            if(!writeToDb) {
                console.log('kcal:\n', kcal);
                console.log('unfilteredIngredients:\n', unfilteredIngredients);
                console.log('filteredNutrients:\n', filteredNutrients);
                console.log('foodScore:\n', foodScore);
                console.log('======================================================');
            } else {

            }
        });
}

function getCalories(unfilteredNutrients) {
    return _.find(unfilteredNutrients, { 'title': 'Calories' }).amount;
}

function getFilteredNutrients(unfilteredNutrients) {
    let nutrients = {};

    nutrients['TOTAL_FAT'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.TOTAL_FAT }), 'amount');
    nutrients['SATURATED_FAT'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.SATURATED_FAT }), 'amount');
    nutrients['CHOLESTEROL'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.CHOLESTEROL }), 'amount');
    nutrients['SODIUM'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.SODIUM }), 'amount');
    nutrients['TOTAL_CARBOHYDRATE'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.TOTAL_CARBOHYDRATE }), 'amount');
    nutrients['FIBER'] =_.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.FIBER }), 'amount');
    nutrients['SUGAR'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.SUGAR }), 'amount');
    nutrients['PROTEIN'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.PROTEIN }), 'amount');
    nutrients['VITAMIN_A'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.VITAMIN_A }), 'percentOfDailyNeeds');
    nutrients['VITAMIN_C'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.VITAMIN_C }), 'percentOfDailyNeeds');
    nutrients['CALCIUM'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.CALCIUM }), 'percentOfDailyNeeds');
    nutrients['IRON'] = _.get(_.find(unfilteredNutrients, { 'title': nutrientConstants.IRON }), 'percentOfDailyNeeds');

    nutrients.hasMissingValues = _.some(nutrients, _.isEmpty);

    return nutrients;
}

spoonacularToMongo(foodDB.BERLIN, null, '608429', false);