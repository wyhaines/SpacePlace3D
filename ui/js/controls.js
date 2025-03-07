// Global control variables
let isMobile = false;
let isPointerDown = false;
let pointerX = 0;
let pointerY = 0;
let targetRotationY = 0;
let targetRotationX = 0;
let thrustLevel = 0; // -100% to 100% (negative is reverse)
let isBraking = false;
let touchButtons = {}; // Will hold references to touch control buttons

// Check if device is mobile
function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 800;
}

// Initialize controls based on device type
function initControls() {
    isMobile = detectMobile();
    
    // Set up mouse/touch controls
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: false });
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown, { passive: false });
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    
    // Set up keyboard controls (for desktop)
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // If mobile device, create touch UI
    if (isMobile) {
        createTouchUI();
    }
    
    // Set initial rotation targets
    if (ship) {
        targetRotationY = ship.rotation.y;
        targetRotationX = ship.rotation.x;
    }
    
    console.log(`Controls initialized for ${isMobile ? 'mobile' : 'desktop'} device`);
}

// Handle pointer (mouse/touch) movement
function onPointerMove(event) {
    event.preventDefault();
    
    // Get pointer position
    if (event.type === 'touchmove') {
        pointerX = event.touches[0].clientX;
        pointerY = event.touches[0].clientY;
    } else {
        pointerX = event.clientX;
        pointerY = event.clientY;
    }
    
    // Always update target rotation to follow pointer direction
    if (isPointerDown) {
        calculateTargetRotationTowardPointer();
    }
}

// Handle pointer down event
function onPointerDown(event) {
    event.preventDefault();
    isPointerDown = true;
    
    // Get initial pointer position
    if (event.type === 'touchstart') {
        pointerX = event.touches[0].clientX;
        pointerY = event.touches[0].clientY;
    } else {
        pointerX = event.clientX;
        pointerY = event.clientY;
    }
    
    calculateTargetRotationTowardPointer();
}

// Handle pointer up event
function onPointerUp(event) {
    isPointerDown = false;
}

// Calculate target rotation to turn toward pointer position
function calculateTargetRotationTowardPointer() {
    if (!ship) return;
    
    // Get the center of the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate vector from center to pointer
    const directionX = pointerX - centerX;
    const directionY = pointerY - centerY;
    
    // Convert to normalized direction (-1 to 1)
    const maxDistance = Math.min(window.innerWidth, window.innerHeight) / 2;
    const normalizedX = Math.max(-1, Math.min(1, directionX / maxDistance));
    const normalizedY = Math.max(-1, Math.min(1, directionY / maxDistance));
    
    // Calculate target rotation based on normalized position
    // This will make the ship turn toward where the pointer is pointing
    const turnSensitivity = 1.0;
    
    // Calculate yaw (left/right turning)
    // Negative X should turn right (negative Y rotation in Three.js)
    targetRotationY = ship.rotation.y - (normalizedX * turnSensitivity);
    
    // Calculate pitch (up/down turning)
    // Negative Y (up on screen) should pitch up (positive X rotation in Three.js)
    targetRotationX = -normalizedY * turnSensitivity * 0.5; // Limit pitch range
}

// Key down event handler
function onKeyDown(event) {
    keys[event.code] = true;
    
    // Thrust control with W/S or Up/Down
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
        increaseThrustLevel();
    }
    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        decreaseThrustLevel();
    }
    
    // Space bar for braking
    if (event.code === 'Space') {
        isBraking = true;
    }
    
    // Toggle travel mode with T
    if (event.code === 'KeyT' && !window.travelKeyPressed) {
        window.travelKeyPressed = true;
        toggleTravelMode();
    }
    
    // Scan area with E
    if (event.code === 'KeyE') {
        sendScanRequest();
    }
}

// Key up event handler
function onKeyUp(event) {
    keys[event.code] = false;
    
    // Reset braking
    if (event.code === 'Space') {
        isBraking = false;
    }
    
    if (event.code === 'KeyT') {
        window.travelKeyPressed = false;
    }
}

