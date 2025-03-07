// Global game variables
let socket;
let scene, camera, renderer;
let ship;
let playerName = '';
let playerId = '';
let connected = false;
let keys = {};
let spaceObjects = {}; // Dictionary of space objects by ID
let otherPlayers = {}; // Dictionary of other players by ID
let nebulaParticles; // Nebula cloud particles
let nebulaColor = '#4A4A8A';
let nebulaDensity = 0.5;
let visualRange = 5000.0;
let travelMode = 'subluminal';
let travelSpeed = 1.0;

// DOM elements
const loginScreen = document.getElementById('login-screen');
const joinButton = document.getElementById('join-button');
const playerNameInput = document.getElementById('player-name');
const gameUI = document.getElementById('game-ui');
const connectionStatus = document.getElementById('connection-status');
const shipStatus = document.getElementById('ship-status');
const coordinatesDisplay = document.getElementById('coordinates');
