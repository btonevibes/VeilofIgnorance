const assert = require('assert');
const { getBarRating } = require('../rating');

// Positive metric - higher is better
let result = getBarRating(83.8, 'lifeExpectancy', true);
assert.deepStrictEqual(result, { barCount: 6, colorClass: 'bg-green-500' });

result = getBarRating(76.9, 'lifeExpectancy', true);
assert.deepStrictEqual(result, { barCount: 1, colorClass: 'bg-red-500' });

result = getBarRating(80.7, 'lifeExpectancy', true);
assert.deepStrictEqual(result, { barCount: 4, colorClass: 'bg-yellow-400' });

// Negative metric - lower is better
result = getBarRating(5.6, 'povertyRate', false);
assert.deepStrictEqual(result, { barCount: 6, colorClass: 'bg-green-500' });

result = getBarRating(18.0, 'povertyRate', false);
assert.deepStrictEqual(result, { barCount: 1, colorClass: 'bg-red-500' });

result = getBarRating(10.4, 'povertyRate', false);
assert.deepStrictEqual(result, { barCount: 4, colorClass: 'bg-yellow-400' });

console.log('All tests passed!');
