import cv2
from ultralytics import YOLO

# -------------------- PATH --------------------
model_path = r"D:\IBCRS\best (4).pt"

# -------------------- LOAD MODEL --------------------
model = YOLO(model_path)

# -------------------- START WEBCAM --------------------
cap = cv2.VideoCapture(0)   # 0 = default webcam

if not cap.isOpened():
    print("❌ Error: Could not open webcam.")
    exit()

print("🎥 Running IBCRS Live Detection... Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    
    if not ret:
        print("❌ Failed to grab frame.")
        break

    # -------------------- RUN DETECTION --------------------
    results = model(frame)
    annotated_frame = results[0].plot()

    # -------------------- DISPLAY --------------------
    cv2.imshow("IBCRS Live Detection", annotated_frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# -------------------- RELEASE --------------------
cap.release()
cv2.destroyAllWindows()

print("🎯 Live detection stopped.")
