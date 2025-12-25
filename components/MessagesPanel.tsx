import React, { useState, useEffect } from 'react';
import { Send, Mail, X, Reply, MessageCircle } from 'lucide-react';
import { Card, Button, Input } from './UI';
import { api } from '../services/api';
import { Message, Role } from '../types';

interface MessagesPanelProps {
  userId: string;
  userName: string;
  userRole: Role;
  recipients?: { id: string; name: string; role: Role }[];
  onClose?: () => void;
}

const MessagesPanel: React.FC<MessagesPanelProps> = ({ 
  userId, 
  userName, 
  userRole, 
  recipients = [], 
  onClose 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientRole, setRecipientRole] = useState<Role>('teacher');
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadMessages();
  }, [tab]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const msgs = tab === 'inbox' 
        ? await api.getMessages(userId, userRole)
        : await api.getSentMessages(userId, userRole);
      setMessages(msgs);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!subject.trim() || !content.trim() || !recipientId) {
      alert('أكمل جميع الحقول');
      return;
    }

    const message: Message = {
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      recipientId,
      recipientRole: recipientRole,
      subject,
      content,
      timestamp: Date.now(),
      read: false,
      replies: []
    };

    setLoading(true);
    try {
      await api.sendMessage(message);
      setSubject('');
      setContent('');
      setRecipientId('');
      setShowCompose(false);
      alert('تم إرسال الرسالة');
      loadMessages();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ في الإرسال');
    }
    setLoading(false);
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedMessage) return;

    const reply: Message = {
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      recipientId: selectedMessage.senderId,
      recipientRole: selectedMessage.senderRole,
      subject: `رد: ${selectedMessage.subject}`,
      content: replyContent,
      timestamp: Date.now(),
      read: false
    };

    setLoading(true);
    try {
      if (selectedMessage.id) {
        await api.replyToMessage(selectedMessage.id, reply);
      }
      setReplyContent('');
      setSelectedMessage(null);
      alert('تم الرد');
      loadMessages();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ');
    }
    setLoading(false);
  };

  const handleDeleteMessage = async (messageId: string | undefined) => {
    if (!messageId || !confirm('هل تريد حذف الرسالة؟')) return;

    setLoading(true);
    try {
      await api.deleteMessage(messageId);
      setSelectedMessage(null);
      loadMessages();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleMarkAsRead = async (msg: Message) => {
    if (msg.id && !msg.read) {
      await api.markMessageAsRead(msg.id);
      msg.read = true;
    }
  };

  return (
    <div className="w-full max-w-4xl">
      <Card className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-secondary flex gap-2 items-center">
          <MessageCircle className="w-6 h-6" /> الرسائل
        </h2>
        {onClose && <button onClick={onClose} className="p-2"><X className="w-5 h-5" /></button>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <Card className="lg:col-span-1 max-h-[600px] flex flex-col">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('inbox')}
              className={`flex-1 py-2 rounded transition-all ${
                tab === 'inbox'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-1" />
              الوارد
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`flex-1 py-2 rounded transition-all ${
                tab === 'sent'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Send className="w-4 h-4 inline mr-1" />
              المرسل
            </button>
          </div>

          <Button
            fullWidth
            onClick={() => setShowCompose(true)}
            className="mb-4"
          >
            + رسالة جديدة
          </Button>

          <div className="overflow-y-auto flex-1 custom-scrollbar space-y-2">
            {loading && <div className="text-center py-4 text-gray-400">جاري التحميل...</div>}
            {messages.length === 0 && !loading && (
              <div className="text-center py-10 text-gray-400">لا توجد رسائل</div>
            )}
            {messages.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  handleMarkAsRead(msg);
                  setSelectedMessage(msg);
                }}
                className={`w-full text-right p-3 rounded-lg border-2 transition-all ${
                  selectedMessage?.id === msg.id
                    ? 'bg-blue-50 border-primary'
                    : msg.read
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}
              >
                <div className="font-bold text-sm truncate">
                  {tab === 'inbox' ? msg.senderName : msg.recipientId}
                </div>
                <div className="text-xs text-gray-600 truncate">{msg.subject}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(msg.timestamp).toLocaleDateString('ar-EG', { weekday: 'long' })}، {new Date(msg.timestamp).toLocaleDateString('ar-EG')}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Detail or Compose */}
        <Card className="lg:col-span-2 max-h-[600px] flex flex-col">
          {showCompose ? (
            <>
              <h3 className="text-xl font-bold text-secondary mb-4">رسالة جديدة</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
                <div>
                  <label className="block text-right mb-2 font-medium">إلى:</label>
                  <select
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="w-full p-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-right"
                  >
                    <option value="">-- اختر المستقبل --</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.role})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="الموضوع:"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
                <div>
                  <label className="block text-right mb-2 font-medium">المحتوى:</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-right h-40"
                    placeholder="اكتب رسالتك هنا..."
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  fullWidth
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4 inline mr-1" /> إرسال
                </Button>
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowCompose(false)}
                  disabled={loading}
                >
                  إلغاء
                </Button>
              </div>
            </>
          ) : selectedMessage ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-secondary">{selectedMessage.subject}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    من: {selectedMessage.senderName}
                    <br />
                    التاريخ: {new Date(selectedMessage.timestamp).toLocaleDateString('ar-EG', { weekday: 'long' })}، {new Date(selectedMessage.timestamp).toLocaleDateString('ar-EG')}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded text-xl"
                >
                  🗑️
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-right whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              {/* Replies */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 max-h-32 overflow-y-auto">
                  <div className="font-bold text-sm mb-2 text-right">الردود:</div>
                  {selectedMessage.replies.map((reply, idx) => (
                    <div key={idx} className="bg-white p-2 rounded mb-2 text-sm text-right border-l-2 border-primary">
                      <div className="font-bold">{reply.senderName}</div>
                      <p className="mt-1">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'inbox' && (
                <div className="space-y-3">
                  <label className="block text-right font-medium">رد على هذه الرسالة:</label>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-primary text-right h-24"
                    placeholder="اكتب ردك..."
                  />
                  <div className="flex gap-2">
                    <Button
                      fullWidth
                      onClick={handleReply}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Reply className="w-4 h-4 inline mr-1" /> رد
                    </Button>
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={() => {
                        setSelectedMessage(null);
                        setReplyContent('');
                      }}
                    >
                      إغلاق
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>اختر رسالة لعرضها</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagesPanel;
