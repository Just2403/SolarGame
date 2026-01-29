// Spielzustand
const gameState = {
    money: 1000,
    energy: 0,
    energyCapacity: 0,
    energyProduction: 0,
    energyConsumption: 0,
    income: 0,
    passiveIncome: 0,
    day: 1,
    items: [],
    currentHour: 0,
    currentMinute: 0,
    dayPhase: 'night',
    dayStartTime: Date.now(),
    dayDuration: 2 * 60 * 1000,
    timers: [],
    selectedItem: null,
    passiveIncomeTimer: null,
    buildMode: null,
    tempItem: null,
    isDragging: false,
    draggedItem: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastEnergyUpdate: Date.now(),
    wheatStock: 0,
    autoPurchaseActive: false,
    totalProfit: 0,
    totalEnergy: 0,
    energyPrice: 1.00,
    wheatPrice: 0.50,
    weather: 'sunny',
    firstLoad: true,
    achievements: [],
    season: 'spring',
    loan: { amount: 0, interestRate: 0.05, repaymentDay: null },
    maintenanceDue: false
};

// Erfolge
const achievements = [
    { id: 'first_solar', name: 'Erste Sonne', description: 'Baue deine erste PV-Anlage', condition: () => gameState.items.some(item => item.type === 'solar-panel'), reward: 100 },
    { id: 'energy_tycoon', name: 'Energiemogul', description: 'Erreiche 1000 kWh Gesamtenergie', condition: () => gameState.totalEnergy >= 1000, reward: 500 },
    { id: 'wheat_king', name: 'Weizenkönig', description: 'Sammle 500 Weizen', condition: () => gameState.wheatStock >= 500, reward: 300 },
    { id: 'upgrade_master', name: 'Upgrade-Meister', description: 'Upgrade ein Gebäude auf Stufe 3', condition: () => gameState.items.some(item => item.level === 3), reward: 400 },
    { id: 'workshop_builder', name: 'Werkstatt-Meister', description: 'Baue eine Werkstatt', condition: () => gameState.items.some(item => item.type === 'workshop'), reward: 200 },
    { id: 'watertower_builder', name: 'Wasserturm-Pionier', description: 'Baue einen Wasserturm', condition: () => gameState.items.some(item => item.type === 'watertower'), reward: 200 }
];

// Gebäudepreise und Eigenschaften
const itemsData = {
    'solar-panel': {
        name: 'PV-Anlage',
        cost: 500,
        basePower: 5,
        income: 0,
        passiveIncome: 0,
        width: 60,
        height: 60,
        levels: [
            { cost: 200, powerBonus: 25 },
            { cost: 500, powerBonus: 50 },
            { cost: 1000, powerBonus: 100 }
        ],
        maintenanceCost: 50,
        maintenanceInterval: 7
    },
    'wind-turbine': {
        name: 'Windkraftanlage',
        cost: 600,
        basePower: 3,
        income: 0,
        passiveIncome: 0,
        width: 60,
        height: 80,
        levels: [
            { cost: 250, powerBonus: 15 },
            { cost: 600, powerBonus: 30 },
            { cost: 1200, powerBonus: 60 }
        ],
        maintenanceCost: 60,
        maintenanceInterval: 7
    },
    'barn': {
        name: 'Stall',
        cost: 300,
        power: -0.5,
        income: 20,
        passiveIncome: 0,
        width: 80,
        height: 60,
        maintenanceCost: 30,
        maintenanceInterval: 5
    },
    'field': {
        name: 'Feld',
        cost: 200,
        power: -0.3,
        income: 0,
        passiveIncome: 20,
        width: 100,
        height: 80,
        growthTime: 119000,
        wheatYield: () => Math.floor(Math.random() * 21) + 90,
        maintenanceCost: 20,
        maintenanceInterval: 5
    },
    'battery': {
        name: 'Batteriespeicher',
        cost: 10,
        capacity: 10,
        efficiency: 0.95,
        width: 70,
        height: 50,
        levels: [
            { cost: 500, capacityBonus: 500, efficiencyBonus: 0.03 },
            { cost: 1000, capacityBonus: 1000, efficiencyBonus: 0.05 },
            { cost: 2000, capacityBonus: 2000, efficiencyBonus: 0.07 }
        ],
        maintenanceCost: 40,
        maintenanceInterval: 10
    },
    'silo': {
        name: 'Silo',
        cost: 400,
        power: -0.1,
        income: 0,
        passiveIncome: 0,
        width: 70,
        height: 70,
        capacity: 200,
        levels: [
            { cost: 600, capacityBonus: 200 },
            { cost: 1200, capacityBonus: 400 },
            { cost: 2000, capacityBonus: 600 }
        ],
        maintenanceCost: 35,
        maintenanceInterval: 10
    },
    'water-pump': {
        name: 'Wasserpumpe',
        cost: 250,
        power: -0.4,
        income: 0,
        passiveIncome: 0,
        width: 50,
        height: 50,
        growthBonus: 0.2,
        maintenanceCost: 25,
        maintenanceInterval: 5
    },
    'workshop': {
        name: 'Werkstatt',
        cost: 800,
        power: -0.2,
        income: 0,
        passiveIncome: () => 5 * gameState.items.length, // 5€ pro Gebäude
        width: 80,
        height: 80,
        maintenanceCost: 50,
        maintenanceInterval: 7
    },
    'watertower': {
        name: 'Wasserturm',
        cost: 500,
        power: -0.3,
        income: 0,
        passiveIncome: 0,
        width: 60,
        height: 100,
        siloCapacityBonus: 100,
        maintenanceCost: 30,
        maintenanceInterval: 7
    }
};

// Jahreszeiten
const seasons = {
    'spring': { solarMultiplier: 1, windMultiplier: 0.9, growthBonus: 1.2, description: 'Frühling' },
    'summer': { solarMultiplier: 1.2, windMultiplier: 0.8, growthBonus: 1.1, description: 'Sommer' },
    'fall': { solarMultiplier: 0.9, windMultiplier: 1.1, growthBonus: 0.9, description: 'Herbst' },
    'winter': { solarMultiplier: 0.7, windMultiplier: 1.2, growthBonus: 0.8, description: 'Winter' }
};

// Tageszeiten
const dayPhases = {
    'night': { start: 0, end: 6, brightness: 0.4, color: '#2a4e1a', productionMultiplier: 0 },
    'dawn': { start: 6, end: 8, brightness: 0.7, color: '#5a9216', productionMultiplier: 0.5 },
    'day': { start: 8, end: 20, brightness: 1, color: '#8bc34a', productionMultiplier: 1 },
    'dusk': { start: 20, end: 22, brightness: 0.7, color: '#5a9216', productionMultiplier: 0.5 }
};

// Wetterbedingungen
const weatherConditions = {
    'sunny': { solarMultiplier: 1, windMultiplier: 0.8, description: 'Sonnig' },
    'cloudy': { solarMultiplier: 0.7, windMultiplier: 1, description: 'Bewölkt' },
    'windy': { solarMultiplier: 0.9, windMultiplier: 2, description: 'Windig' }
};

