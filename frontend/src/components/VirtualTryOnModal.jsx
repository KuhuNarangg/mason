import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, Download, ZoomIn, RotateCw, Eye, Sparkles, AlertCircle, Move } from 'lucide-react';
import './VirtualTryOnModal.css';

const VirtualTryOnModal = ({ product, onClose }) => {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' or 'upload'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [cameraError, setCameraError] = useState(null);

  // Garment overlay transformation state
  const [pos, setPos] = useState({ x: 0, y: -20 });
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(0.9);
  const [blendMode, setBlendMode] = useState('normal');

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Get primary product image
  const garmentImgUrl = (product?.images && product.images.length > 0) 
    ? product.images[0] 
    : (product?.image || product?.thumbnail || '/logofinalnobg.png');

  // Start Camera Stream
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied or unavailable. You can upload a photo instead.");
      setActiveMode('upload');
    }
  };

  // Handle mode switch
  useEffect(() => {
    if (activeMode === 'camera') {
      startCamera(facingMode);
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeMode, facingMode]);

  // Flip Camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
  };

  // Upload photo handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
    }
  };

  // Drag overlay event handlers
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    setDragStart({ x: clientX - pos.x, y: clientY - pos.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    setPos({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Reset transform
  const handleResetTransform = () => {
    setPos({ x: 0, y: -20 });
    setScale(1.0);
    setRotation(0);
    setOpacity(0.9);
    setBlendMode('normal');
  };

  // Capture Snapshot
  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 640;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Draw background video or image
    if (activeMode === 'camera' && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    } else if (activeMode === 'upload' && uploadedImage) {
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';
      userImg.onload = () => {
        ctx.drawImage(userImg, 0, 0, width, height);
        drawGarmentOverlay(ctx, width, height);
      };
      userImg.src = uploadedImage;
      return;
    }

    drawGarmentOverlay(ctx, width, height);
  };

  const drawGarmentOverlay = (ctx, canvasWidth, canvasHeight) => {
    const gImg = new Image();
    gImg.crossOrigin = 'anonymous';
    gImg.onload = () => {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.globalCompositeOperation = blendMode === 'multiply' ? 'multiply' : (blendMode === 'overlay' ? 'overlay' : 'source-over');
      
      const centerX = canvasWidth / 2 + pos.x;
      const centerY = canvasHeight / 2 + pos.y;
      
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale, scale);

      const drawW = 280;
      const drawH = (280 * gImg.height) / gImg.width;
      ctx.drawImage(gImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // Download
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `OwlStitch-VirtualTryOn-${product?.slug || 'look'}.png`;
      link.href = dataUrl;
      link.click();
    };
    gImg.src = garmentImgUrl;
  };

  return (
    <div className="vto-backdrop" onClick={onClose}>
      <div className="vto-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vto-header">
          <div className="vto-header-title">
            <Sparkles size={20} className="vto-sparkle-icon" />
            <div>
              <h3>Virtual Fitting Room</h3>
              <span>Try {product?.name || 'apparel'} on yourself</span>
            </div>
          </div>
          <button className="vto-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="vto-tabs">
          <button 
            className={`vto-tab ${activeMode === 'camera' ? 'active' : ''}`}
            onClick={() => setActiveMode('camera')}
          >
            <Camera size={16} /> Live Camera
          </button>
          <button 
            className={`vto-tab ${activeMode === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveMode('upload')}
          >
            <Upload size={16} /> Upload Photo
          </button>
        </div>

        {/* Viewport Box */}
        <div 
          className="vto-viewport" 
          ref={containerRef}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          {activeMode === 'camera' ? (
            <div className="vto-media-wrap">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`vto-video-feed ${facingMode === 'user' ? 'mirrored' : ''}`} 
              />
              <button className="vto-flip-cam-btn" onClick={toggleFacingMode} title="Flip Camera">
                <RefreshCw size={18} />
              </button>
            </div>
          ) : (
            <div className="vto-upload-wrap">
              {uploadedImage ? (
                <img src={uploadedImage} alt="User Fitting" className="vto-user-photo" />
              ) : (
                <label className="vto-file-dropzone">
                  <Upload size={36} />
                  <p>Click to upload your full-body or upper-body photo</p>
                  <span>JPEG, PNG supported</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                </label>
              )}
            </div>
          )}

          {/* Draggable & Resizable Garment Overlay */}
          {(activeMode === 'camera' || (activeMode === 'upload' && uploadedImage)) && (
            <div 
              className={`vto-garment-overlay ${isDragging ? 'dragging' : ''}`}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${scale})`,
                opacity: opacity,
                mixBlendMode: blendMode
              }}
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              <img src={garmentImgUrl} alt={product?.name} draggable={false} />
              <div className="vto-drag-handle" title="Drag to position">
                <Move size={14} />
              </div>
            </div>
          )}

          {cameraError && activeMode === 'camera' && (
            <div className="vto-error-banner">
              <AlertCircle size={16} /> {cameraError}
            </div>
          )}
        </div>

        {/* Controls Toolbar */}
        <div className="vto-controls">
          <div className="vto-control-group">
            <label><ZoomIn size={14} /> Size / Scale ({Math.round(scale * 100)}%)</label>
            <input 
              type="range" 
              min="0.4" 
              max="2.2" 
              step="0.05" 
              value={scale} 
              onChange={(e) => setScale(parseFloat(e.target.value))} 
            />
          </div>

          <div className="vto-control-group">
            <label><RotateCw size={14} /> Rotate ({rotation}°)</label>
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
            <label><Eye size={14} /> Opacity ({Math.round(opacity * 100)}%)</label>
            <input 
              type="range" 
              min="0.3" 
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
          <button className="vto-reset-btn" onClick={handleResetTransform}>
            Reset Fit
          </button>
          <button className="vto-download-btn" onClick={handleDownloadSnapshot}>
            <Download size={16} /> Save Look Snapshot
          </button>
        </div>

        {/* Hidden Canvas for Export */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default VirtualTryOnModal;
