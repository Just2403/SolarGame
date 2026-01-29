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
            gameState.money -= gameState.loan.amount * 0.1;
            gameState.totalProfit -= gameState.loan.amount * 0.1;
            gameState.loan.repaymentDay += 3;
        }
        updateUI();
        saveGame();
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

// Spiel starten
window.onload = () => {
    try {
        initGame();
    } catch (e) {
        console.error('Fehler bei der Spielinitialisierung:', e);
        showError('Spiel konnte nicht gestartet werden! Bitte Seite neu laden.');
    }
};
