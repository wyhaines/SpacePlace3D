// Main Controls Logic - Non-module version
// This file depends on reticle.js, displays.js, touchControls.js and deviceUtils.js

// Global control variables
window.isMobile = false;
window.isPointerDown = false;
window.pointerX = 0;
window.pointerY = 0;
window.targetRotationY = 0;
window.targetRotationX = 0;
window.rotationSpeed = { x: 0, y: 0, z: 0 }; // Current rotation speed in x, y, and z axes
window.cameraRotation = { x: 0, y: 0, z: 0 }; // Camera rotation (pitch, yaw, roll)
window.shipForwardVector = new THREE.Vector3(0, 0, 1); // Direction ship is moving
window.shipViewOffset = { x: 0, y: -1.5, z: 5 }; // Ship position offset from camera view
window.maxRotationSpeed = 0.03; // Maximum rotation speed in radians per frame
window.rotationAcceleration = 0.001; // How quickly rotation speed increases
window.normalDampingStrength = 0.98; // Base damping for all rotations
window.autoDampingThreshold = 0.015; // Threshold for stronger auto-damping
window.strongDampingStrength = 0.94; // Stronger damping when over threshold (3-4x effect)
window.thrustLevel = 0; // -100% to 100% (negative is reverse)
window.isBraking = false;
window.touchButtons = {}; // Will hold references to touch control buttons
window.rotationDisplayElement = null; // Element to display rotation values
window.orientationReticleElement = null; // Element for orientation reticle

// Initialize controls based on device type
function initControls() {
    window.isMobile = detectMobile();
    
    // First check and clean up any duplicate UI elements
    if (typeof removeDuplicateReticles === 'function') {
        removeDuplicateReticles();
    }
    
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
    if (window.isMobile) {
        createTouchUI(
            increaseThrustLevel, 
            decreaseThrustLevel, 
            sendScanRequest, 
            toggleTravelMode
        );
    }
    
    // Initialize rotation variables
    window.cameraRotation = { x: 0, y: 0, z: 0 };
    window.rotationSpeed = { x: 0, y: 0, z: 0 };
    
    // Make sure visual range is set properly
    if (typeof Universe !== 'undefined' && Universe.instance) {
        window.visualRange = Universe.instance.visual_range || 5000.0;
    } else {
        window.visualRange = 5000.0; // Default if Universe not defined
    }
    
    // Create displays
    window.rotationDisplayElement = createRotationDisplay();
    window.orientationReticleElement = createOrientationReticle();
    
    // Position camera properly behind ship at initialization
    if (ship && camera) {
        // Position camera behind ship
        const cameraOffset = new THREE.Vector3(0, 5, -20);
        camera.position.copy(ship.position).add(cameraOffset);
        camera.lookAt(ship.position);
    }
    
    // Set up window resize handler
    window.addEventListener('resize', function() {
        handleWindowResize(
            function() { updateReticlePosition(window.orientationReticleElement); },
            function() { 
                createTouchUI(increaseThrustLevel, decreaseThrustLevel, 
                         sendScanRequest, toggleTravelMode);
            }
        );
    });
    
    console.log(`Controls initialized for ${window.isMobile ? 'mobile' : 'desktop'} device`);
}

// Handle pointer (mouse/touch) movement
function onPointerMove(event) {
    event.preventDefault();
    
    // Get pointer position
    if (event.type === 'touchmove') {
        window.pointerX = event.touches[0].clientX;
        window.pointerY = event.touches[0].clientY;
    } else {
        window.pointerX = event.clientX;
        window.pointerY = event.clientY;
    }
    
    // Always update target rotation to follow pointer direction
    if (window.isPointerDown) {
        calculateTargetRotationTowardPointer();
    }
}

// Handle pointer down event
function onPointerDown(event) {
    event.preventDefault();
    window.isPointerDown = true;
    
    // Get initial pointer position
    if (event.type === 'touchstart') {
        window.pointerX = event.touches[0].clientX;
        window.pointerY = event.touches[0].clientY;
    } else {
        window.pointerX = event.clientX;
        window.pointerY = event.clientY;
    }
    
    calculateTargetRotationTowardPointer();
}