// Increase thrust level (move forward faster)
function increaseThrustLevel() {
    thrustLevel = Math.min(100, thrustLevel + 10);
    updateThrustDisplay();
}

// Decrease thrust level (slow down or move backward)
function decreaseThrustLevel() {
    thrustLevel = Math.max(-100, thrustLevel - 10);
    updateThrustDisplay();
}

// Apply braking (rapidly bring thrust to zero)
function applyBraking() {
    if (thrustLevel > 0) {
        thrustLevel = Math.max(0, thrustLevel - 5);
    } else if (thrustLevel < 0) {
        thrustLevel = Math.min(0, thrustLevel + 5);
    }
    updateThrustDisplay();
}

// Update the thrust display in UI
function updateThrustDisplay() {
    const thrustDisplay = document.getElementById('thrust-display');
    if (thrustDisplay) {
        const displayValue = thrustLevel >= 0 ? 
            `Thrust: +${thrustLevel}%` : 
            `Thrust: ${thrustLevel}%`;
        
        thrustDisplay.textContent = displayValue;
        
        // Update thrust bar visual
        const thrustBar = document.getElementById('thrust-bar-fill');
        if (thrustBar) {
            // Handle positive and negative thrust visually
            if (thrustLevel >= 0) {
                thrustBar.style.width = `${thrustLevel}%`;
                thrustBar.style.marginLeft = '0';
                
                // Change color based on thrust level
                if (thrustLevel > 75) {
                    thrustBar.style.backgroundColor = '#ff3300';
                } else if (thrustLevel > 40) {
                    thrustBar.style.backgroundColor = '#ffaa00';
                } else {
                    thrustBar.style.backgroundColor = '#00aaff';
                }
            } else {
                // For negative thrust, show bar from right to left
                const absThrust = Math.abs(thrustLevel);
                thrustBar.style.width = `${absThrust}%`;
                thrustBar.style.marginLeft = `${100 - absThrust}%`;
                thrustBar.style.backgroundColor = '#aa00ff'; // Different color for reverse
            }
        }
    }
}

// Update camera to follow ship from behind
function updateCameraPosition() {
    // Position camera behind the ship (from tail)
    const cameraOffset = new THREE.Vector3(0, 5, -20); // Negative Z to position behind the ship
    cameraOffset.applyQuaternion(ship.quaternion);
    
    camera.position.copy(ship.position).add(cameraOffset);
    camera.lookAt(ship.position);
}

// Create touch UI for mobile devices
function createTouchUI() {
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
        increaseThrustLevel();
    });
    
    const thrustDownButton = document.createElement('button');
    thrustDownButton.id = 'thrust-down';
    thrustDownButton.className = 'touch-button thrust-button';
    thrustDownButton.innerHTML = '&#9660;'; // Down arrow
    thrustDownButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        decreaseThrustLevel();
    });
    
    // Create brake button
    const brakeButton = document.createElement('button');
    brakeButton.id = 'brake-button';
    brakeButton.className = 'touch-button brake-button';
    brakeButton.textContent = 'BRAKE';
    brakeButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isBraking = true;
    });
    brakeButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        isBraking = false;
    });
    
    // Create scan button
    const scanButton = document.createElement('button');
    scanButton.id = 'scan-button-touch';
    scanButton.className = 'touch-button action-button';
    scanButton.textContent = 'SCAN';
    scanButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sendScanRequest();
    });
    
    // Create travel mode toggle button
    const travelModeButton = document.createElement('button');
    travelModeButton.id = 'travel-mode-touch';
    travelModeButton.className = 'touch-button action-button';
    travelModeButton.textContent = 'WARP';
    travelModeButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleTravelMode();
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
    
    // Add the controls container to the game container
    gameContainer.appendChild(touchControlsContainer);
    
    // Store references to touch buttons
    touchButtons = {
        thrustUp: thrustUpButton,
        thrustDown: thrustDownButton,
        brake: brakeButton,
        scan: scanButton,
        travelMode: travelModeButton
    };
}

