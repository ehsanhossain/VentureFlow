/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2,
    ChevronLeft, ChevronRight, Trash2, SkipForward, Edit3,
    Loader2, AlertTriangle, XCircle, Check, Search
} from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

// ── Types ──

interface ImportError {
    field: string;
    label: string;
    value: string | null;
    message: string;
    suggestions: string[];
}

interface ImportRow {
    rowIndex: number;
    status: 'valid' | 'error';
    data: Record<string, string | null>;
    errors: ImportError[];
}

interface ColumnDef {
    key: string;
    label: string;
    required: boolean;
    type: string;
}

interface ValidationResult {
    summary: { total: number; valid: number; errors: number };
    rows: ImportRow[];
    columns: ColumnDef[];
}

interface ImportWizardProps {
    isOpen: boolean;
    onClose: () => void;
    initialType?: 'investors' | 'targets';
}

type ImportStep = 'upload' | 'preview' | 'confirm' | 'done';

// ── Component ──

const ImportWizard: React.FC<ImportWizardProps> = ({
    isOpen,
    onClose,
    initialType = 'investors',
}) => {
    // State
    const [step, setStep] = useState<ImportStep>('upload');
    const [importType, setImportType] = useState<'investors' | 'targets'>(initialType);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const [rows, setRows] = useState<ImportRow[]>([]);
    const [columns, setColumns] = useState<ColumnDef[]>([]);
    const [filterMode, setFilterMode] = useState<'all' | 'errors'>('all');
    const [editingCell, setEditingCell] = useState<{ rowIdx: number; field: string } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: any[] } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setStep('upload');
            setSelectedFile(null);

            setRows([]);
            setColumns([]);
            setImportResult(null);
            setFilterMode('all');
            setSearchTerm('');
        }
    }, [isOpen]);

    // Focus edit input when editing
    useEffect(() => {
        if (editingCell && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingCell]);

    // ── Handlers ──

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                showAlert({ type: 'error', message: 'File is too large. Maximum 10MB allowed.' });
                return;
            }
            setSelectedFile(file);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
                showAlert({ type: 'error', message: 'Only CSV and XLSX files are supported.' });
                return;
            }
            setSelectedFile(file);
        }
    }, []);

    const downloadTemplate = useCallback(async () => {
        const type = importType === 'investors' ? 'investor' : 'target';
        setIsDownloadingTemplate(true);
        try {
            const response = await api.get(`/api/import/template/${type}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ventureflow_${type}_import_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            showAlert({ type: 'success', message: 'Template downloaded successfully!' });
        } catch (err: any) {
            showAlert({ type: 'error', message: 'Failed to download template. Please try again.' });
        } finally {
            setIsDownloadingTemplate(false);
        }
    }, [importType]);

    const startValidation = useCallback(async () => {
        if (!selectedFile) return;

        setIsValidating(true);
        const type = importType === 'investors' ? 'investor' : 'target';

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post(`/api/import/validate/${type}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const result: ValidationResult = response.data;

            setRows(result.rows);
            setColumns(result.columns);

            if (result.summary.total === 0) {
                showAlert({ type: 'warning', message: 'The file appears to be empty. No data rows found.' });
                return;
            }

            setStep('preview');

            if (result.summary.errors > 0) {
                showAlert({
                    type: 'warning',
                    message: `${result.summary.errors} row(s) have issues that need your attention.`,
                });
            } else {
                showAlert({
                    type: 'success',
                    message: `All ${result.summary.valid} rows are valid and ready to import!`,
                });
            }

        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to validate the file.';
            showAlert({ type: 'error', message: msg });
        } finally {
            setIsValidating(false);
        }
    }, [selectedFile, importType]);

    const confirmImport = useCallback(async () => {
        const validRows = rows.filter(r => r.status === 'valid');
        if (validRows.length === 0) {
            showAlert({ type: 'error', message: 'No valid rows to import.' });
            return;
        }

        setIsImporting(true);
        const type = importType === 'investors' ? 'investor' : 'target';

        try {
            const response = await api.post(`/api/import/confirm/${type}`, {
                rows: validRows.map(r => ({ rowIndex: r.rowIndex, data: r.data })),
            });

            setImportResult(response.data);
            setStep('done');
            showAlert({ type: 'success', message: `Successfully imported ${response.data.imported} records!` });

        } catch (err: any) {
            const msg = err.response?.data?.message || 'Import failed.';
            showAlert({ type: 'error', message: msg });
        } finally {
            setIsImporting(false);
        }
    }, [rows, importType]);

    // ── Row operations ──

    const skipRow = useCallback((rowIndex: number) => {
        setRows(prev => prev.filter(r => r.rowIndex !== rowIndex));
    }, []);

    const skipAllErrors = useCallback(() => {
        setRows(prev => prev.filter(r => r.status === 'valid'));
    }, []);

    const deleteAllErrors = useCallback(() => {
        setRows(prev => prev.filter(r => r.status === 'valid'));
        showAlert({ type: 'info', message: 'All error rows removed from import.' });
    }, []);

    const startEditing = useCallback((rowIdx: number, field: string, currentValue: string | null) => {
        setEditingCell({ rowIdx, field });
        setEditValue(currentValue || '');
    }, []);

    const saveEdit = useCallback(() => {
        if (!editingCell) return;

        setRows(prev => prev.map(row => {
            if (row.rowIndex === editingCell.rowIdx) {
                const newData = { ...row.data, [editingCell.field]: editValue || null };
                // Re-check: if this edit fixes a previously errored field, remove that error
                const newErrors = row.errors.filter(e => e.field !== editingCell.field);
                return {
                    ...row,
                    data: newData,
                    errors: newErrors,
                    status: newErrors.length === 0 ? 'valid' as const : 'error' as const,
                };
            }
            return row;
        }));

        setEditingCell(null);
        setEditValue('');
    }, [editingCell, editValue]);

    const applySuggestion = useCallback((rowIndex: number, field: string, suggestion: string) => {
        setRows(prev => prev.map(row => {
            if (row.rowIndex === rowIndex) {
                // Merge: keep existing valid items + append the accepted suggestion
                // The backend already stores matched items in row.data[field] and only
                // the unrecognized items appear in the error. So we merge them together.
                const existing = row.data[field];
                const merged = existing ? `${existing}, ${suggestion}` : suggestion;
                const newData = { ...row.data, [field]: merged };
                const newErrors = row.errors.filter(e => e.field !== field);
                return {
                    ...row,
                    data: newData,
                    errors: newErrors,
                    status: newErrors.length === 0 ? 'valid' as const : 'error' as const,
                };
            }
            return row;
        }));
    }, []);

    // ── Derived values ──

    const filteredRows = rows.filter(r => {
        if (filterMode === 'errors' && r.status !== 'error') return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return Object.values(r.data).some(v => v?.toLowerCase().includes(search));
        }
        return true;
    });

    const validCount = rows.filter(r => r.status === 'valid').length;
    const errorCount = rows.filter(r => r.status === 'error').length;

    // ── Helper: get error for a field in a row ──

    const getFieldError = (row: ImportRow, field: string): ImportError | undefined => {
        return row.errors.find(e => e.field === field);
    };

    if (!isOpen) return null;

    // ── Render ──

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white rounded-[3px] shadow-2xl border border-gray-100 transform transition-all animate-in zoom-in-95 duration-200 flex flex-col ${step === 'preview' ? 'w-[95vw] h-[92vh]' : 'max-w-xl w-full max-h-[90vh]'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        {step !== 'upload' && step !== 'done' && (
                            <button
                                onClick={() => setStep(step === 'confirm' ? 'preview' : 'upload')}
                                className="p-1.5 hover:bg-gray-100 rounded-[3px] transition-colors text-gray-400 hover:text-gray-600"
                                title="Go back"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                            {step === 'upload' && 'Import Data'}
                            {step === 'preview' && 'Review & Fix Errors'}
                            {step === 'confirm' && 'Confirm Import'}
                            {step === 'done' && 'Import Complete'}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Step indicator */}
                        <div className="hidden sm:flex items-center gap-1.5 mr-4">
                            {(['upload', 'preview', 'confirm', 'done'] as ImportStep[]).map((s, i) => (
                                <div key={s} className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full transition-colors ${s === step ? 'bg-[#064771] scale-125' :
                                        (['upload', 'preview', 'confirm', 'done'].indexOf(step) > i) ? 'bg-green-400' : 'bg-gray-200'
                                        }`} />
                                    {i < 3 && <div className={`w-6 h-0.5 ${(['upload', 'preview', 'confirm', 'done'].indexOf(step) > i) ? 'bg-green-400' : 'bg-gray-200'
                                        }`} />}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-[3px] transition-colors"
                            title="Close import wizard"
                            aria-label="Close import wizard"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {step === 'upload' && renderUploadStep()}
                    {step === 'preview' && renderPreviewStep()}
                    {step === 'confirm' && renderConfirmStep()}
                    {step === 'done' && renderDoneStep()}
                </div>
            </div>
        </div>
    );

    // ── Step Renderers ──

    function renderUploadStep() {
        return (
            <div className="p-6 space-y-6">
                {/* Type tabs */}
                <div className="flex bg-gray-100 p-1 rounded-[3px]">
                    <button
                        onClick={() => setImportType('investors')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-[3px] transition-all ${importType === 'investors'
                            ? 'bg-white text-[#064771] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Investors
                    </button>
                    <button
                        onClick={() => setImportType('targets')}
                        className={`flex-1 py-2.5 text-sm font-medium rounded-[3px] transition-all ${importType === 'targets'
                            ? 'bg-white text-[#064771] shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Targets
                    </button>
                </div>

                {/* File upload zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative group cursor-pointer border-2 border-dashed rounded-[3px] p-10 transition-all duration-300 flex flex-col items-center gap-4 ${selectedFile
                        ? 'border-green-400 bg-green-50/30'
                        : 'border-gray-200 hover:border-[#064771] hover:bg-gray-50/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        id="csv-upload"
                        type="file"
                        className="hidden"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileSelect}
                        title="Upload CSV or Excel file"
                        aria-label="Upload CSV or Excel file"
                    />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${selectedFile
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-[#064771]/10 group-hover:text-[#064771]'
                        }`}>
                        {selectedFile ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">
                            {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {selectedFile
                                ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB — Click to change`
                                : 'Supports CSV, XLSX files up to 10MB'}
                        </p>
                    </div>
                </div>

                {/* Info box */}
                <div className="p-4 bg-blue-50 rounded-[3px] border border-blue-100">
                    <div className="flex gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-blue-900">Download our template</p>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Use our XLSX template for the best experience. It includes dropdown validation for fields like Country, Currency, and Rank — making data entry faster and more accurate.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                        disabled={isDownloadingTemplate}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-200 rounded-[3px] text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-60"
                    >
                        {isDownloadingTemplate ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Download Template
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); startValidation(); }}
                        disabled={!selectedFile || isValidating}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isValidating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                <ChevronRight className="w-4 h-4" />
                                Validate & Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Cancel */}
                <div className="pt-2 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    function renderPreviewStep() {
        return (
            <div className="flex flex-col h-full">
                {/* Summary bar */}
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">Total:</span>
                                <span className="font-semibold text-gray-900">{rows.length}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-green-700 font-medium">{validCount} valid</span>
                            </div>
                            {errorCount > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span className="text-red-700 font-medium">{errorCount} with errors</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search rows..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-[3px] focus:outline-none focus:ring-2 focus:ring-[#064771]/20 focus:border-[#064771] w-48"
                                    title="Search rows"
                                />
                            </div>

                            {/* Filter toggle */}
                            <div className="flex bg-gray-100 p-0.5 rounded-[3px]">
                                <button
                                    onClick={() => setFilterMode('all')}
                                    className={`px-3 py-1 text-xs font-medium rounded-[3px] transition-all ${filterMode === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterMode('errors')}
                                    className={`px-3 py-1 text-xs font-medium rounded-[3px] transition-all ${filterMode === 'errors' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'
                                        }`}
                                >
                                    Errors Only
                                </button>
                            </div>

                            {/* Bulk actions */}
                            {errorCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={skipAllErrors}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-[3px] hover:bg-amber-100 transition-colors"
                                        title="Skip all error rows"
                                    >
                                        <SkipForward className="w-3.5 h-3.5" />
                                        Skip All Errors
                                    </button>
                                    <button
                                        onClick={deleteAllErrors}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-[3px] hover:bg-red-100 transition-colors"
                                        title="Delete all error rows"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove All Errors
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Data table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10 bg-white border-b-2 border-gray-200">
                            <tr>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 sticky left-0 z-20 w-10 border-r border-gray-200">
                                    #
                                </th>
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 w-16 border-r border-gray-200">
                                    Status
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.key}
                                        className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 border-r border-gray-100 whitespace-nowrap min-w-[140px]"
                                    >
                                        {col.label}
                                        {col.required && <span className="text-red-500 ml-0.5">*</span>}
                                    </th>
                                ))}
                                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 w-28">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.map((row) => {
                                const isError = row.status === 'error';
                                return (
                                    <tr
                                        key={row.rowIndex}
                                        className={`border-b border-gray-100 transition-colors ${isError ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-gray-50/50'
                                            }`}
                                    >
                                        {/* Row number */}
                                        <td className="px-3 py-2 text-xs text-gray-400 font-mono sticky left-0 bg-inherit border-r border-gray-200">
                                            {row.rowIndex}
                                        </td>

                                        {/* Status icon */}
                                        <td className="px-3 py-2 border-r border-gray-200">
                                            {isError ? (
                                                <div className="flex items-center gap-1.5" title={`${row.errors.length} error(s)`}>
                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    <span className="text-xs text-red-600 font-medium">{row.errors.length}</span>
                                                </div>
                                            ) : (
                                                <Check className="w-4 h-4 text-green-500" />
                                            )}
                                        </td>

                                        {/* Data cells */}
                                        {columns.map(col => {
                                            const fieldError = getFieldError(row, col.key);
                                            const isEditing = editingCell?.rowIdx === row.rowIndex && editingCell?.field === col.key;
                                            const cellValue = row.data[col.key];

                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`px-3 py-2 border-r border-gray-100 ${fieldError ? 'bg-red-50' : ''
                                                        }`}
                                                >
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1">
                                                            <input
                                                                ref={editInputRef}
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveEdit();
                                                                    if (e.key === 'Escape') setEditingCell(null);
                                                                }}
                                                                className="w-full px-2 py-1 text-xs border border-[#064771] rounded focus:outline-none focus:ring-1 focus:ring-[#064771]"
                                                                title={`Edit ${col.label}`}
                                                            />
                                                            <button
                                                                onClick={saveEdit}
                                                                className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                                                title="Save edit"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingCell(null)}
                                                                className="p-0.5 text-gray-400 hover:bg-gray-100 rounded"
                                                                title="Cancel edit"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="group relative">
                                                            <div
                                                                className={`flex items-center gap-1 cursor-pointer ${fieldError ? 'text-red-700' : 'text-gray-700'
                                                                    }`}
                                                                onClick={() => startEditing(row.rowIndex, col.key, cellValue)}
                                                            >
                                                                <span className="text-xs truncate max-w-[200px]" title={cellValue || ''}>
                                                                    {cellValue || <span className="text-gray-300 italic">empty</span>}
                                                                </span>
                                                                <Edit3 className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                                            </div>

                                                            {/* Error tooltip + suggestions */}
                                                            {fieldError && (
                                                                <div className="mt-1">
                                                                    <p className="text-[10px] text-red-600 leading-tight">
                                                                        {fieldError.message}
                                                                    </p>
                                                                    {fieldError.suggestions.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {fieldError.suggestions.map((sug, si) => (
                                                                                <button
                                                                                    key={si}
                                                                                    onClick={() => applySuggestion(row.rowIndex, col.key, sug)}
                                                                                    className="px-1.5 py-0.5 text-[10px] bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                                                                                    title={`Apply suggestion: ${sug}`}
                                                                                >
                                                                                    {sug}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}

                                        {/* Actions */}
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => skipRow(row.rowIndex)}
                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove this row from import"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {filteredRows.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={columns.length + 3}
                                        className="text-center py-12 text-gray-400 text-sm"
                                    >
                                        {filterMode === 'errors' ? 'No error rows found' : 'No data rows'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom bar */}
                <div className="px-6 py-3 border-t border-gray-200 bg-white shrink-0 flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        {validCount} row(s) will be imported • {errorCount} row(s) with errors will be skipped
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setStep('upload')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => setStep('confirm')}
                            disabled={validCount === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            Continue to Import
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    function renderConfirmStep() {
        return (
            <div className="p-6 space-y-6">
                {/* Summary card */}
                <div className="bg-gradient-to-r from-[#064771]/5 to-blue-50 rounded-[3px] p-6 border border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-[3px] bg-[#064771] flex items-center justify-center">
                            <FileSpreadsheet className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                                Ready to Import {validCount} {importType === 'investors' ? 'Investor' : 'Target'}{validCount !== 1 ? 's' : ''}
                            </h4>
                            <p className="text-sm text-gray-600 mt-0.5">
                                {errorCount > 0
                                    ? `${errorCount} row(s) with errors will be skipped.`
                                    : 'All rows passed validation.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Preview of what will be imported */}
                <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700">Records to import:</h5>
                    <div className="max-h-[300px] overflow-auto border border-gray-200 rounded-[3px]">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Company Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Country</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rank</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.filter(r => r.status === 'valid').slice(0, 50).map((row) => (
                                    <tr key={row.rowIndex} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-xs text-gray-400 font-mono">{row.rowIndex}</td>
                                        <td className="px-3 py-2 text-xs font-medium text-gray-900">{row.data.company_name || '—'}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{row.data.origin_country || '—'}</td>
                                        <td className="px-3 py-2"><span className="px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 rounded">{row.data.rank || '—'}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {validCount > 50 && (
                            <div className="px-3 py-2 text-xs text-gray-400 text-center border-t bg-gray-50">
                                ...and {validCount - 50} more
                            </div>
                        )}
                    </div>
                </div>

                {/* Warning for large imports */}
                {validCount > 100 && (
                    <div className="p-3 bg-amber-50 rounded-[3px] border border-amber-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700">
                            Large imports may take a moment to process. Please don't close this window.
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={() => setStep('preview')}
                        className="flex-1 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-[3px] hover:bg-gray-50 transition-colors"
                    >
                        Back to Review
                    </button>
                    <button
                        onClick={confirmImport}
                        disabled={isImporting}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-[3px] text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-60 shadow-sm"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Confirm Import ({validCount} records)
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    function renderDoneStep() {
        return (
            <div className="p-6 space-y-6 text-center">
                {/* Success icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in-50 duration-300">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                </div>

                {/* Message */}
                <div>
                    <h4 className="text-xl font-semibold text-gray-900">Import Successful!</h4>
                    <p className="text-sm text-gray-600 mt-2">
                        {importResult?.imported || 0} {importType === 'investors' ? 'investor' : 'target'}(s) have been added to your system.
                    </p>
                </div>

                {/* Stats */}
                {importResult && (
                    <div className="flex justify-center gap-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                            <p className="text-xs text-gray-500 mt-1">Imported</p>
                        </div>
                        {importResult.skipped > 0 && (
                            <div className="text-center">
                                <p className="text-2xl font-bold text-amber-600">{importResult.skipped}</p>
                                <p className="text-xs text-gray-500 mt-1">Skipped</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Import errors from DB save */}
                {importResult?.errors && importResult.errors.length > 0 && (
                    <div className="text-left bg-amber-50 rounded-[3px] p-4 border border-amber-100">
                        <p className="text-sm font-medium text-amber-900 mb-2">Some rows could not be saved:</p>
                        <div className="max-h-32 overflow-auto space-y-1">
                            {importResult.errors.map((err: any, i: number) => (
                                <p key={i} className="text-xs text-amber-700">
                                    Row {err.rowIndex}: {err.companyName} — {err.error}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action */}
                <button
                    onClick={onClose}
                    className="w-full py-3 bg-[#064771] text-white rounded-[3px] text-sm font-medium hover:bg-[#053a5c] transition-all shadow-sm"
                >
                    Done — View {importType === 'investors' ? 'Investors' : 'Targets'}
                </button>
            </div>
        );
    }
};

export default ImportWizard;
