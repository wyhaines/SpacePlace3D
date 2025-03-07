// Mobile Touch Controls

// Holds references to the touch buttons
let touchButtons = {};

// Create touch UI for mobile devices
function createTouchUI(
    increaseThrustCallback, 
    decreaseThrustCallback, 
    scanCallback, 
    travelModeCallback
) {
    // Remove existing touch controls if any
    const existingControls = document.getElementById('touch-controls');
    if (existingControls) {
        existingControls.remove();
    }
    
    const gameContainer = document.getElementById('game-container');
    
    // Create container for touch controls
    const touchControlsContainer = document.createElement('div');
    touchControlsContainer.id = 'touch-controls';
    touchControlsContainer.className = 'touch-controls';
    
    // Create thrust control buttons
    const thrustUpButton = document.createElement('button');
    thrustUpButton.id = 'thrust-up';
    thrustUpButton.className = 'touch-button thrust-button';
    thrustUpButton.innerHTML = '&#9650;'; // Up arrow
    thrustUpButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        increaseThrustCallback();
    });
    
    const thrustDownButton = document.createElement('button');
    thrustDownButton.id = 'thrust-down';
    thrustDownButton.className = 'touch-button thrust-button';
    thrustDownButton.innerHTML = '&#9660;'; // Down arrow
    thrustDownButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        decreaseThrustCallback();
    });
    
    // Create brake button
    const brakeButton = document.createElement('button');
    brakeButton.id = 'brake-button';
    brakeButton.className = 'touch-button brake-button';
    brakeButton.textContent = 'BRAKE';
    brakeButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.isBraking = true;
    });
    brakeButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        window.isBraking = false;
    });
    
    // Create scan button
    const scanButton = document.createElement('button');
    scanButton.id = 'scan-button-touch';
    scanButton.className = 'touch-button action-button';
    scanButton.textContent = 'SCAN';
    scanButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        scanCallback();
    });
    
    // Create travel mode toggle button
    const travelModeButton = document.createElement('button');
    travelModeButton.id = 'travel-mode-touch';
    travelModeButton.className = 'touch-button action-button';
    travelModeButton.textContent = 'WARP';
    travelModeButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        travelModeCallback();
    });
    
    // Create roll control buttons
    const rollLeftButton = document.createElement('button');
    rollLeftButton.id = 'roll-left';
    rollLeftButton.className = 'touch-button roll-button';
    rollLeftButton.textContent = '↺';
    rollLeftButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.rotationSpeed.z += 0.01; // Roll left
    });
    
    const rollRightButton = document.createElement('button');
    rollRightButton.id = 'roll-right';
    rollRightButton.className = 'touch-button roll-button';
    rollRightButton.textContent = '↻';
    rollRightButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        window.rotationSpeed.z -= 0.01; // Roll right
    });
    
    // Create thrust level display
    const thrustDisplay = document.createElement('div');
    thrustDisplay.id = 'thrust-display';
    thrustDisplay.className = 'thrust-display';
    thrustDisplay.textContent = 'Thrust: 0%';
    
    // Create thrust bar
    const thrustBarContainer = document.createElement('div');
    thrustBarContainer.className = 'thrust-bar-container';
    
    const thrustBarFill = document.createElement('div');
    thrustBarFill.id = 'thrust-bar-fill';
    thrustBarFill.className = 'thrust-bar-fill';
    
    thrustBarContainer.appendChild(thrustBarFill);
    
    // Add all elements to the controls container
    touchControlsContainer.appendChild(thrustUpButton);
    touchControlsContainer.appendChild(thrustDisplay);
    touchControlsContainer.appendChild(thrustBarContainer);
    touchControlsContainer.appendChild(thrustDownButton);
    touchControlsContainer.appendChild(brakeButton);
    touchControlsContainer.appendChild(scanButton);
    touchControlsContainer.appendChild(travelModeButton);
    touchControlsContainer.appendChild(rollLeftButton);
    touchControlsContainer.appendChild(rollRightButton);
    
    // Add the controls container to the game container
    gameContainer.appendChild(touchControlsContainer);
    
    // Store references to touch buttons
    touchButtons = {
        thrustUp: thrustUpButton,
        thrustDown: thrustDownButton,
        brake: brakeButton,
        scan: scanButton,
        travelMode: travelModeButton,
        rollLeft: rollLeftButton,
        rollRight: rollRightButton
    };
    
    // Style the roll buttons
    const rollButtons = document.querySelectorAll('.roll-button');
    rollButtons.forEach(button => {
        button.style.fontSize = '20px';
        button.style.fontWeight = 'bold';
    });
    
    // Add touch control styles if not already added
    addTouchControlStyles();
    
    return touchButtons;
}

// Add CSS styles for touch controls
function addTouchControlStyles() {
    // Check if styles are already added
    if (document.getElementById('touch-control-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'touch-control-styles';
    styleElement.textContent = `
        /* Touch Controls Styles */
        .touch-controls {
            position: absolute;
            bottom: 20px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            width: 100%;
            padding: 0 20px;
            box-sizing: border-box;
            pointer-events: none; /* Allow events to pass through container */
        }

        .touch-button {
            background-color: rgba(0, 150, 255, 0.3);
            border: 2px solid rgba(0, 200, 255, 0.6);
            color: white;
            border-radius: 50%;
            width: 70px;
            height: 70px;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 10px;
            pointer-events: auto; /* Capture events for buttons */
            user-select: none;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
        }

        .touch-button:active {
            background-color: rgba(0, 200, 255, 0.5);
            transform: scale(0.95);
        }

        .thrust-button {
            font-size: 30px;
        }

        .brake-button {
            background-color: rgba(255, 50, 50, 0.3);
            border-color: rgba(255, 100, 100, 0.6);
            border-radius: 10px;
            width: 80px;
            height: 50px;
            font-size: 16px;
        }

        .brake-button:active {
            background-color: rgba(255, 100, 100, 0.5);
        }

        .action-button {
            background-color: rgba(150, 150, 255, 0.3);
            border-color: rgba(150, 150, 255, 0.6);
            border-radius: 10px;
            width: 80px;
            height: 50px;
            font-size: 16px;
        }

        .thrust-display {
            color: white;
            font-size: 16px;
            text-align: center;
            margin: 5px 0;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
            pointer-events: none;
        }

        .thrust-bar-container {
            width: 120px;
            height: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            overflow: hidden;
            pointer-events: none;
        }

        .thrust-bar-fill {
            height: 100%;
            width: 0%; /* Will be updated by JS */
            background-color: #00aaff;
            transition: width 0.2s ease, background-color 0.3s;
        }

        /* Media queries for responsive design */
        @media (max-width: 800px) {
            .touch-button {
                width: 60px;
                height: 60px;
                font-size: 20px;
                margin: 0 5px;
            }
            
            .brake-button, .action-button {
                width: 70px;
                height: 45px;
                font-size: 14px;
            }
            
            .thrust-bar-container {
                width: 80px;
            }
        }
    `;
    document.head.appendChild(styleElement);
}