// Initialisierung
function initGame() {
    console.log('Spiel wird initialisiert...');
    clearAllTimers();
    try {
        loadGame();
    } catch (e) {
        console.error('Fehler beim Laden des Spielstands:', e);
        resetGame();
    }
    setupEventListeners();
    startDayCycle();
    startPassiveIncome();
    startEnergySystem();
    startAchievementCheck();
    startMaintenanceCheck();
    updateDayPhase();
    updateUI();
    showTutorial();
}

// Event-Listener einrichten
function setupEventListeners() {
    const farmArea = document.getElementById('farm-area');
    if (!farmArea) {
        console.error('Farm-Bereich nicht gefunden!');
        showError('Spiel konnte nicht geladen werden: Farm-Bereich fehlt!');
        return;
    }
    farmArea.addEventListener('mousemove', moveTempItem);
    farmArea.addEventListener('touchmove', moveTempItemTouch);
    farmArea.addEventListener('click', (e) => {
        if (gameState.buildMode) {
            placeItem(e);
        } else if (e.target.classList.contains('field')) {
            handleFieldHarvest(e);
        } else if (e.target.id === 'farm-area') {
            if (gameState.selectedItem) {
                gameState.selectedItem.element.classList.remove('selected');
                gameState.selectedItem = null;
                const upgradeMenu = document.getElementById('upgrade-menu');
                if (upgradeMenu) upgradeMenu.style.display = 'none';
            }
        }
    });
    farmArea.addEventListener('mousedown', startDragItem);
    farmArea.addEventListener('touchstart', startDragItemTouch);
    document.addEventListener('mousemove', dragItem);
    document.addEventListener('touchmove', dragItemTouch);
    document.addEventListener('mouseup', stopDragItem);
    document.addEventListener('touchend', stopDragItem);
    document.addEventListener('keydown', handleKeyDown);
    ['solar-panel', 'wind-turbine', 'barn', 'field', 'battery', 'silo', 'water-pump', 'workshop', 'watertower'].forEach(itemType => {
        const btn = document.getElementById(`build-${itemType}`);
        if (btn) {
            btn.addEventListener('click', () => {
                console.log(`Bau-Modus gestartet für: ${itemType}`);
                startBuildMode(itemType);
            });
        } else {
            console.warn(`Button build-${itemType} nicht gefunden!`);
        }
    });
    const sellEnergyBtn = document.getElementById('sell-energy-btn');
    if (sellEnergyBtn) sellEnergyBtn.addEventListener('click', sellEnergy);
    const sellWheatBtn = document.getElementById('sell-wheat-btn');
    if (sellWheatBtn) sellWheatBtn.addEventListener('click', sellWheat);
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    const closeTutorialBtn = document.getElementById('close-tutorial');
    if (closeTutorialBtn) closeTutorialBtn.addEventListener('click', () => {
        document.getElementById('tutorial-modal').style.display = 'none';
        gameState.firstLoad = false;
        saveGame();
    });
    [1, 2, 3].forEach(i => {
        const upgradeBtn = document.getElementById(`upgrade-btn-${i}`);
        if (upgradeBtn) upgradeBtn.addEventListener('click', () => upgradeSelectedItem(i));
    });
    const takeLoanBtn = document.getElementById('take-loan-btn');
    if (takeLoanBtn) takeLoanBtn.addEventListener('click', takeLoan);
    const repayLoanBtn = document.getElementById('repay-loan-btn');
    if (repayLoanBtn) repayLoanBtn.addEventListener('click', repayLoan);
    const viewAchievementsBtn = document.getElementById('view-achievements-btn');
    if (viewAchievementsBtn) viewAchievementsBtn.addEventListener('click', showAchievements);
    const closeAchievementsBtn = document.getElementById('close-achievements');
    if (closeAchievementsBtn) closeAchievementsBtn.addEventListener('click', () => {
        document.getElementById('achievements-modal').style.display = 'none';
    });
}

// Touchscreen-Unterstützung
function moveTempItemTouch(e) {
    e.preventDefault();
    if (!gameState.tempItem || !gameState.buildMode) return;
    const touch = e.touches[0];
    moveTempItem({ clientX: touch.clientX, clientY: touch.clientY });
}

function startDragItemTouch(e) {
    e.preventDefault();
    if (gameState.buildMode || !e.target.classList.contains('farm-item')) return;
    const touch = e.touches[0];
    const clickedItem = e.target;
    const item = gameState.items.find(i => i.element === clickedItem);
    if (item) {
        gameState.isDragging = true;
        gameState.draggedItem = item;
        const rect = clickedItem.getBoundingClientRect();
        gameState.dragOffsetX = touch.clientX - rect.left;
        gameState.dragOffsetY = touch.clientY - rect.top;
        clickedItem.style.zIndex = '10';
        clickedItem.style.opacity = '0.8';
    }
}

function dragItemTouch(e) {
    e.preventDefault();
    if (!gameState.isDragging || !gameState.draggedItem) return;
    const touch = e.touches[0];
    dragItem({ clientX: touch.clientX, clientY: touch.clientY });
}

// Tastatursteuerung
function handleKeyDown(e) {
    if (e.key === 'Escape') {
        if (gameState.isDragging) {
            stopDragItem();
        } else {
            cancelBuildMode();
        }
    }
}

// Tutorial anzeigen
function showTutorial() {
    if (gameState.firstLoad) {
        document.getElementById('tutorial-modal').style.display = 'flex';
    }
}

// Erfolge überprüfen
function startAchievementCheck() {
    const achievementTimer = setInterval(checkAchievements, 5000);
    gameState.timers.push(achievementTimer);
}

function checkAchievements() {
    achievements.forEach(ach => {
        if (!gameState.achievements.includes(ach.id) && ach.condition()) {
            gameState.achievements.push(ach.id);
            gameState.money += ach.reward;
            showAchievementPopup(ach.name, ach.description, ach.reward);
            updateUI();
            saveGame();
        }
    });
}

function showAchievementPopup(name, description, reward) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `<strong>${name}</strong><br>${description}<br>Belohnung: ${reward}€`;
    popup.style.position = 'absolute';
    popup.style.top = '100px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.backgroundColor = 'rgba(0, 255, 0, 0.9)';
    popup.style.color = '#333';
    popup.style.padding = '15px';
    popup.style.borderRadius = '5px';
    popup.style.zIndex = '1000';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 5000);
}

function showAchievements() {
    const modal = document.getElementById('achievements-modal');
    const content = document.getElementById('achievements-content');
    if (modal && content) {
        content.innerHTML = '<h2>Erfolge</h2>';
        achievements.forEach(ach => {
            const status = gameState.achievements.includes(ach.id) ? 'Freigeschaltet' : 'Gesperrt';
            content.innerHTML += `<p><strong>${ach.name}</strong>: ${ach.description} (${status})</p>`;
        });
        modal.style.display = 'flex';
    }
}

// Wartungssystem
function startMaintenanceCheck() {
    const maintenanceTimer = setInterval(checkMaintenance, 60000);
    gameState.timers.push(maintenanceTimer);
}

function checkMaintenance() {
    if (gameState.day % 5 === 0 && !gameState.maintenanceDue) {
        gameState.maintenanceDue = true;
        showMaintenanceWarning();
    }
}

