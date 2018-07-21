'use strict';

const request = require('request');

request('http://api.yummly.com/v1/api/recipe/Classic-Chicken-Soup-2368529?_app_id=6902516a&_app_key=492984fa3dd37d10acb4a440fa29e53f', function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', JSON.parse(body)); // Print the HTML for the Google homepage.

});