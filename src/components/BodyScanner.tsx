"use client";

import { useCallback, useEffect, useRef } from "react";

/** CDN builds — must match installed npm versions for locateFile consistency. */
const MP_POSE_VER = "0.5.1675469404";
const MP_CAM_VER = "0.3.1675466862";
const MP_DRAW_VER = "0.3.1675466124";

const SCRIPT_POSE = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MP_POSE_VER}/pose.js`;
const SCRIPT_CAMERA = `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${MP_CAM_VER}/camera_utils.js`;
const SCRIPT_DRAW = `https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@${MP_DRAW_VER}/drawing_utils.js`;

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-mp-src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.mpSrc = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

function poseAssetUrl(file: string) {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MP_POSE_VER}/${file}`;
}

type NormalizedLandmarkList = Array<{
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}>;

type MpPose = {
  setOptions: (o: Record<string, unknown>) => void;
  onResults: (cb: (results: { poseLandmarks?: NormalizedLandmarkList }) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => Promise<void>;
};

type MpPoseCtor = new (config?: { locateFile?: (file: string) => string }) => MpPose;

type MpCamera = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

type MpCameraCtor = new (
  video: HTMLVideoElement,
  options: { onFrame: () => Promise<void> | void; width?: number; height?: number; facingMode?: string },
) => MpCamera;

declare global {
  interface Window {
    Pose?: MpPoseCtor;
    Camera?: MpCameraCtor;
    POSE_CONNECTIONS?: Array<[number, number]>;
    drawConnectors?: (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmarkList | undefined,
      connections: Array<[number, number]>,
      style?: Record<string, unknown>,
    ) => void;
    drawLandmarks?: (
      ctx: CanvasRenderingContext2D,
      landmarks: NormalizedLandmarkList | undefined,
      style?: Record<string, unknown>,
    ) => void;
  }
}

export function BodyScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latestLandmarksRef = useRef<NormalizedLandmarkList | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const videoEl = video;
    const canvasEl = canvas;

    let cancelled = false;
    const ctx2d = canvasEl.getContext("2d");
    if (!ctx2d) return;
    const ctx = ctx2d;

    let pose: MpPose | null = null;
    let camera: MpCamera | null = null;

    async function setup() {
      await loadScriptOnce(SCRIPT_POSE);
      await loadScriptOnce(SCRIPT_CAMERA);
      await loadScriptOnce(SCRIPT_DRAW);
      if (cancelled) return;

      const PoseCtor = window.Pose;
      const CameraCtor = window.Camera;
      const connections = window.POSE_CONNECTIONS;
      const drawConnectors = window.drawConnectors;
      const drawLandmarks = window.drawLandmarks;

      if (!PoseCtor || !CameraCtor || !connections || !drawConnectors || !drawLandmarks) {
        // eslint-disable-next-line no-console
        console.error("[BodyScanner] MediaPipe globals missing after script load.");
        return;
      }

      pose = new PoseCtor({ locateFile: poseAssetUrl });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        if (cancelled) return;
        const w = videoEl.videoWidth;
        const h = videoEl.videoHeight;
        if (w && h) {
          canvasEl.width = w;
          canvasEl.height = h;
        }
        ctx.save();
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        const landmarks = results.poseLandmarks;
        latestLandmarksRef.current = landmarks ?? null;
        if (landmarks) {
          drawConnectors(ctx, landmarks, connections, {
            color: "#FF2800",
            lineWidth: 3,
          });
          drawLandmarks(ctx, landmarks, {
            color: "#FF2800",
            lineWidth: 1,
            radius: 4,
            fillColor: "rgba(255, 40, 0, 0.35)",
          });
        }
        ctx.restore();
      });

      camera = new CameraCtor(videoEl, {
        onFrame: async () => {
          if (cancelled || !pose) return;
          await pose.send({ image: videoEl });
        },
        width: 1280,
        height: 720,
        facingMode: "user",
      });

      await camera.start().catch(() => {
        /* permission / device */
      });
    }

    void setup();

    return () => {
      cancelled = true;
      void camera?.stop();
      void pose?.close();
      camera = null;
      pose = null;
      latestLandmarksRef.current = null;
    };
  }, []);

  const capturePose = useCallback(() => {
    const lm = latestLandmarksRef.current;
    // eslint-disable-next-line no-console -- dev: inspect pose snapshot
    console.log("[BodyScanner] pose landmarks:", lm);
  }, []);

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md sm:p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF2800]">Body measurement</p>
        <h2 className="mb-4 text-lg font-semibold text-white/90">Live pose</h2>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-black/50 ring-1 ring-[#FF2800]/20">
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            width={1280}
            height={720}
          />
        </div>

        <p className="mt-3 text-xs text-white/45">
          Allow camera access. Stand so your full upper body is visible for best tracking.
        </p>

        <button
          type="button"
          onClick={capturePose}
          className="mt-5 w-full rounded-xl border border-[#FF2800]/40 bg-[#FF2800]/10 py-3.5 text-sm font-semibold uppercase tracking-widest text-white shadow-[0_0_24px_rgba(255,40,0,0.15)] backdrop-blur-sm transition-colors hover:border-[#FF2800]/70 hover:bg-[#FF2800]/20"
        >
          Capture Pose
        </button>
      </div>
    </div>
  );
}