function showMaintenanceWarning() {
    const totalCost = gameState.items.reduce((sum, item) => sum + itemsData[item.type].maintenanceCost, 0);
    if (totalCost > 0) {
        const popup = document.createElement('div');
        popup.className = 'maintenance-popup';
        popup.innerHTML = `Wartung fällig! Kosten: ${totalCost}€<br><button id="pay-maintenance-btn">Bezahlen</button>`;
        popup.style.position = 'absolute';
        popup.style.top = '150px';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.backgroundColor = 'rgba(255, 165, 0, 0.9)';
        popup.style.color = '#333';
        popup.style.padding = '15px';
        popup.style.borderRadius = '5px';
        popup.style.zIndex = '1000';
        document.body.appendChild(popup);
        const payBtn = document.getElementById('pay-maintenance-btn');
        if (payBtn) {
            payBtn.addEventListener('click', () => {
                if (gameState.money >= totalCost) {
                    gameState.money -= totalCost;
                    gameState.totalProfit -= totalCost;
                    gameState.maintenanceDue = false;
                    popup.remove();
                    updateUI();
                    saveGame();
                } else {
                    showError('Nicht genug Geld für Wartung!');
                }
            });
        }
    }
}

// Kreditsystem
function takeLoan() {
    if (gameState.loan.amount > 0) {
        showError('Du hast bereits einen Kredit!');
        return;
    }
    const amount = 1000;
    gameState.loan = { amount, interestRate: 0.05, repaymentDay: gameState.day + 7 };
    gameState.money += amount;
    gameState.totalProfit += amount;
    showError(`Kredit von ${amount}€ aufgenommen. Rückzahlung in 7 Tagen!`);
    updateUI();
    saveGame();
}

function repayLoan() {
    if (gameState.loan.amount === 0) {
        showError('Kein Kredit zum Zurückzahlen!');
        return;
    }
    const totalRepayment = gameState.loan.amount * (1 + gameState.loan.interestRate);
    if (gameState.money >= totalRepayment) {
        gameState.money -= totalRepayment;
        gameState.totalProfit -= totalRepayment;
        gameState.loan = { amount: 0, interestRate: 0.05, repaymentDay: null };
        showError('Kredit zurückgezahlt!');
        updateUI();
        saveGame();
    } else {
        showError('Nicht genug Geld, um den Kredit zurückzuzahlen!');
    }
}

function checkLoanRepayment() {
    if (gameState.loan.amount > 0 && gameState.day >= gameState.loan.repaymentDay) {
        const totalRepayment = gameState.loan.amount * (1 + gameState.loan.interestRate);
        if (gameState.money >= totalRepayment) {
            gameState.money -= totalRepayment;
            gameState.totalProfit -= totalRepayment;
            gameState.loan = { amount: 0, interestRate: 0.05, repaymentDay: null };
            showError('Kredit automatisch zurückgezahlt!');
        } else {
            showError('Kreditrückzahlung fällig! Nicht genug Geld, Strafe wird erhoben!');
            gameState.money -= gameState.loan.amount * 0.1; // Strafe
            gameState.totalProfit -= gameState.loan.amount * 0.1;
            gameState.loan.repaymentDay += 3; // Verlängerung
        }
        updateUI();
        saveGame();
    }
}

// Feld ernten bei Klick
function handleFieldHarvest(e) {
    if (gameState.buildMode || gameState.isDragging) return;
    const target = e.target;
    if (!target.classList.contains('field') || !target.classList.contains('field-ripe')) return;
    const hasSilo = gameState.items.some(item => item.type === 'silo');
    if (!hasSilo) {
        showError('Ein Silo ist erforderlich, um Weizen zu sammeln!');
        return;
    }
    const totalSiloCapacity = calculateSiloCapacity();
    const field = gameState.items.find(item => item.element === target);
    if (field && field.isRipe) {
        const wheatToAdd = itemsData.field.wheatYield() * seasons[gameState.season].growthBonus;
        if (gameState.wheatStock + wheatToAdd <= totalSiloCapacity) {
            gameState.wheatStock += wheatToAdd;
            field.growthStart = Date.now();
            field.growthProgress = 0;
            field.isRipe = false;
            field.element.classList.remove('field-seed', 'field-growing', 'field-ripe');
            field.element.classList.add('field-seed');
            field.element.setAttribute('data-income', `${itemsData.field.passiveIncome}€/119s`);
            updateSiloText();
            updateUI();
            saveGame();
        } else {
            showError('Nicht genug Silo-Kapazität!');
        }
    }
}

// Silokapazität berechnen
function calculateSiloCapacity() {
    let totalCapacity = gameState.items
        .filter(item => item.type === 'silo')
        .reduce((sum, silo) => {
            const base = itemsData.silo.capacity;
            const bonus = silo.level ? itemsData.silo.levels[silo.level - 1].capacityBonus : 0;
            return sum + base + bonus;
        }, 0);
    // Wasserturm-Bonus hinzufügen
    const watertowerCount = gameState.items.filter(item => item.type === 'watertower').length;
    totalCapacity += watertowerCount * itemsData.watertower.siloCapacityBonus;
    return totalCapacity;
}

// Silo-Text aktualisieren
function updateSiloText() {
    const totalSiloCapacity = calculateSiloCapacity();
    gameState.items
        .filter(item => item.type === 'silo')
        .forEach(silo => {
            silo.element.setAttribute('data-income', `${gameState.wheatStock}/${totalSiloCapacity} Weizen`);
            silo.element.textContent = itemsData.silo.name;
        });
}

// Energie-System starten
function startEnergySystem() {
    gameState.energyTimer = setInterval(updateEnergy, 2000);
    gameState.timers.push(gameState.energyTimer);
}

// Energie aktualisieren
function updateEnergy() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastEnergyUpdate) / 1000;
    gameState.lastEnergyUpdate = now;
    const phase = dayPhases[gameState.dayPhase];
    const weather = weatherConditions[gameState.weather];
    const season = seasons[gameState.season];
    const productionMultiplier = phase ? phase.productionMultiplier : 0;

    // Produktion berechnen
    gameState.energyProduction = gameState.items
        .reduce((sum, item) => {
            let production = 0;
            if (item.type === 'solar-panel') {
                const base = itemsData['solar-panel'].basePower / 5;
                const bonus = item.level ? itemsData['solar-panel'].levels[item.level - 1].powerBonus / 5 : 0;
                production = (base + bonus) * productionMultiplier * weather.solarMultiplier * season.solarMultiplier;
            } else if (item.type === 'wind-turbine') {
                const base = itemsData['wind-turbine'].basePower / 5;
                const bonus = item.level ? itemsData['wind-turbine'].levels[item.level - 1].powerBonus / 5 : 0;
                const windMultiplier = gameState.dayPhase === 'night' ? 2 : 1;
                production = (base + bonus) * windMultiplier * weather.windMultiplier * season.windMultiplier;
            }
            return sum + production;
        }, 0);

    // Verbrauch berechnen
    gameState.energyConsumption = gameState.items.reduce((sum, item) => {
        let consumption = 0;
        if (item.type === 'barn' || item.type === 'field' || item.type === 'silo' || item.type === 'water-pump' || item.type === 'workshop' || item.type === 'watertower') {
            consumption = -itemsData[item.type].power / 3600;
        } else if (item.type === 'battery' && gameState.energy > 0) {
            const efficiency = itemsData.battery.efficiency +
                (item.level ? itemsData.battery.levels[item.level - 1].efficiencyBonus : 0);
            consumption = (1 - efficiency) * gameState.energy * 0.0001;
        }
        return sum + consumption;
    }, 0);

    const energyDemand = gameState.energyConsumption * deltaTime;
    const energyProduced = gameState.energyProduction * deltaTime;
    const netEnergyChange = energyProduced - energyDemand;
    gameState.totalEnergy += energyProduced;

    if (netEnergyChange >= 0 || gameState.dayPhase !== 'night') {
        gameState.energy += netEnergyChange;
        gameState.autoPurchaseActive = false;
    } else {
        if (gameState.energy >= Math.abs(energyDemand)) {
            gameState.energy += netEnergyChange;
            gameState.autoPurchaseActive = false;
        } else {
            const shortfall = Math.abs(energyDemand) - gameState.energy;
            const purchaseCost = shortfall * gameState.energyPrice * 1.5;
            if (gameState.money >= purchaseCost) {
                gameState.money -= purchaseCost;
                gameState.totalProfit -= purchaseCost;
                gameState.energy = 0;
                if (!gameState.autoPurchaseActive) {
                    showAutoPurchasePopup(shortfall, purchaseCost);
                    gameState.autoPurchaseActive = true;
                }
            } else {
                showError('Nicht genug Geld für Stromkauf!');
                gameState.energy = 0;
            }
        }
    }
    gameState.energy = Math.max(0, Math.min(gameState.energy, gameState.energyCapacity));
    updateBatteryLevels();
    updateUI();
}

