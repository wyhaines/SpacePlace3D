// Update ship status display
function updateShipStatus(data) {
    if (data.hull) {
        shipStatus.textContent = `Hull Integrity: ${data.hull}%`;
    }
}

// Display scan results
function displayScanResults(data) {
    if (data.nearestObject) {
        // Create or update the scan result panel
        let scanPanel = document.getElementById('scan-panel');
        
        if (!scanPanel) {
            scanPanel = document.createElement('div');
            scanPanel.id = 'scan-panel';
            document.getElementById('game-container').appendChild(scanPanel);
            
            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'X';
            closeButton.style.position = 'absolute';
            closeButton.style.top = '5px';
            closeButton.style.right = '5px';
            closeButton.style.background = 'transparent';
            closeButton.style.border = 'none';
            closeButton.style.color = 'white';
            closeButton.style.cursor = 'pointer';
            closeButton.onclick = function() {
                scanPanel.style.display = 'none';
            };
            scanPanel.appendChild(closeButton);
        }
        
        scanPanel.style.display = 'block';
        
        // Format the object details based on its type
        const obj = data.nearestObject;
        let detailsHTML = `
            <h3>Scan Results</h3>
            <p><strong>Name:</strong> ${obj.name}</p>
            <p><strong>Type:</strong> ${obj.type}</p>
            <p><strong>Distance:</strong> ${obj.distance.toFixed(2)} units</p>
        `;
        
        // Add specific details based on object type
        switch (obj.type) {
            case 'star':
                detailsHTML += `
                    <p><strong>Radius:</strong> ${obj.details.radius} units</p>
                    <p><strong>Temperature:</strong> ${obj.details.temperature}K</p>
                    <p><strong>Planets:</strong> ${obj.details.planetCount}</p>
                `;
                break;
            case 'planet':
                detailsHTML += `
                    <p><strong>Radius:</strong> ${obj.details.radius} units</p>
                    <p><strong>Orbit Radius:</strong> ${obj.details.orbitRadius} units</p>
                    <p><strong>Moons:</strong> ${obj.details.moonCount}</p>
                    <p><strong>Has Rings:</strong> ${obj.details.hasRings ? 'Yes' : 'No'}</p>
                `;
                break;
            case 'station':
                detailsHTML += `
                    <p><strong>Station Type:</strong> ${obj.details.stationType}</p>
                    <p><strong>Radius:</strong> ${obj.details.radius} units</p>
                `;
                break;
        }
        
        scanPanel.innerHTML = detailsHTML;
        
        // Add the close button again (since we replaced innerHTML)
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '5px';
        closeButton.style.background = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.color = 'white';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = function() {
            scanPanel.style.display = 'none';
        };
        scanPanel.appendChild(closeButton);
    }
}

// Setup event listeners for UI elements
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
