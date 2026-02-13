// ============ CONFIGURATION ============
const API_BASE_URL = 'http://localhost:5000';
const STATS_UPDATE_INTERVAL = 500; // ms
let statsInterval = null;
let isDetectionRunning = false;
let mediaStream = null;
let frameCount = 0;
let detectionCount = 0;
let startTime = null;

// Equipment mapping for component pages
const equipmentMapping = {
    'Camera': 'component_cam.html',
    'Cam': 'component_cam.html',
    'camera': 'component_cam.html',
    'cam': 'component_cam.html',
    'Colorimeter': 'component_colorimeter.html',
    'colorimeter': 'component_colorimeter.html',
    'DroneRx': 'component_dronerx.html',
    'Drone': 'component_dronerx.html',
    'drone': 'component_dronerx.html',
    'dronerx': 'component_dronerx.html',
    'Magnetic Stirrer': 'component_magnetic_stirrer.html',
    'Stirrer': 'component_magnetic_stirrer.html',
    'stirrer': 'component_magnetic_stirrer.html',
    'pH Meter': 'component_ph_meter.html',
    'pH': 'component_ph_meter.html',
    'ph meter': 'component_ph_meter.html',
    'PIR': 'component_pir.html',
    'pir': 'component_pir.html',
    'Sonar': 'component_sonar.html',
    'sonar': 'component_sonar.html'
};

// ============ DOM ELEMENTS ============
let videoFeed;
let webcamFeed;
let detectionCanvas;
let startBtn;
let stopBtn;
let startWebcamBtn;
let stopWebcamBtn;
let snapshotBtn;
let statusIndicator;
let statusText;
let detectionStatus;
let frameCountDisplay;
let detectionCountDisplay;
let fpsCounter;
let detectionResults;
let loadingSpinner;
let navLinks;

// ============ INITIALIZATION ============
function initializeDOMElements() {
    videoFeed = document.getElementById('video-feed');
    webcamFeed = document.getElementById('webcam-feed');
    detectionCanvas = document.getElementById('detection-canvas');
    startBtn = document.getElementById('start-btn');
    stopBtn = document.getElementById('stop-btn');
    startWebcamBtn = document.getElementById('start-webcam-btn');
    stopWebcamBtn = document.getElementById('stop-webcam-btn');
    snapshotBtn = document.getElementById('snapshot-btn');
    statusIndicator = document.getElementById('status-indicator');
    statusText = document.getElementById('status-text');
    detectionStatus = document.getElementById('detection-status');
    frameCountDisplay = document.getElementById('frame-count');
    detectionCountDisplay = document.getElementById('detection-count');
    fpsCounter = document.getElementById('fps-counter');
    detectionResults = document.getElementById('detection-results');
    loadingSpinner = document.getElementById('loading-spinner');
    navLinks = document.querySelectorAll('.nav-link');
}

document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    initializeEventListeners();
    checkServerHealth();
    setupNavigation();
});

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    if (startBtn) startBtn.addEventListener('click', startDetection);
    if (stopBtn) stopBtn.addEventListener('click', stopDetection);
    if (snapshotBtn) snapshotBtn.addEventListener('click', captureSnapshot);
    if (startWebcamBtn) startWebcamBtn.addEventListener('click', startWebcam);
    if (stopWebcamBtn) stopWebcamBtn.addEventListener('click', stopWebcam);
}

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ============ DETECTION FUNCTIONS ============
async function startDetection() {
    try {
        showLoading(true);
        
        // Start video feed
        videoFeed.src = `${API_BASE_URL}/video_feed`;
        
        // Send start command to server
        const response = await fetch(`${API_BASE_URL}/api/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to start detection');
        }

        // Update UI
        isDetectionRunning = true;
        updateUIState();
        
        // Update status
        setState('Running', 'active');
        
        // Start stats update
        startStatsUpdate();
        
        // Hide loading after video loads
        videoFeed.addEventListener('loadstart', () => showLoading(true), { once: true });
        videoFeed.addEventListener('canplay', () => showLoading(false), { once: true });
        
    } catch (error) {
        console.error('Error starting detection:', error);
        showAlert('Failed to start detection. Make sure the server is running.', 'error');
        showLoading(false);
    }
}

async function stopDetection() {
    try {
        showLoading(true);
        
        // Send stop command to server
        const response = await fetch(`${API_BASE_URL}/api/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to stop detection');
        }

        // Stop video feed
        videoFeed.src = '';
        
        // Clear stats update
        if (statsInterval) {
            clearInterval(statsInterval);
            statsInterval = null;
        }

        // Update UI
        isDetectionRunning = false;
        updateUIState();
        
        // Update status
        setState('Stopped', 'inactive');
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error stopping detection:', error);
        showAlert('Failed to stop detection.', 'error');
        showLoading(false);
    }
}

