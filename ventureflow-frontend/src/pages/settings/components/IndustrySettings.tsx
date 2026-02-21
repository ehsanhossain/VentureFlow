/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Plus, Trash2, Search, Edit3, Check, X,
    Sparkles, GitMerge, ChevronUp, AlertCircle,
    Upload, RefreshCw, Download
} from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { BrandSpinner } from '../../../components/BrandSpinner';

/* ── Types ── */

interface PrimaryIndustry {
    id: number;
    name: string;
    status: boolean;
    created_at: string;
    usage_count: number;
}

interface Suggestion {
    id: number;
    name: string;
    score: number;
}

interface AdhocIndustry {
    name: string;
    count: number;
    suggestions: Suggestion[];
}

/* ── Score Helpers ── */

const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (score >= 50) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
};

const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Strong';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Partial';
    return 'Weak';
};

/* ── Main Component ── */

const IndustrySettings: React.FC = () => {
    // State
    const [primaryIndustries, setPrimaryIndustries] = useState<PrimaryIndustry[]>([]);
    const [adhocIndustries, setAdhocIndustries] = useState<AdhocIndustry[]>([]);
    const [loading, setLoading] = useState(true);
    const [adhocLoading, setAdhocLoading] = useState(true);
    const [primarySearch, setPrimarySearch] = useState('');
    const [adhocSearch, setAdhocSearch] = useState('');
    const [newIndustryName, setNewIndustryName] = useState('');
    const [addingNew, setAddingNew] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [mergingName, setMergingName] = useState<string | null>(null);
    const [promotingName, setPromotingName] = useState<string | null>(null);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingAdhocName, setEditingAdhocName] = useState<string | null>(null);
    const [editingAdhocNewName, setEditingAdhocNewName] = useState('');
    const csvInputRef = useRef<HTMLInputElement>(null);
    const primarySearchRef = useRef<HTMLInputElement>(null);
    const adhocSearchRef = useRef<HTMLInputElement>(null);
    const lastCtrlFTarget = useRef<'primary' | 'adhoc'>('adhoc');

    /* ── Ctrl+F Toggle ── */

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                if (lastCtrlFTarget.current === 'adhoc') {
                    primarySearchRef.current?.focus();
                    lastCtrlFTarget.current = 'primary';
                } else {
                    adhocSearchRef.current?.focus();
                    lastCtrlFTarget.current = 'adhoc';
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    /* ── Data Fetching ── */

    const fetchPrimary = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/industries/stats');
            setPrimaryIndustries(response.data);
        } catch {
            showAlert({ type: 'error', message: 'Failed to load industries' });
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAdhoc = useCallback(async () => {
        setAdhocLoading(true);
        try {
            const response = await api.get('/api/industries/adhoc');
            setAdhocIndustries(response.data);
        } catch {
            showAlert({ type: 'error', message: 'Failed to scan ad-hoc industries' });
        } finally {
            setAdhocLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPrimary();
        fetchAdhoc();
    }, [fetchPrimary, fetchAdhoc]);

    /* ── Actions: Primary Industries ── */

    const handleAddIndustry = async () => {
        const name = newIndustryName.trim();
        if (!name) return;

        const exists = primaryIndustries.some(
            i => i.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            showAlert({ type: 'error', message: `"${name}" already exists.` });
            return;
        }

        setAddingNew(true);
        try {
            await api.post('/api/industries', { name, status: true });
            setNewIndustryName('');
            showAlert({ type: 'success', message: `Industry "${name}" added.` });
            fetchPrimary();
        } catch {
            showAlert({ type: 'error', message: 'Failed to add industry' });
        } finally {
            setAddingNew(false);
        }
    };

    const handleUpdateIndustry = async (id: number) => {
        const name = editingName.trim();
        if (!name) return;

        try {
            await api.put(`/api/industries/${id}`, { name });
            setEditingId(null);
            showAlert({ type: 'success', message: `Industry renamed. All prospect records updated.` });
            fetchPrimary();
        } catch {
            showAlert({ type: 'error', message: 'Failed to update industry' });
        }
    };

    const handleDeleteIndustry = async (id: number) => {
        setDeletingId(id);
        try {
            await api.delete(`/api/industries/${id}`);
            showAlert({ type: 'success', message: 'Industry deleted.' });
            fetchPrimary();
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to delete industry';
            showAlert({ type: 'error', message: msg });
        } finally {
            setDeletingId(null);
        }
    };

    /* ── Actions: Ad-hoc Industries ── */

    const handlePromote = async (name: string) => {
        setPromotingName(name);
        try {
            const response = await api.post('/api/industries/promote', { name });
            showAlert({
                type: 'success',
                message: response.data.message || `"${name}" promoted to primary.`
            });
            fetchPrimary();
            fetchAdhoc();
        } catch (err: any) {
            showAlert({
                type: 'error',
                message: err.response?.data?.message || 'Failed to promote industry'
            });
        } finally {
            setPromotingName(null);
        }
    };

    const handleRenameAdhoc = async (oldName: string) => {
        const newName = editingAdhocNewName.trim();
        if (!newName || newName === oldName) {
            setEditingAdhocName(null);
            return;
        }
        try {
            const response = await api.post('/api/industries/rename-adhoc', {
                old_name: oldName,
                new_name: newName,
            });
            showAlert({
                type: 'success',
                message: response.data.message || `Renamed "${oldName}" to "${newName}".`
            });
            setEditingAdhocName(null);
            fetchAdhoc();
        } catch (err: any) {
            showAlert({
                type: 'error',
                message: err.response?.data?.message || 'Failed to rename ad-hoc industry'
            });
        }
    };

    const handleMerge = async (adhocName: string, targetId: number) => {
        setMergingName(adhocName);
        try {
            const response = await api.post('/api/industries/merge', {
                adhoc_name: adhocName,
                target_industry_id: targetId,
            });
            showAlert({
                type: 'success',
                message: response.data.message || `Merged "${adhocName}" successfully.`
            });
            fetchPrimary();
            fetchAdhoc();
        } catch (err: any) {
            showAlert({
                type: 'error',
                message: err.response?.data?.message || 'Failed to merge industry'
            });
        } finally {
            setMergingName(null);
        }
    };

    /* ── Bulk Actions ── */

    const handlePromoteAll = async () => {
        if (adhocIndustries.length === 0) return;
        setBulkProcessing(true);
        let promoted = 0;
        let failed = 0;
        for (const adhoc of adhocIndustries) {
            try {
                await api.post('/api/industries/promote', { name: adhoc.name });
                promoted++;
            } catch {
                failed++;
            }
        }
        setBulkProcessing(false);
        showAlert({
            type: failed === 0 ? 'success' : 'error',
            message: `Promoted ${promoted} industries.${failed > 0 ? ` ${failed} failed.` : ''}`
        });
        fetchPrimary();
        fetchAdhoc();
    };

    const handleMergeAndPromoteAll = async () => {
        if (adhocIndustries.length === 0) return;
        setBulkProcessing(true);
        let processed = 0;
        let failed = 0;
        for (const adhoc of adhocIndustries) {
            try {
                const bestSuggestion = adhoc.suggestions.length > 0 ? adhoc.suggestions[0] : null;
                if (bestSuggestion && bestSuggestion.score >= 50) {
                    await api.post('/api/industries/merge', {
                        adhoc_name: adhoc.name,
                        target_industry_id: bestSuggestion.id,
                    });
                } else {
                    await api.post('/api/industries/promote', { name: adhoc.name });
                }
                processed++;
            } catch {
                failed++;
            }
        }
        setBulkProcessing(false);
        showAlert({
            type: failed === 0 ? 'success' : 'error',
            message: `Processed ${processed} industries.${failed > 0 ? ` ${failed} failed.` : ''}`
        });
        fetchPrimary();
        fetchAdhoc();
    };

    /* ── CSV ── */

    const downloadCsvTemplate = () => {
        const template = 'Industry Name\nHealthcare and Social Assistance\nInformation Technology\nReal Estate and Rental';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'industry_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const text = await file.text();
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

            const startIndex = lines[0]?.toLowerCase().includes('name') || lines[0]?.toLowerCase().includes('industry') ? 1 : 0;

            let added = 0;
            let skipped = 0;
            const existingNames = new Set(primaryIndustries.map(i => i.name.toLowerCase()));

            for (let i = startIndex; i < lines.length; i++) {
                const name = lines[i].split(',')[0].trim().replace(/^["']|["']$/g, '');
                if (!name) continue;

                if (existingNames.has(name.toLowerCase())) {
                    skipped++;
                    continue;
                }

                try {
                    await api.post('/api/industries', { name, status: true });
                    existingNames.add(name.toLowerCase());
                    added++;
                } catch {
                    skipped++;
                }
            }

            showAlert({
                type: 'success',
                message: `Imported ${added} industries.${skipped > 0 ? ` ${skipped} skipped (duplicates or errors).` : ''}`
            });
            fetchPrimary();
        } catch {
            showAlert({ type: 'error', message: 'Failed to read CSV file' });
        } finally {
            setUploading(false);
            if (csvInputRef.current) csvInputRef.current.value = '';
        }
    };

    /* ── Filtered & Sorted Lists ── */

    const filteredPrimary = useMemo(() => {
        let list = [...primaryIndustries];
        // Sort by usage count descending (most used on top)
        list.sort((a, b) => b.usage_count - a.usage_count);
        if (primarySearch) {
            const q = primarySearch.toLowerCase();
            list = list.filter(i => i.name.toLowerCase().includes(q));
        }
        return list;
    }, [primaryIndustries, primarySearch]);

    const filteredAdhoc = useMemo(() => {
        let list = [...adhocIndustries];
        // Sort by count descending
        list.sort((a, b) => b.count - a.count);
        if (adhocSearch) {
            const q = adhocSearch.toLowerCase();
            list = list.filter(i => i.name.toLowerCase().includes(q));
        }
        return list;
    }, [adhocIndustries, adhocSearch]);

    /* ── Render ── */

    return (
        <div className="h-full flex flex-col bg-[#f9fafb] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6">
                <div className="flex items-center justify-between gap-6">
                    <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
                        Industry Management
                    </h1>
                    {/* CSV Actions */}
                    <input
                        ref={csvInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                    />
                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadCsvTemplate}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-[3px] text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                            title="Download a sample CSV template"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Template
                        </button>
                        <button
                            onClick={() => csvInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-[3px] text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                            title="Import industries from a CSV file"
                        >
                            {uploading ? (
                                <BrandSpinner size="sm" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {uploading ? 'Importing...' : 'Import CSV'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Split-View Content */}
            <div className="flex-1 overflow-hidden flex gap-6 px-8 pb-8">

                {/* ═══ LEFT PANEL — Primary Industries ═══ */}
                <div className="flex-1 flex flex-col bg-white rounded-[3px] border border-gray-100 overflow-hidden" style={{ minWidth: 0 }}>
                    {/* Panel Header */}
                    <div className="px-5 py-4 border-b border-gray-100 space-y-3">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Primary Industries
                            <span className="text-gray-400 font-normal ml-1.5">
                                ({primaryIndustries.length})
                            </span>
                        </h2>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                ref={primarySearchRef}
                                type="text"
                                value={primarySearch}
                                onChange={e => setPrimarySearch(e.target.value)}
                                placeholder="Search primary industries..."
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                            />
                        </div>

                        {/* Add New */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newIndustryName}
                                onChange={e => setNewIndustryName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddIndustry()}
                                placeholder="Add new industry…"
                                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                            />
                            <button
                                onClick={handleAddIndustry}
                                disabled={addingNew || !newIndustryName.trim()}
                                className="flex items-center gap-1.5 px-3 py-2 bg-[#064771] text-white rounded-[3px] text-xs font-medium hover:bg-[#053a5e] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Add industry"
                            >
                                {addingNew ? (
                                    <BrandSpinner size="sm" />
                                ) : (
                                    <Plus className="w-3.5 h-3.5" />
                                )}
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Industry List */}
                    <div className="flex-1 overflow-y-auto scrollbar-premium">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <BrandSpinner size="lg" />
                            </div>
                        ) : filteredPrimary.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <p className="text-sm">
                                    {primarySearch ? 'No industries match your search' : 'No industries yet'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredPrimary.map(industry => (
                                    <div
                                        key={industry.id}
                                        className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-all"
                                    >
                                        {editingId === industry.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={e => setEditingName(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') handleUpdateIndustry(industry.id);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    className="flex-1 px-3 py-1.5 bg-white border border-[#064771] rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 transition-all"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleUpdateIndustry(industry.id)}
                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-[3px] transition-all"
                                                    title="Save"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-[3px] transition-all"
                                                    title="Cancel"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm text-gray-900">
                                                        {industry.name}
                                                    </span>
                                                </div>

                                                {/* Usage Count — number only */}
                                                <span
                                                    className="px-2 py-0.5 rounded-[3px] bg-gray-50 border border-gray-100 text-xs text-gray-500 tabular-nums"
                                                    title={`Used by ${industry.usage_count} prospect(s)`}
                                                >
                                                    {industry.usage_count}
                                                </span>

                                                {/* Actions */}
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(industry.id);
                                                            setEditingName(industry.name);
                                                        }}
                                                        className="p-1.5 text-gray-400 hover:text-[#064771] hover:bg-[#064771]/5 rounded-[3px] transition-all"
                                                        title="Edit name"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteIndustry(industry.id)}
                                                        disabled={deletingId === industry.id || industry.usage_count > 0}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-[3px] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={industry.usage_count > 0 ? `Cannot delete — used by ${industry.usage_count} prospect(s)` : 'Delete industry'}
                                                    >
                                                        {deletingId === industry.id ? (
                                                            <BrandSpinner size="sm" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT PANEL — Ad-hoc Industries ═══ */}
                <div className="flex-1 flex flex-col bg-white rounded-[3px] border border-gray-100 overflow-hidden" style={{ minWidth: 0 }}>
                    {/* Panel Header */}
                    <div className="px-5 py-4 border-b border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ad-hoc Industries
                                <span className="text-gray-400 font-normal ml-1.5">
                                    ({adhocIndustries.length})
                                </span>
                            </h2>
                            <button
                                onClick={() => fetchAdhoc()}
                                disabled={adhocLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-[3px] text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                                title="Rescan prospect data for ad-hoc industries"
                            >
                                <RefreshCw className={`w-3 h-3 ${adhocLoading ? 'animate-spin' : ''}`} />
                                Rescan
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                                ref={adhocSearchRef}
                                type="text"
                                value={adhocSearch}
                                onChange={e => setAdhocSearch(e.target.value)}
                                placeholder="Search ad-hoc entries..."
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-[3px] text-xs focus:outline-none focus:ring-2 focus:ring-[#064771]/10 focus:border-[#064771] transition-all"
                            />
                        </div>

                        {/* Bulk Action Buttons — both secondary */}
                        {adhocIndustries.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePromoteAll}
                                    disabled={bulkProcessing}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-[3px] text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                                    title="Promote all ad-hoc industries to primary"
                                >
                                    {bulkProcessing ? <BrandSpinner size="sm" /> : <ChevronUp className="w-3.5 h-3.5" />}
                                    Promote All
                                </button>
                                <button
                                    onClick={handleMergeAndPromoteAll}
                                    disabled={bulkProcessing}
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-[3px] text-xs font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                                    title="Merge matches (≥50%) and promote the rest"
                                >
                                    {bulkProcessing ? <BrandSpinner size="sm" /> : <GitMerge className="w-3.5 h-3.5" />}
                                    Merge &amp; Promote All
                                </button>
                            </div>
                        )}

                        {/* Info Banner */}
                        {adhocIndustries.length > 0 && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50/60 border border-amber-100 rounded-[3px]">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    These industries were typed during prospect registration and don&apos;t exist in your official list.
                                    Merge them into an existing industry or promote them individually.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Ad-hoc List */}
                    <div className="flex-1 overflow-y-auto scrollbar-premium">
                        {adhocLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <BrandSpinner size="lg" />
                            </div>
                        ) : filteredAdhoc.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <Sparkles className="w-8 h-8 mb-2 opacity-40" />
                                <p className="text-sm font-medium text-gray-500">All clean</p>
                                <p className="text-xs mt-1">
                                    {adhocSearch
                                        ? 'No results match your search'
                                        : 'No orphan industries found in prospect data'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredAdhoc.map(adhoc => {
                                    const isMerging = mergingName === adhoc.name;
                                    const isPromoting = promotingName === adhoc.name;
                                    const isBusy = isMerging || isPromoting || bulkProcessing;

                                    return (
                                        <div
                                            key={adhoc.name}
                                            className="group px-5 py-4 hover:bg-gray-50/30 transition-all"
                                        >
                                            {/* Header Row */}
                                            <div className="flex items-center justify-between mb-2">
                                                {editingAdhocName === adhoc.name ? (
                                                    <div className="flex-1 flex items-center gap-2 mr-2">
                                                        <input
                                                            type="text"
                                                            value={editingAdhocNewName}
                                                            onChange={e => setEditingAdhocNewName(e.target.value)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleRenameAdhoc(adhoc.name);
                                                                if (e.key === 'Escape') setEditingAdhocName(null);
                                                            }}
                                                            className="flex-1 px-3 py-1.5 bg-white border border-[#064771] rounded-[3px] text-sm focus:outline-none focus:ring-2 focus:ring-[#064771]/20 transition-all"
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleRenameAdhoc(adhoc.name)}
                                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-[3px] transition-all"
                                                            title="Save"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingAdhocName(null)}
                                                            className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-[3px] transition-all"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="text-sm font-medium text-gray-900 truncate">
                                                            {adhoc.name}
                                                        </span>
                                                        <span
                                                            className="px-2 py-0.5 rounded-[3px] bg-gray-50 border border-gray-100 text-xs text-gray-500 tabular-nums flex-shrink-0"
                                                            title={`Used by ${adhoc.count} prospect(s)`}
                                                        >
                                                            {adhoc.count}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                setEditingAdhocName(adhoc.name);
                                                                setEditingAdhocNewName(adhoc.name);
                                                            }}
                                                            className="p-1 text-gray-400 hover:text-[#064771] hover:bg-[#064771]/5 rounded-[3px] transition-all opacity-0 group-hover:opacity-100"
                                                            title="Edit name (updates across all prospect records)"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}

                                                {editingAdhocName !== adhoc.name && (
                                                    <button
                                                        onClick={() => handlePromote(adhoc.name)}
                                                        disabled={isBusy}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#064771] hover:bg-[#064771]/5 border border-transparent hover:border-[#064771]/20 rounded-[3px] transition-all disabled:opacity-40 flex-shrink-0"
                                                        title="Promote to primary industry"
                                                    >
                                                        {isPromoting ? (
                                                            <BrandSpinner size="sm" />
                                                        ) : (
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                        )}
                                                        Promote
                                                    </button>
                                                )}
                                            </div>

                                            {/* Suggestions */}
                                            {adhoc.suggestions.length > 0 ? (
                                                <div className="space-y-1.5">
                                                    <p className="text-xs text-gray-400">
                                                        Smart suggestions
                                                    </p>
                                                    {adhoc.suggestions.map(suggestion => {
                                                        const colors = getScoreColor(suggestion.score);
                                                        const label = getScoreLabel(suggestion.score);
                                                        return (
                                                            <div
                                                                key={suggestion.id}
                                                                className={`flex items-center gap-3 px-3 py-2 rounded-[3px] border ${colors.border} ${colors.bg} transition-all`}
                                                            >
                                                                <span className="text-xs text-gray-700 flex-1 min-w-0 truncate">
                                                                    {suggestion.name}
                                                                </span>
                                                                <span className={`text-xs font-medium ${colors.text} flex-shrink-0`}>
                                                                    {suggestion.score}% {label}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleMerge(adhoc.name, suggestion.id)}
                                                                    disabled={isBusy}
                                                                    className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-[3px] text-xs font-medium text-gray-700 hover:text-[#064771] hover:border-[#064771]/30 transition-all disabled:opacity-40 flex-shrink-0"
                                                                    title={`Merge "${adhoc.name}" into "${suggestion.name}"`}
                                                                >
                                                                    {isMerging ? (
                                                                        <BrandSpinner size="sm" />
                                                                    ) : (
                                                                        <GitMerge className="w-3 h-3" />
                                                                    )}
                                                                    Merge
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 px-3 py-2 bg-gray-50 rounded-[3px] border border-gray-100">
                                                    No close matches found — consider promoting to primary
                                                </p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndustrySettings;
