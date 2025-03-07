// Create player ship model
function createPlayerShip() {
    // Simple spaceship geometry
    const geometry = new THREE.ConeGeometry(1, 4, 8);
    geometry.rotateX(Math.PI / 2);
    
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x3366ff,
        emissive: 0x112244,
        shininess: 30
    });
    
    ship = new THREE.Mesh(geometry, material);
    
    // Add ship body
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
    bodyGeometry.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.z = -1;
    ship.add(body);
    
    // Add wings
    const wingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2255cc,
        shininess: 30
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0, -1);
    ship.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0, -1);
    ship.add(rightWing);
    
    // Add engine glow
    const engineGlow = new THREE.PointLight(0x00aaff, 1, 10);
    engineGlow.position.z = -2;
    ship.add(engineGlow);
    
    scene.add(ship);
    
    // Position the ship
    ship.position.set(0, 0, 0);
    
    // Set up camera to follow ship
    updateCameraPosition();
    
    // Add a UI element for travel mode
    const travelModeDisplay = document.createElement('div');
    travelModeDisplay.id = 'travel-mode';
    travelModeDisplay.textContent = `Travel Mode: ${travelMode}`;
    document.getElementById('game-container').appendChild(travelModeDisplay);
    
    // Add a scan button
    const scanButton = document.createElement('button');
    scanButton.id = 'scan-button';
    scanButton.textContent = 'Scan Area';
    scanButton.onclick = sendScanRequest;
    document.getElementById('game-container').appendChild(scanButton);
}

// Create ships for other players
function createOtherPlayerShip(playerData) {
    // Simple spaceship for other players
    const geometry = new THREE.ConeGeometry(1, 4, 8);
    geometry.rotateX(Math.PI / 2);
    
    const material = new THREE.MeshPhongMaterial({ 
        color: 0xff3366, // Different color for other players
        emissive: 0x441122,
        shininess: 30
    });
    
    const playerShip = new THREE.Mesh(geometry, material);
    
    // Add ship body
    const bodyGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
    bodyGeometry.rotateX(Math.PI / 2);
    const body = new THREE.Mesh(bodyGeometry, material);
    body.position.z = -1;
    playerShip.add(body);
    
    // Add wings
    const wingGeometry = new THREE.BoxGeometry(4, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xcc2255,
        shininess: 30
    });
    
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-1.5, 0, -1);
    playerShip.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(1.5, 0, -1);
    playerShip.add(rightWing);
    
    // Add engine glow
    const engineGlow = new THREE.PointLight(0xff00aa, 1, 10);
    engineGlow.position.z = -2;
    playerShip.add(engineGlow);
    
    // Add player name label
    const nameDiv = document.createElement('div');
    nameDiv.className = 'player-label';
    nameDiv.textContent = playerData.name;
    document.getElementById('game-container').appendChild(nameDiv);
    
    // Position the ship
    playerShip.position.set(playerData.x, playerData.y, playerData.z);
    playerShip.rotation.y = playerData.rotationY;
    playerShip.rotation.z = playerData.rotationZ;
    
    scene.add(playerShip);
    
    // Store the player
    otherPlayers[playerData.id] = {
        ship: playerShip,
        nameLabel: nameDiv,
        markedForRemoval: false
    };
    
    return playerShip;
}

