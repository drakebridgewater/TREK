import React, { useState, useEffect, useCallback } from 'react'
import {
  Car, LayoutTemplate, Users, Wand2, RefreshCw, Plus, Trash2, Check,
  Loader2, Package, Box, ChevronDown, X, Utensils
} from 'lucide-react'
import { TripPackingPlan, TripPlanContainer, TripPlanItem, GearVehicle, GearTemplate } from '../../types'
import { packingPlanApi } from '../../api/client'
import { useGearStore } from '../../store/gearStore'
import PartyAndGuestsPanel from './PartyAndGuestsPanel'

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

// ─── Plan item row ─────────────────────────────────────────────────────────────
function PlanItemRow({
  item,
  containers,
  tripId,
  onUpdate,
  onDelete,
  onMove,
}: {
  item: TripPlanItem
  containers: TripPlanContainer[]
  tripId: number
  onUpdate: (updated: TripPlanItem) => void
  onDelete: (id: number) => void
  onMove: (itemId: number, containerId: number | null) => void
}) {
  const [showMove, setShowMove] = useState(false)

  const toggle = async () => {
    try {
      const r = await packingPlanApi.updateItem(tripId, item.id, { checked: item.checked ? 0 : 1 })
      onUpdate(r.item)
    } catch {}
  }

  const handleDelete = async () => {
    try {
      await packingPlanApi.removeItem(tripId, item.id)
      onDelete(item.id)
    } catch { alert('Failed to remove item') }
  }

  return (
    <div className="flex items-center gap-2 py-1 group/pitem">
      <button
        onClick={toggle}
        className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
          item.checked ? 'bg-slate-800 border-slate-800' : 'border-gray-300 hover:border-slate-400'
        }`}
      >
        {!!item.checked && <Check className="w-2.5 h-2.5 text-white" />}
      </button>
      <span className={`flex-1 text-sm truncate ${item.checked ? 'line-through text-slate-400' : 'text-slate-800'}`}>
        {item.name}
      </span>
      <span className="text-xs text-slate-400 flex-shrink-0">×{item.quantity}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover/pitem:opacity-100 flex-shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowMove(s => !s)}
            className="p-1 text-slate-300 hover:text-slate-600 rounded"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          {showMove && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
              <button
                onClick={() => { onMove(item.id, null); setShowMove(false) }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                Unassigned
              </button>
              {containers.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onMove(item.id, c.id); setShowMove(false) }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 ${item.container_id === c.id ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={handleDelete} className="p-1 text-slate-300 hover:text-red-500 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Plan container card ───────────────────────────────────────────────────────
function PlanContainerCard({
  container,
  allContainers,
  tripId,
  onItemUpdate,
  onItemDelete,
  onItemMove,
  onDeleteContainer,
}: {
  container: TripPlanContainer
  allContainers: TripPlanContainer[]
  tripId: number
  onItemUpdate: (containerId: number, item: TripPlanItem) => void
  onItemDelete: (containerId: number, itemId: number) => void
  onItemMove: (itemId: number, fromContainerId: number | null, toContainerId: number | null) => void
  onDeleteContainer: (id: number) => void
}) {
  const items = container.items || []
  const checkedCount = items.filter(i => i.checked).length

  const handleDelete = async () => {
    if (!confirm(`Remove container "${container.name}"? Items will become unassigned.`)) return
    try {
      await packingPlanApi.removeContainer(tripId, container.id)
      onDeleteContainer(container.id)
    } catch { alert('Failed to remove container') }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-gray-100">
        <Box className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm text-slate-800">{container.name}</span>
          {container.person_label && (
            <span className="ml-2 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">{container.person_label}</span>
          )}
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0">{checkedCount}/{items.length}</span>
        <button onClick={handleDelete} className="p-1 text-slate-300 hover:text-red-500 rounded flex-shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-3 py-2 min-h-[40px]">
        {items.length === 0 && (
          <p className="text-xs text-slate-300 italic py-1">Empty</p>
        )}
        {items.map(item => (
          <PlanItemRow
            key={item.id}
            item={item}
            containers={allContainers}
            tripId={tripId}
            onUpdate={updated => onItemUpdate(container.id, updated)}
            onDelete={id => onItemDelete(container.id, id)}
            onMove={(itemId, toContainerId) => onItemMove(itemId, container.id, toContainerId)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Add item inline form ─────────────────────────────────────────────────────
function AddItemForm({
  tripId,
  containerId,
  onAdd,
  onCancel,
}: {
  tripId: number
  containerId: number | null
  onAdd: (item: TripPlanItem) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const r = await packingPlanApi.addItem(tripId, {
        custom_name: name.trim(),
        quantity: qty,
        container_id: containerId,
        container_override: containerId ? 1 : 0,
      })
      onAdd(r.item)
      setName(''); setQty(1)
    } catch { alert('Failed to add item') }
    finally { setSaving(false) }
  }

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Item name…"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel() }}
        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400 min-w-0"
      />
      <input
        type="number"
        min={1}
        value={qty}
        onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-14 text-sm border border-gray-200 rounded-lg px-2 py-1.5 text-center"
      />
      <button onClick={handleAdd} disabled={saving || !name.trim()} className="p-2 bg-slate-800 text-white rounded-lg disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Template selector ─────────────────────────────────────────────────────────
function TemplateSelectorModal({
  templates,
  tripId,
  onApplied,
  onClose,
}: {
  templates: GearTemplate[]
  tripId: number
  onApplied: () => void
  onClose: () => void
}) {
  const [applying, setApplying] = useState<number | null>(null)

  const apply = async (templateId: number) => {
    setApplying(templateId)
    try {
      await packingPlanApi.applyTemplate(tripId, templateId)
      onApplied()
    } catch {
      alert('Failed to apply template')
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-900">Apply Template</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {templates.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">No templates available. Create templates in the Admin → Gear Library.</p>
          )}
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200">
              <LayoutTemplate className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-400">{t.item_count ?? 0} items · {t.container_count ?? 0} containers</p>
              </div>
              <button
                onClick={() => apply(t.id)}
                disabled={applying !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium disabled:opacity-60"
              >
                {applying === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Apply
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Auto-assign preview modal ─────────────────────────────────────────────────
function AutoAssignModal({
  tripId,
  containers,
  items,
  onApplied,
  onClose,
}: {
  tripId: number
  containers: TripPlanContainer[]
  items: TripPlanItem[]
  onApplied: () => void
  onClose: () => void
}) {
  const [preview, setPreview] = useState<{ item_id: number; proposed_container_id: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    packingPlanApi.previewAutoAssign(tripId)
      .then(r => setPreview(r.assignments || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tripId])

  const containerName = (id: number | null) => {
    if (!id) return 'Unassigned'
    return containers.find(c => c.id === id)?.name || `Container #${id}`
  }

  const itemName = (id: number) => {
    const flat = containers.flatMap(c => c.items || []).concat(items)
    return flat.find(i => i.id === id)?.name || `Item #${id}`
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await packingPlanApi.applyAutoAssign(tripId)
      onApplied()
    } catch {
      alert('Failed to apply auto-assign')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-slate-900">Auto-Assign Preview</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : preview.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No assignments to suggest. Make sure items and containers have matching tags.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {preview.map(p => (
                <div key={p.item_id} className="flex items-center gap-2 text-sm py-1">
                  <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-slate-700">{itemName(p.item_id)}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-slate-600 text-xs">{containerName(p.proposed_container_id)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {!loading && preview.length > 0 && (
          <div className="px-5 pb-4 flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium"
            >
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Apply
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main PackingPlanPanel ─────────────────────────────────────────────────────
export default function PackingPlanPanel({ tripId, partySizeOverride, members, onPartySizeChange }: Props) {
  const [plan, setPlan] = useState<TripPackingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unassigned, setUnassigned] = useState<TripPlanItem[]>([])

  // Sidebar panels
  const [showParty, setShowParty] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAutoAssign, setShowAutoAssign] = useState(false)
  const [addingToContainer, setAddingToContainer] = useState<number | null | false>(false)
  const [syncingFood, setSyncingFood] = useState(false)
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number } | null>(null)

  const { templates, loaded: gearLoaded, loadGear } = useGearStore()

  useEffect(() => {
    if (!gearLoaded) loadGear()
  }, [gearLoaded, loadGear])

  const loadPlan = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Init plan if not exists (idempotent)
      await packingPlanApi.init(tripId)
      const r = await packingPlanApi.get(tripId)
      setPlan(r.plan)
      setUnassigned(r.plan?.unassigned_items || [])
    } catch {
      setError('Failed to load packing plan')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { loadPlan() }, [loadPlan])

  const containers = plan?.containers || []
  const vehicleDirect = plan?.vehicle_direct_items || []

  // ── Item helpers ──────────────────────────────────────────────────────────
  const handleItemUpdate = (containerId: number, updated: TripPlanItem) => {
    setPlan(p => {
      if (!p) return p
      return {
        ...p,
        containers: p.containers?.map(c =>
          c.id === containerId
            ? { ...c, items: (c.items || []).map(i => i.id === updated.id ? updated : i) }
            : c
        ) || [],
      }
    })
  }

  const handleUnassignedUpdate = (updated: TripPlanItem) => {
    setUnassigned(p => p.map(i => i.id === updated.id ? updated : i))
  }

  const handleItemDelete = (containerId: number | null, itemId: number) => {
    if (containerId === null) {
      setUnassigned(p => p.filter(i => i.id !== itemId))
    } else {
      setPlan(p => {
        if (!p) return p
        return {
          ...p,
          containers: p.containers?.map(c =>
            c.id === containerId
              ? { ...c, items: (c.items || []).filter(i => i.id !== itemId) }
              : c
          ) || [],
        }
      })
    }
  }

  const handleItemMove = async (itemId: number, fromContainerId: number | null, toContainerId: number | null) => {
    try {
      const r = await packingPlanApi.updateItem(tripId, itemId, {
        container_id: toContainerId,
        container_override: 1,
      })
      const updated: TripPlanItem = r.item
      // Remove from source
      handleItemDelete(fromContainerId, itemId)
      // Add to destination
      if (toContainerId === null) {
        setUnassigned(p => [...p, updated])
      } else {
        setPlan(p => {
          if (!p) return p
          return {
            ...p,
            containers: p.containers?.map(c =>
              c.id === toContainerId ? { ...c, items: [...(c.items || []), updated] } : c
            ) || [],
          }
        })
      }
    } catch { alert('Failed to move item') }
  }

  const handleContainerDelete = (id: number) => {
    setPlan(p => {
      if (!p) return p
      const deleted = p.containers?.find(c => c.id === id)
      if (deleted?.items) setUnassigned(prev => [...prev, ...deleted.items!])
      return { ...p, containers: p.containers?.filter(c => c.id !== id) || [] }
    })
  }

  const handleSyncFood = async () => {
    setSyncingFood(true)
    setSyncResult(null)
    try {
      const r = await packingPlanApi.syncFood(tripId)
      setSyncResult({ added: r.added, updated: r.updated })
      // Reload plan to show new/updated items
      await loadPlan()
    } catch { alert('Failed to sync food') }
    finally { setSyncingFood(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm">
        {error}
        <button onClick={loadPlan} className="ml-auto underline text-xs">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Vehicle */}
        <VehicleSelector
          tripId={tripId}
          currentVehicle={plan?.vehicle || null}
          onChange={vehicle => setPlan(p => p ? { ...p, vehicle } : p)}
        />

        {/* Template */}
        <button
          onClick={() => setShowTemplates(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          <LayoutTemplate className="w-4 h-4" /> Apply Template
        </button>

        {/* Party */}
        <button
          onClick={() => setShowParty(s => !s)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 border rounded-lg text-slate-600 transition-colors ${
            showParty ? 'bg-slate-900 text-white border-slate-900' : 'border-gray-200 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Party {partySizeOverride !== null ? `(${partySizeOverride})` : `(${members.length})`}
        </button>

        {/* Auto-assign */}
        <button
          onClick={() => setShowAutoAssign(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          <Wand2 className="w-4 h-4" /> Auto-assign
        </button>

        {/* Sync food */}
        <button
          onClick={handleSyncFood}
          disabled={syncingFood}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-60"
        >
          {syncingFood ? <Loader2 className="w-4 h-4 animate-spin" /> : <Utensils className="w-4 h-4" />}
          Sync Food
        </button>

        {/* Add item (unassigned) */}
        <button
          onClick={() => setAddingToContainer(null)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-700 ml-auto"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Sync food result */}
      {syncResult && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
          <Check className="w-4 h-4 flex-shrink-0" />
          Synced: {syncResult.added} added, {syncResult.updated} updated
          <button onClick={() => setSyncResult(null)} className="ml-auto text-green-500 hover:text-green-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Party panel */}
      {showParty && (
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <PartyAndGuestsPanel
            tripId={tripId}
            partySizeOverride={partySizeOverride}
            members={members}
            onPartySizeChange={onPartySizeChange}
          />
        </div>
      )}

      {/* Containers grid */}
      {containers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {containers.map(container => (
            <PlanContainerCard
              key={container.id}
              container={container}
              allContainers={containers}
              tripId={tripId}
              onItemUpdate={handleItemUpdate}
              onItemDelete={handleItemDelete}
              onItemMove={handleItemMove}
              onDeleteContainer={handleContainerDelete}
            />
          ))}
        </div>
      )}

      {/* Vehicle direct items */}
      {vehicleDirect.length > 0 && (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-b border-gray-100">
            <Car className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-sm text-slate-800">Directly in Vehicle</span>
            <span className="text-xs text-slate-400">{vehicleDirect.length} items</span>
          </div>
          <div className="px-3 py-2">
            {vehicleDirect.map(item => (
              <PlanItemRow
                key={item.id}
                item={item}
                containers={containers}
                tripId={tripId}
                onUpdate={handleUnassignedUpdate}
                onDelete={id => setPlan(p => p ? { ...p, vehicle_direct_items: (p.vehicle_direct_items || []).filter(i => i.id !== id) } : p)}
                onMove={handleItemMove.bind(null, item.id, null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unassigned items */}
      <div className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <Package className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-medium text-slate-500">
            Unassigned <span className="text-slate-400">({unassigned.length})</span>
          </span>
          <button onClick={() => setAddingToContainer(null)} className="ml-auto text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        {(unassigned.length > 0 || addingToContainer === null) && (
          <div className="px-3 pb-3">
            {unassigned.map(item => (
              <PlanItemRow
                key={item.id}
                item={item}
                containers={containers}
                tripId={tripId}
                onUpdate={handleUnassignedUpdate}
                onDelete={id => handleItemDelete(null, id)}
                onMove={(itemId, _, toContainerId) => handleItemMove(itemId, null, toContainerId)}
              />
            ))}
            {addingToContainer === null && (
              <AddItemForm
                tripId={tripId}
                containerId={null}
                onAdd={item => { setUnassigned(p => [...p, item]); setAddingToContainer(false) }}
                onCancel={() => setAddingToContainer(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Empty state */}
      {containers.length === 0 && unassigned.length === 0 && vehicleDirect.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <LayoutGrid className="w-10 h-10 text-slate-200 mx-auto" />
          <p className="text-slate-500 font-medium">No packing plan yet</p>
          <p className="text-sm text-slate-400">Apply a template or add items manually to get started.</p>
          <div className="flex justify-center gap-2">
            <button onClick={() => setShowTemplates(true)} className="flex items-center gap-1.5 text-sm px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700">
              <LayoutTemplate className="w-4 h-4" /> Apply Template
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTemplates && (
        <TemplateSelectorModal
          templates={templates}
          tripId={tripId}
          onApplied={() => { setShowTemplates(false); loadPlan() }}
          onClose={() => setShowTemplates(false)}
        />
      )}
      {showAutoAssign && (
        <AutoAssignModal
          tripId={tripId}
          containers={containers}
          items={unassigned}
          onApplied={() => { setShowAutoAssign(false); loadPlan() }}
          onClose={() => setShowAutoAssign(false)}
        />
      )}
    </div>
  )
}

// ─── Vehicle Selector ─────────────────────────────────────────────────────────
function LayoutGrid({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function VehicleSelector({
  tripId,
  currentVehicle,
  onChange,
}: {
  tripId: number
  currentVehicle: GearVehicle | null
  onChange: (v: GearVehicle | null) => void
}) {
  const { vehicles } = useGearStore()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const select = async (v: GearVehicle | null) => {
    setOpen(false)
    setSaving(true)
    try {
      await packingPlanApi.update(tripId, { vehicle_id: v?.id || null })
      onChange(v)
    } catch { alert('Failed to update vehicle') }
    finally { setSaving(false) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-slate-50 text-slate-600"
      >
        <Car className="w-4 h-4" />
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentVehicle?.name || 'No Vehicle')}
        <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1">
          <button onClick={() => select(null)} className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${!currentVehicle ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
            No Vehicle
          </button>
          {vehicles.map(v => (
            <button key={v.id} onClick={() => select(v)} className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${currentVehicle?.id === v.id ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
              {v.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
