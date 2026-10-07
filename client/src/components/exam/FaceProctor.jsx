import React, { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, UserCheck, UserX, Users, AlertTriangle } from 'lucide-react';

export const FaceProctor = ({
  enabled = true,
  onSignal = () => {},
  onStatusChange = () => {},
  showPreview = true,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const faceDetectorRef = useRef(null);

  const [cameraState, setCameraState] = useState('INITIALIZING'); // INITIALIZING, READY, DENIED, DISCONNECTED
  const [faceState, setFaceState] = useState('CHECKING'); // CHECKING, SINGLE_FACE, NO_FACE, MULTIPLE_FACES
  const [faceCount, setFaceCount] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // History buffer for temporal confirmation (storing last N frame counts)
  const historyRef = useRef([]);
  const activeIncidentRef = useRef(null); // 'NO_FACE' | 'MULTIPLE_FACES' | null

  const sendIntegritySignal = (type, metadata = {}) => {
    onSignal(type, metadata);
  };

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const startCamera = async () => {
      try {
        setCameraState('INITIALIZING');
        setErrorMessage('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access API is not supported by your browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 360 },
            frameRate: { ideal: 15 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            if (isMounted) {
              setCameraState('DISCONNECTED');
              sendIntegritySignal('CAMERA_DISCONNECTED', { reason: 'Track ended' });
              onStatusChange({ camera: false, faceDetected: false });
            }
          };
        }

        setCameraState('READY');
        onStatusChange({ camera: true, faceDetected: true });
      } catch (err) {
        if (!isMounted) return;
        console.error('[CAMERA_INIT_ERROR]', err);
        let msg = 'Could not access camera.';
        let type = 'CAMERA_PERMISSION_DENIED';

        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Camera permission denied. Please allow camera access in browser settings.';
          type = 'CAMERA_PERMISSION_DENIED';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No camera device found on your system.';
          type = 'CAMERA_DISCONNECTED';
        }

        setCameraState('DENIED');
        setErrorMessage(msg);
        sendIntegritySignal(type, { error: err.message });
        onStatusChange({ camera: false, faceDetected: false });
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [enabled]);

  // Frame processing loop for multi-face presence detection
  useEffect(() => {
    if (cameraState !== 'READY' || !enabled) return;

    let animId;
    let lastProcessTime = 0;

    const analyzeSpatialSkinBlobs = (ctx, width, height) => {
      const frame = ctx.getImageData(0, 0, width, height);
      const data = frame.data;
      const totalPixels = width * height;

      // 8x6 Grid region analysis for distinct facial skin clusters
      const cols = 8;
      const rows = 6;
      const cellWidth = Math.floor(width / cols);
      const cellHeight = Math.floor(height / rows);
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

      let totalSkinPixels = 0;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // YCbCr skin detection formula
          const Y = 0.299 * r + 0.587 * g + 0.114 * b;
          const Cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const Cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          if (Cb >= 77 && Cb <= 127 && Cr >= 133 && Cr <= 173 && Y >= 35) {
            totalSkinPixels++;
            const c = Math.min(cols - 1, Math.floor(x / cellWidth));
            const rIdx = Math.min(rows - 1, Math.floor(y / cellHeight));
            grid[rIdx][c]++;
          }
        }
      }

      const skinRatio = totalSkinPixels / totalPixels;
      if (skinRatio < 0.04) return 0; // No face present

      // Find distinct connected skin regions (blobs) across grid cells
      const minCellDensity = cellWidth * cellHeight * 0.15;
      const activeCells = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c] >= minCellDensity) {
            activeCells.push({ r, c });
          }
        }
      }

      if (activeCells.length === 0) return 0;

      // Cluster active cells into separate blobs using BFS
      const visited = new Set();
      let blobCount = 0;
      const blobs = [];

      for (const cell of activeCells) {
        const key = `${cell.r},${cell.c}`;
        if (visited.has(key)) continue;

        blobCount++;
        const queue = [cell];
        visited.add(key);

        let minC = cell.c, maxC = cell.c, minR = cell.r, maxR = cell.r;

        while (queue.length > 0) {
          const curr = queue.shift();
          minC = Math.min(minC, curr.c);
          maxC = Math.max(maxC, curr.c);
          minR = Math.min(minR, curr.r);
          maxR = Math.max(maxR, curr.r);

          // Check 8 neighbors
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = curr.r + dr;
              const nc = curr.c + dc;
              const nKey = `${nr},${nc}`;
              if (
                nr >= 0 && nr < rows && nc >= 0 && nc < cols &&
                !visited.has(nKey) &&
                grid[nr][nc] >= minCellDensity
              ) {
                visited.add(nKey);
                queue.push({ r: nr, c: nc });
              }
            }
          }
        }

        const widthCells = maxC - minC + 1;
        const heightCells = maxR - minR + 1;
        blobs.push({ widthCells, heightCells });
      }

      // If we have 2 or more distinct large blobs separated by empty cells -> 2 faces
      const significantBlobs = blobs.filter((b) => b.widthCells * b.heightCells >= 2);

      if (significantBlobs.length >= 2) return 2;
      return 1;
    };

    const processFrame = async (time) => {
      if (time - lastProcessTime > 250) {
        // Run detection every 250ms (~4 FPS) to prevent UI thread blocking
        lastProcessTime = time;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas && video.readyState === 4) {
          let detectedFacesCount = 1;

          // Attempt native Shape Detection API if available
          if ('FaceDetector' in window) {
            try {
              if (!faceDetectorRef.current) {
                // @ts-ignore
                faceDetectorRef.current = new window.FaceDetector({ maxDetectedFaces: 5, fastMode: true });
              }
              const faces = await faceDetectorRef.current.detect(video);
              detectedFacesCount = faces.length;
            } catch (e) {
              // Fallback to spatial skin blob analysis
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              canvas.width = 160;
              canvas.height = 120;
              ctx.drawImage(video, 0, 0, 160, 120);
              detectedFacesCount = analyzeSpatialSkinBlobs(ctx, 160, 120);
            }
          } else {
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = 160;
            canvas.height = 120;
            ctx.drawImage(video, 0, 0, 160, 120);
            detectedFacesCount = analyzeSpatialSkinBlobs(ctx, 160, 120);
          }

          setFaceCount(detectedFacesCount);

          // Update temporal sliding window buffer (keep last 6 evaluations = ~1.5s)
          historyRef.current.push(detectedFacesCount);
          if (historyRef.current.length > 6) {
            historyRef.current.shift();
          }

          const history = historyRef.current;

          // Temporal confirmation rule
          const allZero = history.length >= 5 && history.every((c) => c === 0);
          const allMultiple = history.length >= 5 && history.every((c) => c >= 2);
          const allSingle = history.length >= 4 && history.every((c) => c === 1);

          if (allZero) {
            setFaceState('NO_FACE');
            onStatusChange({ camera: true, faceDetected: false, multipleFaces: false });

            if (activeIncidentRef.current !== 'NO_FACE') {
              activeIncidentRef.current = 'NO_FACE';
              sendIntegritySignal('FACE_NOT_DETECTED', { durationSeconds: 2, faceCount: 0 });
            }
          } else if (allMultiple) {
            setFaceState('MULTIPLE_FACES');
            onStatusChange({ camera: true, faceDetected: true, multipleFaces: true });

            if (activeIncidentRef.current !== 'MULTIPLE_FACES') {
              activeIncidentRef.current = 'MULTIPLE_FACES';
              sendIntegritySignal('MULTIPLE_PERSON_DETECTED', { faceCount: detectedFacesCount, severity: 'HIGH' });
            }
          } else if (allSingle) {
            setFaceState('SINGLE_FACE');
            activeIncidentRef.current = null;
            onStatusChange({ camera: true, faceDetected: true, multipleFaces: false });
          }
        }
      }

      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraState, enabled]);

  if (!enabled) return null;

  return (
    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-[18px] border border-[var(--border)] bg-slate-950 text-white shadow-md transition-all">
      {/* Mirrored live video canvas */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover object-center transform -scale-x-100 ${showPreview ? 'block' : 'hidden'}`}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Top overlay badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold shadow-xs">
        {cameraState === 'READY' ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Camera Active</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>{cameraState === 'DENIED' ? 'Camera Denied' : 'Camera Disconnected'}</span>
          </>
        )}
      </div>

      {/* Bottom overlay badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md text-[10px] font-semibold border border-white/10 shadow-xs">
        {faceState === 'SINGLE_FACE' && (
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <UserCheck className="w-3.5 h-3.5" /> Face Detected
          </span>
        )}
        {faceState === 'NO_FACE' && (
          <span className="flex items-center gap-1.5 text-amber-400 font-bold animate-pulse">
            <UserX className="w-3.5 h-3.5" /> Face Not Detected
          </span>
        )}
        {faceState === 'MULTIPLE_FACES' && (
          <span className="flex items-center gap-1.5 text-red-400 font-bold animate-pulse">
            <Users className="w-3.5 h-3.5" /> Multiple People Detected ({faceCount})
          </span>
        )}
        {faceState === 'CHECKING' && (
          <span className="flex items-center gap-1.5 text-slate-300">
            <Camera className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" /> Verifying Face...
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center text-xs font-semibold text-red-400 space-y-2">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
