// ============ CONFIGURATION ============
const API_BASE_URL = 'http://localhost:5000';
const STATS_UPDATE_INTERVAL = 500; // ms
let statsInterval = null;
let isDetectionRunning = false;

// ============ DOM ELEMENTS ============
const videoFeed = document.getElementById('video-feed');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const snapshotBtn = document.getElementById('snapshot-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const loadingSpinner = document.getElementById('loading-spinner');
const navLinks = document.querySelectorAll('.nav-link');

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    checkServerHealth();
    setupNavigation();
});

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    startBtn.addEventListener('click', startDetection);
    stopBtn.addEventListener('click', stopDetection);
    snapshotBtn.addEventListener('click', captureSnapshot);
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
        startBtn.disabled = true;
        stopBtn.disabled = false;
        snapshotBtn.disabled = false;
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        snapshotBtn.disabled = true;
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

// ============ INITIAL STATE ============
updateUIState();
setState('Ready', 'inactive');
