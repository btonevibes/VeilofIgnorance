// --- DOM ELEMENTS ---
const onboardingScreen_div = document.getElementById('onboardingScreen');
const mainAppScreen_div = document.getElementById('mainAppScreen');
// const resultsScreen_div = document.getElementById('resultsScreen_div_unused'); // No longer primary results screen
const startGameOnboardingBtn = document.getElementById('startGameOnboardingBtn');

const gameArea = document.getElementById('gameArea');
const resultsArea = document.getElementById('resultsArea'); // Reverted to original results area
const countryCardA_div = document.getElementById('countryCardA');
const countryCardB_div = document.getElementById('countryCardB');
const progressArea = document.getElementById('progressArea');

const rankedList_ol = document.getElementById('rankedList'); // Reverted to original ranked list
const analysisArea_div = document.getElementById('analysisArea'); // Reverted
const comparisonSection_div = document.getElementById('comparisonSection'); // Reverted
const playAgainBtn = document.getElementById('playAgainBtn'); // Reverted to original play again button

const instructionsP = document.getElementById('gameInstructions');
const gameTitleH1 = document.getElementById('gameTitle');


// --- DATA ---
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
const fictionalNamePool = [
    "AETHELGARD", "BORELIA", "CASPIA", "DRAKON", "ELARA", "FAELAN", "GWYN", "HYPERIA", "IRIDIA", "JORIN",
    "KRYLLOS", "LYRA", "MYRRIDON", "NEXARA", "ORIONIS", "PYRALIS", "QUORUM", "RHIVANA", "SOLARA", "TERRA NOVA"
];

// --- GAME STATE ---
let activeCountries = [];
let userCountryScores = {};
let chosenCountryStatsHistory = [];
let currentRound = 0;

// --- UTILITY FUNCTIONS ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function getTimesFaced(country1, country2) {
    if (!country1.opponentsFaced || !country2.opponentsFaced) return 0;
    return country1.opponentsFaced[country2.realName] || 0;
}

function areBothAmongLowestLosses(country1, country2, allViableCountries) {
    if (allViableCountries.length === 0) return false;
    let minLosses = Infinity;
    allViableCountries.forEach(c => { if (c.losses < minLosses) minLosses = c.losses; });
    return country1.losses === minLosses && country2.losses === minLosses;
}

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

function generateVerticalBarsHTML(barCount, colorClass) {
    let barsHTML = '<div class="stat-bar-container w-[63px] justify-start">';
    for (let i = 0; i < barCount; i++) {
        barsHTML += `<div class="stat-bar ${colorClass}" style="height: 18px;"></div>`;
    }
    return barsHTML + '</div>';
}

function generateHorizontalBarHTML(percentage) {
    const validPercentage = Math.max(0, Math.min(100, percentage));
    return `
        <div class="stat-bar-container w-[63px] justify-start items-center">
            <div class="horizontal-bar-bg">
                <div class="horizontal-bar-fill" style="width: ${validPercentage}%;"></div>
            </div>
        </div>
    `;
}

const statLabels = {
    lifeExpectancy: "Life Expectancy (yrs)",
    medianIncome: "Median Income ($)",
    povertyRate: "Poverty Rate (%)",
    homicideRate: "Homicide Rate (per /100k)",
    infantMortality: "Infant Mortality (per /1k)",
    foreignBorn: "Foreign-Born (%)"
};

