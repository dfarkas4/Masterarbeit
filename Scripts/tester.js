'use strict';

const request = require('request'),
    latinSquare = require('latinsquare'),
    hashStr = require('string-hash');

/*
request('http://api.yummly.com/v1/api/recipe/Classic-Chicken-Soup-2368529?_app_id=6902516a&_app_key=492984fa3dd37d10acb4a440fa29e53f', function (error, response, body) {
    console.log('error:', error); // Print the error if one occurred
    console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
    console.log('body:', JSON.parse(body)); // Print the HTML for the Google homepage.

});*/

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

var rString = randomString(12, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');

console.log('random string', rString);

const preNoveltyMax = -Math.log2(0.7*(1 / 4) + 0.3*(1 / 4)),
    preNoveltyMin = -Math.log2(0.7*(4 / 4) + 0.3*(4 / 4));

let preNovelty = -Math.log2(0.7*(4 / 4) + 0.3*(3 / 4));

let asdasd = (preNovelty - preNoveltyMin) / (preNoveltyMax - preNoveltyMin); // (value - min) / (max - min);

console.log('preNovelty', preNovelty);
console.log('asdasd', asdasd);

var square2 = latinSquare.generate(5);

console.log(square2);

console.log('STRHASH', hashStr('123.123.12.1'));

var asdmao = {
    asd: '123',
    qwe: '3434',
};

console.log(asdmao);

delete asdmao.email;

console.log(asdmao);