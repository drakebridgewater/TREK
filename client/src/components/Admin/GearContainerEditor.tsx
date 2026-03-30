import React, { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import GearTagPicker from './GearTagPicker'
import { GearContainer, GearTag } from '../../types'
import { gearApi } from '../../api/client'

interface GearContainerEditorProps {
  container: GearContainer | null
  availableTags: GearTag[]
  onSave: (container: GearContainer) => void
  onClose: () => void
}

const DEFAULT_FORM = {
  name: '',
  description: '',
  capacity_notes: '',
  is_personal: false,
}

export default function GearContainerEditor({ container, availableTags, onSave, onClose }: GearContainerEditorProps) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedTags, setSelectedTags] = useState<GearTag[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (container) {
      setForm({
        name: container.name,
        description: container.description || '',
        capacity_notes: container.capacity_notes || '',
        is_personal: !!container.is_personal,
      })
      setSelectedTags(container.tags || [])
    } else {
      setForm(DEFAULT_FORM)
      setSelectedTags([])
    }
  }, [container])

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      let saved: GearContainer
      if (container) {
        const r = await gearApi.updateContainer(container.id, {
          name: form.name.trim(),
          description: form.description || null,
          capacity_notes: form.capacity_notes || null,
          is_personal: form.is_personal ? 1 : 0,
        })
        saved = r.container
        await gearApi.setContainerTags(container.id, selectedTags.map(t => t.id))
        saved.tags = selectedTags
      } else {
        const r = await gearApi.createContainer({
          name: form.name.trim(),
          description: form.description || null,
          capacity_notes: form.capacity_notes || null,
          is_personal: form.is_personal ? 1 : 0,
        })
        saved = r.container
        if (selectedTags.length > 0) {
          await gearApi.setContainerTags(saved.id, selectedTags.map(t => t.id))
          saved.tags = selectedTags
        }
      }
      onSave(saved)
    } catch {
      setError('Failed to save container')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={container ? 'Edit Container' : 'New Container'}
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium">
            {saving ? 'Saving…' : container ? 'Update' : 'Create'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. 60L Backpack"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Optional"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Capacity notes</label>
          <input
            type="text"
            value={form.capacity_notes}
            onChange={e => setForm(p => ({ ...p, capacity_notes: e.target.value }))}
            placeholder="e.g. 60L, max 20kg"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_personal}
            onChange={e => setForm(p => ({ ...p, is_personal: e.target.checked }))}
            className="rounded border-gray-300"
          />
          Personal container <span className="text-xs text-slate-400">(one instance per person in the trip)</span>
        </label>

        <div className="pt-2 border-t border-gray-100">
          <GearTagPicker
            selectedTags={selectedTags}
            availableTags={availableTags}
            onChange={setSelectedTags}
          />
        </div>
      </div>
    </Modal>
  )
}