// Auto-Purchase Popup anzeigen
function showAutoPurchasePopup(shortfall, cost) {
    const popup = document.createElement('div');
    popup.className = 'auto-purchase-popup';
    popup.textContent = `Kein Strom mehr! ${shortfall.toFixed(1)} kWh für ${cost.toFixed(2)}€ gekauft.`;
    popup.style.position = 'absolute';
    popup.style.top = '50px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.backgroundColor = 'rgba(255, 165, 0, 0.9)';
    popup.style.color = '#333';
    popup.style.padding = '15px';
    popup.style.borderRadius = '5px';
    popup.style.zIndex = '1000';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

// Batterie-Füllstand visualisieren
function updateBatteryLevels() {
    const totalCapacity = gameState.energyCapacity;
    if (totalCapacity === 0) return;
    gameState.items.filter(item => item.type === 'battery').forEach(battery => {
        const fillPercentage = (gameState.energy / totalCapacity) * 100;
        battery.element.style.setProperty('--fill-level', `${fillPercentage}%`);
        const itemData = itemsData.battery;
        const level = battery.level || 0;
        const capacity = itemData.capacity + (level > 0 ? itemData.levels[level - 1].capacityBonus : 0);
        const efficiency = (itemData.efficiency + (level > 0 ? itemData.levels[level - 1].efficiencyBonus : 0)) * 100;
        battery.element.setAttribute('data-income', `${capacity} kWh\n${efficiency.toFixed(1)}% Effizienz`);
        battery.element.textContent = itemData.name;
    });
}

// Wachstumsmechanismus für Felder
function updateFieldGrowth() {
    gameState.items
        .filter(item => item.type === 'field')
        .forEach(field => {
            if (!field.growthStart) {
                field.growthStart = Date.now();
                field.growthProgress = 0;
            }
            const nearbyPumps = gameState.items
                .filter(item => item.type === 'water-pump')
                .filter(pump => {
                    const rect1 = field.element.getBoundingClientRect();
                    const rect2 = pump.element.getBoundingClientRect();
                    const dx = (rect1.left + rect1.width / 2) - (rect2.left + rect2.width / 2);
                    const dy = (rect1.top + rect1.height / 2) - (rect2.top + rect2.height / 2);
                    return Math.sqrt(dx * dx + dy * dy) < 150;
                }).length;
            const growthTime = itemsData.field.growthTime * (1 - nearbyPumps * itemsData['water-pump'].growthBonus) / seasons[gameState.season].growthBonus;
            const elapsed = Date.now() - field.growthStart;
            field.growthProgress = Math.min(elapsed / growthTime, 1);
            const stage = field.growthProgress >= 1 ? 2 : Math.floor(field.growthProgress * 2);
            field.element.classList.remove('field-seed', 'field-growing', 'field-ripe');
            field.element.classList.add(`field-${['seed', 'growing', 'ripe'][stage]}`);
            field.element.setAttribute('data-income', field.isRipe ? 'Fertig zum Ernten' : `${itemsData.field.passiveIncome}€/119s`);
            field.element.textContent = itemsData.field.name;
            if (field.growthProgress >= 1 && !field.isRipe) {
                field.isRipe = true;
                updateUI();
            }
        });
}

// Bau-Modus starten
function startBuildMode(itemType) {
    if (!itemsData[itemType]) {
        console.error(`Ungültiger Gebäudetyp: ${itemType}`);
        showError(`Ungültiger Gebäudetyp: ${itemType}`);
        return;
    }
    cancelBuildMode();
    gameState.buildMode = itemType;
    const item = itemsData[itemType];
    const tempItem = document.createElement('div');
    tempItem.className = `farm-item ${itemType} temp-item`;
    tempItem.style.width = `${item.width}px`;
    tempItem.style.height = `${item.height}px`;
    tempItem.textContent = item.name;
    const farmArea = document.getElementById('farm-area');
    if (farmArea) {
        farmArea.appendChild(tempItem);
        gameState.tempItem = tempItem;
    } else {
        console.error('Farm-Bereich nicht gefunden beim Platzieren!');
    }
}

// Temporäres Objekt bewegen
function moveTempItem(e) {
    if (!gameState.tempItem || !gameState.buildMode) return;
    const farmArea = document.getElementById('farm-area');
    const rect = farmArea.getBoundingClientRect();
    const item = itemsData[gameState.buildMode];
    let x = e.clientX - rect.left - item.width / 2;
    let y = e.clientY - rect.top - item.height / 2;
    x = Math.max(0, Math.min(x, farmArea.clientWidth - item.width));
    y = Math.max(0, Math.min(y, farmArea.clientHeight - item.height));
    gameState.tempItem.style.left = `${x}px`;
    gameState.tempItem.style.top = `${y}px`;
    gameState.tempItem.classList.toggle('invalid-position', checkCollision(gameState.tempItem));
}

// Überlappung prüfen
function checkCollision(element) {
    if (!element) return false;
    const rect1 = element.getBoundingClientRect();
    return gameState.items.some(item => {
        if (gameState.isDragging && item.element === gameState.draggedItem?.element) return false;
        const rect2 = item.element.getBoundingClientRect();
        return !(rect1.right <= rect2.left || rect1.left >= rect2.right ||
                 rect1.bottom <= rect2.top || rect1.top >= rect2.bottom);
    });
}

// Objekt platzieren
function placeItem(e) {
    if (gameState.isDragging || !gameState.tempItem || !gameState.buildMode) return;
    if (checkCollision(gameState.tempItem)) {
        console.log('Kollision erkannt, Platzierung abgebrochen');
        return;
    }
    const itemType = gameState.buildMode;
    const item = itemsData[itemType];
    if (gameState.money >= item.cost) {
        gameState.money -= item.cost;
        gameState.totalProfit -= item.cost;
        const newItem = document.createElement('div');
        newItem.className = `farm-item ${itemType}`;
        newItem.style.left = gameState.tempItem.style.left;
        newItem.style.top = gameState.tempItem.style.top;
        newItem.style.width = `${item.width}px`;
        newItem.style.height = `${item.height}px`;
        updateItemText(newItem, itemType, item);
        if (itemType === 'solar-panel' || itemType === 'wind-turbine' || itemType === 'battery' || itemType === 'silo') {
            newItem.classList.add('lvl1');
        } else if (itemType === 'barn') {
            gameState.income += item.income;
        } else if (itemType === 'field') {
            newItem.classList.add('field-seed');
        } else if (itemType === 'water-pump') {
            newItem.setAttribute('data-income', '20% Wachstumsbonus');
        } else if (itemType === 'workshop') {
            newItem.setAttribute('data-income', `${itemsData.workshop.passiveIncome()}€/Tag`);
        } else if (itemType === 'watertower') {
            newItem.setAttribute('data-income', `+${item.siloCapacityBonus} Silokapazität`);
        }
        newItem.dataset.originalX = parseInt(newItem.style.left) || 0;
        newItem.dataset.originalY = parseInt(newItem.style.top) || 0;
        newItem.onclick = () => selectItem(newItem);
        document.getElementById('farm-area').appendChild(newItem);
        gameState.items.push({
            type: itemType,
            element: newItem,
            level: 0,
            growthStart: itemType === 'field' ? Date.now() : null,
            growthProgress: 0,
            isRipe: false,
            lastMaintenance: gameState.day
        });
        if (itemType === 'battery') {
            gameState.energyCapacity += item.capacity;
        }
        updatePassiveIncome();
        updateSiloText();
        cancelBuildMode();
        updateUI();
        saveGame();
    } else {
        showError('Nicht genug Geld!');
        cancelBuildMode();
    }
}

// Fehler anzeigen
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '10px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 2000);
}

