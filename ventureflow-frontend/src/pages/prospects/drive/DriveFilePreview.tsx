/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { formatFileSize, getFileIconSrc } from './driveUtils';
import { DriveFile } from './useProspectDrive';

interface DriveFilePreviewProps {
    file: DriveFile | null;
    previewUrl: string | null;
    loading?: boolean;
    onClose: () => void;
    onDownload: () => void;
}

const DriveFilePreview: React.FC<DriveFilePreviewProps> = ({ file, previewUrl, loading, onClose, onDownload }) => {
    const { t } = useTranslation();
    const [fullscreen, setFullscreen] = React.useState(false);

    const isImage = file?.mime_type?.startsWith('image/') ?? false;
    const isPdf = file?.mime_type === 'application/pdf';
    const isVideo = file?.mime_type?.startsWith('video/') ?? false;
    const isText = file?.mime_type?.startsWith('text/') ?? false;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative bg-white rounded-lg shadow-2xl flex flex-col z-[101] transition-all duration-200 ${fullscreen ? 'w-full h-full m-0 rounded-none' : 'w-full max-w-4xl h-[85vh]'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {file && <img src={getFileIconSrc(file.original_name)} alt="" className="w-7 h-7 shrink-0" draggable={false} />}
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{file?.original_name || 'Loading...'}</p>
                            {file && <p className="text-[11px] text-gray-400">{formatFileSize(file.size)} · v{file.current_version}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={onDownload} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title={t('flowdrive.filePreview.download')} aria-label={t('flowdrive.filePreview.download')}>
                            <Download className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setFullscreen(!fullscreen)} className="p-1.5 hover:bg-gray-100 rounded transition-colors" title={t('flowdrive.filePreview.toggleFullscreen')} aria-label={t('flowdrive.filePreview.toggleFullscreen')}>
                            {fullscreen ? <Minimize2 className="w-4 h-4 text-gray-500" /> : <Maximize2 className="w-4 h-4 text-gray-500" />}
                        </button>
                        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded transition-colors" aria-label="Close">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                    {loading && (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-[#064771] animate-spin" />
                            <p className="text-sm text-gray-500">Loading preview...</p>
                        </div>
                    )}
                    {!loading && previewUrl && isImage && (
                        <img
                            src={previewUrl}
                            alt={file?.original_name || ''}
                            className="max-w-full max-h-full object-contain rounded"
                            style={{ imageRendering: 'auto' }}
                        />
                    )}
                    {!loading && previewUrl && isPdf && (
                        <iframe
                            src={previewUrl}
                            title={file?.original_name || ''}
                            className="w-full h-full border-0 rounded"
                        />
                    )}
                    {!loading && previewUrl && isVideo && (
                        <video
                            src={previewUrl}
                            controls
                            className="max-w-full max-h-full rounded"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}
                    {!loading && previewUrl && isText && (
                        <iframe
                            src={previewUrl}
                            title={file?.original_name || ''}
                            className="w-full h-full border-0 bg-white rounded font-mono text-sm"
                        />
                    )}
                    {!loading && !previewUrl && file && (
                        <div className="text-center">
                            <img src={getFileIconSrc(file.original_name)} alt="" className="w-16 h-16 mx-auto mb-4" draggable={false} />
                            <p className="text-sm text-gray-500 mb-3">{t('flowdrive.filePreview.noPreview')}</p>
                            <button
                                onClick={onDownload}
                                className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                            >
                                <Download className="w-4 h-4" /> {t('flowdrive.filePreview.downloadFile')}
                            </button>
                        </div>
                    )}
                    {!loading && !isImage && !isPdf && !isVideo && !isText && previewUrl && file && (
                        <div className="text-center">
                            <img src={getFileIconSrc(file.original_name)} alt="" className="w-16 h-16 mx-auto mb-4" draggable={false} />
                            <p className="text-sm text-gray-500 mb-3">{t('flowdrive.filePreview.noPreview')}</p>
                            <button
                                onClick={onDownload}
                                className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-[#064771] text-white rounded text-sm font-medium hover:bg-[#053a5c] transition-colors"
                            >
                                <Download className="w-4 h-4" /> {t('flowdrive.filePreview.downloadFile')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriveFilePreview;