// Create space objects (stars, planets, etc.)
function createSpaceObject(objectData) {
    let geometry, material, object;
    
    switch(objectData.type) {
        case 'star':
            // Create a star with glow effect
            geometry = new THREE.SphereGeometry(objectData.radius, 32, 32);
            material = new THREE.MeshBasicMaterial({ 
                color: new THREE.Color(objectData.color),
                emissive: new THREE.Color(objectData.emissionColor),
                emissiveIntensity: objectData.emissionIntensity
            });
            object = new THREE.Mesh(geometry, material);
            
            // Add light for the star
            const starLight = new THREE.PointLight(
                new THREE.Color(objectData.color),
                1.0,
                objectData.radius * 100
            );
            object.add(starLight);
            
            // Add glow effect
            const starGlow = createGlowMesh(geometry, {
                color: new THREE.Color(objectData.color),
                coefficient: 0.5,
                power: 2.0
            });
            object.add(starGlow);
            break;
            
        case 'planet':
            // Create a planet
            geometry = new THREE.SphereGeometry(objectData.radius, 32, 16);
            material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(objectData.color),
                specular: 0x333333,
                shininess: 5
            });
            object = new THREE.Mesh(geometry, material);
            
            // Add rings if the planet has them
            if (objectData.hasRings) {
                const ringGeometry = new THREE.RingGeometry(
                    objectData.ringsInnerRadius,
                    objectData.ringsOuterRadius,
                    64
                );
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(objectData.ringsColor),
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.7
                });
                const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.rotation.x = Math.PI / 2;
                object.add(rings);
            }
            break;
            
        case 'moon':
            // Create a moon
            geometry = new THREE.SphereGeometry(objectData.radius, 16, 16);
            material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(objectData.color),
                specular: 0x111111,
                shininess: 2
            });
            object = new THREE.Mesh(geometry, material);
            break;
            
        case 'asteroid':
            // Create an irregular shape for asteroid
            geometry = new THREE.IcosahedronGeometry(objectData.radius, 0);
            // Randomize vertices a bit to make it look more irregular
            const positions = geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                positions.setXYZ(
                    i,
                    positions.getX(i) + (Math.random() - 0.5) * 0.2 * objectData.radius,
                    positions.getY(i) + (Math.random() - 0.5) * 0.2 * objectData.radius,
                    positions.getZ(i) + (Math.random() - 0.5) * 0.2 * objectData.radius
                );
            }
            positions.needsUpdate = true;
            geometry.computeVertexNormals();
            
            material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(objectData.color),
                flatShading: true
            });
            object = new THREE.Mesh(geometry, material);
            
            // Store rotation info
            object.userData.rotationSpeed = objectData.rotationSpeed;
            break;
            
        case 'nebula':
            // Create a nebula cloud as a particle system
            const particles = objectData.radius * 10;
            const particlePositions = new Float32Array(particles * 3);
            const particleSizes = new Float32Array(particles);
            
            for (let i = 0; i < particles; i++) {
                // Distribute particles in a sphere
                const radius = objectData.radius * Math.cbrt(Math.random());
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
                particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                particlePositions[i * 3 + 2] = radius * Math.cos(phi);
                
                // Random sizes for particles
                particleSizes[i] = Math.random() * 10;
            }
            
            geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
            geometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
            
            const particleMaterial = new THREE.PointsMaterial({
                color: new THREE.Color(objectData.color),
                transparent: true,
                opacity: objectData.opacity,
                size: 10,
                sizeAttenuation: true
            });
            
            object = new THREE.Points(geometry, particleMaterial);
            
            // Add light if nebula is emissive
            if (objectData.emission) {
                const nebulaLight = new THREE.PointLight(
                    new THREE.Color(objectData.emissionColor),
                    objectData.emissionIntensity,
                    objectData.radius * 2
                );
                object.add(nebulaLight);
            }
            break;
            
        case 'station':
            // Create a space station
            // Use a simple box shape for now
            geometry = new THREE.BoxGeometry(objectData.radius, objectData.radius * 0.5, objectData.radius * 2);
            material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(objectData.color),
                emissive: new THREE.Color(objectData.emissionColor),
                emissiveIntensity: objectData.emissionIntensity
            });
            object = new THREE.Mesh(geometry, material);
            
            // Add a small beacon light
            const stationLight = new THREE.PointLight(
                new THREE.Color(objectData.emissionColor),
                objectData.emissionIntensity,
                objectData.radius * 10
            );
            stationLight.position.set(0, objectData.radius, 0);
            object.add(stationLight);
            break;
            
        default:
            // Generic object for unknown types
            geometry = new THREE.SphereGeometry(objectData.radius, 16, 16);
            material = new THREE.MeshPhongMaterial({ 
                color: new THREE.Color(objectData.color)
            });
            object = new THREE.Mesh(geometry, material);
    }
    
    // Position the object
    object.position.set(objectData.x, objectData.y, objectData.z);
    
    // Add to scene
    scene.add(object);
    
    // Add a label for the object
    const labelDiv = document.createElement('div');
    labelDiv.className = 'object-label';
    labelDiv.textContent = objectData.name;
    labelDiv.style.display = 'none'; // Hidden by default, only show when close
    document.getElementById('game-container').appendChild(labelDiv);
    
    // Store the object
    spaceObjects[objectData.id] = {
        object: object,
        type: objectData.type,
        label: labelDiv,
        markedForRemoval: false
    };
    
    return object;
}

// Add stars to the background
function addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        sizeAttenuation: false
    });
    
    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    window.starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(window.starField);
}