// Text im Gebäude aktualisieren
function updateItemText(element, itemType, itemData, level = 0) {
    element.textContent = itemData.name;
    let incomeText = '';
    if (itemType === 'solar-panel') {
        const base = itemData.basePower;
        const bonus = level > 0 ? itemData.levels[level - 1].powerBonus : 0;
        const weather = weatherConditions[gameState.weather];
        const season = seasons[gameState.season];
        incomeText = `${(base + bonus) * dayPhases[gameState.dayPhase].productionMultiplier * weather.solarMultiplier * season.solarMultiplier} kW/5s`;
    } else if (itemType === 'wind-turbine') {
        const base = itemData.basePower;
        const bonus = level > 0 ? itemData.levels[level - 1].powerBonus : 0;
        const windMultiplier = gameState.dayPhase === 'night' ? 2 : 1;
        const weather = weatherConditions[gameState.weather];
        const season = seasons[gameState.season];
        incomeText = `${(base + bonus) * windMultiplier * weather.windMultiplier * season.windMultiplier} kW/5s`;
    } else if (itemType === 'barn') {
        incomeText = `${itemData.income}€/Tag`;
    } else if (itemType === 'field') {
        const field = gameState.items.find(item => item.element === element);
        incomeText = field && field.isRipe ? 'Fertig zum Ernten' : `${itemData.passiveIncome}€/119s`;
    } else if (itemType === 'battery') {
        const capacity = itemData.capacity + (level > 0 ? itemData.levels[level - 1].capacityBonus : 0);
        const efficiency = (itemData.efficiency + (level > 0 ? itemData.levels[level - 1].efficiencyBonus : 0)) * 100;
        incomeText = `${capacity} kWh\n${efficiency.toFixed(1)}% Effizienz`;
    } else if (itemType === 'silo') {
        const totalSiloCapacity = calculateSiloCapacity();
        incomeText = `${gameState.wheatStock}/${totalSiloCapacity} Weizen`;
    } else if (itemType === 'water-pump') {
        incomeText = '20% Wachstumsbonus';
    } else if (itemType === 'workshop') {
        incomeText = `${itemData.passiveIncome()}€/Tag`;
    } else if (itemType === 'watertower') {
        incomeText = `+${itemData.siloCapacityBonus} Silokapazität`;
    }
    element.setAttribute('data-income', incomeText);
}

// Bau-Modus abbrechen
function cancelBuildMode() {
    if (gameState.tempItem) {
        gameState.tempItem.remove();
        gameState.tempItem = null;
    }
    gameState.buildMode = null;
}

// Drag & Drop
function startDragItem(e) {
    if (gameState.buildMode || !e.target.classList.contains('farm-item')) return;
    const clickedItem = e.target;
    const item = gameState.items.find(i => i.element === clickedItem);
    if (item) {
        gameState.isDragging = true;
        gameState.draggedItem = item;
        const rect = clickedItem.getBoundingClientRect();
        gameState.dragOffsetX = e.clientX - rect.left;
        gameState.dragOffsetY = e.clientY - rect.top;
        clickedItem.style.zIndex = '10';
        clickedItem.style.opacity = '0.8';
    }
}

function dragItem(e) {
    if (!gameState.isDragging || !gameState.draggedItem) return;
    const farmArea = document.getElementById('farm-area');
    const rect = farmArea.getBoundingClientRect();
    let x = e.clientX - rect.left - gameState.dragOffsetX;
    let y = e.clientY - rect.top - gameState.dragOffsetY;
    x = Math.max(0, Math.min(x, farmArea.clientWidth - gameState.draggedItem.element.offsetWidth));
    y = Math.max(0, Math.min(y, farmArea.clientHeight - gameState.draggedItem.element.offsetHeight));
    gameState.draggedItem.element.style.left = `${x}px`;
    gameState.draggedItem.element.style.top = `${y}px`;
}

function stopDragItem() {
    if (gameState.isDragging && gameState.draggedItem) {
        gameState.draggedItem.element.style.zIndex = '';
        gameState.draggedItem.element.style.opacity = '';
        if (checkCollision(gameState.draggedItem.element)) {
            const item = gameState.draggedItem;
            item.element.style.left = `${parseInt(item.element.dataset.originalX)}px`;
            item.element.style.top = `${parseInt(item.element.dataset.originalY)}px`;
        } else {
            gameState.draggedItem.element.dataset.originalX = parseInt(gameState.draggedItem.element.style.left) || 0;
            gameState.draggedItem.element.dataset.originalY = parseInt(gameState.draggedItem.element.style.top) || 0;
            saveGame();
        }
    }
    gameState.isDragging = false;
    gameState.draggedItem = null;
}

// Item auswählen (für Upgrades)
function selectItem(element) {
    if (gameState.isDragging) return;
    if (gameState.selectedItem) {
        gameState.selectedItem.element.classList.remove('selected');
    }
    const item = gameState.items.find(i => i.element === element);
    if (item && (item.type === 'solar-panel' || item.type === 'wind-turbine' || item.type === 'battery' || item.type === 'silo')) {
        gameState.selectedItem = item;
        element.classList.add('selected');
        const upgradeMenu = document.getElementById('upgrade-menu');
        if (upgradeMenu) {
            upgradeMenu.style.display = 'block';
            updateUpgradeButtons(item.type, item.level);
        }
    } else {
        gameState.selectedItem = null;
        const upgradeMenu = document.getElementById('upgrade-menu');
        if (upgradeMenu) upgradeMenu.style.display = 'none';
    }
}

