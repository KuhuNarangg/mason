import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Camera,
  Upload,
  X,
  RefreshCw,
  Download,
  ZoomIn,
  RotateCw,
  Eye,
  Sparkles,
  AlertCircle,
  Move,
  CheckCircle2,
  Sliders,
  Maximize2,
} from 'lucide-react';
import useCameraStream from '../hooks/useCameraStream';
import usePoseDetection from '../hooks/usePoseDetection';
import './VirtualTryOnModal.css';

const VirtualTryOnModal = ({ product, onClose }) => {
  // Try-on mode state: 'autofit' (default) or 'manual'
  const [tryOnMode, setTryOnMode] = useState('autofit'); // 'autofit' | 'manual'
  const [sourceMode, setSourceMode] = useState('camera'); // 'camera' | 'upload'
  const [uploadedUserImage, setUploadedUserImage] = useState(null);

  // Manual transform state (Mode 1 & Nudge Offsets in Mode 2)
  const [manualPos, setManualPos] = useState({ x: 0, y: -10 });
  const [manualScale, setManualScale] = useState(1.0);
  const [manualRotation, setManualRotation] = useState(0);

  // Fine-tuning nudge offsets for Auto-Fit mode
  const [autoNudge, setAutoNudge] = useState({ x: 0, y: 0, scale: 1.0 });

  // Common overlay settings
  const [opacity, setOpacity] = useState(0.9);
  const [blendMode, setBlendMode] = useState('normal');

  // Dragging state for manual mode
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Camera Stream Custom Hook
  const {
    videoRef,
    facingMode,
    isLoading: isCamLoading,
    error: cameraError,
    toggleCamera,
  } = useCameraStream({
    initialFacingMode: 'user',
    active: sourceMode === 'camera',
  });

  // Pose Detection Custom Hook
  const {
    isLoaded: isPoseLoaded,
    poseFound,
    poseData,
    error: poseError,
  } = usePoseDetection({
    videoRef,
    active: sourceMode === 'camera' && tryOnMode === 'autofit',
  });

  // Automatic fallback to manual overlay if pose detection fails to load or error occurs
  useEffect(() => {
    if (poseError && tryOnMode === 'autofit') {
      console.info('Switching to Basic Manual Overlay mode due to pose model status:', poseError);
    }
  }, [poseError, tryOnMode]);

  // Determine garment image URL (prioritize tryOnImage -> first product image -> thumbnail/fallback)
  const garmentImgUrl = useMemo(() => {
    if (product?.tryOnImage) return product.tryOnImage;
    if (product?.images && product.images.length > 0) return product.images[0];
    return product?.image || product?.thumbnail || '/logofinalnobg.png';
  }, [product]);

  // Handle uploaded user photo
  const handleUserPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedUserImage(url);
    }
  };

  // Pointer drag event handlers for Manual Mode
  const handlePointerDown = (e) => {
    if (tryOnMode === 'autofit') return;
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    setDragStart({ x: clientX - manualPos.x, y: clientY - manualPos.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging || tryOnMode === 'autofit') return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    setManualPos({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Reset transforms
  const handleResetFit = () => {
    setManualPos({ x: 0, y: -10 });
    setManualScale(1.0);
    setManualRotation(0);
    setAutoNudge({ x: 0, y: 0, scale: 1.0 });
    setOpacity(0.9);
    setBlendMode('normal');
  };

  // Calculate final style transform for overlay
  const overlayStyle = useMemo(() => {
    if (tryOnMode === 'autofit' && poseFound && poseData && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerW = rect.width || 580;
      const containerH = rect.height || 380;

      // Invert X when camera is mirrored in selfie user mode
      const isMirrored = facingMode === 'user' && sourceMode === 'camera';
      const normX = isMirrored ? 1 - poseData.x : poseData.x;

      const posX = (normX - 0.5) * containerW + autoNudge.x;
      const posY = (poseData.y - 0.5) * containerH - 10 + autoNudge.y;
      const computedScale = poseData.scale * autoNudge.scale;
      const computedRot = isMirrored ? -poseData.rotation : poseData.rotation;

      return {
        transform: `translate(${posX}px, ${posY}px) rotate(${computedRot}deg) scale(${computedScale})`,
        opacity,
        mixBlendMode: blendMode,
      };
    }

    // Basic Manual Overlay Mode (or Pose fallback)
    return {
      transform: `translate(${manualPos.x}px, ${manualPos.y}px) rotate(${manualRotation}deg) scale(${manualScale})`,
      opacity,
      mixBlendMode: blendMode,
    };
  }, [
    tryOnMode,
    poseFound,
    poseData,
    facingMode,
    sourceMode,
    autoNudge,
    manualPos,
    manualRotation,
    manualScale,
    opacity,
    blendMode,
  ]);

  // Capture & Download Snapshot Handler
  const handleCaptureSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 640;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    const drawSnapshot = (bgSource, isVideo = false) => {
      ctx.save();
      // Handle camera mirroring on canvas if facingMode === 'user'
      if (sourceMode === 'camera' && facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      if (isVideo) {
        ctx.drawImage(bgSource, 0, 0, width, height);
      } else {
        ctx.drawImage(bgSource, 0, 0, width, height);
      }
      ctx.restore();

      // Load garment image and draw overlay
      const gImg = new Image();
      gImg.crossOrigin = 'anonymous';
      gImg.onload = () => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.globalCompositeOperation =
          blendMode === 'multiply'
            ? 'multiply'
            : blendMode === 'overlay'
            ? 'overlay'
            : 'source-over';

        let targetX = width / 2;
        let targetY = height / 2;
        let targetScale = 1.0;
        let targetRot = 0;

        if (tryOnMode === 'autofit' && poseFound && poseData) {
          targetX = poseData.x * width + autoNudge.x;
          targetY = poseData.y * height - 20 + autoNudge.y;
          targetScale = poseData.scale * autoNudge.scale;
          targetRot = poseData.rotation;
        } else {
          targetX = width / 2 + manualPos.x * 1.2;
          targetY = height / 2 + manualPos.y * 1.2;
          targetScale = manualScale;
          targetRot = manualRotation;
        }

        ctx.translate(targetX, targetY);
        ctx.rotate((targetRot * Math.PI) / 180);
        ctx.scale(targetScale, targetScale);

        const drawW = 320;
        const drawH = (320 * gImg.height) / gImg.width;
        ctx.drawImage(gImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Trigger PNG Download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `OwlStitch-VirtualTryOn-${product?.slug || 'look'}.png`;
        link.href = dataUrl;
        link.click();
      };
      gImg.src = garmentImgUrl;
    };

    if (sourceMode === 'camera' && videoRef?.current) {
      drawSnapshot(videoRef.current, true);
    } else if (sourceMode === 'upload' && uploadedUserImage) {
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      userImg.onload = () => drawSnapshot(userImg, false);
      userImg.src = uploadedUserImage;
    }
  }, [
    sourceMode,
    facingMode,
    videoRef,
    uploadedUserImage,
    opacity,
    blendMode,
    tryOnMode,
    poseFound,
    poseData,
    autoNudge,
    manualPos,
    manualScale,
    manualRotation,
    garmentImgUrl,
    product,
  ]);

  return (
    <div className="vto-backdrop" onClick={onClose}>
      <div className="vto-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vto-header">
          <div className="vto-header-title">
            <Sparkles size={22} className="vto-sparkle-icon" />
            <div>
              <h3>Virtual Fitting Room</h3>
              <span>
                {product?.name ? `Try "${product.name}" live` : 'Real-time garment try-on preview'}
              </span>
            </div>
          </div>
          <button className="vto-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Source Selector & Try-On Mode Switcher */}
        <div className="vto-mode-toolbar">
          <div className="vto-sub-tabs">
            <button
              className={`vto-tab ${tryOnMode === 'autofit' ? 'active' : ''}`}
              onClick={() => setTryOnMode('autofit')}
              title="Pose-tracked automatic garment fitting"
            >
              <Sparkles size={15} /> Auto-Fit (Pose Tracked)
            </button>
            <button
              className={`vto-tab ${tryOnMode === 'manual' ? 'active' : ''}`}
              onClick={() => setTryOnMode('manual')}
              title="Manual drag and scale overlay"
            >
              <Move size={15} /> Basic Overlay (Manual)
            </button>
          </div>

          <div className="vto-source-toggle">
            <button
              className={`vto-source-btn ${sourceMode === 'camera' ? 'active' : ''}`}
              onClick={() => setSourceMode('camera')}
            >
              <Camera size={14} /> Live Feed
            </button>
            <button
              className={`vto-source-btn ${sourceMode === 'upload' ? 'active' : ''}`}
              onClick={() => setSourceMode('upload')}
            >
              <Upload size={14} /> Upload Photo
            </button>
          </div>
        </div>

        {/* Main Viewport Box */}
        <div
          className="vto-viewport"
          ref={containerRef}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          {sourceMode === 'camera' ? (
            <div className="vto-media-wrap">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`vto-video-feed ${facingMode === 'user' ? 'mirrored' : ''}`}
              />
              <button
                className="vto-flip-cam-btn"
                onClick={toggleCamera}
                title="Flip Camera (Front/Back)"
              >
                <RefreshCw size={18} />
              </button>
            </div>
          ) : (
            <div className="vto-upload-wrap">
              {uploadedUserImage ? (
                <img src={uploadedUserImage} alt="User Fitting" className="vto-user-photo" />
              ) : (
                <label className="vto-file-dropzone">
                  <Upload size={36} />
                  <p>Click or drag to upload your upper-body / full-body photo</p>
                  <span>Supports JPG, PNG, WEBP</span>
                  <input type="file" accept="image/*" onChange={handleUserPhotoUpload} />
                </label>
              )}
            </div>
          )}

          {/* Garment Layer Overlay */}
          {(sourceMode === 'camera' || (sourceMode === 'upload' && uploadedUserImage)) && (
            <div
              className={`vto-garment-overlay ${tryOnMode === 'manual' ? 'manual-draggable' : ''} ${
                isDragging ? 'dragging' : ''
              }`}
              style={overlayStyle}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <img src={garmentImgUrl} alt={product?.name || 'Garment Overlay'} draggable={false} />
              {tryOnMode === 'manual' && (
                <div className="vto-drag-handle" title="Drag to position garment">
                  <Move size={14} />
                </div>
              )}
            </div>
          )}

          {/* Status Indicator Badges */}
          {sourceMode === 'camera' && tryOnMode === 'autofit' && (
            <div className="vto-pose-status">
              {poseFound ? (
                <span className="badge-locked">
                  <CheckCircle2 size={14} /> Pose Tracked
                </span>
              ) : isPoseLoaded ? (
                <span className="badge-searching">
                  <Sparkles size={14} className="spinning-icon" /> Aligning front camera...
                </span>
              ) : (
                <span className="badge-loading">
                  <AlertCircle size={14} /> Loading pose tracking engine...
                </span>
              )}
            </div>
          )}

          {/* Graceful Camera Error Banner */}
          {cameraError && sourceMode === 'camera' && (
            <div className="vto-error-banner">
              <AlertCircle size={18} />
              <div>
                <strong>Camera Access Issue:</strong> {cameraError}
              </div>
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="vto-controls">
          {tryOnMode === 'autofit' ? (
            <>
              <div className="vto-control-group">
                <label>
                  <Eye size={14} /> Opacity ({Math.round(opacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
              </div>

              <div className="vto-control-group">
                <label>
                  <ZoomIn size={14} /> Auto-Fit Scale Fine-Tune ({Math.round(autoNudge.scale * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.05"
                  value={autoNudge.scale}
                  onChange={(e) =>
                    setAutoNudge((prev) => ({ ...prev, scale: parseFloat(e.target.value) }))
                  }
                />
              </div>

              <div className="vto-control-group">
                <label>
                  <Sliders size={14} /> Vertical Nudge Y ({autoNudge.y}px)
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="2"
                  value={autoNudge.y}
                  onChange={(e) => setAutoNudge((prev) => ({ ...prev, y: parseInt(e.target.value) }))}
                />
              </div>

              <div className="vto-control-group">
                <label>
                  <Sliders size={14} /> Horizontal Nudge X ({autoNudge.x}px)
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="2"
                  value={autoNudge.x}
                  onChange={(e) => setAutoNudge((prev) => ({ ...prev, x: parseInt(e.target.value) }))}
                />
              </div>
            </>
          ) : (
            <>
              <div className="vto-control-group">
                <label>
                  <ZoomIn size={14} /> Size / Scale ({Math.round(manualScale * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.05"
                  value={manualScale}
                  onChange={(e) => setManualScale(parseFloat(e.target.value))}
                />
              </div>

              <div className="vto-control-group">
                <label>
                  <RotateCw size={14} /> Rotate ({manualRotation}°)
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="2"
                  value={manualRotation}
                  onChange={(e) => setManualRotation(parseInt(e.target.value))}
                />
              </div>

              <div className="vto-control-group">
                <label>
                  <Eye size={14} /> Opacity ({Math.round(opacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
              </div>

              <div className="vto-control-group">
                <label>Blend Mode</label>
                <select value={blendMode} onChange={(e) => setBlendMode(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="multiply">Multiply (Shadow Blend)</option>
                  <option value="overlay">Overlay</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="vto-footer">
          <button className="vto-reset-btn" onClick={handleResetFit}>
            Reset Fit
          </button>
          <button className="vto-download-btn" onClick={handleCaptureSnapshot}>
            <Download size={16} /> Save Look Snapshot
          </button>
        </div>

        {/* Offscreen Canvas for Image Capture & Download */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default VirtualTryOnModal;
