import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, Package, Box, Car, Tag, Loader2, AlertCircle, LayoutTemplate } from 'lucide-react'
import { GearItem, GearContainer, GearVehicle, GearTag, GearTemplate } from '../../types'
import { gearApi } from '../../api/client'
import GearItemEditor from './GearItemEditor'
import GearContainerEditor from './GearContainerEditor'
import GearVehicleEditor from './GearVehicleEditor'
import GearTemplateEditor from './GearTemplateEditor'
import Modal from '../shared/Modal'

type Tab = 'items' | 'containers' | 'vehicles' | 'tags' | 'templates'

// ─── Tag row ──────────────────────────────────────────────────────────────────
function TagRow({
  tag,
  onEdit,
  onDelete,
}: {
  tag: GearTag
  onEdit: (tag: GearTag) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 group">
      <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
      <span className="flex-1 text-sm font-medium text-gray-900">{tag.name}</span>
      <code className="text-xs text-slate-400 font-mono">{tag.color}</code>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(tag)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(tag.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  onEdit,
  onDelete,
}: {
  item: GearItem
  onEdit: (item: GearItem) => void
  onDelete: (id: number) => void
}) {
  const formulaLabel: Record<string, string> = {
    fixed: 'Fixed',
    per_night: '× nights',
    per_person: '× people',
    per_person_per_night: '× people × nights',
  }
  return (
    <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100">
        <Package className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{item.name}</span>
          {!!item.is_personal && <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">personal</span>}
          {!!item.is_food && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">food</span>}
          {item.tags.map(t => (
            <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}>
              {t.name}
            </span>
          ))}
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          {item.base_quantity} {formulaLabel[item.quantity_formula] || item.quantity_formula}
          {item.serving_unit && ` · ${item.serving_unit}`}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(item)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Container row ────────────────────────────────────────────────────────────
function ContainerRow({
  container,
  onEdit,
  onDelete,
}: {
  container: GearContainer
  onEdit: (c: GearContainer) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100">
        <Box className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{container.name}</span>
          {!!container.is_personal && <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600">personal</span>}
          {container.tags.map(t => (
            <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}>
              {t.name}
            </span>
          ))}
        </div>
        {container.capacity_notes && <div className="text-xs text-slate-400 mt-0.5">{container.capacity_notes}</div>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(container)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(container.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Vehicle row ──────────────────────────────────────────────────────────────
function VehicleRow({
  vehicle,
  onEdit,
  onDelete,
}: {
  vehicle: GearVehicle
  onEdit: (v: GearVehicle) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100">
        <Car className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{vehicle.name}</span>
          {vehicle.tags.map(t => (
            <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${t.color}22`, color: t.color }}>
              {t.name}
            </span>
          ))}
        </div>
        {vehicle.description && <div className="text-xs text-slate-400 mt-0.5">{vehicle.description}</div>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button onClick={() => onEdit(vehicle)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(vehicle.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GearLibraryManager() {
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [items, setItems] = useState<GearItem[]>([])
  const [containers, setContainers] = useState<GearContainer[]>([])
  const [vehicles, setVehicles] = useState<GearVehicle[]>([])
  const [tags, setTags] = useState<GearTag[]>([])
  const [templates, setTemplates] = useState<GearTemplate[]>([])

  // Editors
  const [editingItem, setEditingItem] = useState<GearItem | null | undefined>(undefined)
  const [editingContainer, setEditingContainer] = useState<GearContainer | null | undefined>(undefined)
  const [editingVehicle, setEditingVehicle] = useState<GearVehicle | null | undefined>(undefined)
  const [editingTemplate, setEditingTemplate] = useState<GearTemplate | null | undefined>(undefined)

  // Tag editor
  const [editingTag, setEditingTag] = useState<GearTag | null | undefined>(undefined)
  const [tagForm, setTagForm] = useState({ name: '', color: '#6366f1' })
  const [tagSaving, setTagSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [itemsR, containersR, vehiclesR, tagsR, templatesR] = await Promise.all([
        gearApi.listItems(),
        gearApi.listContainers(),
        gearApi.listVehicles(),
        gearApi.listTags(),
        gearApi.listTemplates(),
      ])
      setItems(itemsR.items)
      setContainers(containersR.containers)
      setVehicles(vehiclesR.vehicles)
      setTags(tagsR.tags)
      setTemplates(templatesR.templates)
    } catch {
      setError('Failed to load gear library')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Delete this item? It will be removed from all templates and packing plans.')) return
    try { await gearApi.deleteItem(id); setItems(p => p.filter(i => i.id !== id)) } catch { alert('Failed to delete') }
  }

  const handleDeleteContainer = async (id: number) => {
    if (!confirm('Delete this container?')) return
    try { await gearApi.deleteContainer(id); setContainers(p => p.filter(c => c.id !== id)) } catch { alert('Failed to delete') }
  }

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('Delete this vehicle?')) return
    try { await gearApi.deleteVehicle(id); setVehicles(p => p.filter(v => v.id !== id)) } catch { alert('Failed to delete') }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Delete this template? All template items, containers, and assignments will be removed.')) return
    try { await gearApi.deleteTemplate(id); setTemplates(p => p.filter(t => t.id !== id)) } catch { alert('Failed to delete') }
  }

  const handleDeleteTag = async (id: number) => {
    if (!confirm('Delete this tag? It will be removed from all items, containers, and vehicles.')) return
    try {
      await gearApi.deleteTag(id)
      setTags(p => p.filter(t => t.id !== id))
    } catch { alert('Failed to delete') }
  }

  const openTagEditor = (tag: GearTag | null) => {
    setEditingTag(tag)
    setTagForm({ name: tag?.name || '', color: tag?.color || '#6366f1' })
  }

  const handleTagSave = async () => {
    if (!tagForm.name.trim()) return
    setTagSaving(true)
    try {
      if (editingTag) {
        const r = await gearApi.updateTag(editingTag.id, { name: tagForm.name.trim(), color: tagForm.color })
        setTags(p => p.map(t => t.id === editingTag.id ? r.tag : t))
      } else {
        const r = await gearApi.createTag({ name: tagForm.name.trim(), color: tagForm.color })
        setTags(p => [...p, r.tag])
      }
      setEditingTag(undefined)
    } catch (e: unknown) {
      alert((e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to save tag')
    } finally {
      setTagSaving(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'items', label: 'Items', icon: <Package className="w-4 h-4" />, count: items.length },
    { id: 'containers', label: 'Containers', icon: <Box className="w-4 h-4" />, count: containers.length },
    { id: 'vehicles', label: 'Vehicles', icon: <Car className="w-4 h-4" />, count: vehicles.length },
    { id: 'tags', label: 'Tags', icon: <Tag className="w-4 h-4" />, count: tags.length },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" />, count: templates.length },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 py-4 px-3 bg-red-50 rounded-xl">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">{error}</span>
        <button onClick={load} className="ml-auto text-xs underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Items tab ── */}
      {activeTab === 'items' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">{items.length} items in library</p>
            <button onClick={() => setEditingItem(null)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New item
            </button>
          </div>
          <div className="space-y-2">
            {items.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No items yet. Add some to the library!</p>}
            {items.map(item => (
              <ItemRow key={item.id} item={item}
                onEdit={i => setEditingItem(i)}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Containers tab ── */}
      {activeTab === 'containers' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">{containers.length} containers in library</p>
            <button onClick={() => setEditingContainer(null)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New container
            </button>
          </div>
          <div className="space-y-2">
            {containers.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No containers yet.</p>}
            {containers.map(c => (
              <ContainerRow key={c.id} container={c}
                onEdit={co => setEditingContainer(co)}
                onDelete={handleDeleteContainer}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Vehicles tab ── */}
      {activeTab === 'vehicles' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">{vehicles.length} vehicles in library</p>
            <button onClick={() => setEditingVehicle(null)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New vehicle
            </button>
          </div>
          <div className="space-y-2">
            {vehicles.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No vehicles yet.</p>}
            {vehicles.map(v => (
              <VehicleRow key={v.id} vehicle={v}
                onEdit={ve => setEditingVehicle(ve)}
                onDelete={handleDeleteVehicle}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Templates tab ── */}
      {activeTab === 'templates' && editingTemplate === undefined && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">{templates.length} templates</p>
            <button onClick={() => setEditingTemplate(null)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New template
            </button>
          </div>
          <div className="space-y-2">
            {templates.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No templates yet. Create a packing template like "3-Day Camping".</p>}
            {templates.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:border-gray-200 group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-100">
                  <LayoutTemplate className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 text-sm">{t.name}</span>
                    {t.tags?.map(tag => (
                      <span key={tag.id} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color }}>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {t.item_count ?? 0} items · {t.container_count ?? 0} containers
                    {t.description && ` · ${t.description}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => setEditingTemplate(t)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Template editor ── */}
      {activeTab === 'templates' && editingTemplate !== undefined && (
        <GearTemplateEditor
          template={editingTemplate}
          allItems={items}
          allContainers={containers}
          allTags={tags}
          onClose={() => setEditingTemplate(undefined)}
          onSaved={saved => {
            setTemplates(p => {
              const idx = p.findIndex(t => t.id === saved.id)
              if (idx >= 0) return p.map(t => t.id === saved.id ? saved : t)
              return [...p, saved]
            })
          }}
        />
      )}

      {/* ── Tags tab ── */}
      {activeTab === 'tags' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">{tags.length} gear tags</p>
            <button onClick={() => openTagEditor(null)}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New tag
            </button>
          </div>
          <div className="space-y-2">
            {tags.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No tags yet. Tags are used to auto-assign items to containers.</p>}
            {tags.map(t => (
              <TagRow key={t.id} tag={t}
                onEdit={openTagEditor}
                onDelete={handleDeleteTag}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Editors ── */}
      {editingItem !== undefined && (
        <GearItemEditor
          item={editingItem}
          availableTags={tags}
          onSave={saved => {
            if (editingItem) {
              setItems(p => p.map(i => i.id === saved.id ? saved : i))
            } else {
              setItems(p => [...p, saved])
            }
            setEditingItem(undefined)
          }}
          onClose={() => setEditingItem(undefined)}
        />
      )}

      {editingContainer !== undefined && (
        <GearContainerEditor
          container={editingContainer}
          availableTags={tags}
          onSave={saved => {
            if (editingContainer) {
              setContainers(p => p.map(c => c.id === saved.id ? saved : c))
            } else {
              setContainers(p => [...p, saved])
            }
            setEditingContainer(undefined)
          }}
          onClose={() => setEditingContainer(undefined)}
        />
      )}

      {editingVehicle !== undefined && (
        <GearVehicleEditor
          vehicle={editingVehicle}
          availableTags={tags}
          onSave={saved => {
            if (editingVehicle) {
              setVehicles(p => p.map(v => v.id === saved.id ? saved : v))
            } else {
              setVehicles(p => [...p, saved])
            }
            setEditingVehicle(undefined)
          }}
          onClose={() => setEditingVehicle(undefined)}
        />
      )}

      {/* Tag editor modal */}
      {editingTag !== undefined && (
        <Modal
          isOpen
          onClose={() => setEditingTag(undefined)}
          title={editingTag ? 'Edit Tag' : 'New Tag'}
          size="sm"
          footer={
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditingTag(undefined)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
              <button onClick={handleTagSave} disabled={tagSaving || !tagForm.name.trim()}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-60 font-medium">
                {tagSaving ? 'Saving…' : editingTag ? 'Update' : 'Create'}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Name *</label>
              <input
                type="text"
                value={tagForm.name}
                onChange={e => setTagForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Camping"
                autoFocus
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={tagForm.color}
                  onChange={e => setTagForm(p => ({ ...p, color: e.target.value }))}
                  className="w-10 h-8 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={tagForm.color}
                  onChange={e => setTagForm(p => ({ ...p, color: e.target.value }))}
                  placeholder="#6366f1"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white font-mono"
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
