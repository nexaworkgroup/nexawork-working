import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { clsx } from 'clsx'

interface AutocompleteProps {
  label?: string
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  required?: boolean
}

function useDebounce(value: string, delay: number) {
  const [d, setD] = useState(value)
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
  return d
}

export function Autocomplete({ label, value, onChange, suggestions, placeholder, className, required }: AutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)
  const dq = useDebounce(query, 200)

  const filtered = dq.length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(dq.toLowerCase())).slice(0, 8)
    : suggestions.slice(0, 6)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className={clsx('relative', className)}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && ' *'}</label>}
      <div className="relative">
        <input value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="input-field pr-14"
          autoComplete="off"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {query && <button type="button" onClick={() => { onChange(''); setQuery(''); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
          <button type="button" onClick={() => setOpen(!open)} className="p-1 text-gray-400"><ChevronDown size={13} className={clsx('transition-transform', open && 'rotate-180')} /></button>
        </div>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {filtered.map((s, i) => (
            <button key={i} type="button" onMouseDown={() => { onChange(s); setQuery(s); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-green-light hover:text-brand-green transition-colors border-b border-gray-50 last:border-0">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export const UNIVERSITIES = [
  'University of Buea','University of Yaoundé I','University of Yaoundé II',
  'University of Douala','University of Dschang','University of Ngaoundéré',
  'University of Bamenda','University of Maroua','ENSP Yaoundé',
  'IUT Douala','IUT Ngaoundéré','ESSEC Douala','SUP\'PTIC Yaoundé',
  'Institut Catholique de Yaoundé','FMSB Yaoundé','IRIC Yaoundé',
  'University of Lagos','University of Ghana','University of Nairobi',
  'Makerere University','University of Cape Town','Université de Dakar'
]

export const LOCATIONS = [
  'Douala, Cameroun','Yaoundé, Cameroun','Bafoussam, Cameroun',
  'Bamenda, Cameroun','Garoua, Cameroun','Maroua, Cameroun',
  'Ngaoundéré, Cameroun','Buea, Cameroun','Kribi, Cameroun','Limbe, Cameroun',
  'Lagos, Nigeria','Abuja, Nigeria','Accra, Ghana','Nairobi, Kenya',
  'Dakar, Sénégal','Abidjan, Côte d\'Ivoire','Remote — Anywhere','Remote — Africa'
]

export const DEGREES = [
  'BSc','MSc','PhD','MBA','HND','BTS','Licence','Master',
  'BEng','MEng','BA','MA','DUT','Diplôme d\'Ingénieur','Doctorat'
]

export const FIELDS_OF_STUDY = [
  'Computer Science','Software Engineering','Information Technology',
  'Electrical Engineering','Mechanical Engineering','Civil Engineering',
  'Telecommunications','Business Administration','Finance','Accounting',
  'Marketing','Management','Economics','Law','Medicine','Pharmacy',
  'Nursing','Public Health','Agriculture','Education','Mathematics',
  'Data Science','Cybersecurity','Génie Logiciel','Informatique de Gestion'
]

export const INDUSTRIES = [
  'Technology','Finance & Banking','Telecommunications','Healthcare',
  'Education','Agriculture','Energy & Mining','Construction',
  'Retail & FMCG','Media & Entertainment','NGO & Development',
  'Government & Public Sector','Consulting','Manufacturing','Transport & Logistics'
]
