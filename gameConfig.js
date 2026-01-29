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
        passiveIncome: () => 5 * gameState.items.length,
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
