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

// Passives Einkommen starten
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

// Touchscreen-Unterstützung für Felder
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
