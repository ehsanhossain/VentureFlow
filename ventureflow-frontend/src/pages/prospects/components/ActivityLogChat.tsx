import React, { useState, useEffect } from 'react';
import { Send, FileText, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../../config/api';
import { showAlert } from '../../../components/Alert';

interface LogItem {
    id: string;
    type: 'comment' | 'system';
    user: string;
    avatar?: string;
    content: string;
    timestamp: Date;
    metadata?: any;
}

interface ActivityLogChatProps {
    entityId?: string;
    entityType: 'buyer' | 'seller' | 'deal';
}

export const ActivityLogChat: React.FC<ActivityLogChatProps> = ({ entityId, entityType }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'logs'>('all');
    const [newMessage, setNewMessage] = useState('');
    const [items, setItems] = useState<LogItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchLogs = async () => {
        if (!entityId) return;
        setIsLoading(true);
        try {
            const response = await api.get('/api/activity-logs', {
                params: { entity_id: entityId, entity_type: entityType }
            });
            const formattedItems = response.data.data.map((item: any) => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
            setItems(formattedItems);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [entityId, entityType]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !entityId) return;

        try {
            const response = await api.post('/api/activity-logs', {
                entity_id: entityId,
                entity_type: entityType,
                content: newMessage,
                type: 'comment'
            });

            const newItem: LogItem = {
                ...response.data.data,
                timestamp: new Date(response.data.data.timestamp)
            };

            setItems(prev => [newItem, ...prev]);
            setNewMessage('');
        } catch (err) {
            showAlert({ type: 'error', message: 'Failed to send comment' });
        }
    };

    const filteredItems = items.filter(item => {
        if (activeTab === 'all') return true;
        if (activeTab === 'chat') return item.type === 'comment';
        if (activeTab === 'logs') return item.type === 'system';
        return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div className="bg-white border md:border-transparent rounded-lg flex flex-col h-full overflow-hidden font-poppins">
            {/* Header / Tabs */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
                <div className="flex space-x-6">
                    {(['all', 'chat', 'logs'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`text-sm font-semibold pb-4 -mb-4 border-b-2 transition-all ${activeTab === tab
                                    ? 'border-[#064771] text-[#064771]'
                                    : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            {tab === 'all' && 'All Activity'}
                            {tab === 'chat' && (
                                <span className="flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4" /> Comments
                                </span>
                            )}
                            {tab === 'logs' && (
                                <span className="flex items-center gap-1.5">
                                    <FileText className="w-4 h-4" /> System Logs
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#064771]"></div>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                        <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm font-medium">No activity recorded yet</p>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div key={item.id} className="flex gap-4 group">
                            {/* Avatar / Icon */}
                            <div className="flex-shrink-0 mt-1">
                                {item.type === 'comment' ? (
                                    item.avatar ? (
                                        <img src={item.avatar} alt="" className="w-9 h-9 rounded-full border border-gray-100 object-cover" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-[#064771] font-bold text-xs border border-blue-100">
                                            {item.user.charAt(0).toUpperCase()}
                                        </div>
                                    )
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className={`text-[13px] font-bold ${item.type === 'system' ? 'text-gray-500' : 'text-gray-900'}`}>
                                        {item.user}
                                    </span>
                                    {item.type === 'system' && (
                                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">System</span>
                                    )}
                                    <span className="text-[11px] text-gray-400 font-medium ml-auto uppercase tracking-tight">
                                        {format(item.timestamp, 'MMM d, h:mm a')}
                                    </span>
                                </div>
                                <div className={`text-sm leading-relaxed ${item.type === 'system' ? 'text-gray-500 italic' : 'text-gray-700'}`}>
                                    {item.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t bg-gray-50/50">
                <div className="relative group bg-white rounded-xl border border-gray-200 focus-within:border-[#064771] focus-within:ring-4 focus-within:ring-blue-50 transition-all shadow-sm">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write a comment or note..."
                        className="w-full px-4 pt-4 pb-12 bg-transparent border-none focus:ring-0 resize-none text-[13px] font-medium placeholder:text-gray-400 min-h-[80px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <div className="absolute right-3 bottom-3 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Shift + Enter for new line</span>
                        <button
                            type="button"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !entityId}
                            className="p-2.5 text-white bg-[#064771] rounded-lg hover:bg-[#053a5c] disabled:opacity-30 disabled:grayscale transition-all shadow-md active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