// Handle pointer up event
function onPointerUp(event) {
    window.isPointerDown = false;
    // Don't immediately zero the rotation speed - let the damping handle it
}

// Calculate target rotation to turn toward pointer position
function calculateTargetRotationTowardPointer() {
    if (!ship) return;
    
    // Use the center of the screen as reference for rotation
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate vector from center to pointer
    const directionX = window.pointerX - centerX;
    const directionY = window.pointerY - centerY;
    
    // Convert to normalized direction
    const maxDistance = Math.min(window.innerWidth, window.innerHeight) / 2.5;
    const normalizedX = directionX / maxDistance;
    const normalizedY = directionY / maxDistance;
    
    // Calculate direction and magnitude
    const distance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    
    // Only apply rotation if pointer is outside the deadzone
    const deadzone = 0.1;
    if (distance > deadzone) {
        // Calculate target rotation speeds based on pointer position
        // Fixed: Clicking above should rotate up (negative X in Three.js)
        const targetSpeedX = -normalizedY * window.maxRotationSpeed; // Pitch (up/down)
        const targetSpeedY = -normalizedX * window.maxRotationSpeed; // Yaw (left/right)
        
        // Gradually accelerate toward target speeds (smoother control)
        window.rotationSpeed.x += (targetSpeedX - window.rotationSpeed.x) * window.rotationAcceleration * distance * 20;
        window.rotationSpeed.y += (targetSpeedY - window.rotationSpeed.y) * window.rotationAcceleration * distance * 20;
        
        // Clamp rotation speeds to prevent excessive spinning
        window.rotationSpeed.x = Math.max(-window.maxRotationSpeed, Math.min(window.maxRotationSpeed, window.rotationSpeed.x));
        window.rotationSpeed.y = Math.max(-window.maxRotationSpeed, Math.min(window.maxRotationSpeed, window.rotationSpeed.y));
    } else {
        // Apply normal damping when no input
        window.rotationSpeed.x *= window.normalDampingStrength;
        window.rotationSpeed.y *= window.normalDampingStrength;
    }
}

// Apply rotation damping
function applyDamping() {
    // Apply normal damping to all axes
    window.rotationSpeed.x *= window.normalDampingStrength;
    window.rotationSpeed.y *= window.normalDampingStrength;
    window.rotationSpeed.z *= window.normalDampingStrength;
    
    // Apply stronger damping when over threshold
    if (Math.abs(window.rotationSpeed.x) > window.autoDampingThreshold) {
        window.rotationSpeed.x *= window.strongDampingStrength;
    }
    
    if (Math.abs(window.rotationSpeed.y) > window.autoDampingThreshold) {
        window.rotationSpeed.y *= window.strongDampingStrength; 
    }
    
    if (Math.abs(window.rotationSpeed.z) > window.autoDampingThreshold) {
        window.rotationSpeed.z *= window.strongDampingStrength;
    }
    
    // If rotation speed is very low, just zero it out to prevent jittering
    if (Math.abs(window.rotationSpeed.x) < 0.0001) window.rotationSpeed.x = 0;
    if (Math.abs(window.rotationSpeed.y) < 0.0001) window.rotationSpeed.y = 0;
    if (Math.abs(window.rotationSpeed.z) < 0.0001) window.rotationSpeed.z = 0;
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
        window.isBraking = true;
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
    
    // Roll control with Q/A
    if (event.code === 'KeyD') {
        window.rotationSpeed.z += 0.01; // Roll right
    }
    if (event.code === 'KeyA') {
        window.rotationSpeed.z -= 0.01; // Roll left
    }
}

// Key up event handler
function onKeyUp(event) {
    keys[event.code] = false;
    
    // Reset braking
    if (event.code === 'Space') {
        window.isBraking = false;
    }
    
    if (event.code === 'KeyT') {
        window.travelKeyPressed = false;
    }
}

// Increase thrust level (move forward faster)
function increaseThrustLevel() {
    window.thrustLevel = Math.min(100, window.thrustLevel + 10);
    updateThrustDisplay();
}