// Update ship position and rotation
function updateShipPosition() {
    // 1. Handle rotation (interpolate smoothly toward target rotation)
    const rotationInterpolationFactor = 0.05;
    
    // Interpolate Y rotation (yaw)
    ship.rotation.y = THREE.MathUtils.lerp(
        ship.rotation.y, 
        targetRotationY, 
        rotationInterpolationFactor
    );
    
    // Interpolate X rotation (pitch)
    ship.rotation.x = THREE.MathUtils.lerp(
        ship.rotation.x, 
        targetRotationX, 
        rotationInterpolationFactor
    );
    
    // 2. Handle acceleration/deceleration
    if (isBraking) {
        applyBraking();
    }
    
    // Calculate current ship speed based on thrust level
    const maxSpeed = travelSpeed; // Base max speed affected by travel mode
    const currentSpeed = (thrustLevel / 100) * maxSpeed;
    
    // Apply forward/backward movement
    ship.translateZ(currentSpeed);
    
    // 3. Display updates
    // Update coordinates display
    coordinatesDisplay.textContent = `Position: (${ship.position.x.toFixed(1)}, ${ship.position.y.toFixed(1)}, ${ship.position.z.toFixed(1)})`;
    
    // 4. Send position update to server
    if (connected) {
        const positionMessage = {
            type: 'position',
            x: ship.position.x,
            y: ship.position.y,
            z: ship.position.z,
            rotationY: ship.rotation.y,
            rotationZ: ship.rotation.z
        };
        socket.send(JSON.stringify(positionMessage));
    }
    
    // 5. Update camera position to follow ship
    updateCameraPosition();
    
    // 6. Update labels for space objects
    updateObjectLabels();
}

// Update the position of object labels in screen space
function updateObjectLabels() {
    // Update other player labels
    for (const id in otherPlayers) {
        const playerShip = otherPlayers[id].ship;
        const nameLabel = otherPlayers[id].nameLabel;
        
        // Project 3D position to 2D screen coordinates
        const position = playerShip.position.clone();
        position.project(camera);
        
        // Convert to screen coordinates
        const x = (position.x * 0.5 + 0.5) * window.innerWidth;
        const y = (1 - (position.y * 0.5 + 0.5)) * window.innerHeight;
        
        // Only show label if in front of camera
        if (position.z < 1.0) {
            nameLabel.style.display = 'block';
            nameLabel.style.left = x + 'px';
            nameLabel.style.top = y + 'px';
        } else {
            nameLabel.style.display = 'none';
        }
    }
    
    // Update space object labels
    for (const id in spaceObjects) {
        const object = spaceObjects[id].object;
        const label = spaceObjects[id].label;
        
        // Calculate distance to object
        const distance = object.position.distanceTo(ship.position);
        
        // Only show labels for objects within a certain range
        const labelVisibleRange = 500;
        if (distance < labelVisibleRange) {
            // Project 3D position to 2D screen coordinates
            const position = object.position.clone();
            position.project(camera);
            
            // Convert to screen coordinates
            const x = (position.x * 0.5 + 0.5) * window.innerWidth;
            const y = (1 - (position.y * 0.5 + 0.5)) * window.innerHeight;
            
            // Only show label if in front of camera and in view
            if (position.z < 1.0 && x > 0 && x < window.innerWidth && y > 0 && y < window.innerHeight) {
                label.style.display = 'block';
                label.style.left = x + 'px';
                label.style.top = y + 'px';
                
                // Adjust opacity based on distance
                const opacity = Math.max(0.2, 1 - (distance / labelVisibleRange));
                label.style.opacity = opacity.toString();
            } else {
                label.style.display = 'none';
            }
        } else {
            label.style.display = 'none';
        }
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Check if device type changed (e.g., window resized to mobile size)
    const wasMobile = isMobile;
    isMobile = detectMobile();
    
    if (wasMobile !== isMobile) {
        // Device type changed, reinitialize controls
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.remove();
        }
        
        if (isMobile) {
            createTouchUI();
        }
    }
}
