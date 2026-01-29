/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

type Detection = {
  label: string;
  confidence: number;
  details?: {
    name?: string;
    code?: string;
    category?: string;
    description?: string;
    location?: string;
    status?: string;
  } | null;
};

type HistoryItem = {
  time: string;
  label: string;
  confidence: string;
  status: string;
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<{ text: string; tone: "emerald" | "red" | "amber" }>({
    text: "Ready",
    tone: "emerald",
  });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus({ text: "Camera ready", tone: "emerald" });
      } catch (err) {
        console.error(err);
        setStatus({ text: "Camera blocked", tone: "red" });
      }
    };
    startCamera();

    return () => {
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach((t) => t.stop());
    };
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      throw new Error("Camera not ready");
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not ready");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const sendScan = async () => {
    try {
      setIsScanning(true);
      setStatus({ text: "Scanning...", tone: "amber" });
      const image = captureFrame();
      const res = await fetch("http://localhost:8000/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`);
      const data = await res.json();
      const dets: Detection[] = data?.detections ?? [];
      setDetections(dets);
      const top = dets[0];
      setHistory((prev) => {
        const next: HistoryItem[] = [
          {
            time: new Date().toLocaleTimeString(),
            label: top ? top.label : "No detection",
            confidence: top ? top.confidence.toString() : "-",
            status: top?.details?.status ?? "N/A",
          },
          ...prev,
        ].slice(0, 10);
        return next;
      });
      setStatus({ text: "Camera ready", tone: "emerald" });
    } catch (err: any) {
      console.error(err);
      setStatus({ text: err?.message || "Error scanning", tone: "red" });
    } finally {
      setIsScanning(false);
    }
  };

  const statusClasses = {
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
  } as const;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Equipment Scanner</h1>
            <p className="text-slate-600">
              Capture a frame from your webcam, send it to the model, and view matched equipment details.
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusClasses[status.tone]}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                status.tone === "emerald" ? "bg-emerald-500" : status.tone === "amber" ? "bg-amber-500" : "bg-rose-500"
              }`}
            ></span>
            {status.text}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white shadow-sm rounded-xl p-4 border border-slate-100">
            <div className="aspect-video bg-slate-200 rounded-lg overflow-hidden relative">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none"></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={sendScan}
                disabled={isScanning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-60"
              >
                {isScanning ? "Scanning..." : "Scan"}
              </button>
              <button
                onClick={() => setDetections([])}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg font-medium"
              >
                Reset
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Tip: Hold the item steady and centered before scanning.</p>
          </section>

          <section className="space-y-4">
            <div className="bg-white shadow-sm rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Scan Result</h2>
                <span className="text-sm text-slate-500">
                  {detections.length ? `${detections.length} detection${detections.length > 1 ? "s" : ""}` : "No scans yet"}
                </span>
              </div>
              <div className="space-y-3 text-sm text-slate-700">
                {detections.length === 0 && <p className="text-slate-500">No detection yet. Scan an item to see details.</p>}
                {detections.length > 0 && (
                  <>
                    {(() => {
                      const top = detections[0];
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-500">Top match</div>
                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700">
                              {top.confidence} confidence
                            </span>
                          </div>
                          {top.details ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-900">{top.details.name || top.label}</div>
                              <div className="text-slate-600">{top.details.description || ""}</div>
                              <div className="text-xs text-slate-500">
                                Code: {top.details.code || "N/A"} | Location: {top.details.location || "N/A"}
                              </div>
                              <span className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                {top.details.status || "unknown"}
                              </span>
                            </div>
                          ) : (
                            <div className="font-semibold">
                              {top.label}
                              <div className="text-slate-500 text-sm">No saved details for this label.</div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-500 mb-1">All detections</div>
                      <div className="rounded-lg border border-slate-100 divide-y bg-slate-50">
                        {detections.map((d) => (
                          <div key={`${d.label}-${d.confidence}`} className="flex items-center justify-between py-2 px-3">
                            <div className="font-medium">{d.label}</div>
                            <div className="text-xs text-slate-600">Conf: {d.confidence}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-lg">Recent Scans</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-2">Time</th>
                      <th className="py-2">Label</th>
                      <th className="py-2">Confidence</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-slate-600">{item.time}</td>
                        <td className="py-2">{item.label}</td>
                        <td className="py-2 text-slate-600">{item.confidence}</td>
                        <td className="py-2">
                          <span className="px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">{item.status}</span>
                        </td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td className="py-2 text-slate-500" colSpan={4}>
                          No scans yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
