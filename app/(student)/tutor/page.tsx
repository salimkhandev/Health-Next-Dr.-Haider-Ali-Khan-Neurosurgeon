'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';
import { GraduationCap, Send, Bot, User, Settings2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MODES = [
  'Grammar Tutor',
  'Tenses Coach',
  'Vocabulary Builder',
  'Writing Coach',
  'Speaking Partner',
  'Reading Coach',
  'Exam Preparation (IELTS/TOEFL)',
  'Homework Helper',
  'General Conversation'
];

const LEVELS = [
  'Beginner (A1–A2)',
  'Intermediate (B1–B2)',
  'Advanced (C1–C2)'
];

export default function AITutorPage() {
  const [mode, setMode] = useState(MODES[0]);
  const [level, setLevel] = useState(LEVELS[1]);
  const [showSettings, setShowSettings] = useState(false);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, error } = useChat({
    api: '/api/chat',
    body: {
      data: {
        mode,
        level,
      }
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the conversation?')) {
      setMessages([]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--surface-0)' }}>
      {/* Header */}
      <header style={{ height: '60px', borderBottom: '1px solid var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', background: 'var(--surface-1)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-500 hover:underline" style={{ textDecoration: 'none' }}>
            Dashboard
          </Link>
          <span className="text-muted text-xs">/</span>
          <span className="text-xs font-medium truncate flex items-center gap-1 sm:gap-2" style={{ color: 'var(--text-secondary)' }}>
            <GraduationCap className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="hidden sm:inline">AI Tutor: Hafiz Mujeeb</span>
            <span className="sm:hidden">AI Tutor</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="lg:hidden p-1.5 text-muted hover:text-primary rounded-md border border-surface-2 bg-surface-1"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          <button onClick={clearChat} className="text-xs text-muted hover:text-red-400 transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer">
            <Trash2 className="w-4 h-4" /> Clear Chat
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0 relative">
        {/* Sidebar Settings */}
        <aside className={`${showSettings ? 'flex absolute inset-0 z-20' : 'hidden'} lg:static lg:flex w-full lg:w-72 lg:border-r border-slate-800 bg-surface-1 p-4 flex-col gap-6`} style={{ background: 'var(--surface-1)', borderColor: 'var(--surface-2)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Settings2 className="w-5 h-5 text-brand-500" />
              <h2 className="font-semibold text-sm">Tutor Settings</h2>
            </div>
            <button onClick={() => setShowSettings(false)} className="lg:hidden p-1 text-muted hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Select Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="input text-sm p-2"
            >
              {MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Your Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="input text-sm p-2"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="mt-auto p-4 rounded-lg bg-surface-2/50 border border-surface-2 text-xs text-secondary leading-relaxed">
            <p><strong>Note:</strong> Changing the mode or level will take effect on your next message.</p>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col min-h-0 bg-surface-0 relative">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-32">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto text-secondary gap-4 opacity-70">
                <div className="w-16 h-16 rounded-full border border-brand-500/20 overflow-hidden mb-2 shadow-sm">
                  <Image src="/profile.jpg" alt="Hafiz Mujeeb" width={64} height={64} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-semibold text-primary">I am Hafiz Mujeeb</h3>
                <p className="text-sm">
                  Your AI English Tutor. Select a mode on the left and say hello to start practicing!
                </p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto flex flex-col gap-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center overflow-hidden"
                         style={{ 
                           background: message.role === 'user' ? 'var(--brand-500)' : 'var(--surface-2)',
                           color: message.role === 'user' ? '#0f172a' : 'var(--text-primary)'
                         }}>
                      {message.role === 'user' ? <User className="w-5 h-5" /> : <Image src="/profile.jpg" alt="Hafiz" width={40} height={40} className="w-full h-full object-cover" />}
                    </div>
                    
                    <div
                      className="px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[80%] whitespace-pre-wrap text-sm sm:text-base shadow-sm"
                      style={{
                        background: message.role === 'user' ? 'var(--brand-500)' : 'var(--surface-1)',
                        color: message.role === 'user' ? '#0f172a' : 'var(--text-primary)',
                        border: message.role === 'user' ? 'none' : '1px solid var(--surface-2)',
                        borderTopRightRadius: message.role === 'user' ? '4px' : '16px',
                        borderTopLeftRadius: message.role === 'user' ? '16px' : '4px',
                      }}
                    >
                      {message.role === 'user' ? (
                        message.content
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-primary overflow-hidden">
                      <Image src="/profile.jpg" alt="Hafiz" width={40} height={40} className="w-full h-full object-cover" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-surface-1 border border-surface-2 text-secondary text-sm flex items-center gap-1" style={{ borderTopLeftRadius: '4px' }}>
                      <span className="spinner" style={{ width: '14px', height: '14px', borderTopColor: 'var(--brand-500)' }}></span>
                      Thinking...
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-3 sm:gap-4">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 overflow-hidden">
                      <Image src="/profile.jpg" alt="Hafiz" width={40} height={40} className="w-full h-full object-cover" style={{ opacity: 0.5 }} />
                    </div>
                    <div className="px-4 py-3 rounded-2xl max-w-[85%] sm:max-w-[80%] whitespace-pre-wrap text-sm sm:text-base shadow-sm border border-red-500/20 bg-red-500/5 text-red-400" style={{ borderTopLeftRadius: '4px' }}>
                      <span className="font-semibold block mb-1">Error processing response:</span>
                      {error.message}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-10">
            <div className="max-w-3xl mx-auto">
              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 bg-surface-1 border border-surface-2 rounded-2xl p-2 shadow-xl"
              >
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message here..."
                  className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none resize-none p-3 text-sm sm:text-base focus:ring-0 focus:outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading) {
                        const fakeEvent = new Event('submit', { cancelable: true }) as any;
                        handleSubmit(fakeEvent);
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex-shrink-0 w-11 h-11 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:hover:bg-brand-500 flex items-center justify-center transition-colors text-slate-950 mb-1 mr-1"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
              <div className="text-center mt-2">
                <span className="text-[10px] text-muted">AI responses can be inaccurate. Press Shift + Enter for a new line.</span>
              </div>
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}
