import React, { useState, useEffect } from 'react'
import { FrequencyType } from '@shared/lib/habitFrequency'
import { cn } from '@/lib/utils'

interface FrequencySelectorProps {
  value?: {
    numerator: number
    denominator: number
    type: FrequencyType
  }
  onChange: (frequency: {
    numerator: number
    denominator: number
    type: FrequencyType
  }) => void
  className?: string
}

export function FrequencySelector({ value, onChange, className }: FrequencySelectorProps) {
  const [type, setType] = useState<FrequencyType>(value?.type || FrequencyType.DAILY)
  const [numerator, setNumerator] = useState(value?.numerator || 1)
  const [denominator, setDenominator] = useState(value?.denominator || 1)

  // Sync with external value changes (e.g., when editing existing habit)
  useEffect(() => {
    if (value) {
      setType(value.type)
      setNumerator(value.numerator)
      setDenominator(value.denominator)
    }
  }, [value])

  const handleTypeChange = (newType: FrequencyType) => {
    setType(newType)

    if (newType === FrequencyType.DAILY) {
      const freq = { numerator: 1, denominator: 1, type: newType }
      setNumerator(1)
      setDenominator(1)
      onChange(freq)
    } else if (newType === FrequencyType.WEEKLY) {
      const freq = { numerator: 1, denominator: 7, type: newType }
      setNumerator(1)
      setDenominator(7)
      onChange(freq)
    }
  }

  const handleWeeklyPreset = (times: number) => {
    const freq = { numerator: times, denominator: 7, type: FrequencyType.WEEKLY }
    setNumerator(times)
    setDenominator(7)
    onChange(freq)
  }

  const handleCustomChange = (num: number, den: number) => {
    // Validate inputs
    const validNum = Math.max(1, Math.min(365, num || 1))
    const validDen = Math.max(1, Math.min(365, den || 1))

    setNumerator(validNum)
    setDenominator(validDen)
    onChange({ numerator: validNum, denominator: validDen, type: FrequencyType.CUSTOM })
  }

  // Calculate display text
  const getFrequencyText = () => {
    if (numerator === denominator) {
      return 'Every day'
    } else if (numerator === 1 && denominator === 7) {
      return 'Once per week'
    } else if (denominator === 7) {
      return `${numerator} times per week`
    } else if (numerator === 1) {
      return `Once every ${denominator} days`
    } else {
      return `${numerator} times every ${denominator} days`
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Type Selection */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleTypeChange(FrequencyType.DAILY)}
          className={cn(
            "px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
            type === FrequencyType.DAILY
              ? "border-primary bg-primary/10 text-foreground"
              : "border-card-border bg-card/40 text-muted-foreground hover:border-primary/30"
          )}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange(FrequencyType.WEEKLY)}
          className={cn(
            "px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
            type === FrequencyType.WEEKLY
              ? "border-primary bg-primary/10 text-foreground"
              : "border-card-border bg-card/40 text-muted-foreground hover:border-primary/30"
          )}
        >
          Weekly
        </button>
        <button
          type="button"
          onClick={() => handleTypeChange(FrequencyType.CUSTOM)}
          className={cn(
            "px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all",
            type === FrequencyType.CUSTOM
              ? "border-primary bg-primary/10 text-foreground"
              : "border-card-border bg-card/40 text-muted-foreground hover:border-primary/30"
          )}
        >
          Custom
        </button>
      </div>

      {/* Weekly Presets */}
      {type === FrequencyType.WEEKLY && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Quick Presets
          </label>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7].map(times => (
              <button
                key={times}
                type="button"
                onClick={() => handleWeeklyPreset(times)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  numerator === times && denominator === 7
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted/20 text-foreground hover:bg-muted/40 border-2 border-card-border'
                )}
              >
                {times}x/week
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom Inputs */}
      {type === FrequencyType.CUSTOM && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Custom Frequency
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="365"
              value={numerator}
              onChange={(e) => handleCustomChange(parseInt(e.target.value) || 1, denominator)}
              className="w-20 px-3 py-2 border-2 border-card-border rounded-xl bg-card/40 text-foreground text-center focus:outline-none focus:border-primary/50 transition-colors"
              aria-label="Number of times"
            />
            <span className="text-sm text-muted-foreground">times every</span>
            <input
              type="number"
              min="1"
              max="365"
              value={denominator}
              onChange={(e) => handleCustomChange(numerator, parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border-2 border-card-border rounded-xl bg-card/40 text-foreground text-center focus:outline-none focus:border-primary/50 transition-colors"
              aria-label="Number of days"
            />
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Valid range: 1-365 for both values. Numerator cannot exceed denominator.
          </p>
        </div>
      )}

      {/* Display Current Selection */}
      <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {getFrequencyText()}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: {numerator}/{denominator}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