function createCountryCardHTML_Tournament(country, _currentViablePool_ignored) {
    const leRating = getBarRating(country.stats.lifeExpectancy, 'lifeExpectancy', true);
    const incomeRating = getBarRating(country.stats.medianIncome, 'medianIncome', true);
    const povertyRating = getBarRating(country.stats.povertyRate, 'povertyRate', false);
    const homicideRating = getBarRating(country.stats.homicideRate, 'homicideRate', false);
    const imRating = getBarRating(country.stats.infantMortality, 'infantMortality', false);

    const lossesText = country.losses > 0
        ? `<p class="text-xs text-gray-500 text-center mb-0.5">Losses: ${country.losses}</p>`
        : '<p class="text-xs text-gray-500 text-center mb-0.5 h-[18px]"></p>';

    return `
        <div>
            ${lossesText}
            <h2 class="text-2xl font-bold uppercase text-blue-800 mb-2 text-center">${country.fictionalName}</h2>
            <div class="space-y-3 text-sm text-gray-700">
                <div class="flex justify-between items-center"><span>Life Expectancy: ${country.stats.lifeExpectancy.toFixed(1)} yrs</span>${generateVerticalBarsHTML(leRating.barCount, leRating.colorClass)}</div>
                <div class="flex justify-between items-center"><span>Median Income: $${country.stats.medianIncome.toLocaleString()}</span>${generateVerticalBarsHTML(incomeRating.barCount, incomeRating.colorClass)}</div>
                <div class="flex justify-between items-center"><span>Poverty Rate: ${country.stats.povertyRate.toFixed(1)}%</span>${generateVerticalBarsHTML(povertyRating.barCount, povertyRating.colorClass)}</div>
                <div class="flex justify-between items-center"><span>Homicide Rate: ${country.stats.homicideRate.toFixed(1)} /100k</span>${generateVerticalBarsHTML(homicideRating.barCount, homicideRating.colorClass)}</div>
                <div class="flex justify-between items-center"><span>Infant Mortality: ${country.stats.infantMortality.toFixed(1)} /1k</span>${generateVerticalBarsHTML(imRating.barCount, imRating.colorClass)}</div>
                <div class="flex justify-between items-center"><span>Foreign-Born: ${country.stats.foreignBorn.toFixed(1)}%</span>${generateHorizontalBarHTML(country.stats.foreignBorn)}</div>
            </div>
        </div>
        <button class="action-button w-full mt-6 select-country-btn" data-country-realname="${country.realName}">
            Choose ${country.fictionalName}
        </button>
    `;
}


// --- GAME LOGIC ---
function startGame() {
    shuffleArray(fictionalNamePool);
    userCountryScores = {};
    chosenCountryStatsHistory = [];

    activeCountries = baseCountryProfiles.map((profile, index) => {
        userCountryScores[profile.realName] = 0;
        return {
            ...profile,
            stats: { ...profile.stats },
            fictionalName: fictionalNamePool[index % fictionalNamePool.length],
            losses: 0,
            opponentsFaced: {}
        };
    });

    currentRound = 0;
    mainAppScreen_div.classList.remove('hidden');
    onboardingScreen_div.classList.add('hidden');
    // resultsScreen_div.classList.add('hidden'); // Ensure new results screen is hidden
    resultsArea.classList.add('hidden'); // Ensure old results area is hidden
    document.body.classList.remove('bg-slate-50');
    document.body.classList.add('bg-gray-100');


    gameArea.classList.remove('hidden');
    progressArea.textContent = '';

    if (gameTitleH1) gameTitleH1.classList.remove('hidden');
    if (instructionsP) instructionsP.classList.remove('hidden');

    nextComparison();
}

function nextComparison() {
    currentRound++;
    const viableCountries = activeCountries.filter(c => c.losses < 2);

    if (viableCountries.length < 2) {
        if (gameTitleH1) gameTitleH1.classList.add('hidden');
        if (instructionsP) instructionsP.classList.add('hidden');
        showResults(viableCountries, viableCountries.length === 1 && viableCountries[0].losses < 2 ? `${viableCountries[0].fictionalName} is the Winner!` : "Tournament Ended");
        return;
    }
    progressArea.textContent = `Round ${currentRound}`;

    let possiblePairs = [];
    for (let i = 0; i < viableCountries.length; i++) {
        for (let j = i + 1; j < viableCountries.length; j++) {
            const c1 = viableCountries[i]; const c2 = viableCountries[j];
            const timesFaced = getTimesFaced(c1, c2);
            let canPlay = (timesFaced < 2) || (timesFaced === 2 && areBothAmongLowestLosses(c1, c2, viableCountries));
            if (canPlay) possiblePairs.push({ countryA: c1, countryB: c2 });
        }
    }

    if (possiblePairs.length === 0) {
        if (gameTitleH1) gameTitleH1.classList.add('hidden');
        if (instructionsP) instructionsP.classList.add('hidden');
        showResults(viableCountries, "No more valid matchups. Tournament ended.");
        return;
    }

    const selectedPair = possiblePairs[Math.floor(Math.random() * possiblePairs.length)];

    countryCardA_div.innerHTML = createCountryCardHTML_Tournament(selectedPair.countryA);
    countryCardB_div.innerHTML = createCountryCardHTML_Tournament(selectedPair.countryB);

    document.querySelectorAll('.select-country-btn').forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.addEventListener('click', (event) => handleChoiceTournament(event, selectedPair.countryA, selectedPair.countryB));
    });
}

