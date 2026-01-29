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

// Wetter und Jahreszeit anzeigen
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

// Tutorial anzeigen
function showTutorial() {
    if (gameState.firstLoad) {
        document.getElementById('tutorial-modal').style.display = 'flex';
    }
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

// Erfolge anzeigen
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

// Erfolgs-Popup anzeigen
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

// Wartungs-Warnung anzeigen
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
