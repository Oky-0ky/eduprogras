import React, { useState } from 'react';
import { INITIAL_MESSAGES } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import GlassCard from '../components/GlassCard';
import { MessageSquareText, Send, User, CheckCheck, Sparkles } from 'lucide-react';

export default function Messages() {
  const { user, selectedStudent } = useAuth();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: `msg-${Date.now()}`,
      senderRole: user.role,
      senderName: user.name,
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: true
    };

    setMessages((prev) => [...prev, newMsg]);
    const sentText = inputText;
    setInputText('');

    // Auto reply simulation from Homeroom Teacher
    setTimeout(() => {
      const autoReply = {
        id: `msg-${Date.now() + 1}`,
        senderRole: 'Guru',
        senderName: selectedStudent.homeroomTeacher,
        text: `Terima kasih atas pesannya! Informasi mengenai "${sentText}" sudah saya catat untuk evaluasi perkembangan ananda ${selectedStudent.name}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: true
      };
      setMessages((prev) => [...prev, autoReply]);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 p-6 rounded-4xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <MessageSquareText className="w-3.5 h-3.5" /> Pesan & Diskusi Real-time
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Pesan Komunikasi Guru & Orang Tua</h1>
          <p className="text-xs sm:text-sm text-sky-100">
            Kanal konsultasi privat perkembangan belajar anak bersama Wali Kelas {selectedStudent.homeroomTeacher}.
          </p>
        </div>
      </div>

      {/* Chat Container Box */}
      <GlassCard className="p-0 overflow-hidden flex flex-col h-[550px]">
        {/* Chat Header */}
        <div className="p-4 bg-sky-500 text-white flex items-center gap-3">
          <img src={selectedStudent.homeroomAvatar} alt={selectedStudent.homeroomTeacher} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
          <div>
            <h3 className="font-extrabold text-sm">{selectedStudent.homeroomTeacher}</h3>
            <p className="text-[11px] text-sky-100 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span> Online - Wali Kelas {selectedStudent.className}
            </p>
          </div>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          {messages.map((msg) => {
            const isMe = msg.senderRole === user.role;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-md p-3.5 rounded-3xl text-xs space-y-1 shadow-sm ${
                    isMe
                      ? 'bg-sky-500 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
                  }`}
                >
                  <p className={`text-[10px] font-extrabold ${isMe ? 'text-sky-100' : 'text-sky-600 dark:text-sky-400'}`}>
                    {msg.senderName} ({msg.senderRole})
                  </p>
                  <p className="leading-relaxed">{msg.text}</p>
                  <div className={`text-[9px] text-right ${isMe ? 'text-sky-200' : 'text-slate-400'} font-medium`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Box */}
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ketik pesan untuk ${selectedStudent.homeroomTeacher}...`}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center gap-1.5"
          >
            <span>Kirim</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