function handleChoiceTournament(event, countryA, countryB) {
    if (gameTitleH1) gameTitleH1.classList.add('hidden');
    if (instructionsP) instructionsP.classList.add('hidden');

    const chosenRealName = event.target.dataset.countryRealname;
    let winner, loser;

    if (countryA.realName === chosenRealName) {
        winner = countryA; loser = countryB;
    } else {
        winner = countryB; loser = countryA;
    }

    userCountryScores[winner.realName]++;
    chosenCountryStatsHistory.push({...winner.stats});

    const loserInActive = activeCountries.find(c => c.realName === loser.realName);
    const winnerInActive = activeCountries.find(c => c.realName === winner.realName);

    if (loserInActive) loserInActive.losses++;

    if (winnerInActive && loserInActive) {
        winnerInActive.opponentsFaced[loserInActive.realName] = (winnerInActive.opponentsFaced[loserInActive.realName] || 0) + 1;
        loserInActive.opponentsFaced[winnerInActive.realName] = (loserInActive.opponentsFaced[winnerInActive.realName] || 0) + 1;
    }
    nextComparison();
}

// --- RESULTS PAGE FUNCTIONS (Reverted to original logic) ---
function generateChoiceAnalysis() {
    if (chosenCountryStatsHistory.length === 0) {
        return "<h3>Analysis of Your Choices</h3><p>No choices were made to analyze.</p>";
    }
    const numChoices = chosenCountryStatsHistory.length;
    const avgChosenStats = {
        lifeExpectancy: chosenCountryStatsHistory.reduce((sum, s) => sum + s.lifeExpectancy, 0) / numChoices,
        medianIncome: chosenCountryStatsHistory.reduce((sum, s) => sum + s.medianIncome, 0) / numChoices,
        povertyRate: chosenCountryStatsHistory.reduce((sum, s) => sum + s.povertyRate, 0) / numChoices,
        homicideRate: chosenCountryStatsHistory.reduce((sum, s) => sum + s.homicideRate, 0) / numChoices,
        infantMortality: chosenCountryStatsHistory.reduce((sum, s) => sum + s.infantMortality, 0) / numChoices,
    };
    const numTotalCountries = baseCountryProfiles.length;
    const overallAvgStats = {
        lifeExpectancy: baseCountryProfiles.reduce((sum, c) => sum + c.stats.lifeExpectancy, 0) / numTotalCountries,
        medianIncome: baseCountryProfiles.reduce((sum, c) => sum + c.stats.medianIncome, 0) / numTotalCountries,
        povertyRate: baseCountryProfiles.reduce((sum, c) => sum + c.stats.povertyRate, 0) / numTotalCountries,
        homicideRate: baseCountryProfiles.reduce((sum, c) => sum + c.stats.homicideRate, 0) / numTotalCountries,
        infantMortality: baseCountryProfiles.reduce((sum, c) => sum + c.stats.infantMortality, 0) / numTotalCountries,
    };
    let analysisHTML = "<h3>Analysis of Your Choices</h3>";
    let findings = [];
    const SIGNIFICANCE_THRESHOLD = 0.05;

    if (((avgChosenStats.lifeExpectancy / overallAvgStats.lifeExpectancy) - 1) > SIGNIFICANCE_THRESHOLD) findings.push(`You tended towards a <strong class="positive-tendency">higher Life Expectancy</strong> (avg. chosen: ${avgChosenStats.lifeExpectancy.toFixed(1)} yrs vs. overall avg: ${overallAvgStats.lifeExpectancy.toFixed(1)} yrs).`);
    if (((avgChosenStats.medianIncome / overallAvgStats.medianIncome) - 1) > SIGNIFICANCE_THRESHOLD) findings.push(`You tended towards a <strong class="positive-tendency">higher Median Income</strong> (avg. chosen: $${avgChosenStats.medianIncome.toLocaleString()} vs. overall avg: $${overallAvgStats.medianIncome.toLocaleString()}).`);
    if ((1 - (avgChosenStats.povertyRate / overallAvgStats.povertyRate)) > SIGNIFICANCE_THRESHOLD) findings.push(`You tended towards a <strong class="positive-tendency">lower Poverty Rate</strong> (avg. chosen: ${avgChosenStats.povertyRate.toFixed(1)}% vs. overall avg: ${overallAvgStats.povertyRate.toFixed(1)}%).`);
    else if (((avgChosenStats.povertyRate / overallAvgStats.povertyRate) - 1) > SIGNIFICANCE_THRESHOLD) findings.push(`Your choices often included countries with a <strong class="negative-tendency">higher Poverty Rate</strong> (avg. chosen: ${avgChosenStats.povertyRate.toFixed(1)}% vs. overall avg: ${overallAvgStats.povertyRate.toFixed(1)}%).`);
    if ((1 - (avgChosenStats.homicideRate / overallAvgStats.homicideRate)) > SIGNIFICANCE_THRESHOLD) findings.push(`You tended towards a <strong class="positive-tendency">lower Homicide Rate</strong> (avg. chosen: ${avgChosenStats.homicideRate.toFixed(1)}/100k vs. overall avg: ${overallAvgStats.homicideRate.toFixed(1)}/100k).`);
    else if (((avgChosenStats.homicideRate / overallAvgStats.homicideRate) - 1) > SIGNIFICANCE_THRESHOLD) findings.push(`Your choices often included countries with a <strong class="negative-tendency">higher Homicide Rate</strong> (avg. chosen: ${avgChosenStats.homicideRate.toFixed(1)}/100k vs. overall avg: ${overallAvgStats.homicideRate.toFixed(1)}/100k).`);
    if ((1 - (avgChosenStats.infantMortality / overallAvgStats.infantMortality)) > SIGNIFICANCE_THRESHOLD) findings.push(`You tended towards a <strong class="positive-tendency">lower Infant Mortality Rate</strong> (avg. chosen: ${avgChosenStats.infantMortality.toFixed(1)}/1k vs. overall avg: ${overallAvgStats.infantMortality.toFixed(1)}/1k).`);
    else if (((avgChosenStats.infantMortality / overallAvgStats.infantMortality) - 1) > SIGNIFICANCE_THRESHOLD) findings.push(`Your choices often included countries with a <strong class="negative-tendency">higher Infant Mortality Rate</strong> (avg. chosen: ${avgChosenStats.infantMortality.toFixed(1)}/1k vs. overall avg: ${overallAvgStats.infantMortality.toFixed(1)}/1k).`);

    if (findings.length > 0) {
        analysisHTML += "<ul>";
        findings.forEach(finding => { analysisHTML += `<li>${finding}</li>`; });
        analysisHTML += "</ul>";
    } else {
        analysisHTML += "<p>Your choices didn't show a strong deviation from the average across the key statistics.</p>";
    }
    analysisHTML += `<p class="text-xs text-gray-500 mt-3">(Note: This is a simplified analysis based on averages of your choices compared to the overall dataset.)</p>`;
    return analysisHTML;
}

