/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Link2, Copy, Check, Shield, Clock, Eye, Download } from 'lucide-react';
import { showAlert } from '../../../components/Alert';
import { useProspectDrive, DriveShareLink } from './useProspectDrive';
import { VFDropdown } from '../../../components/VFDropdown';

interface DriveShareModalProps {
    fileId?: string;
    folderId?: string;
    onClose: () => void;
    type: 'investor' | 'target';
    prospectId: string;
}

const DriveShareModal: React.FC<DriveShareModalProps> = ({ fileId, folderId, onClose, type, prospectId }) => {
    const { createShare, revokeShare, listShares } = useProspectDrive(type, prospectId);
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [expiresIn, setExpiresIn] = useState<string>('7');
    const [maxAccess, setMaxAccess] = useState<string>('');
    const [allowDownload, setAllowDownload] = useState(true);
    const [creating, setCreating] = useState(false);
    const [createdLink, setCreatedLink] = useState<DriveShareLink | null>(null);
    const [copied, setCopied] = useState(false);
    const [existingShares, setExistingShares] = useState<DriveShareLink[]>([]);
    const [loadedShares, setLoadedShares] = useState(false);

    const loadExistingShares = useCallback(async () => {
        if (fileId && !loadedShares) {
            try {
                const shares = await listShares(fileId);
                setExistingShares(shares);
                setLoadedShares(true);
            } catch { /* ignore */ }
        }
    }, [fileId, listShares, loadedShares]);

    // Load shares on mount
    React.useEffect(() => { loadExistingShares(); }, [loadExistingShares]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const expiresAt = expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 86400000).toISOString() : undefined;
            const result = await createShare({
                file_id: fileId,
                folder_id: folderId,
                password: password || undefined,
                expires_at: expiresAt,
                max_access_count: maxAccess ? parseInt(maxAccess) : undefined,
                allow_download: allowDownload,
            });
            setCreatedLink(result);
            showAlert({ type: 'success', message: t('flowdrive.alerts.shareLinkCreated') });
            loadExistingShares();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.shareLinkCreateFailed') });
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (shareId: string) => {
        try {
            await revokeShare(shareId);
            setExistingShares(prev => prev.filter(s => s.id !== shareId));
            showAlert({ type: 'success', message: t('flowdrive.alerts.shareLinkRevoked') });
        } catch {
            showAlert({ type: 'error', message: t('flowdrive.alerts.shareLinkRevokeFailed') });
        }
    };

    const copyLink = (url: string) => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareUrl = createdLink?.url || (createdLink?.share_token ? `${window.location.origin}/shared/${createdLink.share_token}` : '');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[3px] shadow-xl w-full max-w-md overflow-y-auto max-h-[80vh] z-[101]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-[#064771]" /> {t('flowdrive.shareModal.title')}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Created link display */}
                    {createdLink ? (
                        <div className="bg-green-50 border border-green-200 rounded p-4 space-y-3">
                            <p className="text-sm font-medium text-green-800">{t('flowdrive.shareModal.linkCreated')}</p>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 text-sm bg-white border border-gray-200 rounded px-3 py-1.5 text-gray-700 truncate"
                                />
                                <button
                                    onClick={() => copyLink(shareUrl)}
                                    className="px-3 py-1.5 bg-[#064771] text-white rounded text-sm hover:bg-[#053a5c] flex items-center gap-1"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? t('flowdrive.shareModal.copied') : t('flowdrive.shareModal.copy')}
                                </button>
                            </div>
                            {password && (
                                <p className="text-xs text-green-700">
                                    <Shield className="w-3.5 h-3.5 inline mr-1" /> {t('flowdrive.shareModal.passwordProtected')}
                                </p>
                            )}
                            <button
                                onClick={() => setCreatedLink(null)}
                                className="text-xs text-[#064771] hover:underline"
                            >
                                {t('flowdrive.shareModal.createAnother')}
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Password */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                    <Shield className="w-3.5 h-3.5 inline mr-1" /> {t('flowdrive.shareModal.password')}
                                </label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={t('flowdrive.shareModal.passwordPlaceholder')}
                                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#064771]"
                                />
                            </div>

                            {/* Expiry */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                    <Clock className="w-3.5 h-3.5 inline mr-1" /> {t('flowdrive.shareModal.expiresIn')}
                                </label>
                                <VFDropdown
                                    options={[
                                        { value: '1', label: t('flowdrive.shareModal.day1') },
                                        { value: '3', label: t('flowdrive.shareModal.days3') },
                                        { value: '7', label: t('flowdrive.shareModal.days7') },
                                        { value: '14', label: t('flowdrive.shareModal.days14') },
                                        { value: '30', label: t('flowdrive.shareModal.days30') },
                                        { value: '', label: t('flowdrive.shareModal.never') },
                                    ]}
                                    value={expiresIn}
                                    onChange={val => setExpiresIn((val as string) ?? '')}
                                    searchable={false}
                                    placeholder="Select expiry"
                                />
                            </div>

                            {/* Access limit */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                    <Eye className="w-3.5 h-3.5 inline mr-1" /> {t('flowdrive.shareModal.maxAccessCount')}
                                </label>
                                <input
                                    type="number"
                                    value={maxAccess}
                                    onChange={e => setMaxAccess(e.target.value)}
                                    placeholder={t('flowdrive.shareModal.unlimited')}
                                    min="1"
                                    className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#064771]"
                                />
                            </div>

                            {/* Allow download toggle */}
                            <div>
                                <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">
                                    <Download className="w-3.5 h-3.5 inline mr-1" /> {t('flowdrive.shareModal.allowDownload', 'Allow Download')}
                                </label>
                                <div className="flex items-center justify-between h-9 px-3 bg-gray-50 border border-gray-200 rounded text-sm">
                                    <span className="text-gray-600 text-sm">{allowDownload ? t('flowdrive.shareModal.downloadEnabled', 'Recipients can download') : t('flowdrive.shareModal.downloadDisabled', 'View only — no download')}</span>
                                    <button
                                        type="button"
                                        onClick={() => setAllowDownload(!allowDownload)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${allowDownload ? 'bg-[#064771]' : 'bg-gray-300'}`}
                                        aria-label="Toggle download permission"
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${allowDownload ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={creating}
                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-[#064771] rounded hover:bg-[#053a5c] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Link2 className="w-4 h-4" />
                                {creating ? t('flowdrive.shareModal.creating') : t('flowdrive.shareModal.createShareLink')}
                            </button>
                        </>
                    )}

                    {/* Existing shares */}
                    {existingShares.length > 0 && (
                        <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('flowdrive.shareModal.activeShareLinks')}</h4>
                            <div className="space-y-2">
                                {existingShares.map(share => (
                                    <div key={share.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-100">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-600 truncate">…{share.share_token.slice(-12)}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {share.has_password && <span title="Password protected"><Shield className="w-3 h-3 text-amber-500" /></span>}
                                                <span className="text-[10px] text-gray-400">
                                                    {share.access_count} {t('flowdrive.shareModal.views')}
                                                    {share.expires_at && ` · ${t('flowdrive.shareModal.expires')} ${new Date(share.expires_at).toLocaleDateString()}`}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(share.id)}
                                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            {t('flowdrive.shareModal.revoke')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriveShareModal;