// Upgrade-Buttons aktualisieren
function updateUpgradeButtons(itemType, currentLevel) {
    const itemData = itemsData[itemType];
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`upgrade-btn-${i}`);
        if (!btn || i - 1 >= itemData.levels.length) {
            if (btn) btn.style.display = 'none';
            continue;
        }
        btn.style.display = 'block';
        const levelData = itemData.levels[i - 1];
        if (i <= currentLevel) {
            btn.disabled = true;
            btn.textContent = `Stufe ${i} (Bereits geupgradet)`;
        } else if (i === currentLevel + 1) {
            btn.disabled = false;
            let bonusText = '';
            if (itemType === 'solar-panel' || itemType === 'wind-turbine') {
                bonusText = `+${levelData.powerBonus} kW/5s`;
            } else if (itemType === 'battery') {
                bonusText = `+${levelData.capacityBonus} kWh, +${(levelData.efficiencyBonus * 100).toFixed(1)}% Effizienz`;
            } else if (itemType === 'silo') {
                bonusText = `+${levelData.capacityBonus} Weizen`;
            }
            btn.textContent = `Stufe ${i} (${levelData.cost} €) ${bonusText}`;
        } else {
            btn.disabled = true;
            btn.textContent = `Stufe ${i} (Stufe ${i - 1} erforderlich)`;
        }
    }
}

// Item upgraden
function upgradeSelectedItem(targetLevel) {
    if (!gameState.selectedItem) return;
    const item = gameState.selectedItem;
    const itemType = item.type;
    const itemData = itemsData[itemType];
    const currentLevel = item.level || 0;
    if (targetLevel !== currentLevel + 1) return;
    const upgradeCost = itemData.levels[currentLevel].cost;
    if (gameState.money >= upgradeCost) {
        gameState.money -= upgradeCost;
        gameState.totalProfit -= upgradeCost;
        item.level = targetLevel;
        item.element.className = `farm-item ${itemType} lvl${targetLevel} selected`;
        updateItemText(item.element, itemType, itemData, targetLevel);
        if (itemType === 'battery') {
            gameState.energyCapacity += itemData.levels[currentLevel].capacityBonus;
        }
        updateSiloText();
        updateUI();
        saveGame();
    } else {
        showError('Nicht genug Geld für dieses Upgrade!');
    }
}

// Strom verkaufen
function sellEnergy() {
    if (gameState.energy <= 0) {
        const sellInfo = document.getElementById('sell-info');
        if (sellInfo) sellInfo.textContent = "Kein Strom zum Verkauf!";
        return;
    }
    const earned = gameState.energy * gameState.energyPrice;
    gameState.money += earned;
    gameState.totalProfit += earned;
    gameState.energy = 0;
    const sellInfo = document.getElementById('sell-info');
    if (sellInfo) {
        sellInfo.textContent = `Verkauft: ${gameState.energy.toFixed(1)} kWh für ${earned.toFixed(2)}€`;
    }
    const moneyChange = document.createElement('div');
    moneyChange.className = 'money-change';
    moneyChange.textContent = `+${earned.toFixed(2)}€`;
    moneyChange.style.left = '50%';
    moneyChange.style.top = '50%';
    const uiPanel = document.getElementById('ui-panel');
    if (uiPanel) {
        uiPanel.appendChild(moneyChange);
        setTimeout(() => moneyChange.remove(), 1000);
    }
    updateMarketPrices();
    updateUI();
    saveGame();
}

// Weizen verkaufen
function sellWheat() {
    const hasSilo = gameState.items.some(item => item.type === 'silo');
    const sellInfo = document.getElementById('sell-info');
    if (!hasSilo) {
        if (sellInfo) sellInfo.textContent = "Ein Silo ist erforderlich, um Weizen zu verkaufen!";
        return;
    }
    if (gameState.wheatStock <= 0) {
        if (sellInfo) sellInfo.textContent = "Kein Weizen zum Verkauf!";
        return;
    }
    const earned = gameState.wheatStock * gameState.wheatPrice;
    gameState.money += earned;
    gameState.totalProfit += earned;
    if (sellInfo) {
        sellInfo.textContent = `Verkauft: ${gameState.wheatStock} Weizen für ${earned.toFixed(2)}€`;
    }
    gameState.wheatStock = 0;
    updateSiloText();
    const moneyChange = document.createElement('div');
    moneyChange.className = 'money-change';
    moneyChange.textContent = `+${earned.toFixed(2)}€`;
    moneyChange.style.left = '50%';
    moneyChange.style.top = '50%';
    const uiPanel = document.getElementById('ui-panel');
    if (uiPanel) {
        uiPanel.appendChild(moneyChange);
        setTimeout(() => moneyChange.remove(), 1000);
    }
    updateMarketPrices();
    updateUI();
    saveGame();
}

// Marktpreise aktualisieren
function updateMarketPrices() {
    const energySupplyFactor = gameState.energyProduction / (gameState.energyConsumption + 0.01);
    const wheatSupplyFactor = gameState.wheatStock / 1000;
    gameState.energyPrice = Math.max(0.5, Math.min(2.0, (0.8 + Math.random() * 0.4) / energySupplyFactor)).toFixed(2);
    gameState.wheatPrice = Math.max(0.3, Math.min(0.8, (0.4 + Math.random() * 0.2) / (1 + wheatSupplyFactor))).toFixed(2);
}

// Passives Einkommen (Felder und Werkstatt)
function startPassiveIncome() {
    if (gameState.passiveIncomeTimer) clearInterval(gameState.passiveIncomeTimer);
    gameState.passiveIncomeTimer = setInterval(() => {
        updateFieldGrowth();
        updatePassiveIncome();
        updateUI();
    }, 2000);
    gameState.timers.push(gameState.passiveIncomeTimer);
}

// Passives Einkommen aktualisieren
function updatePassiveIncome() {
    gameState.passiveIncome = gameState.items
        .reduce((sum, item) => {
            let income = 0;
            if (item.type === 'field' && !item.isRipe) {
                income = itemsData['field'].passiveIncome;
            } else if (item.type === 'workshop') {
                income = itemsData.workshop.passiveIncome();
            }
            return sum + income;
        }, 0);
}

// Geldzuwachs-Animation
function showMoneyGain(element, amount) {
    const rect = element.getBoundingClientRect();
    const moneyChange = document.createElement('div');
    moneyChange.className = 'money-change';
    moneyChange.textContent = `+${amount}€`;
    moneyChange.style.left = `${rect.left + rect.width / 2}px`;
    moneyChange.style.top = `${rect.top}px`;
    document.body.appendChild(moneyChange);
    setTimeout(() => moneyChange.remove(), 1000);
}

// Alle Timer löschen
function clearAllTimers() {
    gameState.timers.forEach(timer => clearInterval(timer));
    gameState.timers = [];
    if (gameState.passiveIncomeTimer) clearInterval(gameState.passiveIncomeTimer);
    if (gameState.energyTimer) clearInterval(gameState.energyTimer);
}

