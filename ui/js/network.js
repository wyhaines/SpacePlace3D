// Initialize WebSocket connection
function connectToServer() {
    try {
        // Update status to connecting
        connectionStatus.textContent = 'Connecting...';
        connectionStatus.className = 'disconnected';
        
        // Connect to the WebSocket endpoint
        console.log('Connecting to WebSocket server...');
        socket = new WebSocket('ws://localhost:3333/game');
        
        socket.onopen = function() {
            console.log('WebSocket connection established');
            connected = true;
            connectionStatus.textContent = 'Connected';
            connectionStatus.className = 'connected';
            
            // Send player join event
            const joinMessage = {
                type: 'join',
                name: playerName
            };
            console.log('Sending join message:', joinMessage);
            socket.send(JSON.stringify(joinMessage));
        };
        
        socket.onclose = function(event) {
            console.log('WebSocket connection closed:', event.code, event.reason);
            connected = false;
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.className = 'disconnected';
            
            // Try to reconnect after a delay
            console.log('Attempting to reconnect in 3 seconds...');
            setTimeout(connectToServer, 3000);
        };
        
        socket.onmessage = function(event) {
            try {
                const message = JSON.parse(event.data);
                console.log('Received message:', message);
                handleServerMessage(message);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
        
        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
            connectionStatus.textContent = 'Connection Error';
            connectionStatus.className = 'disconnected';
        };
    } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        connectionStatus.textContent = 'Connection Failed';
        connectionStatus.className = 'disconnected';
        setTimeout(connectToServer, 3000);
    }
}

// Handle messages from the server
function handleServerMessage(message) {
    switch(message.type) {
        case 'welcome':
            playerId = message.data.id;
            // If we have a starting position, update the ship
            if (message.data.position) {
                ship.position.set(
                    message.data.position.x,
                    message.data.position.y,
                    message.data.position.z
                );
                
                // Update camera to follow ship
                updateCameraPosition();
            }
            
            console.log('Joined game with ID:', playerId);
            break;
            
        case 'universe_info':
            // Update universe information
            visualRange = message.data.visual_range;
            nebulaDensity = message.data.nebula_density;
            nebulaColor = message.data.nebula_color;
            
            // Setup the nebula if it doesn't exist
            if (!nebulaParticles) {
                createNebulaEffect();
            }
            
            console.log('Received universe info:', message.data);
            break;
            
        case 'game_state':
            updateGameState(message.data);
            break;
            
        case 'ship_damage':
            updateShipStatus(message.data);
            break;
            
        case 'travel_mode_change':
            travelMode = message.data.mode;
            travelSpeed = message.data.speed;
            document.getElementById('travel-mode').textContent = `Travel Mode: ${travelMode}`;
            
            // Visual effects for different travel modes
            if (travelMode === 'superluminal') {
                createWarpEffect(true);
            } else {
                createWarpEffect(false);
            }
            
            console.log('Travel mode changed:', travelMode, 'speed:', travelSpeed);
            break;
            
        case 'scan_result':
            displayScanResults(message.data);
            break;
    }
}

// Update game state based on server data
function updateGameState(data) {
    // Update other players
    if (data.players) {
        // First, mark all current players for removal
        for (const id in otherPlayers) {
            otherPlayers[id].markedForRemoval = true;
        }
        
        // Update or add players from the server data
        data.players.forEach(playerData => {
            if (playerData.id === playerId) return; // Skip self
            
            if (otherPlayers[playerData.id]) {
                // Update existing player
                const playerShip = otherPlayers[playerData.id].ship;
                playerShip.position.set(playerData.x, playerData.y, playerData.z);
                playerShip.rotation.y = playerData.rotationY;
                playerShip.rotation.z = playerData.rotationZ;
                
                // Mark as not to be removed
                otherPlayers[playerData.id].markedForRemoval = false;
            } else {
                // Create new player ship
                createOtherPlayerShip(playerData);
            }
        });
        
        // Remove players that are no longer visible
        for (const id in otherPlayers) {
            if (otherPlayers[id].markedForRemoval) {
                scene.remove(otherPlayers[id].ship);
                if (otherPlayers[id].nameLabel.parentNode) {
                    otherPlayers[id].nameLabel.parentNode.removeChild(otherPlayers[id].nameLabel);
                }
                delete otherPlayers[id];
            }
        }
    }
    
    // Update space objects (stars, planets, etc.)
    if (data.spaceObjects) {
        // Mark all current objects for removal
        for (const id in spaceObjects) {
            spaceObjects[id].markedForRemoval = true;
        }
        
        // Update or add space objects
        data.spaceObjects.forEach(objectData => {
            if (spaceObjects[objectData.id]) {
                // Update existing object
                const object = spaceObjects[objectData.id].object;
                object.position.set(objectData.x, objectData.y, objectData.z);
                
                // Mark as not to be removed
                spaceObjects[objectData.id].markedForRemoval = false;
            } else {
                // Create new space object
                createSpaceObject(objectData);
            }
        });
        
        // Remove objects that are no longer visible
        for (const id in spaceObjects) {
            if (spaceObjects[id].markedForRemoval) {
                scene.remove(spaceObjects[id].object);
                if (spaceObjects[id].label && spaceObjects[id].label.parentNode) {
                    spaceObjects[id].label.parentNode.removeChild(spaceObjects[id].label);
                }
                delete spaceObjects[id];
            }
        }
    }
    
    // Update nebula information
    if (data.nebulaInfo) {
        // Update nebula properties if they've changed
        if (nebulaDensity !== data.nebulaInfo.density || nebulaColor !== data.nebulaInfo.color) {
            nebulaDensity = data.nebulaInfo.density;
            nebulaColor = data.nebulaInfo.color;
            
            // Update the nebula visuals
            updateNebulaEffect();
        }
    }
}

// Send scan request to server
function sendScanRequest() {
    if (connected) {
        const scanMessage = {
            type: 'scan_area'
        };
        socket.send(JSON.stringify(scanMessage));
    }
}

// Toggle travel mode
function toggleTravelMode() {
    if (connected) {
        const newMode = travelMode === 'subluminal' ? 'superluminal' : 'subluminal';
        
        const travelModeMessage = {
            type: 'travel_mode',
            mode: newMode
        };
        socket.send(JSON.stringify(travelModeMessage));
    }
}
