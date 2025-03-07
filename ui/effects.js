// Create a nebula effect (background gas clouds)
function createNebulaEffect() {
    const particleCount = Math.floor(10000 * nebulaDensity);
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const color = new THREE.Color(nebulaColor);
    
    for (let i = 0; i < particleCount; i++) {
        // Position particles throughout the visual range
        positions[i * 3] = (Math.random() - 0.5) * visualRange * 2;
        positions[i * 3 + 1] = (Math.random() - 0.5) * visualRange * 0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * visualRange * 2;
        
        // Color variation
        const r = color.r + (Math.random() - 0.5) * 0.2;
        const g = color.g + (Math.random() - 0.5) * 0.2;
        const b = color.b + (Math.random() - 0.5) * 0.2;
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
        
        // Random sizes
        sizes[i] = Math.random() * 20;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const material = new THREE.PointsMaterial({
        size: 10,
        transparent: true,
        opacity: 0.3,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    nebulaParticles = new THREE.Points(particles, material);
    scene.add(nebulaParticles);
}

// Update the nebula effect if properties change
function updateNebulaEffect() {
    if (nebulaParticles) {
        scene.remove(nebulaParticles);
        nebulaParticles = null;
    }
    
    createNebulaEffect();
}

// Create a glow effect for objects
function createGlowMesh(geometry, options) {
    const material = new THREE.ShaderMaterial({
        uniforms: {
            "c": { value: options.coefficient || 0.5 },
            "p": { value: options.power || 2.0 },
            glowColor: { value: options.color || new THREE.Color(0x00ffff) }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vViewPosition = cameraPosition - worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float c;
            uniform float p;
            uniform vec3 glowColor;
            
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            
            void main() {
                float intensity = pow(c - dot(normalize(vNormal), normalize(vViewPosition)), p);
                gl_FragColor = vec4(glowColor, intensity);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.multiplyScalar(1.2); // Scale slightly larger than the original geometry
    return mesh;
}

// Create warp effect when in superluminal travel mode
function createWarpEffect(enable) {
    if (enable) {
        // Add warp lines effect
        if (!window.warpEffect) {
            const warpGeometry = new THREE.BufferGeometry();
            const warpLines = 200;
            const warpPositions = new Float32Array(warpLines * 6); // 2 points per line (start and end)
            
            for (let i = 0; i < warpLines; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                // Start point (near camera)
                warpPositions[i * 6] = Math.sin(phi) * Math.cos(theta) * 50;
                warpPositions[i * 6 + 1] = Math.sin(phi) * Math.sin(theta) * 50;
                warpPositions[i * 6 + 2] = Math.cos(phi) * 50;
                
                // End point (far away)
                warpPositions[i * 6 + 3] = Math.sin(phi) * Math.cos(theta) * 2000;
                warpPositions[i * 6 + 4] = Math.sin(phi) * Math.sin(theta) * 2000;
                warpPositions[i * 6 + 5] = Math.cos(phi) * 2000;
            }
            
            warpGeometry.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));
            
            const warpMaterial = new THREE.LineBasicMaterial({
                color: 0x00ffff,
                opacity: 0.6,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            
            window.warpEffect = new THREE.LineSegments(warpGeometry, warpMaterial);
            window.warpEffect.frustumCulled = false; // Don't cull because we want to see the effect in all directions
        }
        
        // Add the effect to the ship or camera
        camera.add(window.warpEffect);
    } else {
        // Remove warp effect
        if (window.warpEffect) {
            camera.remove(window.warpEffect);
        }
    }
}

// Create directional reticles for both ship orientation and movement vector
function createReticles() {
    // Create container for reticles
    const reticlesContainer = document.createElement('div');
    reticlesContainer.id = 'reticles-container';
    document.getElementById('game-container').appendChild(reticlesContainer);
    
    // Create ship orientation reticle (showing where the nose is pointing)
    const orientationReticle = document.createElement('div');
    orientationReticle.id = 'orientation-reticle';
    orientationReticle.className = 'reticle';
    orientationReticle.innerHTML = `
        <div class="reticle-inner"></div>
        <div class="reticle-label">Orientation</div>
    `;
    reticlesContainer.appendChild(orientationReticle);
    
    // Create movement vector reticle (showing actual travel direction)
    const movementReticle = document.createElement('div');
    movementReticle.id = 'movement-reticle';
    movementReticle.className = 'reticle movement-reticle';
    movementReticle.innerHTML = `
        <div class="reticle-inner"></div>
        <div class="reticle-label">Movement</div>
    `;
    reticlesContainer.appendChild(movementReticle);
}

// Update reticle positions based on ship orientation and movement
function updateReticles() {
    if (!ship) return;
    
    const orientationReticle = document.getElementById('orientation-reticle');
    const movementReticle = document.getElementById('movement-reticle');
    
    if (!orientationReticle || !movementReticle) return;
    
    // Calculate ship's forward direction vector (orientation)
    const forwardDirection = new THREE.Vector3(0, 0, 1);
    forwardDirection.applyQuaternion(ship.quaternion);
    forwardDirection.normalize();
    
    // Project orientation to screen space
    const orientationScreenPos = projectToScreen(forwardDirection.clone().multiplyScalar(100).add(ship.position));
    
    // Position orientation reticle
    if (orientationScreenPos.visible) {
        orientationReticle.style.display = 'block';
        orientationReticle.style.left = orientationScreenPos.x + 'px';
        orientationReticle.style.top = orientationScreenPos.y + 'px';
    } else {
        orientationReticle.style.display = 'none';
    }
    
    // For movement vector, we need to track the ship's actual movement
    // For now, we'll assume it's the same as orientation, but this will change
    // when Newtonian physics are implemented
    
    // Get the ship's current velocity (direction of travel)
    // Note: This will need to be updated once you implement a proper physics system
    // For now, we'll use a simplified approach
    const movementDir = new THREE.Vector3();
    
    if (window.lastShipPosition) {
        movementDir.copy(ship.position).sub(window.lastShipPosition);
        
        // Only update if there's significant movement
        if (movementDir.length() > 0.001) {
            movementDir.normalize();
            // Project movement to screen space
            const movementScreenPos = projectToScreen(movementDir.clone().multiplyScalar(100).add(ship.position));
            
            // Position movement reticle
            if (movementScreenPos.visible) {
                movementReticle.style.display = 'block';
                movementReticle.style.left = movementScreenPos.x + 'px';
                movementReticle.style.top = movementScreenPos.y + 'px';
            } else {
                movementReticle.style.display = 'none';
            }
        }
    }
    
    // Store current position for next frame
    window.lastShipPosition = ship.position.clone();
}

// Helper function to project a 3D point to screen space
function projectToScreen(point) {
    const vector = point.clone();
    vector.project(camera);
    
    const widthHalf = window.innerWidth / 2;
    const heightHalf = window.innerHeight / 2;
    
    const x = (vector.x * widthHalf) + widthHalf;
    const y = -(vector.y * heightHalf) + heightHalf;
    
    // Check if point is in front of camera
    const visible = vector.z < 1;
    
    return {
        x: x,
        y: y,
        visible: visible
    };
}

// Add CSS styles for the reticles
function addReticleStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .reticle {
            position: absolute;
            width: 30px;
            height: 30px;
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: 100;
        }
        
        .reticle-inner {
            position: relative;
            width: 100%;
            height: 100%;
            border: 2px solid #00aaff;
            border-radius: 50%;
            box-sizing: border-box;
        }
        
        .reticle-inner::before, .reticle-inner::after {
            content: '';
            position: absolute;
            background-color: #00aaff;
        }
        
        .reticle-inner::before {
            width: 2px;
            height: 10px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
        
        .reticle-inner::after {
            width: 10px;
            height: 2px;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
        
        .reticle-label {
            position: absolute;
            width: 80px;
            text-align: center;
            left: 50%;
            bottom: -20px;
            transform: translateX(-50%);
            color: #00aaff;
            font-size: 10px;
            text-shadow: 0 0 2px black;
        }
        
        #orientation-reticle .reticle-inner {
            border-color: #00aaff;
        }
        
        #orientation-reticle .reticle-inner::before, 
        #orientation-reticle .reticle-inner::after {
            background-color: #00aaff;
        }
        
        #orientation-reticle .reticle-label {
            color: #00aaff;
        }
        
        #movement-reticle .reticle-inner {
            border-color: #ff00aa;
        }
        
        #movement-reticle .reticle-inner::before, 
        #movement-reticle .reticle-inner::after {
            background-color: #ff00aa;
        }
        
        #movement-reticle .reticle-label {
            color: #ff00aa;
        }
    `;
    document.head.appendChild(styleElement);
}
