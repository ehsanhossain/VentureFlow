/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';
import { timeAgo } from './driveUtils';
import { DriveComment } from './useProspectDrive';

interface DriveCommentPanelProps {
    fileId: string;
    onClose: () => void;
}

const DriveCommentPanel: React.FC<DriveCommentPanelProps> = ({ fileId, onClose }) => {
    const { t } = useTranslation();
    const [comments, setComments] = useState<DriveComment[]>([]);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchComments = async () => {
        try {
            const res = await api.get(`/api/drive/file/${fileId}/comments`);
            setComments(res.data.comments ?? []);
        } catch {
            console.error('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchComments(); }, [fileId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSend = async () => {
        const text = body.trim();
        if (!text) return;
        setSending(true);
        try {
            await api.post(`/api/drive/file/${fileId}/comment`, { content: text });
            setBody('');
            await fetchComments();
        } catch (err: any) {
            showAlert({ type: 'error', message: err?.response?.data?.message || t('flowdrive.alerts.commentAddFailed') });
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm(t('flowdrive.commentPanel.deleteConfirm'))) return;
        try {
            await api.delete(`/api/drive/comment/${commentId}`);
            setComments(prev => prev.filter(c => c.id !== commentId));
            showAlert({ type: 'success', message: t('flowdrive.alerts.commentDeleted') });
        } catch {
            showAlert({ type: 'error', message: t('flowdrive.alerts.commentDeleteFailed') });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="fixed inset-0 bg-gray-900/30" onClick={onClose} />
            <div className="relative w-full max-w-sm bg-white shadow-xl flex flex-col z-[101] animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                    <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-[#064771]" /> {t('flowdrive.commentPanel.title')}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Comments list */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-premium">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-sm text-gray-400">{t('flowdrive.commentPanel.loading')}</div>
                    ) : comments.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">{t('flowdrive.commentPanel.noComments')}</p>
                        </div>
                    ) : (
                        comments.map(c => (
                            <div key={c.id} className="group">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className="text-xs font-medium text-gray-700">{c.user_name}</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-gray-400">{timeAgo(c.created_at)}</span>
                                        <button
                                            onClick={() => handleDelete(c.id)}
                                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
                                            title={t('flowdrive.commentPanel.deleteComment')}
                                            aria-label={t('flowdrive.commentPanel.deleteComment')}
                                        >
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 bg-gray-50 rounded px-2.5 py-2 border border-gray-100">{c.content}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                    <div className="flex items-center gap-2">
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={t('flowdrive.commentPanel.addComment')}
                            rows={1}
                            className="flex-1 resize-none px-3 py-2 bg-white border border-gray-200 rounded text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#064771]"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!body.trim() || sending}
                            className="p-2 bg-[#064771] text-white rounded hover:bg-[#053a5c] disabled:opacity-50 transition-colors"
                            aria-label={t('flowdrive.commentPanel.sendComment')}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriveCommentPanel;
