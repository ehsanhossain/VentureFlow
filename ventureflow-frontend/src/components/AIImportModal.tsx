
import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import api from '../config/api';
import { showAlert } from './Alert';

// Initialize PDF.js worker - use unpkg CDN which works better with Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface AIImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (data: any) => void;
    type: 'buyer' | 'seller';
}

export const AIImportModal: React.FC<AIImportModalProps> = ({ isOpen, onClose, onApply, type }) => {
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const extractTextFromFile = async (file: File): Promise<string> => {
        if (file.type === 'application/pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n';
            }
            return fullText;
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value;
        } else if (file.type === 'text/plain') {
            return await file.text();
        } else {
            throw new Error('Unsupported file type. Please upload PDF, Word (.docx), or Text file.');
        }
    };

    const handleProcess = async () => {
        setLoading(true);
        setError(null);
        setExtractedData(null);

        try {
            let text = '';
            let requestData: any = { type };

            if (mode === 'file') {
                if (!file) {
                    setError('Please select a file.');
                    setLoading(false);
                    return;
                }
                text = await extractTextFromFile(file);
                if (!text.trim()) {
                    throw new Error('Could not extract any text from the file.');
                }
                requestData.text = text;
            } else {
                if (!url) {
                    setError('Please enter a URL.');
                    setLoading(false);
                    return;
                }
                requestData.url = url;
            }

            const response = await api.post('/api/ai/extract', requestData);
            setExtractedData(response.data.data);
        } catch (err: any) {
            console.error('Extraction Error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to process request';
            setError(msg);
            showAlert({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (extractedData) {
            onApply(extractedData);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm ">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-medium text-gray-900">
                        AI Auto-Fill ({type === 'buyer' ? 'Buyer' : 'Seller'})
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!extractedData ? (
                        <>
                            <div className="flex gap-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setMode('file')}
                                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${mode === 'file'
                                        ? 'bg-blue-50 border-blue-500 text-[#053a5c]'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Upload Document
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('url')}
                                    className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${mode === 'url'
                                        ? 'bg-blue-50 border-blue-500 text-[#053a5c]'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Website URL
                                </button>
                            </div>

                            {mode === 'file' ? (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
                                        <input
                                            type="file"
                                            id="ai-file-upload"
                                            className="hidden"
                                            accept=".pdf,.docx,.txt"
                                            onChange={handleFileChange}
                                        />
                                        <label
                                            htmlFor="ai-file-upload"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#064771]">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {file ? file.name : 'Click to upload PDF, Word, or Text file'}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                Supports .pdf, .docx, .txt
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Company Website or Profile URL
                                        </label>
                                        <input
                                            type="url"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://example.com"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        We will fetch text from this page to extract company details.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900">Review Extracted Data</h4>
                                    <p className="text-sm text-gray-500">Please verify the information below before applying.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setExtractedData(null)}
                                    className="text-sm font-medium text-[#064771] hover:text-blue-800 transition-colors flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Re-process
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(extractedData).map(([key, value]) => {
                                        if (value === null || value === '' || (Array.isArray(value) && value.length === 0)) return null;

                                        // Format key for display (snake_case to Title Case)
                                        const label = key
                                            .replace(/_/g, ' ')
                                            .replace(/\b\w/g, (char) => char.toUpperCase());

                                        // Format value for display
                                        let displayValue: React.ReactNode = '-';

                                        if (Array.isArray(value)) {
                                            if (value.length > 0 && typeof value[0] === 'object') {
                                                displayValue = (
                                                    <ul className="list-disc list-inside">
                                                        {value.map((item: any, idx: number) => (
                                                            <li key={idx} className="truncate">{item.name || item.address || JSON.stringify(item)}</li>
                                                        ))}
                                                    </ul>
                                                );
                                            } else {
                                                displayValue = (
                                                    <div className="flex flex-wrap gap-1">
                                                        {value.map((item: string, idx: number) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                                                {item}
                                                            </span>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                        } else if (typeof value === 'object') {
                                            displayValue = JSON.stringify(value);
                                        } else {
                                            displayValue = String(value);
                                        }

                                        return (
                                            <div key={key} className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group">
                                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 group-hover:text-[#064771] transition-colors">
                                                    {label}
                                                </label>
                                                <div className="text-sm text-gray-900 font-medium break-words leading-relaxed">
                                                    {displayValue}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                                <svg className="w-5 h-5 text-[#064771] mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-blue-800">
                                    Review the data above carefully. You can edit the fields manually in the form after applying.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {!extractedData ? (
                        <button
                            type="button"
                            onClick={handleProcess}
                            disabled={loading}
                            className={`px-6 py-2 bg-[#064771] text-white rounded-lg hover:bg-[#053a5c] transition-colors flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {loading ? 'Processing...' : 'Process'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleApply}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Apply to Form
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

