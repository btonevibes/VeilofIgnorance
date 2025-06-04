const baseCountryProfiles = [
    { realName: "Australia",      stats: { lifeExpectancy: 83.2, povertyRate: 12.3, homicideRate: 0.9, infantMortality: 3.3,  foreignBorn: 30.7, medianIncome: 36835 }},
    { realName: "Canada",         stats: { lifeExpectancy: 81.3, povertyRate: 11.2, homicideRate: 2.1, infantMortality: 4.4,  foreignBorn: 23.0, medianIncome: 39388 }},
    { realName: "Denmark",        stats: { lifeExpectancy: 81.3, povertyRate: 5.6,  homicideRate: 1.0, infantMortality: 3.1,  foreignBorn: 14.1, medianIncome: 34061 }},
    { realName: "France",         stats: { lifeExpectancy: 82.2, povertyRate: 8.4,  homicideRate: 1.3, infantMortality: 3.2,  foreignBorn: 13.1, medianIncome: 30622 }},
    { realName: "Germany",        stats: { lifeExpectancy: 80.7, povertyRate: 9.8,  homicideRate: 0.8, infantMortality: 3.2,  foreignBorn: 19.8, medianIncome: 35537 }},
    { realName: "Netherlands",    stats: { lifeExpectancy: 81.7, povertyRate: 7.5,  homicideRate: 0.7, infantMortality: 3.4,  foreignBorn: 15.6, medianIncome: 35891 }},
    { realName: "Sweden",         stats: { lifeExpectancy: 83.1, povertyRate: 6.8,  homicideRate: 1.2, infantMortality: 1.9,  foreignBorn: 20.5, medianIncome: 33472 }},
    { realName: "Switzerland",    stats: { lifeExpectancy: 83.8, povertyRate: 10.4, homicideRate: 0.6, infantMortality: 3.5,  foreignBorn: 30.0, medianIncome: 39698 }},
    { realName: "United Kingdom", stats: { lifeExpectancy: 80.8, povertyRate: 11.7, homicideRate: 1.1, infantMortality: 4.0,  foreignBorn: 17.0, medianIncome: 26884 }},
    { realName: "United States",  stats: { lifeExpectancy: 76.9, povertyRate: 18.0, homicideRate: 5.8, infantMortality: 5.4,  foreignBorn: 15.6, medianIncome: 48625 }}
];

function getBarRating(value, statKey, isPositiveGood) {
    const allValues = baseCountryProfiles
        .map(c => c.stats[statKey])
        .filter(v => typeof v === 'number' && !isNaN(v));

    if (allValues.length === 0) return { barCount: 3, colorClass: 'bg-yellow-400' };

    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);

    if (minVal === maxVal) return { barCount: 3, colorClass: 'bg-yellow-400' };

    let normalizedValue;
    if (isPositiveGood) {
        normalizedValue = (value - minVal) / (maxVal - minVal);
    } else {
        normalizedValue = (maxVal - value) / (maxVal - minVal);
    }

    normalizedValue = Math.max(0, Math.min(1, normalizedValue));
    let barCount = Math.round(1 + normalizedValue * 5);
    barCount = Math.max(1, Math.min(6, barCount));

    let colorClass;
    if (barCount >= 5) colorClass = 'bg-green-500';
    else if (barCount >= 3) colorClass = 'bg-yellow-400';
    else colorClass = 'bg-red-500';

    return { barCount, colorClass };
}

module.exports = { getBarRating };
