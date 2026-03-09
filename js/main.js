// ============ CONFIGURATION ============
// API_BASE_URL is the server address for detection API calls. By default we use the
// current origin so that the frontend will talk to a backend hosted on the same
// domain (useful during local development or when deploying a full stack).
//
// When this page is served as a *static* site (e.g. GitHub Pages) there is no
// backend at the origin, so health checks will fail and the detection controls
// will be disabled. In that case you must run the Flask server locally or
// deploy it somewhere (Heroku, Railway, etc.) and update this value to point
// at that URL.
let API_BASE_URL = window.location.origin;

const STATS_UPDATE_INTERVAL = 500; // ms
let statsInterval = null;
let isDetectionRunning = false;
let mediaStream = null;
let frameCount = 0;
let detectionCount = 0;
let startTime = null;

// detection mode flags & local model handles
let useBackend = null;          // set after health check (true/false)
let localModel = null;          // ultralytics JS model instance
let localStream = null;         // MediaStream when using local webcam

let localLoopId = null;         // requestAnimationFrame id for local inference

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
        navLinks = document.querySelectorAll('.nav-btn[data-tab], .nav-link');
}
        // If video or canvas elements are missing on some deployed pages, create fallbacks
        const wrapper = document.getElementById('video-wrapper') || document.querySelector('.video-display-area') || document.querySelector('.video-wrapper');
        if (!webcamFeed && wrapper) {
            const v = document.createElement('video');
            v.id = 'webcam-feed';
            v.autoplay = true;
            v.muted = true;
            v.playsInline = true;
            v.style.width = '100%';
            v.style.height = '100%';
            wrapper.insertBefore(v, wrapper.firstChild);
            webcamFeed = v;
        }
        if (!detectionCanvas && wrapper) {
            const c = document.createElement('canvas');
            c.id = 'detection-canvas';
            c.style.width = '100%';
            c.style.height = '100%';
            wrapper.appendChild(c);
            detectionCanvas = c;
        }

// global error handlers: surface errors visibly on the static page so you can
// open the GitHub Pages link and see exactly why detection/model load failed.
window.addEventListener('error', function (ev) {
    const details = `${ev.message} at ${ev.filename}:${ev.lineno}:${ev.colno}`;
    const log = document.getElementById('js-error-log');
    const detailsEl = document.getElementById('js-error-details');
    if (detailsEl) detailsEl.textContent = details + '\n' + (ev.error && ev.error.stack ? ev.error.stack : '');
    if (log) log.style.display = 'block';
    console.error('Captured global error:', details, ev.error);
});

window.addEventListener('unhandledrejection', function (ev) {
    const details = 'Unhandled Rejection: ' + (ev.reason && ev.reason.message ? ev.reason.message : JSON.stringify(ev.reason));
    const log = document.getElementById('js-error-log');
    const detailsEl = document.getElementById('js-error-details');
    if (detailsEl) detailsEl.textContent = details + '\n' + (ev.reason && ev.reason.stack ? ev.reason.stack : '');
    if (log) log.style.display = 'block';
    console.error('Captured unhandledrejection:', ev.reason);
});

document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    initializeEventListeners();
    checkServerHealth();
    setupNavigation();
    // If the page was opened with a hash (e.g. index.html#team) or a ?tab= query,
    // show that section immediately so external links work from GitHub Pages.
    try {
        const hash = (window.location.hash || '').replace(/^#/, '');
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab');
        const section = hash || tabParam;
        if (section) {
            // small timeout to ensure DOM is ready
            setTimeout(() => {
                // Support a special logical section name 'detection' which lives inside the Home tab.
                if (section === 'detection') {
                    showSection('home');
                    // scroll to the detection panel and auto-start webcam if possible
                    setTimeout(() => {
                        const wrapper = document.getElementById('video-wrapper');
                        if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // attempt to start detection (user will still need to allow camera)
                        if (typeof startWebcam === 'function') {
                            // do not block page load; try to start after a tiny delay
                            setTimeout(() => {
                                try { startWebcam(); } catch (e) { console.warn('Auto-start failed', e); }
                            }, 300);
                        }
                    }, 120);
                    return;
                }
                showSection(section);
            }, 50);
        }
    } catch (e) {
        console.warn('Error handling initial hash/tab param', e);
    }
});

// ============ EVENT LISTENERS ============
function initializeEventListeners() {
    if (startWebcamBtn) startWebcamBtn.addEventListener('click', startWebcam);
    if (stopWebcamBtn) stopWebcamBtn.addEventListener('click', stopWebcam);
    if (snapshotBtn) snapshotBtn.addEventListener('click', captureSnapshot);
}

function setupNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // determine target tab: support `data-tab` (buttons) or `href` anchors (links)
            const tab = this.getAttribute('data-tab') || (this.getAttribute('href') || '').replace(/^.*#/, '');
            if (tab) showSection(tab);

            // Update active state across both button/link variants
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
        const tab = link.getAttribute('data-tab') || (link.getAttribute('href') || '').replace(/^.*#/, '');
        if (tab === current) {
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

... (file truncated in display)