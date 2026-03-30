import React, { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import GearTagPicker from './GearTagPicker'
import { GearItem, GearTag } from '../../types'
import { gearApi } from '../../api/client'

interface GearItemEditorProps {
  item: GearItem | null
  availableTags: GearTag[]
  onSave: (item: GearItem) => void
  onClose: () => void
}

const DEFAULT_FORM = {
  name: '',
  description: '',
  notes: '',
  is_personal: false,
  is_food: false,
  serving_unit: '',
  quantity_formula: 'fixed' as const,
  base_quantity: 1,
}

export default function GearItemEditor({ item, availableTags, onSave, onClose }: GearItemEditorProps) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [selectedTags, setSelectedTags] = useState<GearTag[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description || '',
        notes: item.notes || '',
        is_personal: !!item.is_personal,
        is_food: !!item.is_food,
        serving_unit: item.serving_unit || '',
        quantity_formula: (item.quantity_formula as typeof DEFAULT_FORM.quantity_formula) || 'fixed',
        base_quantity: item.base_quantity || 1,
      })
      setSelectedTags(item.tags || [])
    } else {
      setForm(DEFAULT_FORM)
      setSelectedTags([])
    }
  }, [item])

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      let saved: GearItem
      if (item) {
        const r = await gearApi.updateItem(item.id, {
          name: form.name.trim(),
          description: form.description || null,
          notes: form.notes || null,
          is_personal: form.is_personal ? 1 : 0,
          is_food: form.is_food ? 1 : 0,
          serving_unit: form.serving_unit || null,
          quantity_formula: form.quantity_formula,
          base_quantity: form.base_quantity,
        })
        saved = r.item
        await gearApi.setItemTags(item.id, selectedTags.map(t => t.id))
        saved.tags = selectedTags
      } else {
        const r = await gearApi.createItem({
          name: form.name.trim(),
          description: form.description || null,
          notes: form.notes || null,
          is_personal: form.is_personal ? 1 : 0,
          is_food: form.is_food ? 1 : 0,
          serving_unit: form.serving_unit || null,
          quantity_formula: form.quantity_formula,
          base_quantity: form.base_quantity,
        })
        saved = r.item
        if (selectedTags.length > 0) {
          await gearApi.setItemTags(saved.id, selectedTags.map(t => t.id))
          saved.tags = selectedTags
        }
      }
      onSave(saved)
    } catch {
      setError('Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={item ? 'Edit Gear Item' : 'New Gear Item'}
      size="md"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium">
            {saving ? 'Saving…' : item ? 'Update' : 'Create'}
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
            placeholder="e.g. Sleeping Bag"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Optional"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Quantity formula</label>
            <select
              value={form.quantity_formula}
              onChange={e => setForm(p => ({ ...p, quantity_formula: e.target.value as typeof form.quantity_formula }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            >
              <option value="fixed">Fixed</option>
              <option value="per_night">Per night</option>
              <option value="per_person">Per person</option>
              <option value="per_person_per_night">Per person × per night</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Base quantity</label>
            <input
              type="number"
              min={1}
              value={form.base_quantity}
              onChange={e => setForm(p => ({ ...p, base_quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_personal}
              onChange={e => setForm(p => ({ ...p, is_personal: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Personal item <span className="text-xs text-slate-400">(one per person)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_food}
              onChange={e => setForm(p => ({ ...p, is_food: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Food item
          </label>
        </div>

        {form.is_food && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Serving unit</label>
            <input
              type="text"
              value={form.serving_unit}
              onChange={e => setForm(p => ({ ...p, serving_unit: e.target.value }))}
              placeholder="e.g. oz, lbs, cups, count"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
          </div>
        )}

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
