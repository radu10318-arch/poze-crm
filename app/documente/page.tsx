'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { PageHeader } from '@/components/ui/PageHeader'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'
import type { Document } from '@/types'
import { Upload, FileText, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface DocWithClient extends Document {
  clients: { full_name: string } | null
}

export default function DocumentePage() {
  const [docs, setDocs] = useState<DocWithClient[]>([])
  const [uploading, setUploading] = useState(false)
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [docType, setDocType] = useState<'contract' | 'alt_document'>('contract')
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('documents').select('*, clients(full_name)').order('uploaded_at', { ascending: false })
      .then(({ data }) => setDocs((data ?? []) as DocWithClient[]))
    supabase.from('clients').select('id, full_name').order('full_name')
      .then(({ data }) => setClients(data ?? []))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedClient) { toast.error('Selecteaza un client si un fisier'); return }
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${selectedClient}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from('documents').upload(path, file)
    if (uploadError) { toast.error('Eroare upload: ' + uploadError.message); setUploading(false); return }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)

    const { data: doc } = await supabase.from('documents').insert({
      client_id: selectedClient,
      file_name: file.name,
      file_url: urlData.publicUrl,
      document_type: docType,
      user_id: user!.id,
    }).select('*, clients(full_name)').single()

    if (doc) setDocs(prev => [doc as DocWithClient, ...prev])
    toast.success('Document incarcat')
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function deleteDoc(docId: string) {
    if (!confirm('Stergi documentul?')) return
    await supabase.from('documents').delete().eq('id', docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
    toast.success('Document sters')
  }

  return (
    <div>
      <PageHeader title="Documente" subtitle="Contracte si fisiere per client" />
      <div className="p-6 space-y-5">
        <div className="card space-y-4">
          <p className="section-title">Incarca document nou</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Client</label>
              <select className="input" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="">Selecteaza client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tip document</label>
              <select className="input" value={docType} onChange={e => setDocType(e.target.value as 'contract' | 'alt_document')}>
                <option value="contract">Contract</option>
                <option value="alt_document">Alt document</option>
              </select>
            </div>
          </div>
          <div>
            <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
            <label htmlFor="file-upload"
              className={`flex items-center justify-center gap-2 w-full py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                uploading ? 'border-stone-200 text-stone-300' : 'border-stone-300 text-stone-500 hover:border-brand-gold hover:text-brand-gold'
              }`}>
              <Upload size={18} />
              <span className="text-sm">{uploading ? 'Se incarca...' : 'Click sa selectezi fisierul (PDF, DOC, imagine)'}</span>
            </label>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Fisier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide hidden md:table-cell">Tip</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Data</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-stone-400 uppercase tracking-wide">Actiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {!docs.length && (
                <tr><td colSpan={5} className="text-center py-12 text-stone-400 text-sm">Niciun document incarcat.</td></tr>
              )}
              {docs.map(doc => (
                <tr key={doc.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-stone-400 flex-shrink-0" />
                      <span className="text-sm text-stone-700 truncate max-w-[200px]">{doc.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar name={doc.clients?.full_name ?? '?'} size="sm" />
                      <span className="text-sm text-stone-600">{doc.clients?.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`badge ${doc.document_type === 'contract' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                      {doc.document_type === 'contract' ? 'Contract' : 'Document'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">{formatDate(doc.uploaded_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="text-brand-gold hover:text-brand-brown">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => deleteDoc(doc.id)} className="text-stone-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
