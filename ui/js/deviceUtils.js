// Device Detection and Utilities

// Check if device is mobile
function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 800;
}

// Handle window resize event - simplified version for direct call from other files
function onWindowResize() {
    // Update camera aspect ratio and renderer size
    if (window.camera) {
        window.camera.aspect = window.innerWidth / window.innerHeight;
        window.camera.updateProjectionMatrix();
    }
    
    if (window.renderer) {
        window.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Update reticle position if it exists
    if (window.orientationReticleElement && typeof updateReticlePosition === 'function') {
        updateReticlePosition(window.orientationReticleElement);
    }
    
    // Check if device type changed (e.g., window resized to mobile size)
    const wasMobile = window.isMobile;
    window.isMobile = detectMobile();
    
    if (wasMobile !== window.isMobile) {
        // Device type changed, reinitialize controls
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.remove();
        }
        
        if (window.isMobile && typeof createTouchUI === 'function') {
            createTouchUI(
                window.increaseThrustLevel || function(){}, 
                window.decreaseThrustLevel || function(){}, 
                window.sendScanRequest || function(){}, 
                window.toggleTravelMode || function(){}
            );
        }
    }
}

// More comprehensive resize handler for use within controls system
function handleWindowResize(updateReticleCallback, createTouchUICallback) {
    // Update camera aspect ratio and renderer size
    if (window.camera) {
        window.camera.aspect = window.innerWidth / window.innerHeight;
        window.camera.updateProjectionMatrix();
    }
    
    if (window.renderer) {
        window.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Update reticle position
    if (updateReticleCallback) {
        updateReticleCallback();
    }
    
    // Check if device type changed (e.g., window resized to mobile size)
    const wasMobile = window.isMobile;
    window.isMobile = detectMobile();
    
    if (wasMobile !== window.isMobile) {
        // Device type changed, reinitialize controls
        const touchControls = document.getElementById('touch-controls');
        if (touchControls) {
            touchControls.remove();
        }
        
        if (window.isMobile && createTouchUICallback) {
            createTouchUICallback();
        }
    }
}
