import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, Loader2, X, Check, UtensilsCrossed } from 'lucide-react'
import { MealTemplate, MealTemplateItem, GearItem } from '../../types'
import { mealTemplatesApi, gearApi } from '../../api/client'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = typeof MEAL_TYPES[number]

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks & Drinks',
}

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: '#f59e0b',
  lunch: '#3b82f6',
  dinner: '#8b5cf6',
  snack: '#10b981',
}

// ─── Add ingredient form ───────────────────────────────────────────────────────
function AddIngredientForm({
  templateId,
  foodItems,
  onAdded,
  onCancel,
}: {
  templateId: number
  foodItems: GearItem[]
  onAdded: (item: MealTemplateItem) => void
  onCancel: () => void
}) {
  const [query, setQuery] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GearItem | null>(null)

  const filtered = foodItems.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  const handleSubmit = async () => {
    if (!query.trim() && !selectedItem) return
    setSaving(true)
    try {
      const data = selectedItem
        ? { gear_item_id: selectedItem.id, quantity_per_person: Number(qty) || 1, unit: unit || null }
        : { custom_food_name: query.trim(), quantity_per_person: Number(qty) || 1, unit: unit || null }
      const res = await mealTemplatesApi.addItem(templateId, data)
      onAdded(res.item)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
      <div className="flex-1 relative">
        <input
          type="text"
          placeholder="Ingredient name..."
          value={selectedItem ? selectedItem.name : query}
          onChange={e => {
            setQuery(e.target.value)
            setSelectedItem(null)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full text-sm px-2 py-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-indigo-400"
          autoFocus
        />
        {showDropdown && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map(item => (
              <button
                key={item.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                onMouseDown={e => { e.preventDefault(); setSelectedItem(item); setQuery(''); setShowDropdown(false) }}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="number"
        step="0.5"
        min="0.5"
        value={qty}
        onChange={e => setQty(e.target.value)}
        className="w-16 text-sm px-2 py-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-center focus:outline-none focus:border-indigo-400"
        placeholder="qty"
      />
      <input
        type="text"
        value={unit}
        onChange={e => setUnit(e.target.value)}
        placeholder="unit"
        className="w-20 text-sm px-2 py-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-indigo-400"
      />
      <button onClick={handleSubmit} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button onClick={onCancel} className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded-lg">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Ingredient row ────────────────────────────────────────────────────────────
function IngredientRow({
  item,
  templateId,
  onUpdated,
  onDeleted,
}: {
  item: MealTemplateItem
  templateId: number
  onUpdated: (item: MealTemplateItem) => void
  onDeleted: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(String(item.quantity_per_person))
  const [unit, setUnit] = useState(item.unit ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await mealTemplatesApi.updateItem(templateId, item.id, {
        quantity_per_person: Number(qty) || 1,
        unit: unit || null,
      })
      onUpdated(res.item)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await mealTemplatesApi.deleteItem(templateId, item.id)
    onDeleted(item.id)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)] group">
      <span className="flex-1 text-sm text-[var(--text-primary)]">{item.name}</span>
      {editing ? (
        <>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={qty}
            onChange={e => setQty(e.target.value)}
            className="w-16 text-sm text-center px-1 py-0.5 border border-[var(--border-primary)] rounded bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none"
            autoFocus
          />
          <input
            type="text"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="unit"
            className="w-20 text-sm px-1 py-0.5 border border-[var(--border-primary)] rounded bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none"
          />
          <button onClick={handleSave} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setEditing(false)} className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="text-xs text-[var(--text-muted)]">
            {item.quantity_per_person}{item.unit ? ` ${item.unit}` : ''}/person
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1 text-[var(--text-muted)] hover:text-slate-700 hover:bg-slate-100 rounded">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} className="p-1 text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  foodItems,
  onUpdated,
  onDeleted,
}: {
  template: MealTemplate
  foodItems: GearItem[]
  onUpdated: (t: MealTemplate) => void
  onDeleted: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<MealTemplateItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(template.name)
  const [savingName, setSavingName] = useState(false)

  const loadItems = useCallback(async () => {
    if (loadingItems) return
    setLoadingItems(true)
    try {
      const res = await mealTemplatesApi.get(template.id)
      setItems(res.template.items ?? [])
    } finally {
      setLoadingItems(false)
    }
  }, [template.id, loadingItems])

  const handleExpand = () => {
    if (!expanded && items.length === 0) loadItems()
    setExpanded(e => !e)
  }

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSavingName(true)
    try {
      const res = await mealTemplatesApi.update(template.id, { name: name.trim() })
      onUpdated(res.template)
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  const handleDelete = async () => {
    await mealTemplatesApi.delete(template.id)
    onDeleted(template.id)
  }

  const color = MEAL_TYPE_COLORS[template.meal_type as MealType] ?? '#6366f1'

  return (
    <div className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={handleExpand} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
              className="flex-1 text-sm px-2 py-1 border border-indigo-400 rounded bg-[var(--bg-card)] text-[var(--text-primary)] focus:outline-none"
              autoFocus
            />
            <button onClick={handleSaveName} disabled={savingName} className="p-1 text-green-600 hover:bg-green-50 rounded">
              {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setEditingName(false)} className="p-1 text-[var(--text-muted)] rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{template.name}</span>
        )}
        <span className="text-xs text-[var(--text-muted)]">{template.item_count ?? 0} ingredients</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditingName(true)} className="p-1.5 text-[var(--text-muted)] hover:text-slate-700 hover:bg-slate-100 rounded-lg">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete} className="p-1.5 text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border-faint)] px-4 pb-3 pt-2 space-y-1">
          {loadingItems && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
            </div>
          )}
          {items.map(item => (
            <IngredientRow
              key={item.id}
              item={item}
              templateId={template.id}
              onUpdated={updated => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))}
              onDeleted={id => setItems(prev => prev.filter(i => i.id !== id))}
            />
          ))}
          {addingItem ? (
            <AddIngredientForm
              templateId={template.id}
              foodItems={foodItems}
              onAdded={item => { setItems(prev => [...prev, item]); setAddingItem(false) }}
              onCancel={() => setAddingItem(false)}
            />
          ) : (
            <button
              onClick={() => setAddingItem(true)}
              className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add ingredient
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function MealTemplateManager() {
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [foodItems, setFoodItems] = useState<GearItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingType, setCreatingType] = useState<MealType | null>(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [tmplRes, gearRes] = await Promise.all([
        mealTemplatesApi.list(),
        gearApi.listItems(),
      ])
      setTemplates(tmplRes.templates ?? [])
      setFoodItems((gearRes.items ?? []).filter((i: GearItem) => i.is_food === 1))
    } catch {
      setError('Failed to load meal templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!newName.trim() || !creatingType) return
    setSaving(true)
    try {
      const res = await mealTemplatesApi.create({ name: newName.trim(), meal_type: creatingType })
      setTemplates(prev => [...prev, { ...res.template, item_count: 0 }])
      setNewName('')
      setCreatingType(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    )
  }

  const grouped = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = templates.filter(t => t.meal_type === type)
    return acc
  }, {} as Record<MealType, MealTemplate[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-[var(--text-muted)]" />
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Meal Templates</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full">
            {templates.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {MEAL_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setCreatingType(type)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MEAL_TYPE_COLORS[type] }} />
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Create form */}
      {creatingType && (
        <div className="flex items-center gap-2 p-3 border border-indigo-200 bg-indigo-50 rounded-xl">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: MEAL_TYPE_COLORS[creatingType] }} />
          <span className="text-sm text-[var(--text-muted)]">{MEAL_TYPE_LABELS[creatingType]}:</span>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreatingType(null) }}
            placeholder="Template name..."
            className="flex-1 text-sm px-2 py-1.5 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <button onClick={handleCreate} disabled={saving || !newName.trim()} className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          </button>
          <button onClick={() => setCreatingType(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grouped sections */}
      {MEAL_TYPES.map(type => (
        grouped[type].length > 0 && (
          <div key={type}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MEAL_TYPE_COLORS[type] }} />
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {MEAL_TYPE_LABELS[type]}
              </h3>
              <span className="text-xs text-[var(--text-faint)]">({grouped[type].length})</span>
            </div>
            <div className="space-y-2">
              {grouped[type].map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  foodItems={foodItems}
                  onUpdated={updated => setTemplates(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t))}
                  onDeleted={id => setTemplates(prev => prev.filter(t => t.id !== id))}
                />
              ))}
            </div>
          </div>
        )
      ))}

      {templates.length === 0 && (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No meal templates yet.</p>
          <p className="text-xs mt-1">Use the buttons above to create your first template.</p>
        </div>
      )}
    </div>
  )
}