function generateComparisonHTML(topChoiceRealName) {
    const topCountry = baseCountryProfiles.find(c => c.realName === topChoiceRealName);
    const usCountry = baseCountryProfiles.find(c => c.realName === "United States");
    if (!topCountry) return "<h3>Comparison Data Unavailable</h3><p>Could not retrieve data for your top choice.</p>";
    if (!usCountry && topChoiceRealName === "United States") return "<h3>Comparison Data</h3><p>Your top choice is the United States. No further comparison target set.</p>"
    if (!usCountry) return `<h3>Comparison: ${topCountry.realName}</h3><p>Data for United States not available for comparison.</p>`;

    const formatStat = (value, unit = '', decimals = 1, prefix = '') => {
         if (typeof value !== 'number' || isNaN(value)) return 'N/A';
         const formattedValue = unit === '$' ? value.toLocaleString() : value.toFixed(decimals);
         return `${prefix}${formattedValue}${unit && unit !== '$' ? unit : ''}`;
    };
    let comparisonHTML = `<h3>Comparison: Your Top Preference vs. United States</h3>`;
     if (topChoiceRealName === "United States") {
        comparisonHTML = `<h3>Your Top Preference: United States</h3>`;
    }
    comparisonHTML += `<table id="comparisonTable">
                        <thead><tr><th>Statistic</th><th>${topCountry.realName}</th>${topChoiceRealName !== "United States" ? `<th>United States</th>` : ''}</tr></thead>
                        <tbody>
                            <tr><td>Life Expectancy</td><td>${formatStat(topCountry.stats.lifeExpectancy, ' yrs')}</td>${topChoiceRealName !== "United States" ? `<td>${formatStat(usCountry.stats.lifeExpectancy, ' yrs')}</td>` : ''}</tr>
                            <tr><td>Median Income</td><td>${formatStat(topCountry.stats.medianIncome, '$', 0, '$')}</td>${topChoiceRealName !== "United States" ? `<td>${formatStat(usCountry.stats.medianIncome, '$', 0, '$')}</td>` : ''}</tr>
                            <tr><td>Poverty Rate</td><td>${formatStat(topCountry.stats.povertyRate, '%')}</td>${topChoiceRealName !== "United States" ? `<td>${formatStat(usCountry.stats.povertyRate, '%')}</td>` : ''}</tr>
                            <tr><td>Homicide Rate</td><td>${formatStat(topCountry.stats.homicideRate, '/100k')}</td>${topChoiceRealName !== "United States" ? `<td>${formatStat(usCountry.stats.homicideRate, '/100k')}</td>` : ''}</tr>
                            <tr><td>Infant Mortality</td><td>${formatStat(topCountry.stats.infantMortality, '/1k')}</td>${topChoiceRealName !== "United States" ? `<td>${formatStat(usCountry.stats.infantMortality, '/1k')}</td>` : ''}</tr>
                            <tr><td>Foreign-Born</td><td>${formatStat(topCountry.stats.foreignBorn, '%')}</td>${topChoiceRealName !== "United States" ? `<td>${formatStat(usCountry.stats.foreignBorn, '%')}</td>` : ''}</tr>
                        </tbody></table>`;
    return comparisonHTML;
}


