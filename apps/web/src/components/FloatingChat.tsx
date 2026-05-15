import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Minus, Briefcase } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { clsx } from 'clsx'

interface Message { role: 'user' | 'assistant'; content: string }

export default function FloatingChat() {
  // ALL hooks before any return
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  const isEmployer = user?.role === 'employer'

  const welcomeMsg = isEmployer
    ? "Hi! I'm your NexaWork hiring assistant. I can help you write job descriptions, find candidates, or answer questions about your postings. What do you need?"
    : t('chat.welcome')

  const suggestions = isEmployer
    ? ['Help me write a job description', 'What makes a good job posting?', 'How to screen candidates better?']
    : ['Find jobs in my field', 'Improve my profile', 'Interview tips']

  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true
      setMessages([{ role: 'assistant', content: welcomeMsg }])
    }
  }, [open, welcomeMsg])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [open, messages])

  // Early return AFTER all hooks
  if (!user) return null

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/ai/chat', { message: msg, history })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
      if (!open) setUnread(u => u + 1)
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.'
      }])
    }
    setLoading(false)
  }

  const headerColor = isEmployer ? 'bg-gray-900' : 'bg-brand-green'
  const fabColor = isEmployer
    ? (open ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-900 hover:bg-gray-800')
    : (open ? 'bg-gray-700 hover:bg-gray-800' : 'bg-brand-green hover:bg-brand-green-dark')

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && !minimized && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className={`${headerColor} px-4 py-3 flex items-center justify-between flex-shrink-0`}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                {isEmployer ? <Briefcase size={14} className="text-white" /> : <Sparkles size={14} className="text-white" />}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {isEmployer ? 'Hiring Assistant' : 'NexaWork AI'}
                </p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  {isEmployer ? 'Powered by GPT-4o' : 'Online'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg text-white">
                <Minus size={14} />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg text-white">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={clsx('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  msg.role === 'assistant' ? (isEmployer ? 'bg-gray-900' : 'bg-brand-green') : 'bg-gray-200'
                )}>
                  {msg.role === 'assistant'
                    ? (isEmployer ? <Briefcase size={12} className="text-white" /> : <Bot size={12} className="text-white" />)
                    : <User size={12} className="text-gray-600" />}
                </div>
                <div className={clsx(
                  'max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap',
                  msg.role === 'assistant'
                    ? 'bg-gray-50 text-gray-800 rounded-tl-none'
                    : `${isEmployer ? 'bg-gray-900' : 'bg-brand-green'} text-white rounded-tr-none`
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className={`w-6 h-6 rounded-full ${isEmployer ? 'bg-gray-900' : 'bg-brand-green'} flex items-center justify-center`}>
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2">
                  <div className="flex gap-1 items-center h-4">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className={`w-1.5 h-1.5 ${isEmployer ? 'bg-gray-900' : 'bg-brand-green'} rounded-full animate-bounce`}
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto flex-nowrap">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  className={clsx(
                    'flex-shrink-0 text-xs rounded-full px-2.5 py-1 transition-colors whitespace-nowrap border',
                    isEmployer
                      ? 'border-gray-800/30 text-gray-700 hover:bg-gray-100'
                      : 'border-brand-green/30 text-brand-green hover:bg-brand-green-light'
                  )}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <div className={clsx('flex gap-2 bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-2',
              isEmployer ? 'focus-within:ring-gray-900/20' : 'focus-within:ring-brand-green/30'
            )}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder={isEmployer ? 'Ask about hiring...' : 'Ask me anything...'}
                className="flex-1 text-sm bg-transparent outline-none" />
              <button onClick={() => send()} disabled={loading || !input.trim()}
                className={clsx('disabled:opacity-30 transition-opacity',
                  isEmployer ? 'text-gray-900' : 'text-brand-green'
                )}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {open && minimized && (
        <button onClick={() => setMinimized(false)}
          className={`${headerColor} text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-opacity hover:opacity-90`}>
          {isEmployer ? <Briefcase size={14} /> : <Sparkles size={14} />}
          <span className="text-sm font-medium">{isEmployer ? 'Hiring Assistant' : 'NexaWork AI'}</span>
        </button>
      )}

      <button onClick={() => { setOpen(!open); setMinimized(false) }}
        className={clsx('w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative', fabColor)}>
        {open ? <X size={22} className="text-white" /> : (isEmployer ? <Briefcase size={22} className="text-white" /> : <MessageSquare size={22} className="text-white" />)}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-gold rounded-full text-xs text-white font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}
