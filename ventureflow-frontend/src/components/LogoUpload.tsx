import React, { useState, useEffect, useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface LogoUploadProps {
    initialImage?: string; // URL or path
    onImageSelect: (file: File | null) => void;
    className?: string;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ initialImage, onImageSelect, className = '' }) => {
    const [preview, setPreview] = useState<string | null>(initialImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialImage) {
            // If it's a full URL or a relative path, use it. 
            // Assuming backend provides full URL or we prepend base URL if needed.
            // For now, trust the initialImage string.
            setPreview(initialImage);
        }
    }, [initialImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create local preview
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);
            onImageSelect(file);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onImageSelect(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div
                onClick={handleClick}
                className={`relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#064771] transition-colors group overflow-hidden bg-gray-50`}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center text-gray-400 group-hover:text-[#064771]">
                        <Camera className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium">Upload</span>
                    </div>
                )}

                {preview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Change</span>
                    </div>
                )}

                {preview && (
                    <button
                        onClick={handleRemove}
                        className="absolute top-0 right-0 p-1 bg-red-500 rounded-bl-lg text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove logo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
            {/* Hidden Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={handleFileChange}
            />
            {/* Label */}
            <span className="mt-2 text-xs text-gray-500 font-medium">Company Logo</span>
        </div>
    );
};
