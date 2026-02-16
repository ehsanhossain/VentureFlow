import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Trash2, X } from 'lucide-react';
import api from '../config/api';
import { showAlert } from './Alert';

// ─────────────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────────────

export interface Note {
    id: number;
    author: string;
    avatar?: string | null;
    content: string;
    timestamp: string;
    isSystem?: boolean;
    isSelf?: boolean;
    isDeleted?: boolean;
    deletedBy?: string;
}

export interface NotesSectionProps {
    /** Array of notes to display */
    notes: Note[];
    /** Callback when notes change (add / delete) */
    onNotesChange: (notes: Note[]) => void;
    /** Entity primary key (buyer.id or seller.id) */
    entityId: string;
    /** Entity type for the activity-logs API */
    entityType: 'buyer' | 'seller' | 'deal';
    /** Display name of the current user — used to set isSelf on new notes */
    currentUserName: string;
}

// ─────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────

const getInitials = (name: string) => {
    if (!name || name === 'N/A') return 'NA';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
};

const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
};




// ─────────────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────────────

export const NotesSection: React.FC<NotesSectionProps> = ({
    notes,
    onNotesChange,
    entityId,
    entityType,
    currentUserName,
}) => {
    const [newNote, setNewNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);
    const notesContainerRef = useRef<HTMLDivElement>(null);

    // Context menu
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: number } | null>(null);

    // Delete modal
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; noteId: number | null; noteAuthor: string }>({
        isOpen: false,
        noteId: null,
        noteAuthor: '',
    });
    const [deletingNote, setDeletingNote] = useState(false);

    // Auto-scroll to bottom when notes change
    useEffect(() => {
        if (notesContainerRef.current) {
            notesContainerRef.current.scrollTop = notesContainerRef.current.scrollHeight;
        }
    }, [notes]);

    // Close context menu on outside click
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    // ── Add note ──────────────────────────────────────
    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setSubmittingNote(true);
        try {
            const response = await api.post('/api/activity-logs', {
                entity_id: entityId,
                entity_type: entityType,
                content: newNote.trim(),
                type: 'comment',
            });

            if (response.data) {
                const newNoteData: Note = {
                    id: response.data.data?.id || Date.now(),
                    author: currentUserName,
                    avatar: null,
                    content: newNote.trim(),
                    timestamp: formatTimestamp(new Date().toISOString()),
                    isSystem: false,
                    isSelf: true,
                };
                onNotesChange([...notes, newNoteData]);
                setNewNote('');
                showAlert({ type: 'success', message: 'Note added successfully' });
            }
        } catch {
            showAlert({ type: 'error', message: 'Failed to add note' });
        } finally {
            setSubmittingNote(false);
        }
    };

    // ── Context menu ──────────────────────────────────
    const handleNoteContextMenu = (e: React.MouseEvent, noteId: number) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, noteId });
    };

    const openDeleteModal = (noteId: number, noteAuthor: string) => {
        setContextMenu(null);
        setDeleteModal({ isOpen: true, noteId, noteAuthor });
    };

    // ── Delete note ───────────────────────────────────
    const handleDeleteNote = async () => {
        if (!deleteModal.noteId) return;

        setDeletingNote(true);
        try {
            await api.delete(`/api/activity-logs/${deleteModal.noteId}`);

            onNotesChange(
                notes.map((note) =>
                    note.id === deleteModal.noteId ? { ...note, isDeleted: true, deletedBy: currentUserName } : note
                )
            );

            setDeleteModal({ isOpen: false, noteId: null, noteAuthor: '' });
            showAlert({ type: 'success', message: 'Note deleted successfully' });
        } catch {
            showAlert({ type: 'error', message: 'Failed to delete note' });
        } finally {
            setDeletingNote(false);
        }
    };

    // ── Render ────────────────────────────────────────
    return (
        <>
            <section className="border border-[#F3F4F6] rounded overflow-hidden flex flex-col h-full">
                {/* Notes Content – WhatsApp Style */}
                <div
                    ref={notesContainerRef}
                    className="px-3 py-3 bg-[#F8FAFC] flex-1 overflow-y-auto flex flex-col gap-2"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' }}
                >
                    {notes.length > 0 ? (
                        notes.map((note) => (
                            <div
                                key={note.id}
                                className="flex items-end w-full"
                                onContextMenu={(e) => !note.isDeleted && note.isSelf && handleNoteContextMenu(e, note.id)}
                            >
                                {/* Self messages: timestamp extreme left, bubble right */}
                                {note.isSelf ? (
                                    <div className="flex items-end justify-between w-full">
                                        {!note.isDeleted && (
                                            <span className="text-[9px] text-gray-400 shrink-0 mb-0.5">{formatTimestamp(note.timestamp)}</span>
                                        )}
                                        <div className="flex gap-1.5 flex-row-reverse max-w-[70%]">
                                            {/* Avatar */}
                                            {!note.isDeleted &&
                                                (note.avatar ? (
                                                    <img src={note.avatar} className="w-5 h-5 rounded-full shrink-0 object-cover self-end" alt="" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-[#064771] flex items-center justify-center shrink-0 self-end">
                                                        <span className="text-white text-[8px] font-medium">{getInitials(note.author)}</span>
                                                    </div>
                                                ))}
                                            {note.isDeleted ? (
                                                <div className="px-2 py-1 bg-[#F3F4F6] rounded-md border border-[#E5E7EB] italic">
                                                    <span className="text-[11px] text-gray-400">
                                                        <Trash2 className="w-2.5 h-2.5 inline mr-0.5" />
                                                        {note.deletedBy || note.author} deleted this message
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="relative px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md bg-[#064771] text-white rounded-br-none">
                                                    <div className="flex items-center gap-1.5 justify-end">
                                                        <span className="text-[10px] font-semibold text-white/90">{note.author}</span>
                                                    </div>
                                                    <p className="text-xs leading-snug text-white">{note.content}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Non-self messages: bubble left, timestamp extreme right */
                                    <div className="flex items-end justify-between w-full">
                                        <div className="flex gap-1.5 max-w-[70%]">
                                            {/* Avatar */}
                                            {!note.isDeleted &&
                                                (note.isSystem ? (
                                                    <img src="/system-avatar.png" className="w-5 h-5 rounded-full shrink-0 object-cover self-end" alt="System" />
                                                ) : note.avatar ? (
                                                    <img src={note.avatar} className="w-5 h-5 rounded-full shrink-0 object-cover self-end" alt="" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-[#064771] flex items-center justify-center shrink-0 self-end">
                                                        <span className="text-white text-[8px] font-medium">{getInitials(note.author)}</span>
                                                    </div>
                                                ))}
                                            {note.isDeleted ? (
                                                <div className="px-2 py-1 bg-[#F3F4F6] rounded-md border border-[#E5E7EB] italic">
                                                    <span className="text-[11px] text-gray-400">
                                                        <Trash2 className="w-2.5 h-2.5 inline mr-0.5" />
                                                        {note.deletedBy || note.author} deleted this message
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className={`relative px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md rounded-bl-none ${note.isSystem
                                                    ? 'bg-gradient-to-r from-[#E0F2FE] to-[#F0F9FF] text-[#0C4A6E] border border-[#BAE6FD]'
                                                    : 'bg-white text-gray-700 border border-[#E5E7EB]'
                                                    }`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-semibold text-gray-700">{note.author}</span>
                                                        {note.isSystem && (
                                                            <span className="px-1 py-px bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 rounded text-[8px] font-medium text-[#0369A1]">System</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs leading-snug">{note.content}</p>
                                                </div>
                                            )}
                                        </div>
                                        {!note.isDeleted && (
                                            <span className="text-[9px] text-gray-400 shrink-0 mb-0.5">{formatTimestamp(note.timestamp)}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-400 italic py-8 text-xs">
                            No notes yet. Add a note to start the conversation.
                        </div>
                    )}
                </div>

                {/* Notes Input */}
                <div className="px-3 py-2 bg-[rgba(249,250,251,0.5)] border-t border-[#E5E7EB] shrink-0">
                    <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Write a comment or note..."
                            className="flex-1 resize-none text-xs text-gray-600 placeholder-[#94A3B8] focus:outline-none"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddNote();
                                }
                            }}
                        />
                        <button
                            onClick={handleAddNote}
                            disabled={submittingNote || !newNote.trim()}
                            className="flex items-center gap-1.5 px-3 py-1 bg-[#064771] text-white rounded text-xs font-semibold hover:bg-[#053a5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            {submittingNote ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <>
                                    Add
                                    <Send className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-lg border border-[#E5E7EB] py-1 z-50 min-w-[140px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        onClick={() => {
                            const note = notes.find((n) => n.id === contextMenu.noteId);
                            if (note) openDeleteModal(contextMenu.noteId, note.author);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Message
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                            <h3 className="text-lg font-medium text-gray-900">Delete Message</h3>
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, noteId: null, noteAuthor: '' })}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Close dialog"
                                aria-label="Close dialog"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-5 py-4">
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete this message? This action cannot be undone.
                            </p>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 px-5 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, noteId: null, noteAuthor: '' })}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-[#D1D5DB] rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteNote}
                                disabled={deletingNote}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {deletingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// ─────────────────────────────────────────────────────
//  Utility: parse raw activity log data into Note[]
//  Use this when mapping API response data to notes.
// ─────────────────────────────────────────────────────

/**
 * Parse formatted activity logs (from buyer/seller detail APIs)
 * into the Note[] shape used by the NotesSection component.
 */
interface ActivityLogRecord {
    id: number;
    author?: string;
    user?: string;
    avatar?: string | null;
    content: string;
    timestamp?: string;
    created_at?: string;
    type?: string;
    isSystem?: boolean;
    isDeleted?: boolean;
    deletedBy?: string;
}

export const parseActivityLogs = (
    logs: ActivityLogRecord[],
    currentUserName: string
): Note[] => {
    if (!logs || !Array.isArray(logs)) return [];

    // Reverse so oldest is first, newest last (chat order)
    const ordered = [...logs].reverse();

    return ordered.map((log: ActivityLogRecord) => {
        const isSystem = log.isSystem ?? log.type === 'system';
        return {
            id: log.id,
            // System messages always show as "Ventureflow" (matches buyer side formatting)
            author: isSystem ? 'Ventureflow' : (log.author || log.user || 'System'),
            avatar: log.avatar || null,
            content: log.content,
            timestamp: formatTimestamp(log.timestamp || log.created_at || ''),
            isSystem,
            // System messages are never "self" — always appear on the left
            isSelf: !isSystem && (log.author || log.user) === currentUserName,
            isDeleted: log.isDeleted || false,
            deletedBy: log.deletedBy || undefined,
        };
    });
};

export default NotesSection;
