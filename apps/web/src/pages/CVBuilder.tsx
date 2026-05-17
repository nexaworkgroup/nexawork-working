import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Download, ArrowLeft, ArrowRight, CheckCircle, Sparkles, Printer } from 'lucide-react'
import { api } from '../lib/api'
import { useAuthStore } from '../store/authStore'

const STEPS = [
  { title: 'Personal Info', placeholder: 'Full name, email, phone, city\nExample: Marie Kotto | marie@email.com | +237 6XX XXX XXX | Douala, Cameroon' },
  { title: 'Education', placeholder: 'Degree, institution, year, achievements\nExample: BSc Computer Science, University of Buea, 2024. GPA 3.8/4.0. Dean\'s List 2022-2024.' },
  { title: 'Skills & Tools', placeholder: 'Technical and soft skills\nExample: React, Node.js, Python, SQL, Git, Agile, Communication, Leadership, Problem Solving' },
  { title: 'Experience & Projects', placeholder: 'Projects, internships, work experience\nExample: Built a food delivery platform with 200+ users. Interned at MTN Cameroon — optimized backend queries reducing load time by 40%.' },
  { title: 'Career Objective', placeholder: 'Role you\'re targeting and why\nExample: Motivated Computer Science graduate seeking a Junior Software Engineer role at a tech company in Cameroon or remotely, passionate about building impactful digital solutions for Africa.' },
]

const PRINT_STYLES = `
  @media print {
    body { margin: 0; padding: 20px; font-family: Arial, sans-serif; color: #111; }
    .no-print { display: none !important; }
    h1 { color: #1A7A4A; border-bottom: 2px solid #E8B84B; padding-bottom: 6px; margin-bottom: 16px; }
    h2 { color: #1A7A4A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 20px; margin-bottom: 8px; border-left: 3px solid #E8B84B; padding-left: 8px; }
    p, li { font-size: 13px; line-height: 1.6; }
    ul { padding-left: 20px; }
    .contact-info { color: #555; font-size: 13px; }
    a { color: #1A7A4A; }
    @page { margin: 1.5cm; }
  }
  body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #333; line-height: 1.6; }
  h1 { color: #1A7A4A; border-bottom: 2px solid #E8B84B; padding-bottom: 8px; margin-bottom: 16px; font-size: 26px; }
  h2 { color: #1A7A4A; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 24px; margin-bottom: 10px; border-left: 3px solid #E8B84B; padding-left: 10px; }
  p { font-size: 14px; margin: 6px 0; }
  ul { padding-left: 20px; }
  li { font-size: 14px; margin: 4px 0; }
  .contact-info { color: #666; font-size: 13px; margin-bottom: 20px; }
`

export default function CVBuilderPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState(() => [
    `${(profile as any)?.full_name || ''} | ${(profile as any)?.location || ''}`.trim().replace(/^\||\|$/g, '').trim(),
    `${(profile as any)?.degree || ''} ${(profile as any)?.field_of_study || ''}, ${(profile as any)?.institution || ''}, ${(profile as any)?.graduation_year || ''}`.trim(),
    '', '', ''
  ])
  const [generating, setGenerating] = useState(false)
  const [cvHtml, setCvHtml] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const update = (val: string) => setAnswers(prev => { const a = [...prev]; a[step] = val; return a })

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await api.post('/ai/generate-cv', { answers })
      setCvHtml(res.data.cv_html)
      setDone(true)
    } catch (e: any) {
      setError(e.message || 'Failed to generate CV. Please check your internet connection and try again.')
    }
    setGenerating(false)
  }

  const handleDownloadHTML = () => {
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>My CV</title><style>${PRINT_STYLES}</style></head><body>${cvHtml}</body></html>`], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'NexaWork_CV.html'; a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>My CV</title><style>${PRINT_STYLES}</style></head><body>${cvHtml}</body></html>`)
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  if (done && cvHtml) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your CV is Ready! 🎉</h1>
            <p className="text-gray-400 text-sm mt-0.5">Review it below and save when ready</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setDone(false); setStep(0) }} className="btn-secondary text-sm px-3 py-2">
              <ArrowLeft size={14} className="inline mr-1" /> Edit
            </button>
            <button onClick={handlePrint}
              className="btn-secondary text-sm px-3 py-2 flex items-center gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50">
              <Printer size={15} /> Print / PDF
            </button>
            <button onClick={handleDownloadHTML} className="btn-primary text-sm px-3 py-2 flex items-center gap-1.5">
              <Download size={15} /> Download HTML
            </button>
          </div>
        </div>

        {/* PDF tip */}
        <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-xl text-sm text-purple-700 flex items-start gap-2">
          <Printer size={16} className="flex-shrink-0 mt-0.5" />
          <span><strong>Save as PDF:</strong> Click "Print / PDF" → In the print dialog, choose "Save as PDF" as the destination → Save</span>
        </div>

        {/* CV Preview */}
        <div className="card overflow-hidden">
          <div className="bg-brand-green-light px-4 py-2.5 flex items-center gap-2 border-b border-brand-green/10">
            <FileText size={15} className="text-brand-green" />
            <span className="text-sm font-medium text-brand-green">CV Preview</span>
            <span className="ml-auto text-xs text-gray-400">AI-generated · ATS optimised</span>
          </div>
          <div
            className="p-6 sm:p-10 prose prose-sm max-w-none"
            style={{ fontFamily: 'Arial, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: cvHtml }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-green mb-6 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-green-light rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-brand-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI CV Builder</h1>
          <p className="text-gray-400 text-sm">5 questions → professional CV in seconds</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-brand-green' : 'bg-gray-200'}`} />
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
          <span className="flex-shrink-0">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <div className="card">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 bg-brand-green text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
            {step + 1}
          </div>
          <h2 className="text-lg font-bold text-gray-900">{STEPS[step].title}</h2>
        </div>
        <p className="text-xs text-gray-400 mb-4 ml-9">Step {step + 1} of {STEPS.length}</p>

        <textarea
          value={answers[step]}
          onChange={e => update(e.target.value)}
          rows={5}
          placeholder={STEPS[step].placeholder}
          className="input-field resize-none text-sm leading-relaxed"
          autoFocus
        />

        <div className="flex gap-3 mt-5">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">
              <ArrowLeft size={15} className="inline mr-1" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!answers[step].trim()} className="btn-primary flex-1">
              Next <ArrowRight size={15} className="inline ml-1" />
            </button>
          ) : (
            <button onClick={handleGenerate} disabled={generating || !answers[step].trim()}
              className="btn-gold flex-1 py-3 font-semibold flex items-center justify-center gap-2">
              {generating
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                : <><Sparkles size={17} />Generate My CV</>}
            </button>
          )}
        </div>

        {/* Progress summary */}
        {answers.some(a => a.trim()) && (
          <div className="mt-5 pt-4 border-t border-gray-100 space-y-1.5">
            {STEPS.map((s, i) => answers[i].trim() && (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle size={13} className="text-brand-green flex-shrink-0" />
                <p className="text-xs text-gray-500 truncate">
                  <span className="font-medium">{s.title}:</span> {answers[i].slice(0, 55)}{answers[i].length > 55 ? '…' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