// Decrease thrust level (slow down or move backward)
function decreaseThrustLevel() {
    window.thrustLevel = Math.max(-100, window.thrustLevel - 10);
    updateThrustDisplay();
}

// Apply braking (rapidly bring thrust to zero)
function applyBraking() {
    if (window.thrustLevel > 0) {
        window.thrustLevel = Math.max(0, window.thrustLevel - 5);
    } else if (window.thrustLevel < 0) {
        window.thrustLevel = Math.min(0, window.thrustLevel + 5);
    }
    updateThrustDisplay();
}

// Update the thrust display in UI
function updateThrustDisplay() {
    const thrustDisplay = document.getElementById('thrust-display');
    if (thrustDisplay) {
        const displayValue = window.thrustLevel >= 0 ? 
            `Thrust: +${window.thrustLevel}%` : 
            `Thrust: ${window.thrustLevel}%`;
        
        thrustDisplay.textContent = displayValue;
        
        // Update thrust bar visual
        const thrustBar = document.getElementById('thrust-bar-fill');
        if (thrustBar) {
            // Handle positive and negative thrust visually
            if (window.thrustLevel >= 0) {
                thrustBar.style.width = `${window.thrustLevel}%`;
                thrustBar.style.marginLeft = '0';
                
                // Change color based on thrust level
                if (window.thrustLevel > 75) {
                    thrustBar.style.backgroundColor = '#ff3300';
                } else if (window.thrustLevel > 40) {
                    thrustBar.style.backgroundColor = '#ffaa00';
                } else {
                    thrustBar.style.backgroundColor = '#00aaff';
                }
            } else {
                // For negative thrust, show bar from right to left
                const absThrust = Math.abs(window.thrustLevel);
                thrustBar.style.width = `${absThrust}%`;
                thrustBar.style.marginLeft = `${100 - absThrust}%`;
                thrustBar.style.backgroundColor = '#aa00ff'; // Different color for reverse
            }
        }
    }
}

// Function to update camera position and rotation
// Debug function to help fix camera and ship positioning
function debugShipVisibility() {
    console.log("Camera position:", camera.position);
    console.log("Ship position:", ship.position);
    console.log("Camera-ship offset:", {
        x: ship.position.x - camera.position.x,
        y: ship.position.y - camera.position.y,
        z: ship.position.z - camera.position.z
    });
    console.log("Ship view offset:", window.shipViewOffset);
    console.log("Camera rotation:", window.cameraRotation);
}

// Update the updateCameraPosition function to ensure ship is visible
function updateCameraPosition() {
    if (!ship || !camera) return;
    
    // 1. Update the camera's rotation based on our rotation speeds
    window.cameraRotation.x += window.rotationSpeed.x;
    window.cameraRotation.y += window.rotationSpeed.y;
    window.cameraRotation.z += window.rotationSpeed.z;
    
    // Keep rotations within 0-2π range
    if (window.cameraRotation.y > Math.PI * 2) window.cameraRotation.y -= Math.PI * 2;
    if (window.cameraRotation.y < 0) window.cameraRotation.y += Math.PI * 2;
    if (window.cameraRotation.x > Math.PI * 2) window.cameraRotation.x -= Math.PI * 2;
    if (window.cameraRotation.x < 0) window.cameraRotation.x += Math.PI * 2;
    if (window.cameraRotation.z > Math.PI * 2) window.cameraRotation.z -= Math.PI * 2;
    if (window.cameraRotation.z < 0) window.cameraRotation.z += Math.PI * 2;
    
    // 2. Set ship rotation first (ship rotation drives movement direction)
    // Make the ship model always appear level with the camera's view
    const shipLevelQuaternion = new THREE.Quaternion();
    
    // Create ship orientation that matches camera yaw but keeps level pitch
    const shipEuler = new THREE.Euler(0, window.cameraRotation.y, 0, 'YXZ');
    shipLevelQuaternion.setFromEuler(shipEuler);
    
    // Apply roll from camera to ship
    const rollQuat = new THREE.Quaternion();
    rollQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), window.cameraRotation.z);
    shipLevelQuaternion.multiply(rollQuat);
    
    // Set ship rotation
    ship.setRotationFromQuaternion(shipLevelQuaternion);
    
    // Add a slight bank effect during yaw rotation
    const bankAmount = Math.min(Math.abs(window.rotationSpeed.y * 15), 0.3);
    const bankDirection = window.rotationSpeed.y > 0 ? -1 : 1; // Bank left when turning right
    if (Math.abs(window.rotationSpeed.y) > 0.001) {
        ship.rotation.z += bankAmount * bankDirection;
    }
    
    // 3. Calculate the forward vector based on camera orientation
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler(window.cameraRotation.x, window.cameraRotation.y, window.cameraRotation.z, 'YXZ');
    quaternion.setFromEuler(euler);
    
    window.shipForwardVector.set(0, 0, 1);
    window.shipForwardVector.applyQuaternion(quaternion);
    
    // 4. Position camera behind ship (CRITICAL DIFFERENCE)
    // Instead of positioning ship from camera, we position camera from ship
    const cameraOffset = new THREE.Vector3(0, 5, -20); // Camera is behind (negative Z) and above (positive Y) the ship
    cameraOffset.applyQuaternion(quaternion);
    
    // First update ship position
    // (camera position will be set relative to ship position)
    
    // 5. Camera rotation
    camera.rotation.copy(euler);
}

