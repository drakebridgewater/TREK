import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, Plus, Trash2, Search, Loader2, Save, Package, Box, Check } from 'lucide-react'
import { GearItem, GearContainer, GearTag, GearTemplate, GearTemplateItem, GearTemplateContainer } from '../../types'
import { gearApi } from '../../api/client'
import GearTagPicker from './GearTagPicker'

interface Props {
  template: GearTemplate | null
  allItems: GearItem[]
  allContainers: GearContainer[]
  allTags: GearTag[]
  onClose: () => void
  onSaved: (template: GearTemplate) => void
}

const FORMULA_LABELS: Record<string, string> = {
  fixed: 'Fixed',
  per_night: '× nights',
  per_person: '× people',
  per_person_per_night: '× people × nights',
}

// ─── Create form (step 1 for new templates) ───────────────────────────────────
function CreateForm({
  allTags,
  onCreate,
}: {
  allTags: GearTag[]
  onCreate: (t: GearTemplate) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTags, setSelectedTags] = useState<GearTag[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const r = await gearApi.createTemplate({ name: name.trim(), description: description.trim() || null })
      const template: GearTemplate = r.template
      if (selectedTags.length > 0) {
        await gearApi.setTemplateTags(template.id, selectedTags.map(t => t.id))
        template.tags = selectedTags
      } else {
        template.tags = []
      }
      onCreate(template)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error || 'Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 space-y-4">
      <h3 className="font-semibold text-slate-900">New Packing Template</h3>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Template Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. 3-Day Camping Trip"
          autoFocus
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional description"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Tags</label>
        <GearTagPicker availableTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />
      </div>
      <button
        onClick={handleCreate}
        disabled={saving || !name.trim()}
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Create Template
      </button>
    </div>
  )
}

