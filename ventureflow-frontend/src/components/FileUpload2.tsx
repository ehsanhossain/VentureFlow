/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ children, className }: BadgeProps) => (
  <div className={`inline-flex items-center justify-center gap-1 px-2 py-1 bg-[#064771] rounded-[999px] ${className || ''}`}>
    {children}
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
  onClick?: () => void;
}

const Button = ({ children, className, variant = 'default', onClick }: ButtonProps) => (
  <button
    className={`flex items-center justify-center gap-1.5 px-3 py-[5.03px] rounded-[49.82px] ${
      variant === 'outline' 
        ? 'bg-white border border-solid border-[#064771] text-gray-600' 
        : 'bg-[#064771] text-white'
    } ${className || ''}`}
    onClick={onClick}
  >
    {children}
  </button>
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card = ({ children, className, ...props }: CardProps) => (
  <div className={`bg-white rounded-[12.34px] ${className || ''}`} {...props}>
    {children}
  </div>
);

interface FileUploadProps {
  onChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => void;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onChange,
  onUpload,
  multiple = true,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateFiles = (files: File[]) => {
    setSelectedFiles(prev => {
      const updated = [...prev, ...files];
      onChange?.(updated);
      return updated;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    if (e.dataTransfer.items.length > 0) {
      setDraggedFile(e.dataTransfer.items[0].getAsFile()?.name || null);
    }
    setCursorPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setDraggedFile(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setDraggedFile(null);

    const files = Array.from(e.dataTransfer.files);
    updateFiles(files);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      updateFiles(files);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadClick = () => {
    onUpload?.(selectedFiles);
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
      />

      <Card
        className={`flex flex-col w-full min-h-[240px] items-center justify-center p-4 ${
          isDragging ? "bg-[#e7f3fc]" : "bg-white"
        } border-[1.9px] border-dashed border-[#064771]`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-6 w-full max-w-2xl">
          {!selectedFiles.length && !isDragging ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <img className="w-12 h-12" alt="Upload icon" src="/group-3.png" />
              <div className="space-y-2">
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  Choose a file or drag & drop it here
                </p>
                <p className="font-normal text-gray-500 text-xs sm:text-sm">
                  Upload the required files
                </p>
              </div>
              <Button className="w-full sm:w-auto min-w-[152px] h-[34px]" onClick={handleBrowseClick}>
                <img className="w-4 h-4" alt="Browse icon" src="/group-1261156516.png" />
                <span className="font-normal">Browse File</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <img className="w-12 h-12" alt="Upload icon" src="/group-3-1.png" />
              <div className="space-y-2">
                <p className="font-medium text-gray-900 text-sm sm:text-base">
                  {isDragging ? "Drop files here" : `${selectedFiles.length} Files selected`}
                </p>
                <p className="font-normal text-gray-500 text-xs sm:text-sm">
                  {isDragging ? "Release to upload files" : 'Click "Upload" to proceed or "Browse" to add more'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
                <Button variant="outline" className="min-w-[189px] h-[34px]" onClick={handleBrowseClick}>
                  <img className="w-4 h-4" alt="Browse icon" src="/group-1261156532.png" />
                  <span>Browse More</span>
                </Button>
                {!isDragging && (
                  <>
                    <div className="font-medium text-gray-900 text-sm sm:text-base">or</div>
                    <Button className="min-w-[111px] h-[34px]" onClick={handleUploadClick}>
                      <img className="w-4 h-4" alt="Upload icon" src="/group-1261156533.png" />
                      <span className="font-medium">Upload</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {selectedFiles.length > 0 && !isDragging && (
            <div className="flex flex-wrap gap-2 mt-4 w-full justify-center">
              {selectedFiles.map((file, index) => (
                <Badge key={index}>
                  <img className="w-4 h-4" alt="Document" src="/document.svg" />
                  <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Card>

      {isDragging && draggedFile && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: `${cursorPosition.x + 10}px`, top: `${cursorPosition.y + 10}px` }}
        >
          <Badge>
            <img className="w-4 h-4" alt="Document" src="/document.svg" />
            <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[200px]">
              {draggedFile}
            </span>
          </Badge>
        </div>
      )}
    </div>
  );
};
