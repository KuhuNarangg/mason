import { useState, useEffect, useRef, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * Custom hook for client-side in-browser pose landmark tracking using MediaPipe PoseLandmarker.
 * Detects shoulder/hip landmarks from video stream and returns real-time auto-fit overlay parameters.
 */
export function usePoseDetection({ videoRef, active = true } = {}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [poseFound, setPoseFound] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fit output state: { x, y, scale, rotation, torsoHeight, shoulderWidth }
  const [poseData, setPoseData] = useState(null);

  const landmarkerRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const smoothedRef = useRef({ x: 0, y: 0, scale: 1, rotation: 0 });

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    let isSubscribed = true;

    async function initMediaPipe() {
      try {
        setError(null);
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isSubscribed) return;

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        if (isSubscribed) {
          landmarkerRef.current = landmarker;
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('Pose detection initialization failed:', err);
        if (isSubscribed) {
          setError('Pose tracking model failed to load. Basic Overlay mode is ready.');
          setIsLoaded(false);
        }
      }
    }

    if (active && !landmarkerRef.current) {
      initMediaPipe();
    }

    return () => {
      isSubscribed = false;
    };
  }, [active]);

  // Frame detection loop
  const detectFrame = useCallback(() => {
    if (!active || !landmarkerRef.current || !videoRef?.current) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState >= 2 && video.currentTime > 0 && !video.paused) {
      try {
        const timestamp = performance.now();
        const results = landmarkerRef.current.detectForVideo(video, timestamp);

        if (results?.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          // 11: Left Shoulder, 12: Right Shoulder, 23: Left Hip, 24: Right Hip
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          const leftHip = landmarks[23];
          const rightHip = landmarks[24];

          if (
            leftShoulder &&
            rightShoulder &&
            leftShoulder.visibility > 0.4 &&
            rightShoulder.visibility > 0.4
          ) {
            setPoseFound(true);

            // Calculate normalized shoulder midpoint (0 to 1)
            const midX = (leftShoulder.x + rightShoulder.x) / 2;
            const midY = (leftShoulder.y + rightShoulder.y) / 2;

            // Calculate shoulder distance (normalized)
            const dx = rightShoulder.x - leftShoulder.x;
            const dy = rightShoulder.y - leftShoulder.y;
            const shoulderDist = Math.sqrt(dx * dx + dy * dy);

            // Calculate shoulder tilt angle in degrees
            const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

            // Compute torso height if hips visible
            let torsoHeightNorm = shoulderDist * 1.5;
            if (leftHip && rightHip && leftHip.visibility > 0.3) {
              const hipMidX = (leftHip.x + rightHip.x) / 2;
              const hipMidY = (leftHip.y + rightHip.y) / 2;
              torsoHeightNorm = Math.sqrt(
                Math.pow(hipMidX - midX, 2) + Math.pow(hipMidY - midY, 2)
              );
            }

            // Target scale (relative to normalized shoulder width of ~0.35)
            const targetScale = Math.max(0.4, Math.min(2.5, shoulderDist / 0.35));

            // Apply Exponential Moving Average (EMA) smoothing for stability (alpha = 0.25)
            const alpha = 0.25;
            const prev = smoothedRef.current;
            const smoothX = prev.x * (1 - alpha) + midX * alpha;
            const smoothY = prev.y * (1 - alpha) + midY * alpha;
            const smoothScale = prev.scale * (1 - alpha) + targetScale * alpha;
            const smoothRot = prev.rotation * (1 - alpha) + angleDeg * alpha;

            smoothedRef.current = {
              x: smoothX,
              y: smoothY,
              scale: smoothScale,
              rotation: smoothRot,
            };

            setPoseData({
              x: smoothX,
              y: smoothY,
              scale: smoothScale,
              rotation: smoothRot,
              shoulderWidth: shoulderDist,
              torsoHeight: torsoHeightNorm,
            });
          } else {
            setPoseFound(false);
          }
        } else {
          setPoseFound(false);
        }
      } catch (e) {
        // Frame detection error, ignore single frame hiccups
      }
    }

    if (active) {
      animFrameIdRef.current = requestAnimationFrame(detectFrame);
    }
  }, [active, videoRef]);

  // Start / stop detection loop
  useEffect(() => {
    if (active && isLoaded) {
      setIsDetecting(true);
      animFrameIdRef.current = requestAnimationFrame(detectFrame);
    } else {
      setIsDetecting(false);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [active, isLoaded, detectFrame]);

  return {
    isLoaded,
    isDetecting,
    poseFound,
    poseData,
    error,
  };
}

export default usePoseDetection;
