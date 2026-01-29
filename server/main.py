"""
FastAPI backend for webcam-based equipment scanning.

- Serves a static frontend from ./static
- /api/scan accepts a base64 data URL from the browser, runs YOLO, and
  returns detections plus equipment details (from equipment.json).
"""

from __future__ import annotations

import base64
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from ultralytics import YOLO


ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = Path(__file__).resolve().parent / "static"
EQUIPMENT_JSON = Path(__file__).resolve().parent / "equipment.json"
MODEL_PATH = ROOT_DIR / "model" / "best.pt"


def load_equipment_data() -> Dict[str, Any]:
    if EQUIPMENT_JSON.exists():
        with EQUIPMENT_JSON.open("r", encoding="utf-8") as f:
            data = json.load(f)
            # Normalize keys to lower-case for lookups.
            return {k.lower(): v for k, v in data.items()}
    return {}


equipment_db = load_equipment_data()

# Load YOLO model once at startup.
if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Model file not found at {MODEL_PATH}. Place best.pt in project root."
    )
model = YOLO(str(MODEL_PATH))


class ScanRequest(BaseModel):
    image: str


def decode_image(data_url: str) -> np.ndarray:
    """
    Convert a base64 data URL into an OpenCV image (BGR).
    """
    if "," in data_url:
        _, data = data_url.split(",", 1)
    else:
        data = data_url
    try:
        raw = base64.b64decode(data)
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("Invalid base64 string") from exc

    np_arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Unable to decode image")
    return frame


def attach_details(label: str) -> Optional[Dict[str, Any]]:
    key = label.lower()
    return equipment_db.get(key)


def format_detections(result) -> List[Dict[str, Any]]:
    detections: List[Dict[str, Any]] = []
    names = result.names
    for box in result.boxes:
        cls_id = int(box.cls[0])
        label = names.get(cls_id, f"class_{cls_id}")
        conf = float(box.conf[0])
        xyxy = box.xyxy[0].tolist()
        detections.append(
            {
                "label": label,
                "confidence": round(conf, 3),
                "bbox": {
                    "x1": xyxy[0],
                    "y1": xyxy[1],
                    "x2": xyxy[2],
                    "y2": xyxy[3],
                },
                "details": attach_details(label),
            }
        )
    # Sort descending by confidence
    return sorted(detections, key=lambda d: d["confidence"], reverse=True)


app = FastAPI(title="Equipment Scanner", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    # Lock CORS to known frontends; add more domains as needed.
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def serve_index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.post("/api/scan")
async def scan(req: ScanRequest) -> Dict[str, Any]:
    try:
        frame = decode_image(req.image)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Adjust confidence threshold here to tune precision/recall.
    results = model(frame, conf=0.3)
    if not results:
        raise HTTPException(status_code=500, detail="Model did not return results")

    result = results[0]
    detections = format_detections(result)
    return {
        "found": len(detections) > 0,
        "count": len(detections),
        "detections": detections,
    }


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

