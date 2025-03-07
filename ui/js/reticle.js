// Reticle UI Elements

// Create the reticle for orientation
function createOrientationReticle() {
    // Create container for reticles if it doesn't exist
    let reticlesContainer = document.getElementById('reticles-container');
    if (!reticlesContainer) {
        reticlesContainer = document.createElement('div');
        reticlesContainer.id = 'reticles-container';
        document.getElementById('game-container').appendChild(reticlesContainer);
    }
    
    // Create orientation reticle
    const reticle = document.createElement('div');
    reticle.id = 'orientation-reticle';
    reticle.className = 'reticle';
    reticle.innerHTML = `
        <div class="reticle-inner"></div>
        <div class="reticle-label">Orientation</div>
    `;
    reticlesContainer.appendChild(reticle);
    
    // Set its initial position to center of screen
    updateReticlePosition(reticle);
    
    // Add necessary CSS styles if not already added
    addReticleStyles();
    
    return reticle;
}

// Position the reticle at the center of the screen
function updateReticlePosition(reticle) {
    if (!reticle) return;
    
    reticle.style.position = 'absolute';
    reticle.style.left = `${window.innerWidth / 2}px`;
    reticle.style.top = `${window.innerHeight / 2}px`;
    reticle.style.display = 'block';
    reticle.style.transform = 'translate(-50%, -50%)';
    reticle.style.zIndex = '100';
    reticle.style.pointerEvents = 'none';
}

// Add CSS styles for the reticles
function addReticleStyles() {
    // Check if styles are already added
    if (document.getElementById('reticle-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'reticle-styles';
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