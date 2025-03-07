// Update camera to follow ship
function updateCameraPosition() {
    const cameraOffset = new THREE.Vector3(0, 5, 15);
    cameraOffset.applyQuaternion(ship.quaternion);
    camera.position.copy(ship.position).add(cameraOffset);
    camera.lookAt(ship.position);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Key down event handler
function onKeyDown(event) {
    keys[event.code] = true;
}

// Key up event handler
function onKeyUp(event) {
    keys[event.code] = false;
}

// Update ship position based on key inputs
function updateShipPosition() {
    // Base speed factor (adjusted by travel mode)
    const baseMoveSpeed = 0.5 * travelSpeed;
    const baseRotateSpeed = 0.03 / (travelSpeed > 10 ? Math.log10(travelSpeed) : 1);
    
    // Forward/backward movement
    if (keys['ArrowUp'] || keys['KeyW']) {
        ship.translateZ(baseMoveSpeed);
    }
    if (keys['ArrowDown'] || keys['KeyS']) {
        ship.translateZ(-baseMoveSpeed);
    }
    
    // Rotation
    if (keys['ArrowLeft'] || keys['KeyA']) {
        ship.rotateY(baseRotateSpeed);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        ship.rotateY(-baseRotateSpeed);
    }
    
    // Roll
    if (keys['KeyQ']) {
        ship.rotateZ(baseRotateSpeed);
    }
    if (keys['KeyE']) {
        ship.rotateZ(-baseRotateSpeed);
    }
    
    // Up/down movement
    if (keys['ShiftLeft']) {
        ship.translateY(baseMoveSpeed);
    }
    if (keys['ControlLeft']) {
        ship.translateY(-baseMoveSpeed);
    }
    
    // Toggle travel mode
    if (keys['KeyT'] && !window.travelKeyPressed) {
        window.travelKeyPressed = true;
        toggleTravelMode();
    }
    
    if (!keys['KeyT']) {
        window.travelKeyPressed = false;
    }
    
    // Update position display
    coordinatesDisplay.textContent = `Position: (${ship.position.x.toFixed(1)}, ${ship.position.y.toFixed(1)}, ${ship.position.z.toFixed(1)})`;
    
    // Send position update to server
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
    
    // Update camera position to follow ship
    updateCameraPosition();
    
    // Update labels for space objects
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
