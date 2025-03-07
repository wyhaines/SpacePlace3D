// Initialize Three.js scene
function initThreeJS() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Add some stars to the background
    addStars();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(0, 10, 30);
    
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
    
    // Set up controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Start game loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (ship) {
        updateShipPosition();
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
    if (window.starField) {
        window.starField.position.x = -ship.position.x / 1000;
        window.starField.position.y = -ship.position.y / 1000;
        window.starField.position.z = -ship.position.z / 1000;
    }
    
    renderer.render(scene, camera);
}

// Initialize the application
function init() {
    setupUIEventListeners();
}

// Call init when the page loads
window.addEventListener('load', init);
