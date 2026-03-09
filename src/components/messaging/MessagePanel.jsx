
import React, { useState, useEffect, useRef } from 'react';
import { User } from '@/entities/User';
import { Message } from '@/entities/Message';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Check, CheckCheck, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessagePanel({ isOpen, setIsOpen, currentUser, theme }) {
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      const interval = setInterval(() => fetchMessages(selectedConversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Bildirim sesi çalma fonksiyonu
  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBTt+z/LNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaBQ==');
    audio.play().catch(() => {}); // Ses çalma hatası durumunda sessizce devam et
  };

  const fetchUsers = async () => {
    const allUsers = await User.list();
    setUsers(allUsers.filter(u => u.id !== currentUser?.id));
    
    // Her kullanıcı için okunmamış mesaj sayısını hesapla
    const counts = {};
    for (const user of allUsers.filter(u => u.id !== currentUser?.id)) {
      const unreadMessages = await Message.filter({
        sender_id: user.id,
        receiver_id: currentUser?.id,
        is_read: false
      });
      counts[user.id] = unreadMessages.length;
    }
    setUnreadCounts(counts);
  };

  const fetchMessages = async (contactId) => {
    if (!currentUser) return;
    
    const sent = await Message.filter({ sender_id: currentUser.id, receiver_id: contactId });
    const received = await Message.filter({ sender_id: contactId, receiver_id: currentUser.id });
    
    const allMessages = [...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    
    // Gelen mesajları otomatik olarak okundu olarak işaretle
    for (const msg of received) {
      if (!msg.is_read) {
        await Message.update(msg.id, { is_read: true });
      }
    }
    
    setMessages(allMessages);
    // Okunmamış sayısını güncelle
    setUnreadCounts(prev => ({ ...prev, [contactId]: 0 }));
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !selectedConversation || !currentUser) return;

    await Message.create({
      sender_id: currentUser.id,
      sender_name: `${currentUser.first_name} ${currentUser.last_name}`,
      receiver_id: selectedConversation.id,
      receiver_name: `${selectedConversation.first_name} ${selectedConversation.last_name}`,
      content: newMessage,
    });
    
    setNewMessage('');
    fetchMessages(selectedConversation.id);
  };

  const markAllAsRead = async () => {
    if (!selectedConversation) return;
    
    const unreadMessages = await Message.filter({
      sender_id: selectedConversation.id,
      receiver_id: currentUser.id,
      is_read: false
    });
    
    for (const msg of unreadMessages) {
      await Message.update(msg.id, { is_read: true });
    }
    
    fetchMessages(selectedConversation.id);
  };

  const deleteAllMessages = async () => {
    if (!selectedConversation || !currentUser) return;
    if (!window.confirm('Tüm mesajları silmek istediğinizden emin misiniz?')) return;
    
    const allMessages = await Message.filter({
      $or: [
        { sender_id: currentUser.id, receiver_id: selectedConversation.id },
        { sender_id: selectedConversation.id, receiver_id: currentUser.id }
      ]
    });
    
    for (const msg of allMessages) {
      await Message.delete(msg.id);
    }
    
    setMessages([]);
  };

  const panelVariants = {
    hidden: { x: "100%" },
    visible: { x: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ type: "tween", duration: 0.3 }}
          className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col ${theme === 'dark' ? 'bg-gray-800 text-white border-l border-gray-700' : 'bg-white text-black border-l border-gray-200'} shadow-2xl`}
        >
          <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className="text-lg font-semibold">
              {selectedConversation ? `${selectedConversation.first_name} ${selectedConversation.last_name}` : "Mesajlar"}
            </h2>
            <div className="flex items-center space-x-2">
              {selectedConversation && (
                <>
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deleteAllMessages}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* User List */}
            <div className={`w-1/3 border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto`}>
              {users.map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedConversation(user)}
                  className={`relative p-3 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${selectedConversation?.id === user.id ? (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  <div className="flex items-center space-x-2">
                    {user.profile_picture_url ? (
                      <img src={user.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover"/>
                    ) : (
                       <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">{user.first_name?.charAt(0)}</div>
                    )}
                    <span className="text-sm font-medium">{user.first_name}</span>
                  </div>
                  {unreadCounts[user.id] > 0 && (
                    <div className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {unreadCounts[user.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Conversation View */}
            <div className="w-2/3 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                    {messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-2 rounded-lg ${msg.sender_id === currentUser?.id ? 'bg-blue-600 text-white' : (theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200')}`}>
                          <p className="text-sm">{msg.content}</p>
                          {msg.sender_id === currentUser?.id && (
                            <div className="flex justify-end mt-1">
                              {msg.is_read ? (
                                <CheckCheck className="w-3 h-3 text-blue-200" />
                              ) : (
                                <Check className="w-3 h-3 text-gray-300" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center space-x-2`}>
                    <Textarea 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      placeholder="Mesaj yaz..."
                      className="text-sm flex-1 h-10 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Konuşma seçin
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