function captureSnapshot() {
    if (!videoFeed.src || !isDetectionRunning) {
        showAlert('Start detection first to capture a snapshot.', 'warning');
        return;
    }

    try {
        // Create canvas and draw current frame
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = videoFeed.naturalWidth || videoFeed.width;
        canvas.height = videoFeed.naturalHeight || videoFeed.height;
        
        // For streamed image, we'll use a workaround
        const link = document.createElement('a');
        link.href = videoFeed.src;
        link.download = `ibcrs-snapshot-${new Date().getTime()}.jpg`;
        
        // Create a temporary canvas with the current frame
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 1280;
        tempCanvas.height = 720;
        
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(videoFeed, 0, 0);
        
        // Download the snapshot
        tempCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ibcrs-snapshot-${new Date().getTime()}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
        
        showAlert('Snapshot captured successfully!', 'success');
        
    } catch (error) {
        console.error('Error capturing snapshot:', error);
        showAlert('Failed to capture snapshot.', 'error');
    }
}

// ============ STATS UPDATE ============
function startStatsUpdate() {
    if (statsInterval) {
        clearInterval(statsInterval);
    }

    statsInterval = setInterval(updateStats, STATS_UPDATE_INTERVAL);
    updateStats(); // Initial update
}

async function updateStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/stats`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch stats');
        }

        const stats = await response.json();

        // Update metrics
        document.getElementById('inference-time').textContent = `${stats.inference_time.toFixed(2)} ms`;
        document.getElementById('fps').textContent = stats.fps;
        document.getElementById('cpu-usage').textContent = `${stats.cpu_usage.toFixed(1)}%`;
        document.getElementById('memory-usage').textContent = `${stats.memory_usage.toFixed(1)}%`;
        document.getElementById('total-detections').textContent = stats.total_detections;

        // Update detected classes
        updateDetectedClasses(stats.detected_classes);

        // Update status indicator
        if (stats.is_running) {
            statusIndicator.classList.add('active');
        } else {
            statusIndicator.classList.remove('active');
        }

    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

function updateDetectedClasses(classes) {
    const container = document.getElementById('detected-classes');
    
    // Clear existing badges
    container.innerHTML = '';

    // Add new badges
    if (Object.keys(classes).length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No detections yet</p>';
        return;
    }

    for (const [className, count] of Object.entries(classes)) {
        const badge = document.createElement('div');
        badge.className = 'class-badge';
        
        const classNameEl = document.createElement('span');
        classNameEl.className = 'class-name';
        classNameEl.textContent = className;
        
        const countEl = document.createElement('span');
        countEl.className = 'class-count';
        countEl.textContent = count;
        
        badge.appendChild(classNameEl);
        badge.appendChild(countEl);
        container.appendChild(badge);
    }
}

// ============ UI HELPERS ============
function updateUIState() {
    if (isDetectionRunning) {
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (snapshotBtn) snapshotBtn.disabled = false;
    } else {
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (snapshotBtn) snapshotBtn.disabled = true;
    }
}

function setState(text, state) {
    statusText.textContent = text;
    if (state === 'active') {
        statusIndicator.classList.add('active');
    } else {
        statusIndicator.classList.remove('active');
    }
}

function showLoading(show) {
    if (show) {
        loadingSpinner.style.display = 'flex';
    } else {
        loadingSpinner.style.display = 'none';
    }
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;

    // Set background color based on type
    const colors = {
        'success': 'rgba(16, 185, 129, 0.9)',
        'error': 'rgba(239, 68, 68, 0.9)',
        'warning': 'rgba(245, 158, 11, 0.9)',
        'info': 'rgba(0, 102, 255, 0.9)'
    };

    alert.style.background = colors[type] || colors['info'];
    alert.textContent = message;

    document.body.appendChild(alert);

    // Remove after 3 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(alert);
        }, 300);
    }, 3000);
}

// ============ WEBCAM DETECTION FUNCTIONS ============
async function startWebcam() {
    try {
        console.log('Starting webcam...');
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('Webcam not supported');
            showAlert('Webcam not supported in this browser', 'error');
            return;
        }

        console.log('Requesting camera access...');
        // Request camera access
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });

        console.log('Camera access granted, setting srcObject...');
        // Set video source
        if (!webcamFeed) {
            console.error('webcamFeed element not found');
            showAlert('Error: Video element not found', 'error');
            return;
        }
        
        webcamFeed.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            webcamFeed.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                resolve();
            };
        });
        
        // Update UI
        isDetectionRunning = true;
        if (startWebcamBtn) startWebcamBtn.style.display = 'none';
        if (stopWebcamBtn) stopWebcamBtn.style.display = 'flex';
        
        if (detectionStatus) {
            detectionStatus.innerHTML = '<span style="color: #10b981;"><i class="fas fa-circle"></i> Online</span>';
        }

        startTime = Date.now();
        frameCount = 0;
        detectionCount = 0;
        
        console.log('Webcam ready, starting frame processing...');
        showAlert('Webcam started. Processing frames...', 'success');
        
        // Start sending frames to API
        processFrames();
        
    } catch (error) {
        console.error('Error accessing webcam:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        let errorMsg = error.message;
        
        // Handle common webcam access errors
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMsg = 'Webcam access denied. Please check:1) Browser permissions, 2) Site is trusted, 3) No other app is using the camera';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMsg = 'No camera device found. Make sure your webcam is connected.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMsg = 'Camera is in use by another application. Close other apps using the camera.';
        } else if (error.name === 'SecurityError') {
            errorMsg = 'Security error: Website must be served over HTTPS or localhost to access webcam.';
        }
        
        showAlert('Error accessing webcam: ' + errorMsg, 'error');
        isDetectionRunning = false;
    }
}

function stopWebcam() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    isDetectionRunning = false;
    startWebcamBtn.style.display = 'flex';
    stopWebcamBtn.style.display = 'none';
    
    if (detectionStatus) {
        detectionStatus.innerHTML = '<span style="color: #ef4444;"><i class="fas fa-circle"></i> Offline</span>';
    }
    
    showAlert('Webcam stopped', 'info');
}

async function processFrames() {
    if (!isDetectionRunning || !webcamFeed.srcObject) {
        console.log('Processing stopped: isDetectionRunning=' + isDetectionRunning + ', srcObject=' + (webcamFeed.srcObject ? 'set' : 'null'));
        return;
    }

    try {
        // Get canvas context
        if (!detectionCanvas) {
            console.log('Canvas not found, retrying...');
            setTimeout(processFrames, 100);
            return;
        }

        detectionCanvas.width = webcamFeed.videoWidth;
        detectionCanvas.height = webcamFeed.videoHeight;
        
        if (detectionCanvas.width === 0 || detectionCanvas.height === 0) {
            console.log('Video dimensions not ready: ' + detectionCanvas.width + 'x' + detectionCanvas.height);
            setTimeout(processFrames, 100);
            return;
        }

        const ctx = detectionCanvas.getContext('2d');
        ctx.drawImage(webcamFeed, 0, 0);
        
        // Convert to base64 JPEG
        const imageData = detectionCanvas.toDataURL('image/jpeg', 0.8);
        
        // Send to API
        await detectFrame(imageData);
        
        frameCount++;
        if (frameCountDisplay) frameCountDisplay.textContent = frameCount;
        
        // Update FPS
        const elapsed = (Date.now() - startTime) / 1000;
        if (fpsCounter && elapsed > 0) {
            fpsCounter.textContent = Math.round(frameCount / elapsed);
        }
        
        // Continue processing
        setTimeout(processFrames, 100); // Process every 100ms
        
    } catch (error) {
        console.error('Error processing frame:', error);
        if (isDetectionRunning) {
            setTimeout(processFrames, 100);
        }
    }
}

async function detectFrame(imageData) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/detect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            if (response.status === 404) {
                // Try alternative endpoint
                return detectFrameAltEndpoint(imageData);
            }
            throw new Error(`API returned status ${response.status}`);
        }

        const detections = await response.json();
        
        if (detections && detections.length > 0) {
            displayDetections(detections);
        }
        
    } catch (error) {
        console.error('Detection error:', error);
    }
}

async function detectFrameAltEndpoint(imageData) {
    try {
        // Try the endpoint from Flask backend
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: imageData })
        });

        if (response.ok) {
            const detections = await response.json();
            if (detections && detections.length > 0) {
                displayDetections(detections);
            }
        }
    } catch (error) {
        console.error('Alt endpoint error:', error);
    }
}

function displayDetections(detections) {
    detectionCount = detections.length;
    if (detectionCountDisplay) detectionCountDisplay.textContent = detectionCount;
    
    if (detectionResults) {
        if (detections.length === 0) {
            detectionResults.innerHTML = '<p style="color: #a0aec0; text-align: center; margin: 2rem 0;">No detections</p>';
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 0.8rem;">';
        
        detections.forEach(det => {
            const confidence = (det.confidence * 100).toFixed(1);
            const label = det.class || det.label || 'Unknown';
            
            html += `
                <div style="background: rgba(0, 102, 255, 0.2); padding: 0.8rem; border-radius: 6px; border-left: 3px solid #0066ff; cursor: pointer; transition: all 0.3s ease;" 
                     onmouseover="this.style.background='rgba(0, 102, 255, 0.4)';" 
                     onmouseout="this.style.background='rgba(0, 102, 255, 0.2)';"
                     onclick="openEquipmentDetail('${label}')">
                    <div style="font-weight: 600; color: #00d4ff; font-size: 1rem; margin-bottom: 0.3rem;"><i class="fas fa-check-circle"></i> ${label}</div>
                    <div style="color: #a0aec0; font-size: 0.9rem;">Confidence: <strong style="color: #10b981;">${confidence}%</strong></div>
                </div>
            `;
        });
        
        html += '</div>';
        detectionResults.innerHTML = html;
    }
}

function openEquipmentDetail(label) {
    // Find the matching component page
    const componentPage = equipmentMapping[label] || equipmentMapping[label.toLowerCase()];
    
    if (componentPage) {
        window.location.href = componentPage;
    } else {
        showAlert(`No component page found for ${label}`, 'warning');
    }
}

// ============ SERVER HEALTH CHECK ============
async function checkServerHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        
        if (!response.ok) {
            console.warn('Server health check failed');
            return false;
        }

        const health = await response.json();
        console.log('Server health:', health);
        
        if (!health.model_loaded) {
            showAlert('Model failed to load. Check server logs.', 'warning');
        }

        return true;

    } catch (error) {
        console.error('Server health check failed:', error);
        showAlert('Cannot connect to server. Make sure it\'s running on port 5000.', 'error');
        return false;
    }
}

// ============ CSS ANIMATIONS ============
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ============ SECTION NAVIGATION ============
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active state to clicked nav link
    const activeLink = document.querySelector(`.nav-link[onclick*="'${sectionId}'"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    window.scrollTo(0, 0);
}

// ============ INITIAL STATE ============
updateUIState();
setState('Ready', 'inactive');
