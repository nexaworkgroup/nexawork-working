import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, ArrowLeft, ArrowRight, CheckCircle, Sparkles } from 'lucide-react'
import { api } from '../lib/api'

const STEPS = [
  { title: 'Personal Info', placeholder: 'Full name, email, phone, city\nExample: John Doe | johndoe@email.com | +237 6XX XXX XXX | Douala, Cameroon' },
  { title: 'Education', placeholder: 'Degree, institution, graduation year\nExample: BSc Computer Science, University of Buea, 2024' },
  { title: 'Skills & Tools', placeholder: 'List your key skills\nExample: React, Node.js, Python, SQL, Figma, Git, Agile' },
  { title: 'Experience & Projects', placeholder: 'Projects, internships, or work experience\nExample: Built an e-commerce platform using React & Node.js that served 200+ users' },
  { title: 'Career Objective', placeholder: 'What role are you looking for and why?\nExample: Junior Software Engineer passionate about building impactful solutions for Africa, seeking to join a growth-stage startup' },
]

export default function CVBuilderPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(['', '', '', '', ''])
  const [generating, setGenerating] = useState(false)
  const [cvHtml, setCvHtml] = useState('')
  const [done, setDone] = useState(false)

  const update = (val: string) => setAnswers(prev => { const a = [...prev]; a[step] = val; return a })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await api.post('/ai/generate-cv', { answers })
      setCvHtml(res.data.cv_html)
      setDone(true)
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  const handleDownload = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333;line-height:1.6}
      h1{color:#1A7A4A;border-bottom:2px solid #E8B84B;padding-bottom:8px}
      h2{color:#1A7A4A;margin-top:24px;font-size:16px;text-transform:uppercase;letter-spacing:1px}
      .section{margin-bottom:20px}
      @media print{body{margin:20px}}
    </style></head><body>${cvHtml}</body></html>`], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'My_NexaWork_CV.html'; a.click()
    URL.revokeObjectURL(url)
  }

  if (done && cvHtml) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your CV is Ready! 🎉</h1>
            <p className="text-gray-400 text-sm mt-0.5">Review it below and download when ready</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setDone(false); setStep(0) }} className="btn-secondary text-sm px-4 py-2">
              <ArrowLeft size={15} className="mr-1.5 inline" /> Regenerate
            </button>
            <button onClick={handleDownload} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              <Download size={15} /> Download CV
            </button>
          </div>
        </div>

        {/* CV Preview */}
        <div className="card overflow-hidden">
          <div className="bg-brand-green-light px-4 py-2 flex items-center gap-2 border-b border-brand-green/10">
            <FileText size={16} className="text-brand-green" />
            <span className="text-sm font-medium text-brand-green">CV Preview</span>
            <span className="ml-auto text-xs text-gray-400">AI-generated · ATS optimised</span>
          </div>
          <div
            className="p-8 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: cvHtml }}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleDownload} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 text-base">
            <Download size={18} /> Download as HTML (open in browser → Print → Save as PDF)
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-2">
          Tip: Open the downloaded file in Chrome → Ctrl+P → Save as PDF for the best quality
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Profile
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center">
            <Sparkles size={20} className="text-brand-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI CV Builder</h1>
            <p className="text-gray-400 text-sm">Answer 5 questions → get a professional CV in seconds</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full mb-1.5 transition-all ${i <= step ? 'bg-brand-green' : 'bg-gray-200'}`} />
            <p className={`text-xs text-center ${i === step ? 'text-brand-green font-medium' : 'text-gray-400'}`}>
              {i + 1}
            </p>
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 bg-brand-green text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
            {step + 1}
          </span>
          <h2 className="text-lg font-bold text-gray-900">{STEPS[step].title}</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4">Step {step + 1} of {STEPS.length}</p>

        <textarea
          value={answers[step]}
          onChange={e => update(e.target.value)}
          rows={5}
          placeholder={STEPS[step].placeholder}
          className="input-field resize-none text-sm leading-relaxed"
          autoFocus
        />

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
              <ArrowLeft size={16} className="mr-1.5 inline" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!answers[step].trim()}
              className="btn-primary flex-1">
              Next <ArrowRight size={16} className="ml-1.5 inline" />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={generating || !answers[step].trim()}
              className="btn-gold flex-1 py-3 font-semibold flex items-center justify-center gap-2">
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating CV…</>
              ) : (
                <><Sparkles size={18} /> Generate My CV</>
              )}
            </button>
          )}
        </div>

        {/* Answers summary */}
        {answers.some(a => a.trim()) && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your answers so far</p>
            <div className="space-y-1.5">
              {STEPS.map((s, i) => answers[i].trim() && (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle size={14} className="text-brand-green flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 truncate">{s.title}: {answers[i].slice(0, 60)}…</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