// Spielstand speichern
function saveGame() {
    const saveData = {
        money: gameState.money,
        energy: gameState.energy,
        energyCapacity: gameState.energyCapacity,
        energyProduction: gameState.energyProduction,
        energyConsumption: gameState.energyConsumption,
        income: gameState.income,
        passiveIncome: gameState.passiveIncome,
        day: gameState.day,
        wheatStock: gameState.wheatStock,
        totalProfit: gameState.totalProfit,
        totalEnergy: gameState.totalEnergy,
        energyPrice: gameState.energyPrice,
        wheatPrice: gameState.wheatPrice,
        weather: gameState.weather,
        firstLoad: gameState.firstLoad,
        season: gameState.season,
        loan: gameState.loan,
        achievements: gameState.achievements,
        maintenanceDue: gameState.maintenanceDue,
        items: gameState.items.map(item => ({
            type: item.type,
            x: parseInt(item.element.style.left) || 0,
            y: parseInt(item.element.style.top) || 0,
            level: item.level || 0,
            growthStart: item.growthStart || null,
            growthProgress: item.growthProgress || 0,
            isRipe: item.isRipe || false,
            lastMaintenance: item.lastMaintenance || gameState.day
        })),
        currentHour: gameState.currentHour,
        currentMinute: gameState.currentMinute,
        dayPhase: gameState.dayPhase,
        dayStartTime: gameState.dayStartTime
    };
    try {
        localStorage.setItem('solarFarmSave', JSON.stringify(saveData));
    } catch (e) {
        console.error('Fehler beim Speichern des Spielstands:', e);
        showError('Spielstand konnte nicht gespeichert werden!');
    }
}

// Spielstand laden
function loadGame() {
    const savedData = localStorage.getItem('solarFarmSave');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (!parsedData || typeof parsedData !== 'object') throw new Error('Ungültiger Spielstand');
            Object.assign(gameState, {
                money: parsedData.money ?? 1000,
                energy: parsedData.energy ?? 0,
                energyCapacity: parsedData.energyCapacity ?? 0,
                energyProduction: parsedData.energyProduction ?? 0,
                energyConsumption: parsedData.energyConsumption ?? 0,
                income: parsedData.income ?? 0,
                passiveIncome: parsedData.passiveIncome ?? 0,
                day: parsedData.day ?? 1,
                currentHour: parsedData.currentHour ?? 0,
                currentMinute: parsedData.currentMinute ?? 0,
                dayPhase: parsedData.dayPhase ?? 'night',
                dayStartTime: parsedData.dayStartTime ?? Date.now(),
                wheatStock: parsedData.wheatStock ?? 0,
                totalProfit: parsedData.totalProfit ?? 0,
                totalEnergy: parsedData.totalEnergy ?? 0,
                energyPrice: parsedData.energyPrice ?? 1.00,
                wheatPrice: parsedData.wheatPrice ?? 0.50,
                weather: parsedData.weather ?? 'sunny',
                firstLoad: parsedData.firstLoad ?? true,
                season: parsedData.season ?? 'spring',
                loan: parsedData.loan ?? { amount: 0, interestRate: 0.05, repaymentDay: null },
                achievements: parsedData.achievements ?? [],
                maintenanceDue: parsedData.maintenanceDue ?? false,
                items: []
            });
            document.getElementById('farm-area').innerHTML = '';
            if (parsedData.items && Array.isArray(parsedData.items)) {
                parsedData.items.forEach(itemData => {
                    if (!itemsData[itemData.type]) {
                        console.warn(`Ungültiger Gebäudetyp im Spielstand: ${itemData.type}`);
                        return;
                    }
                    const itemType = itemData.type;
                    const item = itemsData[itemType];
                    const newItem = document.createElement('div');
                    newItem.className = `farm-item ${itemType}`;
                    if ((itemType === 'solar-panel' || itemType === 'wind-turbine' || itemType === 'battery' || itemType === 'silo') && itemData.level) {
                        newItem.classList.add(`lvl${itemData.level}`);
                    } else if (itemType === 'field') {
                        const stage = itemData.isRipe ? 2 : Math.floor(itemData.growthProgress * 2);
                        newItem.classList.add(`field-${['seed', 'growing', 'ripe'][stage]}`);
                    }
                    newItem.style.left = `${itemData.x || 0}px`;
                    newItem.style.top = `${itemData.y || 0}px`;
                    newItem.style.width = `${item.width}px`;
                    newItem.style.height = `${item.height}px`;
                    updateItemText(newItem, itemType, item, itemData.level || 0);
                    newItem.dataset.originalX = itemData.x || 0;
                    newItem.dataset.originalY = itemData.y || 0;
                    newItem.onclick = () => selectItem(newItem);
                    document.getElementById('farm-area').appendChild(newItem);
                    gameState.items.push({
                        type: itemType,
                        element: newItem,
                        level: itemData.level || 0,
                        growthStart: itemData.growthStart || (itemType === 'field' ? Date.now() : null),
                        growthProgress: itemData.growthProgress || 0,
                        isRipe: itemData.isRipe || false,
                        lastMaintenance: itemData.lastMaintenance || gameState.day
                    });
                });
            }
            updatePassiveIncome();
            updateSiloText();
            updateDayPhase();
            updateWeatherDisplay();
        } catch (e) {
            console.error('Fehler beim Laden des Spielstands:', e);
            resetGame();
        }
    } else {
        gameState.currentHour = 0;
        gameState.currentMinute = 0;
        gameState.dayPhase = 'night';
        gameState.weather = 'sunny';
        gameState.season = 'spring';
        updateDayPhase();
        updateWeatherDisplay();
    }
}

// Spiel zurücksetzen
function resetGame() {
    console.log('Spiel wird zurückgesetzt...');
    if (confirm('Wirklich zurücksetzen? Fortschritt geht verloren!')) {
        clearAllTimers();
        localStorage.removeItem('solarFarmSave');
        Object.assign(gameState, {
            money: 1000,
            energy: 0,
            energyCapacity: 0,
            energyProduction: 0,
            energyConsumption: 0,
            income: 0,
            passiveIncome: 0,
            day: 1,
            currentHour: 0,
            currentMinute: 0,
            dayPhase: 'night',
            dayStartTime: Date.now(),
            wheatStock: 0,
            totalProfit: 0,
            totalEnergy: 0,
            energyPrice: 1.00,
            wheatPrice: 0.50,
            weather: 'sunny',
            firstLoad: true,
            season: 'spring',
            loan: { amount: 0, interestRate: 0.05, repaymentDay: null },
            achievements: [],
            maintenanceDue: false,
            items: [],
            selectedItem: null,
            buildMode: null,
            tempItem: null,
            isDragging: false,
            draggedItem: null,
            lastEnergyUpdate: Date.now(),
            autoPurchaseActive: false
        });
        const farmArea = document.getElementById('farm-area');
        if (farmArea) farmArea.innerHTML = '';
        const upgradeMenu = document.getElementById('upgrade-menu');
        if (upgradeMenu) upgradeMenu.style.display = 'none';
        const sellInfo = document.getElementById('sell-info');
        if (sellInfo) sellInfo.textContent = '';
        updateUI();
        updateTimeDisplay();
        updateDayPhase();
        updateWeatherDisplay();
        startDayCycle();
        startPassiveIncome();
        startEnergySystem();
        startAchievementCheck();
        startMaintenanceCheck();
        showTutorial();
        console.log('Spiel zurückgesetzt, Tagesphase:', gameState.dayPhase, 'Zeit:', gameState.currentHour);
    }
}

