import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to manage HTML5 video camera stream lifecycle, device switching,
 * and user permission / hardware errors.
 */
export function useCameraStream({ initialFacingMode = 'user', active = true } = {}) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState(initialFacingMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const videoRef = useRef(null);

  // Check available video devices
  const checkDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch {
      setHasMultipleCameras(false);
    }
  }, []);

  // Stop current tracks
  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async (mode = facingMode) => {
    setIsLoading(true);
    setError(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not supported by your browser or environment.');
      setIsLoading(false);
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }

      await checkDevices();
    } catch (err) {
      console.error('Camera stream error:', err);
      let message = 'Unable to access camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        message = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on your system.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently in use by another application.';
      } else if (err.name === 'OverconstrainedError') {
        message = 'Requested camera resolution is not supported by your camera.';
      }
      setError(message);
      setStream(null);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode, stream, checkDevices]);

  // Toggle front vs back camera
  const toggleCamera = useCallback(() => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  useEffect(() => {
    if (active) {
      startCamera(facingMode);
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [active]);

  return {
    videoRef,
    stream,
    facingMode,
    isLoading,
    error,
    hasMultipleCameras,
    startCamera,
    stopStream,
    toggleCamera,
  };
}

export default useCameraStream;
