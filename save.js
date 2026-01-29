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

// Alle Timer löschen
function clearAllTimers() {
    gameState.timers.forEach(timer => clearInterval(timer));
    gameState.timers = [];
    if (gameState.passiveIncomeTimer) clearInterval(gameState.passiveIncomeTimer);
    if (gameState.energyTimer) clearInterval(gameState.energyTimer);
}
