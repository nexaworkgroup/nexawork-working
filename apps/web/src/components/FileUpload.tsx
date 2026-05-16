import { useState, useRef } from 'react'
import { Upload, X, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { clsx } from 'clsx'

interface Props {
  type: 'avatar' | 'cv'
  currentUrl?: string | null
  onUpload: (url: string) => void
}

export default function FileUpload({ type, currentUrl, onUpload }: Props) {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAvatar = type === 'avatar'
  const accept = isAvatar ? 'image/jpeg,image/png,image/webp' : 'application/pdf,.doc,.docx'
  const maxMB = isAvatar ? 2 : 5
  const bucket = 'nexawork-files'

  const handleFile = async (file: File) => {
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File too large. Max ${maxMB}MB.`)
      return
    }

    setUploading(true)
    setDone(false)

    try {
      const ext = file.name.split('.').pop()
      const path = `${user!.id}/${type}-${Date.now()}.${ext}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      if (isAvatar) setPreview(publicUrl)
      onUpload(publicUrl)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch (e: any) {
      console.error('Upload failed:', e.message)
      alert('Upload failed: ' + e.message)
    }

    setUploading(false)
  }

  return (
    <div>
      {isAvatar ? (
        // Avatar upload — circle preview
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-brand-green flex items-center justify-center">
              {preview ? (
                <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader size={20} className="text-white animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button type="button" onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
              <Upload size={13} /> {preview ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to {maxMB}MB</p>
            {done && <p className="text-xs text-brand-green flex items-center gap-1 mt-1"><CheckCircle size={12} /> Uploaded!</p>}
          </div>
        </div>
      ) : (
        // CV upload — drag area
        <div
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
            uploading ? 'border-brand-green bg-brand-green-light' : 'border-gray-200 hover:border-brand-green hover:bg-brand-green-light/30'
          )}>
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader size={24} className="text-brand-green animate-spin" />
              <p className="text-sm text-brand-green font-medium">Uploading…</p>
            </div>
          ) : done ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle size={24} className="text-brand-green" />
              <p className="text-sm text-brand-green font-medium">CV uploaded successfully!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                {currentUrl ? 'Replace your CV' : 'Upload your CV'}
              </p>
              <p className="text-xs text-gray-400">PDF, DOC, DOCX up to {maxMB}MB</p>
            </div>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}
