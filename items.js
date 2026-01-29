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

// Silokapazität berechnen
function calculateSiloCapacity() {
    let totalCapacity = gameState.items
        .filter(item => item.type === 'silo')
        .reduce((sum, silo) => {
            const base = itemsData.silo.capacity;
            const bonus = silo.level ? itemsData.silo.levels[silo.level - 1].capacityBonus : 0;
            return sum + base + bonus;
        }, 0);
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
