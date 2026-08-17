'use client'

import { Plus, X } from 'lucide-react'
import { FLUENCY_OPTIONS, LANGUAGE_OPTIONS } from '@/lib/jerboa/constants'
import type { SpokenLanguage } from '@/lib/jerboa/types'
import { NativeSelect } from './form-fields'

interface Props {
  value: SpokenLanguage[]
  onChange: (next: SpokenLanguage[]) => void
  invalid?: boolean
}

export function LanguagePicker({ value, onChange, invalid }: Props) {
  const usedCodes = new Set(value.map((v) => v.language))

  function addRow() {
    onChange([...value, { language: '', fluency: 'fluent' }])
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }
  function updateRow(index: number, patch: Partial<SpokenLanguage>) {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <div
      className={
        'rounded-2xl border-2 bg-card/60 p-3 sm:p-4 ' +
        (invalid ? 'border-destructive' : 'border-input')
      }
    >
      {value.length === 0 ? (
        <p className="px-1 py-3 text-base text-muted-foreground">
          No languages added yet. Add each language you speak and how well.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {value.map((row, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-xl bg-background/60 p-3 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="mb-1 block text-sm font-semibold text-muted-foreground">
                  Language
                </label>
                <NativeSelect
                  aria-label={`Language ${index + 1}`}
                  value={row.language}
                  onChange={(e) => updateRow(index, { language: e.target.value })}
                >
                  <option value="">Select a language…</option>
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value !== row.language && usedCodes.has(opt.value)}
                    >
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="sm:w-48">
                <label className="mb-1 block text-sm font-semibold text-muted-foreground">
                  Fluency
                </label>
                <NativeSelect
                  aria-label={`Fluency for language ${index + 1}`}
                  value={row.fluency}
                  onChange={(e) =>
                    updateRow(index, { fluency: e.target.value as SpokenLanguage['fluency'] })
                  }
                >
                  {FLUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="flex h-[52px] items-center justify-center gap-2 rounded-xl border-2 border-input bg-background px-4 font-semibold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive sm:w-auto"
                aria-label={`Remove language ${index + 1}`}
              >
                <X className="size-5" />
                <span className="sm:hidden">Remove</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/8 px-4 py-3 text-lg font-bold text-primary transition-colors hover:bg-primary/15"
      >
        <Plus className="size-5" />
        Add a language
      </button>
    </div>
  )
}
