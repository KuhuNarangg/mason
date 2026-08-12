import { useState, useRef, useCallback, useMemo } from 'react';
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
} from 'lucide-react';
import useCameraStream from '../hooks/useCameraStream';
import './VirtualTryOnModal.css';

const VirtualTryOnModal = ({ product, onClose }) => {
  const [sourceMode, setSourceMode] = useState('camera'); // 'camera' | 'upload'
  const [uploadedUserImage, setUploadedUserImage] = useState(null);

  // Garment overlay transform state
  const [pos, setPos] = useState({ x: 0, y: -10 });
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(0.9);
  const [blendMode, setBlendMode] = useState('normal');

  // Dragging state
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

  // Garment image URL priority: product.tryOnImage -> product.images[0] -> thumbnail/fallback
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

  // Drag overlay pointer handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    setDragStart({ x: clientX - pos.x, y: clientY - pos.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    setPos({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Reset transform
  const handleResetFit = () => {
    setPos({ x: 0, y: -10 });
    setScale(1.0);
    setRotation(0);
    setOpacity(0.9);
    setBlendMode('normal');
  };

  // Capture Snapshot Handler
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
      // Handle camera selfie mirroring on canvas if facingMode === 'user'
      if (sourceMode === 'camera' && facingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(bgSource, 0, 0, width, height);
      ctx.restore();

      // Load garment image and composite overlay
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

        const targetX = width / 2 + pos.x * 1.2;
        const targetY = height / 2 + pos.y * 1.2;

        ctx.translate(targetX, targetY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);

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
    pos,
    scale,
    rotation,
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
                {product?.name ? `Try "${product.name}" live` : 'Garment try-on overlay'}
              </span>
            </div>
          </div>
          <button className="vto-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Source Selector Toolbar */}
        <div className="vto-mode-toolbar">
          <div className="vto-source-toggle" style={{ width: '100%', justifyContent: 'center' }}>
            <button
              className={`vto-source-btn ${sourceMode === 'camera' ? 'active' : ''}`}
              onClick={() => setSourceMode('camera')}
              style={{ flex: 1, justifyContent: 'center', padding: '8px 16px' }}
            >
              <Camera size={16} /> Live Camera Feed
            </button>
            <button
              className={`vto-source-btn ${sourceMode === 'upload' ? 'active' : ''}`}
              onClick={() => setSourceMode('upload')}
              style={{ flex: 1, justifyContent: 'center', padding: '8px 16px' }}
            >
              <Upload size={16} /> Upload Photo
            </button>
          </div>
        </div>

        {/* Viewport Container */}
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
              className={`vto-garment-overlay manual-draggable ${isDragging ? 'dragging' : ''}`}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${scale})`,
                opacity,
                mixBlendMode: blendMode,
              }}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <img src={garmentImgUrl} alt={product?.name || 'Garment Overlay'} draggable={false} />
              <div className="vto-drag-handle" title="Drag to position garment">
                <Move size={14} />
              </div>
            </div>
          )}

          {/* Camera Error Banner */}
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
          <div className="vto-control-group">
            <label>
              <ZoomIn size={14} /> Size / Scale ({Math.round(scale * 100)}%)
            </label>
            <input
              type="range"
              min="0.4"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
            />
          </div>

          <div className="vto-control-group">
            <label>
              <RotateCw size={14} /> Rotate ({rotation}°)
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="2"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
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
