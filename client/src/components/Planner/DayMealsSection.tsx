import React, { useState, useEffect, useRef } from 'react'
import { Utensils, Plus, Trash2, Edit2, ChevronDown, ChevronUp, X, Check, LayoutTemplate } from 'lucide-react'
import { TripMeal, TripMealItem, MealTemplate } from '../../types'
import { mealsApi, mealTemplatesApi } from '../../api/client'

interface Props {
  tripId: number
  dayId: number
}

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
type MealType = typeof MEAL_TYPES[number]

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: '#f59e0b',
  lunch:     '#3b82f6',
  dinner:    '#8b5cf6',
  snack:     '#10b981',
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch:     'Lunch',
  dinner:    'Dinner',
  snack:     'Snack',
}

// ─── Meal item row ─────────────────────────────────────────────────────────────
function MealItemRow({
  item,
  mealId,
  tripId,
  dayId,
  onUpdate,
  onDelete,
}: {
  item: TripMealItem
  mealId: number
  tripId: number
  dayId: number
  onUpdate: (updated: TripMealItem) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [qty, setQty] = useState(item.quantity_per_person)
  const [unit, setUnit] = useState(item.unit || '')

  const save = async () => {
    try {
      const r = await mealsApi.updateItem(tripId, dayId, mealId, item.id, {
        quantity_per_person: qty,
        unit: unit.trim() || null,
      })
      onUpdate(r.item)
      setEditing(false)
    } catch {
      alert('Failed to update item')
    }
  }

  return (
    <div className="flex items-center gap-2 py-1 group/item">
      {editing ? (
        <>
          <span className="flex-1 text-xs text-slate-700 truncate">{item.name}</span>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={qty}
            onChange={e => setQty(parseFloat(e.target.value) || 0)}
            className="w-14 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-center"
          />
          <input
            type="text"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="unit"
            className="w-16 text-xs border border-gray-200 rounded px-1.5 py-0.5"
          />
          <button onClick={save} className="p-1 text-green-600 hover:bg-green-50 rounded">
            <Check className="w-3 h-3" />
          </button>
          <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
            <X className="w-3 h-3" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-slate-700 truncate">{item.name}</span>
          <span className="text-xs text-slate-400 flex-shrink-0">
            {item.quantity_per_person}{item.unit ? ` ${item.unit}` : ''}/person
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 flex-shrink-0">
            <button onClick={() => setEditing(true)} className="p-1 text-slate-300 hover:text-slate-600 rounded">
              <Edit2 className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 text-slate-300 hover:text-red-500 rounded">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Add food item form ────────────────────────────────────────────────────────
function AddFoodItemForm({
  tripId,
  dayId,
  mealId,
  onAdd,
  onCancel,
}: {
  tripId: number
  dayId: number
  mealId: number
  onAdd: (item: TripMealItem) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const r = await mealsApi.addItem(tripId, dayId, mealId, {
        custom_food_name: name.trim(),
        quantity_per_person: qty,
        unit: unit.trim() || null,
      })
      onAdd(r.item)
      setName(''); setQty(1); setUnit('')
    } catch {
      alert('Failed to add food item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-100">
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Food item…"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel() }}
        className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-slate-400 min-w-0"
      />
      <input
        type="number"
        min={0.1}
        step={0.5}
        value={qty}
        onChange={e => setQty(parseFloat(e.target.value) || 1)}
        className="w-12 text-xs border border-gray-200 rounded-lg px-1.5 py-1 text-center"
      />
      <input
        type="text"
        value={unit}
        onChange={e => setUnit(e.target.value)}
        placeholder="unit"
        className="w-14 text-xs border border-gray-200 rounded-lg px-1.5 py-1"
      />
      <button onClick={handleAdd} disabled={saving || !name.trim()}
        className="p-1.5 bg-slate-800 text-white rounded-lg disabled:opacity-50">
        <Check className="w-3 h-3" />
      </button>
      <button onClick={onCancel} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

// ─── Meal card ────────────────────────────────────────────────────────────────
function MealCard({
  meal,
  tripId,
  dayId,
  onUpdate,
  onDelete,
}: {
  meal: TripMeal
  tripId: number
  dayId: number
  onUpdate: (updated: TripMeal) => void
  onDelete: (id: number) => void
}) {
  const [items, setItems] = useState<TripMealItem[]>(meal.items || [])
  const [addingItem, setAddingItem] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(meal.name || '')
  const color = MEAL_TYPE_COLORS[meal.meal_type as MealType] || '#6b7280'
  const label = MEAL_TYPE_LABELS[meal.meal_type as MealType] || meal.meal_type

  const saveName = async () => {
    setEditingName(false)
    if (nameVal === (meal.name || '')) return
    try {
      const r = await mealsApi.update(tripId, dayId, meal.id, { name: nameVal.trim() || null })
      onUpdate(r.meal)
    } catch {}
  }

  const handleDeleteItem = async (itemId: number) => {
    try {
      await mealsApi.deleteItem(tripId, dayId, meal.id, itemId)
      setItems(p => p.filter(i => i.id !== itemId))
    } catch {
      alert('Failed to remove item')
    }
  }

  return (
    <div style={{ border: '1px solid var(--border-faint)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      {/* Meal header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--bg-secondary)' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.04em', padding: '2px 7px', borderRadius: 20, color: 'white', background: color, flexShrink: 0, textTransform: 'uppercase' }}>
          {label}
        </span>
        {editingName ? (
          <input
            autoFocus
            type="text"
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={saveName}
            onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameVal(meal.name || ''); setEditingName(false) } }}
            placeholder="Custom name (optional)"
            style={{ flex: 1, fontSize: 11, border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit', color: 'var(--text-primary)' }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            style={{ flex: 1, fontSize: 11, color: meal.name ? 'var(--text-primary)' : 'var(--text-faint)', cursor: 'pointer', fontStyle: meal.name ? 'normal' : 'italic' }}
          >
            {meal.name || 'Add name…'}
          </span>
        )}
        <button
          onClick={() => onDelete(meal.id)}
          style={{ padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-faint)', borderRadius: 6, display: 'flex' }}
          className="hover:text-red-500"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Items */}
      <div style={{ padding: '6px 10px' }}>
        {items.length === 0 && !addingItem && (
          <p style={{ fontSize: 11, color: 'var(--text-faint)', fontStyle: 'italic', margin: 0 }}>No food items yet</p>
        )}
        {items.map(item => (
          <MealItemRow
            key={item.id}
            item={item}
            mealId={meal.id}
            tripId={tripId}
            dayId={dayId}
            onUpdate={updated => setItems(p => p.map(i => i.id === updated.id ? updated : i))}
            onDelete={handleDeleteItem}
          />
        ))}
        {addingItem ? (
          <AddFoodItemForm
            tripId={tripId}
            dayId={dayId}
            mealId={meal.id}
            onAdd={item => { setItems(p => [...p, item]); setAddingItem(false) }}
            onCancel={() => setAddingItem(false)}
          />
        ) : (
          <button
            onClick={() => setAddingItem(true)}
            style={{ marginTop: 4, padding: '3px 8px', border: '1px dashed var(--border-primary)', borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 10, color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}
          >
            <Plus size={9} /> Add food
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Template picker ──────────────────────────────────────────────────────────
function TemplatePicker({
  tripId,
  dayId,
  onApplied,
  onClose,
}: {
  tripId: number
  dayId: number
  onApplied: (meal: TripMeal) => void
  onClose: () => void
}) {
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mealTemplatesApi.list().then(r => setTemplates(r.templates ?? [])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const handleApply = async (templateId: number) => {
    setApplying(templateId)
    try {
      const r = await mealTemplatesApi.applyToTrip(tripId, dayId, templateId)
      onApplied(r.meal)
      onClose()
    } catch { setApplying(null) }
  }

  const grouped = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = templates.filter(t => t.meal_type === type)
    return acc
  }, {} as Record<MealType, MealTemplate[]>)

  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: 4, background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 8, maxHeight: 280, overflowY: 'auto' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 12, fontSize: 11, color: 'var(--text-faint)' }}>Loading…</div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 12, fontSize: 11, color: 'var(--text-faint)' }}>No templates yet. Create them in Admin → Meal Templates.</div>
      ) : (
        MEAL_TYPES.map(type => grouped[type].length > 0 && (
          <div key={type}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-faint)', padding: '6px 6px 3px' }}>
              {MEAL_TYPE_LABELS[type]}
            </div>
            {grouped[type].map(tmpl => (
              <button
                key={tmpl.id}
                onClick={() => handleApply(tmpl.id)}
                disabled={applying === tmpl.id}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: 'none', background: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                className="hover:bg-[var(--bg-secondary)]"
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: MEAL_TYPE_COLORS[type], flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text-primary)', flex: 1 }}>{tmpl.name}</span>
                {applying === tmpl.id && <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Adding…</span>}
              </button>
            ))}
          </div>
        ))
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DayMealsSection({ tripId, dayId }: Props) {
  const [meals, setMeals] = useState<TripMeal[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [addingMeal, setAddingMeal] = useState(false)
  const [newMealType, setNewMealType] = useState<MealType>('dinner')
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)

  const loadMeals = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const r = await mealsApi.list(tripId, dayId)
      setMeals(r.meals || [])
      setLoaded(true)
    } catch {}
    finally { setLoading(false) }
  }

  const handleToggle = () => {
    if (!expanded && !loaded) loadMeals()
    setExpanded(e => !e)
  }

  const handleAddMeal = async () => {
    try {
      const r = await mealsApi.create(tripId, dayId, { meal_type: newMealType })
      setMeals(p => [...p, { ...r.meal, items: [] }])
      setAddingMeal(false)
    } catch {
      alert('Failed to create meal')
    }
  }

  const handleDeleteMeal = async (id: number) => {
    try {
      await mealsApi.delete(tripId, dayId, id)
      setMeals(p => p.filter(m => m.id !== id))
    } catch {
      alert('Failed to delete meal')
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* Section toggle */}
      <button
        onClick={handleToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        }}
      >
        <Utensils size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Meals {loaded && meals.length > 0 ? `· ${meals.length}` : ''}
        </span>
        {expanded
          ? <ChevronUp size={12} style={{ color: 'var(--text-faint)' }} />
          : <ChevronDown size={12} style={{ color: 'var(--text-faint)' }} />}
      </button>

      {expanded && (
        <div style={{ paddingTop: 4 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, color: 'var(--text-faint)' }}>Loading…</div>
          ) : (
            <>
              {meals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  tripId={tripId}
                  dayId={dayId}
                  onUpdate={updated => setMeals(p => p.map(m => m.id === updated.id ? { ...updated, items: m.items } : m))}
                  onDelete={handleDeleteMeal}
                />
              ))}

              {addingMeal ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                  {MEAL_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setNewMealType(type)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 600,
                        fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: newMealType === type ? MEAL_TYPE_COLORS[type] : 'var(--bg-secondary)',
                        color: newMealType === type ? 'white' : 'var(--text-faint)',
                      }}
                    >
                      {MEAL_TYPE_LABELS[type]}
                    </button>
                  ))}
                  <button onClick={handleAddMeal} style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-card)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Add
                  </button>
                  <button onClick={() => setAddingMeal(false)} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border-primary)', background: 'none', fontSize: 11, color: 'var(--text-faint)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative', display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setAddingMeal(true)}
                    style={{
                      flex: 1, padding: '7px 0', border: '1.5px dashed var(--border-primary)',
                      borderRadius: 10, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 5, fontSize: 11, color: 'var(--text-faint)', fontFamily: 'inherit',
                    }}
                  >
                    <Plus size={11} /> Add meal
                  </button>
                  <button
                    onClick={() => setShowTemplatePicker(p => !p)}
                    style={{
                      padding: '7px 10px', border: '1.5px dashed var(--border-primary)',
                      borderRadius: 10, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                      gap: 5, fontSize: 11, color: 'var(--text-faint)', fontFamily: 'inherit',
                    }}
                  >
                    <LayoutTemplate size={11} /> From template
                  </button>
                  {showTemplatePicker && (
                    <TemplatePicker
                      tripId={tripId}
                      dayId={dayId}
                      onApplied={meal => { setMeals(p => [...p, meal]); setShowTemplatePicker(false) }}
                      onClose={() => setShowTemplatePicker(false)}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