function showResults(finalists, endReasonMessage = "Tournament Concluded") {
    gameArea.classList.add('hidden'); // Hide game cards
    resultsArea.classList.remove('hidden'); // Show the original results area
    // Ensure other screens are hidden
    onboardingScreen_div.classList.add('hidden');
    // resultsScreen_div.classList.add('hidden'); // The new results screen is not used

    document.body.classList.remove('bg-slate-50'); // Ensure correct body bg
    document.body.classList.add('bg-gray-100');

    progressArea.textContent = endReasonMessage;
    analysisArea_div.innerHTML = generateChoiceAnalysis();

    const sortedCountriesForDisplay = activeCountries
        .map(country => ({
            ...country,
            score: userCountryScores[country.realName] || 0,
            isEliminated: country.losses >= 2
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.losses - b.losses;
        });

    rankedList_ol.innerHTML = '';
    let topChoiceForComparison = null;

    if (sortedCountriesForDisplay.length > 0) {
        const potentialTopChoices = sortedCountriesForDisplay.filter(c => !c.isEliminated);
        if (potentialTopChoices.length > 0) {
            topChoiceForComparison = potentialTopChoices[0].realName;
        } else {
            topChoiceForComparison = sortedCountriesForDisplay[0].realName;
        }

        sortedCountriesForDisplay.forEach((country, index) => {
            const listItem = document.createElement('li');
            listItem.className = "flex items-center";
            let rankBadgeContent = index + 1;

            if (finalists && finalists.length === 1 && finalists[0].realName === country.realName && finalists[0].losses < 2) {
                rankBadgeContent = '🏆';
            }
            let eliminatedText = country.isEliminated ? ' <span class="eliminated-text">(Eliminated)</span>' : '';

            listItem.innerHTML = `
                <span class="rank-badge">${rankBadgeContent}</span>
                <span><strong class="font-semibold">${country.realName}</strong> (${country.fictionalName}) - Chosen: ${country.score} time(s), Losses: ${country.losses}${eliminatedText}</span>
            `;
            rankedList_ol.appendChild(listItem);
        });
    } else {
         rankedList_ol.innerHTML = "<li>No choices were made or no countries remained.</li>";
    }

    if (topChoiceForComparison) {
         comparisonSection_div.innerHTML = generateComparisonHTML(topChoiceForComparison);
    } else {
         comparisonSection_div.innerHTML = "<p class='text-center text-gray-600'>No top choice to compare.</p>";
    }
}

// --- ONBOARDING & APP INITIALIZATION ---
function initializeApp() {
    mainAppScreen_div.classList.add('hidden');
    resultsArea.classList.add('hidden'); // Hide old results area initially
    // resultsScreen_div.classList.add('hidden'); // Hide new results screen initially
    onboardingScreen_div.classList.remove('hidden');
    document.body.className = 'bg-slate-50';


    if (startGameOnboardingBtn) {
        startGameOnboardingBtn.addEventListener('click', () => {
            startGame();
        });
    } else {
        startGame();
    }
}

// --- EVENT LISTENERS ---
// The original playAgainBtn is part of the resultsArea, which is dynamically shown/hidden
// Its event listener is added once when the DOM elements are defined.
if(playAgainBtn){
    playAgainBtn.addEventListener('click', () => {
        // No need to manage onboarding/results screen here, startGame handles it
        startGame();
    });
}

// --- INITIALIZE APP FLOW ---
initializeApp();