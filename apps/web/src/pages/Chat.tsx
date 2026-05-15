import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { api } from '../lib/api'
import { clsx } from 'clsx'

interface Message { role: 'user' | 'assistant'; content: string }

export default function ChatPage() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('chat.welcome') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/ai/chat', { message: msg, history })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' }])
    }
    setLoading(false)
  }

  const suggestions = t('chat.suggestions', { returnObjects: true }) as string[]

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-64px)] md:max-h-screen">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">{t('chat.title')}</h1>
          <p className="text-xs text-brand-green flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={clsx('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              msg.role === 'assistant' ? 'bg-brand-green' : 'bg-gray-200'
            )}>
              {msg.role === 'assistant'
                ? <Bot size={16} className="text-white" />
                : <User size={16} className="text-gray-600" />}
            </div>
            <div className={clsx(
              'max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
              msg.role === 'assistant'
                ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                : 'bg-brand-green text-white rounded-tr-none'
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0 flex-nowrap">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              className="flex-shrink-0 text-xs border border-brand-green/30 text-brand-green rounded-full px-3 py-1.5 hover:bg-brand-green-light transition-colors whitespace-nowrap">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0">
        <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-2 focus-within:border-brand-green transition-colors">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={t('chat.placeholder')}
            className="flex-1 text-sm px-2 outline-none bg-transparent"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="btn-primary p-2.5 rounded-lg disabled:opacity-40">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
