// UI Display Elements

// Create rotation display element
function createRotationDisplay() {
    const rotationDisplayElement = document.createElement('div');
    rotationDisplayElement.id = 'rotation-display';
    rotationDisplayElement.className = 'rotation-display';
    rotationDisplayElement.style.position = 'absolute';
    rotationDisplayElement.style.left = '10px';
    rotationDisplayElement.style.bottom = '50px';
    rotationDisplayElement.style.color = 'white';
    rotationDisplayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    rotationDisplayElement.style.padding = '5px';
    rotationDisplayElement.style.borderRadius = '5px';
    rotationDisplayElement.style.fontFamily = 'monospace';
    rotationDisplayElement.style.fontSize = '12px';
    rotationDisplayElement.style.whiteSpace = 'pre';
    rotationDisplayElement.style.zIndex = '100';
    document.getElementById('game-container').appendChild(rotationDisplayElement);
    
    return rotationDisplayElement;
}

// Update rotation display with current values
function updateRotationDisplay(displayElement, cameraRotation, rotationSpeed) {
    if (!displayElement) return;
    
    // Convert camera rotation from radians to degrees for display
    const pitchDeg = (cameraRotation.x * 180 / Math.PI) % 360;
    const yawDeg = (cameraRotation.y * 180 / Math.PI) % 360;
    const rollDeg = (cameraRotation.z * 180 / Math.PI) % 360;
    
    // Convert rotation speed from radians/frame to degrees/second (assuming 60fps)
    const pitchRateDeg = rotationSpeed.x * 180 / Math.PI * 60;
    const yawRateDeg = rotationSpeed.y * 180 / Math.PI * 60;
    const rollRateDeg = rotationSpeed.z * 180 / Math.PI * 60;
    
    // Format display text
    displayElement.innerHTML = 
        `Pitch: ${pitchDeg.toFixed(1)}° (${pitchRateDeg.toFixed(1)}°/s)\n` +
        `Yaw:   ${yawDeg.toFixed(1)}° (${yawRateDeg.toFixed(1)}°/s)\n` +
        `Roll:  ${rollDeg.toFixed(1)}° (${rollRateDeg.toFixed(1)}°/s)`;
}

// Create thrust display element
function createThrustDisplay() {
    const thrustDisplay = document.createElement('div');
    thrustDisplay.id = 'thrust-display';
    thrustDisplay.className = 'thrust-display';
    thrustDisplay.textContent = 'Thrust: 0%';
    document.getElementById('game-container').appendChild(thrustDisplay);
    
    return thrustDisplay;
}

// Create thrust bar element
function createThrustBar() {
    const thrustBarContainer = document.createElement('div');
    thrustBarContainer.id = 'thrust-bar-container';
    thrustBarContainer.className = 'thrust-bar-container';
    
    const thrustBarFill = document.createElement('div');
    thrustBarFill.id = 'thrust-bar-fill';
    thrustBarFill.className = 'thrust-bar-fill';
    
    thrustBarContainer.appendChild(thrustBarFill);
    document.getElementById('game-container').appendChild(thrustBarContainer);
    
    return {
        container: thrustBarContainer,
        fill: thrustBarFill
    };
}