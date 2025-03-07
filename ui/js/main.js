// Initialize Three.js scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add some stars to the background
    addStars();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, -30); // Position camera behind ship initially
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    
    // Create player ship
    createPlayerShip();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Start game loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (ship) {
        updateShipPosition();
        // Update the reticles to match ship orientation and movement
        updateReticles();
    }
    
    // Animate space objects
    for (const id in spaceObjects) {
        const object = spaceObjects[id].object;
        const type = spaceObjects[id].type;
        
        if (type === 'asteroid' && object.userData.rotationSpeed) {
            // Rotate asteroids
            object.rotation.x += object.userData.rotationSpeed * 0.01;
            object.rotation.y += object.userData.rotationSpeed * 0.02;
        }
    }
    
    // Animate nebula particles if they exist
    if (nebulaParticles) {
        // Slowly rotate the nebula for a dynamic effect
        nebulaParticles.rotation.y += 0.0001;
    }
    
    // Create a subtle parallax effect for stars based on ship movement
    if (window.starField && ship) {
        window.starField.position.x = -ship.position.x / 1000;
        window.starField.position.y = -ship.position.y / 1000;
        window.starField.position.z = -ship.position.z / 1000;
    }
    
    // Update direction indicator position if touch/mouse is active
    if (isPointerDown && ship) {
        const indicator = document.getElementById('direction-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            indicator.style.left = `${pointerX}px`;
            indicator.style.top = `${pointerY}px`;
        }
    } else {
        const indicator = document.getElementById('direction-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }
    
    renderer.render(scene, camera);
}

// Initialize the application
function init() {
    setupUIEventListeners();
}

// Add the setupUIEventListeners function to create the necessary UI elements
function setupUIEventListeners() {
    // Join button
    joinButton.addEventListener('click', function() {
        playerName = playerNameInput.value.trim();
        
        if (playerName.length < 1) {
            alert('Please enter a call sign');
            return;
        }
        
        // Hide login screen, show game UI
        loginScreen.style.display = 'none';
        gameUI.style.display = 'block';
        
        // Initialize game
        initThreeJS();
        connectToServer();
    });
    
    // Controls info toggle
    document.getElementById('controls-button').addEventListener('click', function() {
        const controlsInfo = document.getElementById('controls-info');
        if (controlsInfo.style.display === 'none') {
            controlsInfo.style.display = 'block';
            this.textContent = 'Hide Controls';
        } else {
            controlsInfo.style.display = 'none';
            this.textContent = 'Show Controls';
        }
    });
}

// Call init when the page loads
window.addEventListener('load', init);
