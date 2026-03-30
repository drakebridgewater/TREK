import React, { useState } from 'react'
import { List, LayoutGrid, Loader2 } from 'lucide-react'
import { tripsApi } from '../../api/client'

interface Props {
  tripId: number
  mode: 'simple' | 'full'
  onChange: (mode: 'simple' | 'full') => void
}

export default function PackingModeToggle({ tripId, mode, onChange }: Props) {
  const [saving, setSaving] = useState(false)

  const handleSwitch = async (newMode: 'simple' | 'full') => {
    if (newMode === mode || saving) return
    setSaving(true)
    try {
      await tripsApi.update(tripId, { packing_mode: newMode })
      onChange(newMode)
    } catch {
      alert('Failed to switch packing mode')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
      <button
        onClick={() => handleSwitch('simple')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          mode === 'simple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <List className="w-4 h-4" />
        Checklist
      </button>
      <button
        onClick={() => handleSwitch('full')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          mode === 'full' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        Full Plan
        {saving && mode !== 'full' && <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />}
      </button>
    </div>
  )
}
