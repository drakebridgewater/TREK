import React, { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, Check, X, Loader2 } from 'lucide-react'
import { TripGuest } from '../../types'
import { packingPlanApi, tripsApi } from '../../api/client'

interface TripMemberInfo {
  id: number
  username: string
  avatar_url?: string | null
}

interface Props {
  tripId: number
  partySizeOverride: number | null
  members: TripMemberInfo[]
  onPartySizeChange: (size: number | null) => void
}

interface GuestForm {
  name: string
  days_present: number
  meals_count: number
  notes: string
}

const emptyForm: GuestForm = { name: '', days_present: 1, meals_count: 0, notes: '' }

export default function PartyAndGuestsPanel({ tripId, partySizeOverride, members, onPartySizeChange }: Props) {
  const [guests, setGuests] = useState<TripGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGuest, setEditingGuest] = useState<TripGuest | null | undefined>(undefined)
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyForm)
  const [savingGuest, setSavingGuest] = useState(false)

  const [editingPartySize, setEditingPartySize] = useState(false)
  const [partySizeInput, setPartySizeInput] = useState<string>(partySizeOverride?.toString() || '')
  const [savingPartySize, setSavingPartySize] = useState(false)

  useEffect(() => {
    packingPlanApi.listGuests(tripId)
      .then(r => setGuests(r.guests || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tripId])

  const resolvedPartySize = partySizeOverride ?? members.length

  const handleSavePartySize = async () => {
    setSavingPartySize(true)
    try {
      const val = partySizeInput.trim() === '' ? null : parseInt(partySizeInput)
      if (val !== null && (isNaN(val) || val < 1)) return
      await tripsApi.update(tripId, { party_size: val })
      onPartySizeChange(val)
      setEditingPartySize(false)
    } catch {
      alert('Failed to update party size')
    } finally {
      setSavingPartySize(false)
    }
  }

  const openGuestEditor = (guest: TripGuest | null) => {
    setEditingGuest(guest)
    setGuestForm(
      guest
        ? { name: guest.name, days_present: guest.days_present, meals_count: guest.meals_count, notes: guest.notes || '' }
        : emptyForm
    )
  }

  const handleSaveGuest = async () => {
    if (!guestForm.name.trim()) return
    setSavingGuest(true)
    try {
      const payload = {
        name: guestForm.name.trim(),
        days_present: guestForm.days_present,
        meals_count: guestForm.meals_count,
        notes: guestForm.notes.trim() || null,
      }
      if (editingGuest) {
        const r = await packingPlanApi.updateGuest(tripId, editingGuest.id, payload)
        setGuests(p => p.map(g => g.id === editingGuest.id ? r.guest : g))
      } else {
        const r = await packingPlanApi.addGuest(tripId, payload)
        setGuests(p => [...p, r.guest])
      }
      setEditingGuest(undefined)
    } catch {
      alert('Failed to save guest')
    } finally {
      setSavingGuest(false)
    }
  }

  const handleDeleteGuest = async (id: number) => {
    if (!confirm('Remove this guest?')) return
    try {
      await packingPlanApi.removeGuest(tripId, id)
      setGuests(p => p.filter(g => g.id !== id))
    } catch {
      alert('Failed to remove guest')
    }
  }

  return (
    <div className="space-y-5">
      {/* Party size */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-medium text-slate-700">Party Size</h4>
          </div>
          {!editingPartySize && (
            <button
              onClick={() => {
                setPartySizeInput(partySizeOverride?.toString() || '')
                setEditingPartySize(true)
              }}
              className="text-xs text-slate-400 hover:text-slate-700 underline"
            >
              {partySizeOverride ? 'Change' : 'Override'}
            </button>
          )}
        </div>

        {editingPartySize ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={partySizeInput}
              onChange={e => setPartySizeInput(e.target.value)}
              placeholder={`Auto (${members.length})`}
              autoFocus
              className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            <button
              onClick={handleSavePartySize}
              disabled={savingPartySize}
              className="p-1.5 text-white bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-60"
            >
              {savingPartySize ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditingPartySize(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-800">
            <span className="font-semibold text-lg">{resolvedPartySize}</span>
            <span className="text-slate-400 ml-1.5 text-xs">
              {partySizeOverride ? 'manual override' : `auto · ${members.length} member${members.length !== 1 ? 's' : ''}`}
            </span>
            {partySizeOverride && (
              <button
                onClick={async () => {
                  await tripsApi.update(tripId, { party_size: null })
                  onPartySizeChange(null)
                }}
                className="ml-3 text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Reset to auto
              </button>
            )}
          </div>
        )}

        {/* Members pill list */}
        {members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {members.map(m => (
              <span key={m.id} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {m.username}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Guests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-slate-700">
            Guests
            <span className="ml-1.5 text-xs font-normal text-slate-400">informational · does not affect quantities</span>
          </h4>
          <button
            onClick={() => openGuestEditor(null)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg px-2 py-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add guest
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
          </div>
        ) : guests.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-gray-100 rounded-xl">
            No guests. Add guests to track how many days/meals they'll attend.
          </p>
        ) : (
          <div className="space-y-2">
            {guests.map(guest => (
              <div key={guest.id} className="flex items-start gap-3 p-3 border border-gray-100 rounded-xl group">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{guest.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {guest.days_present} day{guest.days_present !== 1 ? 's' : ''} · {guest.meals_count} meal{guest.meals_count !== 1 ? 's' : ''}
                    {guest.notes && ` · ${guest.notes}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openGuestEditor(guest)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteGuest(guest.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guest editor inline panel */}
      {editingGuest !== undefined && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <h5 className="text-sm font-medium text-slate-700">{editingGuest ? 'Edit Guest' : 'Add Guest'}</h5>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Name *</label>
            <input
              type="text"
              value={guestForm.name}
              onChange={e => setGuestForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Guest name"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Days present</label>
              <input
                type="number"
                min={1}
                value={guestForm.days_present}
                onChange={e => setGuestForm(p => ({ ...p, days_present: Math.max(1, parseInt(e.target.value) || 1) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Meals count</label>
              <input
                type="number"
                min={0}
                value={guestForm.meals_count}
                onChange={e => setGuestForm(p => ({ ...p, meals_count: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Notes</label>
            <input
              type="text"
              value={guestForm.notes}
              onChange={e => setGuestForm(p => ({ ...p, notes: e.target.value }))}
              placeholder="Optional notes"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditingGuest(undefined)} className="px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100">
              Cancel
            </button>
            <button
              onClick={handleSaveGuest}
              disabled={savingGuest || !guestForm.name.trim()}
              className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium"
            >
              {savingGuest ? 'Saving…' : editingGuest ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
