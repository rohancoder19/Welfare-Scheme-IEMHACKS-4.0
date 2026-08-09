import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { sendChatMessageAPI } from '../services/chatbotAPI';
import { Bot, Send, X, Sparkles, User, RefreshCw, Trash2, BookOpen } from 'lucide-react';

const Chatbot = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Namaste! I am your AI Welfare & Grievance Assistant. How can I help you today?',
      suggestedActions: ['Find Eligible Schemes', 'Report Pothole/Water Issue', 'Ayushman Hospital List']
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleClearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: 'Chat history cleared. How can I assist you with government schemes or grievances today?',
        suggestedActions: ['Find Eligible Schemes', 'Report Pothole/Water Issue', 'Ayushman Hospital List']
      }
    ]);
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    // Format recent conversation history for RAG context
    const historyPayload = updatedMessages.slice(-10).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const res = await sendChatMessageAPI(query, historyPayload, user || null);
      if (res && res.reply) {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: res.reply,
            source: res.source || 'Civic AI Assistant',
            sources: res.sources || [],
            suggestedActions: res.suggestedActions || []
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: 'AI Assistant is temporarily unavailable. Please try again.',
            source: 'Civic Assistant',
            sources: [],
            suggestedActions: ['Find Eligible Schemes', 'Report Pothole/Water Issue', 'Ayushman Hospital List']
          }
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'AI Assistant is temporarily unavailable. Please try again.',
          source: 'Civic Assistant',
          sources: [],
          suggestedActions: ['Find Eligible Schemes', 'Report Pothole/Water Issue', 'Ayushman Hospital List']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Welfare Assistant Chat"
          className="group flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-gray-950 font-bold text-xs sm:text-sm shadow-2xl hover:scale-105 transition-transform glow-emerald"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-950/20 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-gray-950 animate-bounce" />
          </div>
          <span>AI Welfare Assistant</span>
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[420px] h-[500px] max-h-[82vh] glass-panel rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* Chat Header */}
          <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-0.5 flex items-center justify-center">
                <Bot className="w-5 h-5 text-gray-950" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  CIVIC<span className="text-emerald-400">AI</span> Assistant
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </h4>
                <p className="text-[11px] text-gray-400">3,400+ Scheme RAG Knowledge Base</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearChat}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-gray-950 font-medium rounded-tr-none shadow-md'
                    : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-none'
                }`}>
                  {msg.text}

                  {/* Sources attribution tag */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center gap-1.5 flex-wrap">
                      <BookOpen className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-gray-400 font-semibold">Sources:</span>
                      {msg.sources.map((src, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20">
                          {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Suggested Quick Prompts */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-800 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(action)}
                          className="px-2.5 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] border border-emerald-500/20 font-medium transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>AI searching 3,400+ schemes dataset...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-gray-900 border-t border-gray-800">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about PM Awas, Kisan, West Bengal Scholarships..."
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-gray-950 disabled:opacity-50 transition-all shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
};

export default Chatbot;
