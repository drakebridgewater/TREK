import React, { useState } from 'react'
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react'
import { GearTag } from '../../types'

interface GearTagPickerProps {
  selectedTags: GearTag[]
  availableTags: GearTag[]
  onChange: (tags: GearTag[]) => void
}

export default function GearTagPicker({ selectedTags, availableTags, onChange }: GearTagPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  const unselected = availableTags.filter(t => !selectedTags.some(s => s.id === t.id))

  const addTag = (tag: GearTag) => {
    onChange([...selectedTags, tag])
    setShowPicker(false)
  }

  const removeTag = (id: number) => {
    onChange(selectedTags.filter(t => t.id !== id))
  }

  const moveUp = (idx: number) => {
    if (idx === 0) return
    const next = [...selectedTags]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  const moveDown = (idx: number) => {
    if (idx === selectedTags.length - 1) return
    const next = [...selectedTags]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">Tags (first tag = highest priority)</span>
        {unselected.length > 0 && (
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="flex items-center gap-1 text-xs px-2 py-1 text-slate-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-3 h-3" />
            Add tag
          </button>
        )}
      </div>

      {showPicker && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
          {unselected.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => addTag(tag)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity"
              style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {selectedTags.length > 0 ? (
        <div className="space-y-1">
          {selectedTags.map((tag, idx) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-100"
            >
              <span className="text-xs font-medium text-slate-400 w-4 text-center">{idx + 1}</span>
              <span
                className="flex-1 text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
              >
                {tag.name}
              </span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === selectedTags.length - 1}
                  className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="p-0.5 text-slate-400 hover:text-red-500 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No tags assigned</p>
      )}
    </div>
  )
}
