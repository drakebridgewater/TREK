import React, { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import GearTagPicker from './GearTagPicker'
import { GearVehicle, GearTag } from '../../types'
import { gearApi } from '../../api/client'

interface GearVehicleEditorProps {
  vehicle: GearVehicle | null
  availableTags: GearTag[]
  onSave: (vehicle: GearVehicle) => void
  onClose: () => void
}

export default function GearVehicleEditor({ vehicle, availableTags, onSave, onClose }: GearVehicleEditorProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<GearTag[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (vehicle) {
      setName(vehicle.name)
      setDescription(vehicle.description || '')
      setSelectedTags(vehicle.tags || [])
    } else {
      setName('')
      setDescription('')
      setSelectedTags([])
    }
  }, [vehicle])

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      let saved: GearVehicle
      if (vehicle) {
        const r = await gearApi.updateVehicle(vehicle.id, { name: name.trim(), description: description || null })
        saved = r.vehicle
        await gearApi.setVehicleTags(vehicle.id, selectedTags.map(t => t.id))
        saved.tags = selectedTags
      } else {
        const r = await gearApi.createVehicle({ name: name.trim(), description: description || null })
        saved = r.vehicle
        if (selectedTags.length > 0) {
          await gearApi.setVehicleTags(saved.id, selectedTags.map(t => t.id))
          saved.tags = selectedTags
        }
      }
      onSave(saved)
    } catch {
      setError('Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={vehicle ? 'Edit Vehicle' : 'New Vehicle'}
      size="sm"
      footer={
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium">
            {saving ? 'Saving…' : vehicle ? 'Update' : 'Create'}
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
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Family SUV"
            autoFocus
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
          />
        </div>

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
