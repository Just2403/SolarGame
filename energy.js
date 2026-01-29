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

// Marktpreise aktualisieren
function updateMarketPrices() {
    const energySupplyFactor = gameState.energyProduction / (gameState.energyConsumption + 0.01);
    const wheatSupplyFactor = gameState.wheatStock / 1000;
    gameState.energyPrice = Math.max(0.5, Math.min(2.0, (0.8 + Math.random() * 0.4) / energySupplyFactor)).toFixed(2);
    gameState.wheatPrice = Math.max(0.3, Math.min(0.8, (0.4 + Math.random() * 0.2) / (1 + wheatSupplyFactor))).toFixed(2);
}
