/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperModalProps {
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    onClose: () => void;
    aspect?: number;
}

/**
 * Helper: create a cropped image blob from canvas
 */
async function getCroppedImg(imageSrc: string, crop: Area): Promise<Blob> {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    await new Promise<void>((resolve) => { image.onload = () => resolve(); });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
        image,
        crop.x, crop.y, crop.width, crop.height,
        0, 0, crop.width, crop.height
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => blob ? resolve(blob) : reject(new Error('Canvas is empty')),
            'image/jpeg',
            0.92
        );
    });
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    imageSrc,
    onCropComplete,
    onClose,
    aspect = 1,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const onCropDone = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;
        setIsSaving(true);
        try {
            const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedBlob);
        } catch (e) {
            console.error('Crop failed:', e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[3px] w-full max-w-lg mx-4 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Crop & Adjust Image</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-[3px] text-gray-400 hover:text-gray-700 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="relative w-full h-80 bg-gray-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropDone}
                    />
                </div>

                {/* Controls */}
                <div className="px-5 py-3 border-t border-gray-100 space-y-3">
                    {/* Zoom Control */}
                    <div className="flex items-center gap-3">
                        <ZoomOut className="w-4 h-4 text-gray-400" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-[#064771]"
                            title="Zoom"
                        />
                        <ZoomIn className="w-4 h-4 text-gray-400" />
                    </div>

                    {/* Rotate Button */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[3px] transition-colors"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                            Rotate
                        </button>
                        <span className="text-[10px] text-gray-400">Drag to reposition, scroll to zoom</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-[3px] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 text-sm font-medium text-white bg-[#064771] hover:bg-[#053a5e] rounded-[3px] transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Apply & Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
