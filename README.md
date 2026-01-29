# IBCRS – Equipment Scanner (Web + YOLO)

This repo contains:
- A **Next.js (React + TypeScript) + Tailwind** web UI (`webapp/`) that captures a webcam frame and sends it to the backend.
- A **FastAPI** backend (`server/`) that runs **Ultralytics YOLO** inference and returns detections + equipment details.
- Model weights in `model/` and dataset in `data/`.

## Structure

- `webapp/`: Next.js frontend (runs on `http://localhost:3000`)
- `server/`: FastAPI backend (runs on `http://localhost:8000`)
- `model/`: YOLO weights (`best.pt`, `fbest.pt`)
- `data/fdataset/`: training dataset (images + labels)
- `ml/webcam.py`: local OpenCV webcam inference script

## Run (local)

### Backend

```bash
cd server
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd webapp
npm install
npm run dev
```

Open `http://localhost:3000`.

## Equipment details

Edit `server/equipment.json`. Keys should match YOLO class labels (case-insensitive).

## Large files

This repo uses **Git LFS** for model weights and datasets (`*.pt`, dataset folders, etc.).

