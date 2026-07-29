import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Check, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
import heic2any from 'heic2any';
import { getPlaceholderImage } from '../../services/storageService.js';

const CANVAS_SIZE = 320; // Internal crop editor viewport size

export default function ImageUploader({ previewSeed, currentUrl, onFileSelected, uploading }) {
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);

  // Parent state display
  const [committedPreview, setCommittedPreview] = useState(null);

  // Editor states
  const [draftFile, setDraftFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [converting, setConverting] = useState(false);

  // Canvas Image & Transform states
  const [imgElement, setImgElement] = useState(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [maxScale, setMaxScale] = useState(3);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // Touch / Drag pointers
  const isDragging = useRef(false);
  const startCoords = useRef({ x: 0, y: 0 });
  const initialPinchDist = useRef(null);
  const initialPinchScale = useRef(1);

  // Ensure image position stays within circular crop bounds (no black empty gaps)
  const clampPosition = useCallback((x, y, currentScale, img) => {
    if (!img) return { x, y };

    const scaledWidth = img.width * currentScale;
    const scaledHeight = img.height * currentScale;

    let clampedX = x;
    let clampedY = y;

    if (scaledWidth >= CANVAS_SIZE) {
      clampedX = Math.min(0, Math.max(CANVAS_SIZE - scaledWidth, x));
    }
    if (scaledHeight >= CANVAS_SIZE) {
      clampedY = Math.min(0, Math.max(CANVAS_SIZE - scaledHeight, y));
    }

    return { x: clampedX, y: clampedY };
  }, []);

  // Redraw Canvas when positions or scale change
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;

    const ctx = canvas.getContext('2d');
    
    // Fill background with white to prevent black background when exporting as JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.drawImage(
      imgElement,
      pos.x,
      pos.y,
      imgElement.width * scale,
      imgElement.height * scale
    );
  }, [imgElement, pos, scale]);

  useEffect(() => {
    if (isEditing) draw();
  }, [draw, isEditing]);

  // Zoom logic targeted at a specific focal point
  const zoomTo = useCallback((targetScale, focalX, focalY) => {
    if (!imgElement) return;

    const clampedScale = Math.min(Math.max(minScale, targetScale), maxScale);
    const scaleFactor = clampedScale / scale;

    const newX = focalX - (focalX - pos.x) * scaleFactor;
    const newY = focalY - (focalY - pos.y) * scaleFactor;

    const clampedPos = clampPosition(newX, newY, clampedScale, imgElement);

    setScale(clampedScale);
    setPos(clampedPos);
  }, [imgElement, minScale, maxScale, scale, pos, clampPosition]);

  // File picking handler (handles HEIC & Motion/Live Photos)
  const handlePick = async (event) => {
    let file = event.target.files?.[0];
    event.target.value = ''; // Reset input
    if (!file) return;

    setConverting(true);

    // Convert HEIC/HEIF files (iPhone standard photo format)
    const isHEIC = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    if (isHEIC) {
      try {
        const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
        file = Array.isArray(converted) ? converted[0] : converted;
      } catch (err) {
        console.error('HEIC conversion failed:', err);
        setConverting(false);
        return;
      }
    }

    setDraftFile(file);

    // Load into HTMLImageElement
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const scaleX = CANVAS_SIZE / img.width;
        const scaleY = CANVAS_SIZE / img.height;
        const calculatedMinScale = Math.max(scaleX, scaleY);
        const calculatedMaxScale = calculatedMinScale * 4;

        const initialX = (CANVAS_SIZE - img.width * calculatedMinScale) / 2;
        const initialY = (CANVAS_SIZE - img.height * calculatedMinScale) / 2;

        setImgElement(img);
        setMinScale(calculatedMinScale);
        setMaxScale(calculatedMaxScale);
        setScale(calculatedMinScale);

        const clamped = clampPosition(initialX, initialY, calculatedMinScale, img);
        setPos(clamped);

        setConverting(false);
        setIsEditing(true);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Dragging handlers
  const handlePointerDown = (e) => {
    if (!imgElement) return;
    isDragging.current = true;
    startCoords.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || initialPinchDist.current || !imgElement) return;
    const newX = e.clientX - startCoords.current.x;
    const newY = e.clientY - startCoords.current.y;
    setPos(clampPosition(newX, newY, scale, imgElement));
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Wheel zoom
  const handleWheel = (e) => {
    if (!imgElement) return;
    e.preventDefault();

    const delta = e.deltaY * -0.005;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;

    zoomTo(scale + delta, focalX, focalY);
  };

  // Pinch-to-zoom logic
  const getPinchDistance = (e) => {
    return Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2 && imgElement) {
      initialPinchDist.current = getPinchDistance(e);
      initialPinchScale.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist.current && imgElement) {
      e.preventDefault();
      const currentDist = getPinchDistance(e);
      const ratio = currentDist / initialPinchDist.current;
      const targetScale = initialPinchScale.current * ratio;

      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

      zoomTo(targetScale, midX, midY);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDist.current = null;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraftFile(null);
    setImgElement(null);
  };

  const handleDone = async () => {
    if (!imgElement) return;

    // Export high-resolution cropped canvas (1080x1080)
    const exportSize = 1080;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize;
    const ctx = exportCanvas.getContext('2d');

    // Fill white background on export canvas too
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportSize, exportSize);

    const ratio = exportSize / CANVAS_SIZE;
    ctx.drawImage(
      imgElement,
      pos.x * ratio,
      pos.y * ratio,
      imgElement.width * scale * ratio,
      imgElement.height * scale * ratio
    );

    const croppedDataUrl = exportCanvas.toDataURL('image/jpeg', 0.92);
    setCommittedPreview(croppedDataUrl);

    // Convert Canvas directly into the final ready-to-upload JPEG File
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const finalCroppedFile = new File([blob], draftFile?.name || 'profile.jpg', {
        type: 'image/jpeg',
      });

      // Send the cropped File directly to the parent
      onFileSelected?.(finalCroppedFile);
    }, 'image/jpeg', 0.92);

    setIsEditing(false);
  };

  const avatarSrc = committedPreview || currentUrl || getPlaceholderImage?.(previewSeed || 'new-member');

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-32">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative block h-full w-full overflow-hidden rounded-full border border-black/10 bg-black/5 shadow-sm dark:border-white/10 dark:bg-white/5"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="h-full w-full object-cover rounded-full" />
          ) : (
            <div className="h-full w-full bg-neutral-200 dark:bg-neutral-800" />
          )}

          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
            <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
          </div>

          {(uploading || converting) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label="Change photo"
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-accent text-white shadow-md dark:border-neutral-900"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*, .heic, .heif"
        onChange={handlePick}
        className="hidden"
      />

      {isEditing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <button type="button" onClick={handleCancel} className="flex items-center gap-1.5 text-sm font-medium">
              <X className="h-5 w-5" />
              Cancel
            </button>
            <span className="text-sm font-semibold">Move and Scale</span>
            <button
              type="button"
              onClick={handleDone}
              className="flex items-center gap-1.5 text-sm font-semibold text-accent"
            >
              <Check className="h-5 w-5" />
              Done
            </button>
          </div>

          {/* Editor Viewport */}
          <div className="flex-1 flex items-center justify-center select-none overflow-hidden bg-black">
            <div
              ref={viewportRef}
              className="relative w-[320px] h-[320px] rounded-full overflow-hidden bg-neutral-900 cursor-grab active:cursor-grabbing touch-none shadow-[0_0_0_9999px_rgba(0,0,0,0.75)]"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 px-6 py-5 bg-black">
            <button
              type="button"
              onClick={() => zoomTo(scale - 0.15, CANVAS_SIZE / 2, CANVAS_SIZE / 2)}
              className="text-white/80 hover:text-white"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <input
              type="range"
              min={minScale}
              max={maxScale}
              step={0.01}
              value={scale}
              onChange={(e) => zoomTo(parseFloat(e.target.value), CANVAS_SIZE / 2, CANVAS_SIZE / 2)}
              className="h-1 flex-1 accent-accent cursor-pointer"
            />
            <button
              type="button"
              onClick={() => zoomTo(scale + 0.15, CANVAS_SIZE / 2, CANVAS_SIZE / 2)}
              className="text-white/80 hover:text-white"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}