// Tageszyklus starten
function startDayCycle() {
    console.log('Tageszyklus wird gestartet...');
    clearInterval(gameState.dayCycleTimer);
    gameState.dayStartTime = Date.now();
    gameState.dayCycleTimer = setInterval(() => {
        updateGameTime();
    }, 100);
    gameState.timers.push(gameState.dayCycleTimer);
    const saveInterval = setInterval(saveGame, 30000);
    gameState.timers.push(saveInterval);
}

// Spielzeit aktualisieren
function updateGameTime() {
    const now = Date.now();
    const elapsed = now - gameState.dayStartTime;
    const progress = Math.min(elapsed / gameState.dayDuration, 1);
    const progressBar = document.getElementById('day-progress');
    if (progressBar) {
        progressBar.style.width = `${progress * 100}%`;
    }
    const totalSeconds = progress * 24 * 60 * 60;
    gameState.currentHour = Math.floor(totalSeconds / 3600) % 24;
    gameState.currentMinute = Math.floor((totalSeconds % 3600) / 60);
    updateTimeDisplay();
    updateDayPhase();
    if (progress >= 1) nextDay();
}

// Zeit-Anzeige aktualisieren
function updateTimeDisplay() {
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        const formattedHour = gameState.currentHour.toString().padStart(2, '0');
        const formattedMinute = gameState.currentMinute.toString().padStart(2, '0');
        timeDisplay.textContent = `${formattedHour}:${formattedMinute}`;
    }
}

// Tagesphase aktualisieren
function updateDayPhase() {
    const farmArea = document.getElementById('farm-area');
    if (!farmArea) {
        console.error('Farm-Bereich nicht gefunden in updateDayPhase!');
        return;
    }
    let newPhase = 'night';
    for (const [phase, data] of Object.entries(dayPhases)) {
        if (gameState.currentHour >= data.start && gameState.currentHour < data.end) {
            newPhase = phase;
            break;
        }
    }
    if (newPhase !== gameState.dayPhase) {
        farmArea.classList.remove('night', 'dawn', 'day', 'dusk');
        farmArea.classList.add(newPhase);
        gameState.dayPhase = newPhase;
        console.log('Tagesphase gewechselt zu:', newPhase, 'Zeit:', gameState.currentHour);
    }
    updateWeatherDisplay();
    gameState.items.forEach(item => updateItemText(item.element, item.type, itemsData[item.type], item.level));
}

// Wetter und Jahreszeit aktualisieren
function updateWeatherDisplay() {
    const farmArea = document.getElementById('farm-area');
    const weatherDisplay = document.getElementById('weather-display');
    if (weatherDisplay) {
        weatherDisplay.textContent = `Wetter: ${weatherConditions[gameState.weather].description} | Jahreszeit: ${seasons[gameState.season].description}`;
    }
    farmArea.classList.remove('cloudy', 'windy', 'spring', 'summer', 'fall', 'winter');
    if (gameState.weather !== 'sunny') {
        farmArea.classList.add(gameState.weather);
    }
    farmArea.classList.add(gameState.season);
}

// Nächster Tag
function nextDay() {
    gameState.money += gameState.income;
    gameState.totalProfit += gameState.income;
    gameState.day++;
    gameState.currentHour = 0;
    gameState.currentMinute = 0;
    gameState.dayPhase = 'night';
    gameState.dayStartTime = Date.now();

    // Jahreszeit aktualisieren (alle 30 Tage)
    if (gameState.day % 30 === 0) {
        const seasonOrder = ['spring', 'summer', 'fall', 'winter'];
        const currentIndex = seasonOrder.indexOf(gameState.season);
        gameState.season = seasonOrder[(currentIndex + 1) % 4];
    }

    // Marktpreise aktualisieren
    updateMarketPrices();

    // Zufälliges Wetterereignis
    if (Math.random() < 0.2) {
        const weathers = Object.keys(weatherConditions);
        gameState.weather = weathers[Math.floor(Math.random() * weathers.length)];
    } else {
        gameState.weather = 'sunny';
    }

    // Kreditrückzahlung prüfen
    checkLoanRepayment();

    updateUI();
    updateTimeDisplay();
    updateDayPhase();
    updateWeatherDisplay();
    saveGame();
}

// UI aktualisieren
function updateUI() {
    const elements = {
        money: document.getElementById('money'),
        income: document.getElementById('income'),
        passiveIncome: document.getElementById('passive-income'),
        day: document.getElementById('day'),
        energyProduction: document.getElementById('energy-production'),
        energyConsumption: document.getElementById('energy-consumption'),
        energyNet: document.getElementById('energy-net'),
        energyStorage: document.getElementById('energy-storage'),
        energyCapacity: document.getElementById('energy-capacity'),
        wheatStock: document.getElementById('wheat-stock'),
        sellWheatBtn: document.getElementById('sell-wheat-btn'),
        energyPrice: document.getElementById('energy-price'),
        wheatPrice: document.getElementById('wheat-price'),
        totalProfit: document.getElementById('total-profit'),
        totalEnergy: document.getElementById('total-energy'),
        loanAmount: document.getElementById('loan-amount')
    };
    if (elements.money) elements.money.textContent = Math.floor(gameState.money);
    if (elements.income) elements.income.textContent = gameState.income;
    if (elements.passiveIncome) elements.passiveIncome.textContent = gameState.passiveIncome;
    if (elements.day) elements.day.textContent = gameState.day;
    if (elements.energyProduction) {
        elements.energyProduction.textContent = `${(gameState.energyProduction * 5).toFixed(1)} kW/5s`;
    }
    if (elements.energyConsumption) {
        elements.energyConsumption.textContent = `${(gameState.energyConsumption * 3600).toFixed(1)} kW/h`;
    }
    if (elements.energyNet) {
        const netEnergy = (gameState.energyProduction * 5) - (gameState.energyConsumption * 3600 / 5);
        elements.energyNet.textContent = `${netEnergy.toFixed(1)} kW/5s`;
        elements.energyNet.className = netEnergy >= 0 ? 'energy-value' : 'energy-value negative';
    }
    if (elements.energyStorage) elements.energyStorage.textContent = `${gameState.energy.toFixed(1)} kWh`;
    if (elements.energyCapacity) elements.energyCapacity.textContent = `${gameState.energyCapacity.toFixed(1)} kWh`;
    if (elements.wheatStock) elements.wheatStock.textContent = gameState.wheatStock;
    if (elements.sellWheatBtn) {
        const hasSilo = gameState.items.some(item => item.type === 'silo');
        elements.sellWheatBtn.style.display = hasSilo ? 'block' : 'none';
    }
    if (elements.energyPrice) elements.energyPrice.textContent = gameState.energyPrice;
    if (elements.wheatPrice) elements.wheatPrice.textContent = gameState.wheatPrice;
    if (elements.totalProfit) elements.totalProfit.textContent = Math.floor(gameState.totalProfit);
    if (elements.totalEnergy) elements.totalEnergy.textContent = gameState.totalEnergy.toFixed(1);
    if (elements.loanAmount) elements.loanAmount.textContent = gameState.loan.amount > 0 ? `${gameState.loan.amount}€ (Fällig: Tag ${gameState.loan.repaymentDay})` : 'Kein Kredit';
}

// Spiel starten
window.onload = () => {
    try {
        initGame();
    } catch (e) {
        console.error('Fehler bei der Spielinitialisierung:', e);
        showError('Spiel konnte nicht gestartet werden! Bitte Seite neu laden.');
    }
};
