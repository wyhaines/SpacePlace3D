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