// ─── Item picker dropdown ──────────────────────────────────────────────────────
function ItemPicker({
  allItems,
  addedItemIds,
  onAdd,
}: {
  allItems: GearItem[]
  addedItemIds: Set<number>
  onAdd: (item: GearItem) => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = allItems.filter(
    i => !addedItemIds.has(i.id) && i.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
      >
        <Plus className="w-3.5 h-3.5" /> Add Item
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
          <div className="p-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items…"
                className="flex-1 text-sm outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                {allItems.length === addedItemIds.size ? 'All items added' : 'No results'}
              </p>
            )}
            {filtered.map(item => (
              <button
                key={item.id}
                onClick={() => { onAdd(item); setOpen(false); setSearch('') }}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 group"
              >
                <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-800 flex-1 truncate">{item.name}</span>
                {!!item.is_personal && <span className="text-xs text-purple-500">personal</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Container picker ─────────────────────────────────────────────────────────
function ContainerPicker({
  allContainers,
  addedContainerIds,
  onAdd,
}: {
  allContainers: GearContainer[]
  addedContainerIds: Set<number>
  onAdd: (container: GearContainer) => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = allContainers.filter(
    c => !addedContainerIds.has(c.id) && c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
      >
        <Plus className="w-3.5 h-3.5" /> Add Container
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
          <div className="p-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search containers…"
                className="flex-1 text-sm outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto px-2 pb-2 space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">
                {allContainers.length === addedContainerIds.size ? 'All containers added' : 'No results'}
              </p>
            )}
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { onAdd(c); setOpen(false); setSearch('') }}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50"
              >
                <Box className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-800 flex-1 truncate">{c.name}</span>
                {!!c.is_personal && <span className="text-xs text-purple-500">personal</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main editor ──────────────────────────────────────────────────────────────
export default function GearTemplateEditor({
  template: initialTemplate,
  allItems,
  allContainers,
  allTags,
  onClose,
  onSaved,
}: Props) {
  const [template, setTemplate] = useState<GearTemplate | null>(initialTemplate)

  // Info state
  const [name, setName] = useState(initialTemplate?.name || '')
  const [description, setDescription] = useState(initialTemplate?.description || '')
  const [selectedTags, setSelectedTags] = useState<GearTag[]>(
    initialTemplate?.tags || []
  )
  const [savingInfo, setSavingInfo] = useState(false)

  // Items and containers in the template (loaded from server for edit mode)
  const [tplItems, setTplItems] = useState<GearTemplateItem[]>([])
  const [tplContainers, setTplContainers] = useState<GearTemplateContainer[]>([])

  // Assignments: Set of "template_item_id:template_container_id"
  const [assignments, setAssignments] = useState<Set<string>>(new Set())
  const [savingAssignments, setSavingAssignments] = useState(false)

  const [loading, setLoading] = useState(!!initialTemplate)
  const [error, setError] = useState('')

  // Load template detail when editing
  const loadTemplateDetail = useCallback(async (id: number) => {
    setLoading(true)
    try {
      const r = await gearApi.getTemplate(id)
      const t: GearTemplate = r.template
      setTemplate(t)
      setName(t.name)
      setDescription(t.description || '')
      setSelectedTags(t.tags || [])
      setTplItems(t.items || [])
      setTplContainers(t.containers || [])
      // Build assignment set from containers
      const aSet = new Set<string>()
      if (t.containers) {
        for (const tc of t.containers) {
          if (tc.assignments) {
            for (const tiId of tc.assignments) {
              aSet.add(`${tiId}:${tc.id}`)
            }
          }
        }
      }
      setAssignments(aSet)
    } catch {
      setError('Failed to load template')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialTemplate?.id) {
      loadTemplateDetail(initialTemplate.id)
    }
  }, [initialTemplate?.id, loadTemplateDetail])

  const handleCreated = (t: GearTemplate) => {
    setTemplate(t)
    setName(t.name)
    setDescription(t.description || '')
    setSelectedTags(t.tags || [])
    setTplItems([])
    setTplContainers([])
    setAssignments(new Set())
    onSaved(t)
  }

  const handleSaveInfo = async () => {
    if (!template) return
    setSavingInfo(true)
    try {
      await gearApi.updateTemplate(template.id, {
        name: name.trim(),
        description: description.trim() || null,
      })
      await gearApi.setTemplateTags(template.id, selectedTags.map(t => t.id))
      const updated = { ...template, name: name.trim(), description: description.trim() || null, tags: selectedTags }
      setTemplate(updated)
      onSaved(updated)
    } catch {
      alert('Failed to save template info')
    } finally {
      setSavingInfo(false)
    }
  }

  // ── Items ───────────────────────────────────────────────────────────────────
  const handleAddItem = async (item: GearItem) => {
    if (!template) return
    try {
      const r = await gearApi.addTemplateItem(template.id, {
        gear_item_id: item.id,
        quantity: item.base_quantity,
        quantity_formula: item.quantity_formula,
        sort_order: tplItems.length,
      })
      setTplItems(p => [...p, { ...r.item, item }])
    } catch {
      alert('Failed to add item')
    }
  }

  const handleUpdateItemQty = async (tplItemId: number, quantity: number, formula: string) => {
    if (!template) return
    try {
      await gearApi.updateTemplateItem(template.id, tplItemId, { quantity, quantity_formula: formula })
      setTplItems(p => p.map(ti => ti.id === tplItemId ? { ...ti, quantity, quantity_formula: formula } : ti))
    } catch {
      alert('Failed to update item')
    }
  }

  const handleRemoveItem = async (tplItemId: number) => {
    if (!template) return
    try {
      await gearApi.deleteTemplateItem(template.id, tplItemId)
      setTplItems(p => p.filter(ti => ti.id !== tplItemId))
      // Remove assignments for this item
      setAssignments(prev => {
        const next = new Set(prev)
        for (const key of next) {
          if (key.startsWith(`${tplItemId}:`)) next.delete(key)
        }
        return next
      })
    } catch {
      alert('Failed to remove item')
    }
  }

  // ── Containers ──────────────────────────────────────────────────────────────
  const handleAddContainer = async (container: GearContainer) => {
    if (!template) return
    try {
      const r = await gearApi.addTemplateContainer(template.id, {
        gear_container_id: container.id,
        sort_order: tplContainers.length,
      })
      setTplContainers(p => [...p, { ...r.container, container, assignments: [] }])
    } catch {
      alert('Failed to add container')
    }
  }

  const handleRemoveContainer = async (tplContainerId: number) => {
    if (!template) return
    try {
      await gearApi.deleteTemplateContainer(template.id, tplContainerId)
      setTplContainers(p => p.filter(tc => tc.id !== tplContainerId))
      // Remove assignments for this container
      setAssignments(prev => {
        const next = new Set(prev)
        for (const key of next) {
          if (key.endsWith(`:${tplContainerId}`)) next.delete(key)
        }
        return next
      })
    } catch {
      alert('Failed to remove container')
    }
  }

  // ── Assignments ─────────────────────────────────────────────────────────────
  const saveAssignments = useCallback(async (newSet: Set<string>) => {
    if (!template) return
    setSavingAssignments(true)
    try {
      const arr = Array.from(newSet).map(key => {
        const [tiId, tcId] = key.split(':').map(Number)
        return { template_item_id: tiId, template_container_id: tcId }
      })
      await gearApi.setTemplateAssignments(template.id, arr)
    } catch {
      alert('Failed to save assignments')
    } finally {
      setSavingAssignments(false)
    }
  }, [template])

  const toggleAssignment = async (tplItemId: number, tplContainerId: number) => {
    const key = `${tplItemId}:${tplContainerId}`
    const next = new Set(assignments)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setAssignments(next)
    await saveAssignments(next)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  const addedItemIds = new Set(tplItems.map(ti => ti.gear_item_id))
  const addedContainerIds = new Set(tplContainers.map(tc => tc.gear_container_id))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>
    )
  }

  // No template yet — show create form
  if (!template) {
    return <CreateForm allTags={allTags} onCreate={handleCreated} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mt-0.5 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Templates
        </button>
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-lg font-semibold w-full border-b border-transparent hover:border-gray-200 focus:border-slate-400 focus:outline-none py-0.5 bg-transparent"
            placeholder="Template name"
          />
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="text-sm text-slate-500 w-full border-b border-transparent hover:border-gray-200 focus:border-slate-400 focus:outline-none py-0.5 bg-transparent"
            placeholder="Description (optional)"
          />
          <GearTagPicker availableTags={allTags} selectedTags={selectedTags} onChange={setSelectedTags} />
        </div>
        <button
          onClick={handleSaveInfo}
          disabled={savingInfo || !name.trim()}
          className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium disabled:opacity-60 flex-shrink-0"
        >
          {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save info
        </button>
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">
              Items
              <span className="ml-1.5 text-xs text-slate-400">({tplItems.length})</span>
            </h4>
            <ItemPicker allItems={allItems} addedItemIds={addedItemIds} onAdd={handleAddItem} />
          </div>
          <div className="space-y-2">
            {tplItems.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                No items yet. Add items to pack for this template.
              </p>
            )}
            {tplItems.map((ti, idx) => (
              <TemplateItemRow
                key={ti.id}
                tplItem={ti}
                index={idx + 1}
                onUpdate={handleUpdateItemQty}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>
        </div>

        {/* Right: Containers + Assignments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-700">
              Containers
              <span className="ml-1.5 text-xs text-slate-400">({tplContainers.length})</span>
              {savingAssignments && <Loader2 className="w-3 h-3 animate-spin text-slate-400 inline ml-1.5" />}
            </h4>
            <ContainerPicker allContainers={allContainers} addedContainerIds={addedContainerIds} onAdd={handleAddContainer} />
          </div>
          <div className="space-y-3">
            {tplContainers.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                No containers yet.
              </p>
            )}
            {tplContainers.map(tc => (
              <TemplateContainerCard
                key={tc.id}
                tplContainer={tc}
                tplItems={tplItems}
                assignments={assignments}
                onToggleAssignment={toggleAssignment}
                onRemove={handleRemoveContainer}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Template item row ────────────────────────────────────────────────────────
function TemplateItemRow({
  tplItem,
  index,
  onUpdate,
  onRemove,
}: {
  tplItem: GearTemplateItem
  index: number
  onUpdate: (id: number, qty: number, formula: string) => void
  onRemove: (id: number) => void
}) {
  const [qty, setQty] = useState(tplItem.quantity)
  const [formula, setFormula] = useState(tplItem.quantity_formula || tplItem.item?.quantity_formula || 'fixed')

  const isDirty = qty !== tplItem.quantity || formula !== (tplItem.quantity_formula || tplItem.item?.quantity_formula || 'fixed')

  return (
    <div className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl group">
      <span className="text-xs text-slate-400 w-5 text-center flex-shrink-0">{index}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-gray-900 truncate">{tplItem.item?.name}</span>
          {!!tplItem.item?.is_personal && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">personal</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <input
            type="number"
            min={1}
            value={qty}
            onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
          />
          <select
            value={formula}
            onChange={e => setFormula(e.target.value)}
            className="text-xs border border-gray-200 rounded px-1 py-0.5 bg-white"
          >
            {Object.entries(FORMULA_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
          {isDirty && (
            <button
              onClick={() => onUpdate(tplItem.id, qty, formula)}
              className="text-xs text-blue-600 hover:underline"
            >
              Save
            </button>
          )}
        </div>
      </div>
      <button
        onClick={() => onRemove(tplItem.id)}
        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Template container card ─────────────────────────────────────────────────
function TemplateContainerCard({
  tplContainer,
  tplItems,
  assignments,
  onToggleAssignment,
  onRemove,
}: {
  tplContainer: GearTemplateContainer
  tplItems: GearTemplateItem[]
  assignments: Set<string>
  onToggleAssignment: (tplItemId: number, tplContainerId: number) => void
  onRemove: (id: number) => void
}) {
  const assignedCount = tplItems.filter(ti => assignments.has(`${ti.id}:${tplContainer.id}`)).length

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden group">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50">
        <Box className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-900">{tplContainer.container?.name}</span>
          {!!tplContainer.container?.is_personal && (
            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">personal</span>
          )}
        </div>
        <span className="text-xs text-slate-400">{assignedCount}/{tplItems.length}</span>
        <button
          onClick={() => onRemove(tplContainer.id)}
          className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {tplItems.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          {tplItems.map(ti => {
            const checked = assignments.has(`${ti.id}:${tplContainer.id}`)
            return (
              <label key={ti.id} className="flex items-center gap-2 cursor-pointer group/row">
                <div
                  onClick={() => onToggleAssignment(ti.id, tplContainer.id)}
                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                    checked
                      ? 'bg-slate-800 border-slate-800'
                      : 'border-gray-300 hover:border-slate-400'
                  }`}
                >
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-xs ${checked ? 'text-slate-800' : 'text-slate-400'}`}>
                  {ti.item?.name}
                </span>
              </label>
            )
          })}
        </div>
      )}
      {tplItems.length === 0 && (
        <p className="text-xs text-slate-300 px-3 py-2">Add items to assign them here</p>
      )}
    </div>
  )
}
