# IBCRS – Intelligent BioTech Component Recognition System

A professional real-time object detection web application for identifying and tracking laboratory components and equipment using advanced YOLOv8 AI technology.

## � Live Demo

**Website is now live on GitHub Pages!**

- **Main Interface:** https://jagriti2325.github.io/IBCRS/
- **About Page:** https://jagriti2325.github.io/IBCRS/about.html  
- **Component Pages:** All 7 biotech components with detailed information

> **Note:**
> - When the Python backend is available (localhost or a deployed server) the frontend will send frames to `/api/detect` exactly as before.
> - **When no backend is reachable (for example on GitHub Pages)** the application now automatically falls back to a *client‑side* YOLOv8 inference engine powered by [Ultralytics Web](https://github.com/ultralytics/ultralytics/tree/main/ultralytics/web).
>   This means the same interface will run entirely in the browser and perform live detection without any server, so the GitHub Pages link now supports detection directly from the page (webcam access required).
>   The browser will download a small YOLOv8n model over the network; detection happens locally and no data is sent to any server.
>
> If you prefer to use a backend, you can still deploy the Flask server (Heroku, Railway, Azure, etc.) and either host the frontend on the same host or update the `API_BASE_URL` constant in `website/frontend/js/main.js` to point at your server.

## �🎯 About

**IBCRS** (Intelligent BioTech Component Recognition System) is an intelligent detection system designed to identify and provide detailed information about various laboratory and industrial equipment. The system uses state-of-the-art YOLOv8 deep learning models for real-time detection and classification.

### Detectable Components
- **Cam** - Camera Detection
- **DroneRx** - Drone Receiver 
- **PIR** - PIR Sensor
- **Sonar** - Sonar Sensor
- **Colorimeter** - Color Analysis Equipment
- **Magnetic Stirrer** - Laboratory Stirring Equipment
- **pH Meter** - pH Measurement Equipment

## ✨ Features

- 🎥 **Real-time Webcam Detection** - Live stream with YOLOv8 AI detection
- 📊 **Performance Monitoring** - CPU, memory, FPS, and inference time tracking
- 📋 **Component Information** - Detailed specs for each detected component
- 🎬 **Tutorial Videos** - Educational content for each component
- 📸 **Snapshot Capture** - Save detection frames locally
- 🌐 **Professional Web UI** - Dark-themed responsive interface
- ⚡ **Fast Inference** - GPU-optimized detection pipeline
- 📱 **Mobile Responsive** - Works on desktop and tablets

## 📁 Project Structure

```
IBCRS/
├── website/                    # Main Flask web application
│   ├── frontend/              # HTML templates & assets
│   │   ├── index.html         # Main detection interface
│   │   ├── component_*.html   # Component info pages
│   │   └── assets/            # Images & icons
│   ├── backend/               # Flask server
│   │   ├── app.py             # Flask application
│   │   └── requirements.txt   # Python dependencies
│   ├── config.py              # Configuration settings
│   └── start.bat              # Windows startup script
├── ml/                        # Machine Learning scripts (excluded)
├── model/                     # YOLOv8 model weights (excluded)
└── dataset/                   # Training datasets (excluded)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip / conda
- Webcam (USB or built-in)
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jagriti2325/IBCRS.git
   cd IBCRS
   ```

2. **Install dependencies**
   ```bash
   cd website
   pip install -r backend/requirements.txt
   ```

3. **Configure the model path** (edit `config.py`)
   ```python
   MODEL_PATH = 'bestfiles/yolo11n.pt'  # Your model file
   ```

4. **Run the Flask server**
   ```bash
   python backend/app.py
   ```
   Server runs on `http://localhost:5000`

5. **Open in browser**
   - **Local Development:** Navigate to `http://localhost:5000` and start detection!
   - **Live Online:** Visit [https://jagriti2325.github.io/IBCRS/](https://jagriti2325.github.io/IBCRS/)

## 🖼️ User Interface Overview

### Main Detection Interface
The primary dashboard displays:
- **Live Video Stream** - Real-time webcam feed with YOLOv8 detection overlays
- **Detection Badges** - Color-coded component identifications with counts
- **Performance Stats** - FPS, inference time, CPU and memory metrics
- **Control Buttons** - Start/Stop detection and capture snapshot features
- **Learn More Buttons** - Interactive navigation to component information pages

**Key Features:**
- Blue/cyan gradient professional dark theme
- Responsive layout for desktop and tablet devices
- Real-time performance monitoring
- Persistent detection history
- Smooth animations and transitions

### Component Detection System
When YOLOv8 detects components:
1. **Real-time Badges** appear showing component name and count
2. **"Learn More" buttons** dynamically appear at the bottom
3. **Buttons persist** even after component leaves the frame
4. **Click buttons** to navigate to detailed component pages

### Component Information Pages
Each of 7 components has a dedicated page featuring:

**Sections:**
- **Introduction** - Component overview and context
- **Advantages** - Key benefits and strengths (green accent)
- **Disadvantages** - Limitations and challenges (red accent)
- **How It Works** - Technical explanation of detection
- **Tutorial Video** - Embedded educational content

**Design Elements:**
- Professional dark theme matching main interface
- Font Awesome icons for visual hierarchy
- Blue accent colors for consistency
- Responsive layout for all devices
- Back navigation to main interface

### Available Components

| Component | Icon | Use Case |
|-----------|------|----------|
| **Camera (Cam)** | 📷 | Security and optical imaging |
| **Drone Receiver (DroneRx)** | 🛰️ | Drone control and communication |
| **PIR Sensor** | 💡 | Motion detection and security |
| **Sonar Sensor** | 📡 | Distance measurement and mapping |
| **Colorimeter** | 🧪 | Color analysis and measurement |
| **Magnetic Stirrer** | 🔧 | Laboratory equipment |
| **pH Meter** | 💧 | Acidity/alkalinity measurement |

### Performance Dashboard
Displays real-time system metrics:
- **Total Detections** - Cumulative count
- **FPS Counter** - Frames per second
- **Inference Time** - Model processing speed
- **CPU Usage** - System processor load
- **Memory Usage** - RAM utilization

## 🔧 Configuration

Edit `website/config.py`:

```python
# Model Configuration
MODEL_PATH = 'bestfiles/yolo11n.pt'          # Path to YOLOv8 model
CONFIDENCE_THRESHOLD = 0.5                    # Detection confidence (0-1)
IMG_SIZE = 640                                # Model input size

# Webcam Configuration
FRAME_WIDTH = 1280                            # Video frame width
FRAME_HEIGHT = 720                            # Video frame height
WEBCAM_INDEX = 0                              # Webcam device index
TARGET_FPS = 30                               # Target frames per second
JPEG_QUALITY = 80                             # JPEG compression (1-100)
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main detection interface |
| `/component_cam` | GET | Camera component page |
| `/component_dronerx` | GET | Drone Receiver component page |
| `/component_pir` | GET | PIR Sensor component page |
| `/component_sonar` | GET | Sonar Sensor component page |
| `/component_colorimeter` | GET | Colorimeter component page |
| `/component_magnetic_stirrer` | GET | Magnetic Stirrer component page |
| `/component_ph_meter` | GET | pH Meter component page |
| `/video_feed` | GET | MJPEG video stream |
| `/api/stats` | GET | Detection statistics JSON |
| `/api/start` | POST | Start detection |
| `/api/stop` | POST | Stop detection |
| `/api/health` | GET | Server health check |

## 🤖 Technology Stack

**Frontend:**
- HTML5, CSS3 (embedded styling)
- JavaScript ES6+
- Font Awesome 6.4.0 Icons
- Responsive design

**Backend:**
- Flask 2.2+
- Flask-CORS
- Python 3.8+

**AI/ML:**
- YOLOv8 (Ultralytics)
- PyTorch
- OpenCV 4.8+

**System:**
- psutil (system monitoring)
- MJPEG video streaming

## 📊 Model Training

To train your own model:

1. **Prepare Dataset**
   ```bash
   # Organize images and labels in COCO or YOLO format
   ```

2. **Create data.yaml**
   ```yaml
   path: /path/to/dataset
   train: images/train
   val: images/val
   nc: 7  # number of classes
   names: ['Cam', 'DroneRx', 'PIR', 'Sonar', 'Colorimeter', 'Magnetic_Stirrer', 'pH_Meter']
   ```

3. **Train Model**
   ```bash
   from ultralytics import YOLO
   model = YOLO('yolov8n.pt')
   results = model.train(data='data.yaml', epochs=100, imgsz=640)
   ```

4. **Export Model**
   Place trained model in appropriate directory and update `config.py`

## 🔒 Repository Structure

Files tracked in Git:
- `website/` - Complete Flask application
- `README.md` - This documentation
- `.gitignore` - Git exclusion rules

Excluded from Git (`.gitignore`):
- `ml/` - ML scripts
- `data/`, `dataset/`, `fdataset/` - Large datasets
- `model/` - Model weights (*.pt, *.pth)
- `server/` - Legacy code
- `webapp/` - Legacy app
- Python cache (`__pycache__/`, `*.pyc`)

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not found | Check `MODEL_PATH` in `config.py` |
| Webcam not detected | Try different `WEBCAM_INDEX` (0, 1, 2...) |
| Slow inference | Reduce `IMG_SIZE` or use lighter model |
| Buttons not showing | Train model with component classes |
| "Not found" 404 error | Verify Flask routes in `backend/app.py` |
| Import errors | Run `pip install -r backend/requirements.txt` |

## 📝 License

This project is part of the IBCRS research initiative.

## 👥 Contributing

Contributions welcome! Please submit pull requests for:
- Bug fixes
- Performance optimizations
- New component pages
- Documentation improvements
- UI/UX enhancements

## 📧 Contact

For questions, feedback, or contributions, please contact the development team.

---

**System Name**: Intelligent BioTech Component Recognition System  
**Last Updated**: February 11, 2026  
**Version**: 1.0.0  
**Repository**: [github.com/jagriti2325/IBCRS](https://github.com/jagriti2325/IBCRS)