// Update the updateShipPosition function to correctly move ship first, camera second
function updateShipPosition() {
    // 1. If not actively controlling the ship, apply damping
    if (!window.isPointerDown) {
        applyDamping();
    }
    
    // 2. Update camera and ship rotations
    updateCameraPosition();
    
    // 3. Handle acceleration/deceleration
    if (window.isBraking) {
        applyBraking();
    }
    
    // Calculate current ship speed based on thrust level
    const maxSpeed = travelSpeed; // Base max speed affected by travel mode
    const currentSpeed = (window.thrustLevel / 100) * maxSpeed;
    
    // 4. Apply forward/backward movement using the ship's forward vector
    const movement = window.shipForwardVector.clone().multiplyScalar(currentSpeed);
    
    // UPDATED: Move ship first
    ship.position.add(movement);
    
    // UPDATED: Position camera relative to ship
    const cameraOffset = new THREE.Vector3(0, 5, -20); // Behind and above
    cameraOffset.applyQuaternion(ship.quaternion);
    camera.position.copy(ship.position).add(cameraOffset);
    camera.lookAt(ship.position);
    
    // 5. Update the reticle position
    updateReticlePosition(window.orientationReticleElement);
    
    // 6. Display updates
    // Update coordinates display
    coordinatesDisplay.textContent = `Position: (${ship.position.x.toFixed(1)}, ${ship.position.y.toFixed(1)}, ${ship.position.z.toFixed(1)})`;
    
    // Update rotation display - now shows camera rotation
    updateRotationDisplay(window.rotationDisplayElement, window.cameraRotation, window.rotationSpeed);
    
    // 7. Send position update to server
    if (connected) {
        const positionMessage = {
            type: 'position',
            x: ship.position.x,
            y: ship.position.y,
            z: ship.position.z,
            rotationY: window.cameraRotation.y,
            rotationZ: window.cameraRotation.z
        };
        socket.send(JSON.stringify(positionMessage));
    }
    
    // 8. Update labels for space objects
    updateObjectLabels();
}

// Update the visual range for space objects
function updateVisualRange() {
    // Set a reasonable default visual range if it's not defined
    if (!window.visualRange || window.visualRange < 1000) {
        window.visualRange = 5000.0; // Default visual range
        
        // If there's a Universe object with visualRange, copy that value
        if (typeof Universe !== 'undefined' && Universe.instance && Universe.instance.visual_range) {
            window.visualRange = Universe.instance.visual_range;
        }
    }
    
    console.log("Visual range set to:", window.visualRange);
    
    // You could add this function call to initControls() to ensure visual range is set properly
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
