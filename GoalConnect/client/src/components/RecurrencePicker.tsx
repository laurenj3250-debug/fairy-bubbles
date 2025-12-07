import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RecurrencePattern,
  RecurrenceType,
  EndConditionType,
  generateRecurrencePreview,
  patternToString,
  RECURRENCE_PRESETS,
  validateRecurrencePattern
} from '../../../shared/lib/recurrenceEngine';

interface RecurrencePickerProps {
  value: RecurrencePattern | null;
  onChange: (pattern: RecurrencePattern | null) => void;
  startDate?: Date;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RecurrencePicker({ value, onChange, startDate = new Date() }: RecurrencePickerProps) {
  const [pattern, setPattern] = useState<RecurrencePattern>(
    value || RECURRENCE_PRESETS.daily()
  );

  // Sync internal state when value prop changes
  useEffect(() => {
    if (value) {
      setPattern(value);
    }
  }, [value]);

  const handlePatternChange = (updates: Partial<RecurrencePattern>) => {
    const newPattern = { ...pattern, ...updates };
    setPattern(newPattern);
    onChange(newPattern);
  };

  const handlePreset = (presetName: keyof typeof RECURRENCE_PRESETS) => {
    const newPattern = RECURRENCE_PRESETS[presetName]();
    setPattern(newPattern);
    onChange(newPattern);
  };

  const handleClear = () => {
    onChange(null);
  };

  const toggleDayOfWeek = (day: number) => {
    const currentDays = pattern.daysOfWeek || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b);

    handlePatternChange({ daysOfWeek: newDays });
  };

  const validation = validateRecurrencePattern(pattern);
  const preview = validation.valid ? generateRecurrencePreview(pattern, startDate, 5) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Repeat className="h-4 w-4" />
          Repeat
        </Label>
        {value && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {/* Quick Presets - 4 columns: None + 6 presets */}
      <div className="grid grid-cols-4 gap-2">
        <Button
          variant={!value ? 'default' : 'outline'}
          size="sm"
          onClick={handleClear}
          aria-pressed={!value}
        >
          None
        </Button>
        <Button
          variant={value && pattern.type === 'daily' && pattern.interval === 1 ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset('daily')}
        >
          Daily
        </Button>
        <Button
          variant={value && pattern.type === 'weekly' && pattern.interval === 1 && !pattern.daysOfWeek ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset('weekly')}
        >
          Weekly
        </Button>
        <Button
          variant={value && pattern.type === 'monthly' && pattern.interval === 1 ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset('monthly')}
        >
          Monthly
        </Button>
        <Button
          variant={value && pattern.type === 'yearly' && pattern.interval === 1 ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset('yearly')}
        >
          Yearly
        </Button>
        <Button
          variant={value && pattern.daysOfWeek?.length === 5 && pattern.daysOfWeek.includes(1) ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset('weekdays')}
        >
          Weekdays
        </Button>
        <Button
          variant={value && pattern.daysOfWeek?.length === 2 && pattern.daysOfWeek.includes(0) && pattern.daysOfWeek.includes(6) ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePreset('weekends')}
        >
          Weekends
        </Button>
      </div>

      {/* Show message when no recurrence selected */}
      {!value && (
        <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md">
          No recurrence pattern. This will be a one-time task.
        </div>
      )}

      {/* Custom controls only shown when recurrence is active */}
      {value && (
        <>
          {/* Custom Interval */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recurrence-type">Repeat every</Label>
              <div className="flex gap-2">
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  value={pattern.interval}
                  onChange={(e) => handlePatternChange({ interval: parseInt(e.target.value) || 1 })}
                  className="w-20"
                />
                <Select
                  value={pattern.type}
                  onValueChange={(type) => handlePatternChange({ type: type as RecurrenceType })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">day(s)</SelectItem>
                    <SelectItem value="weekly">week(s)</SelectItem>
                    <SelectItem value="monthly">month(s)</SelectItem>
                    <SelectItem value="yearly">year(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Day of Week Picker (for weekly) */}
          {pattern.type === 'weekly' && (
            <div className="space-y-2">
              <Label>Repeat on</Label>
              <div className="flex gap-2">
                {DAY_NAMES.map((day, index) => (
                  <Button
                    key={index}
                    variant={pattern.daysOfWeek?.includes(index) ? 'default' : 'outline'}
                    size="sm"
                    className="w-12 h-12 p-0"
                    onClick={() => toggleDayOfWeek(index)}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month Picker (for monthly) */}
          {pattern.type === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="day-of-month">Day of month</Label>
              <Input
                id="day-of-month"
                type="number"
                min="1"
                max="31"
                value={pattern.dayOfMonth || startDate.getDate()}
                onChange={(e) => handlePatternChange({ dayOfMonth: parseInt(e.target.value) || 1 })}
                className="w-24"
              />
              <p className="text-xs text-muted-foreground">
                For months with fewer days, the last day will be used
              </p>
            </div>
          )}

          {/* End Condition */}
          <div className="space-y-2">
            <Label htmlFor="end-condition">Ends</Label>
            <Select
              value={pattern.endCondition}
              onValueChange={(val) => handlePatternChange({ endCondition: val as EndConditionType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="on_date">On date</SelectItem>
                <SelectItem value="after_count">After</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* End Date Picker */}
          {pattern.endCondition === 'on_date' && (
            <div className="space-y-2">
              <Label>End date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !pattern.endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pattern.endDate ? format(new Date(pattern.endDate), 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pattern.endDate ? new Date(pattern.endDate) : undefined}
                    onSelect={(date) => handlePatternChange({ endDate: date?.toISOString() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* End After Count */}
          {pattern.endCondition === 'after_count' && (
            <div className="space-y-2">
              <Label htmlFor="end-count">Number of occurrences</Label>
              <Input
                id="end-count"
                type="number"
                min="1"
                value={pattern.endAfterCount || 1}
                onChange={(e) => handlePatternChange({ endAfterCount: parseInt(e.target.value) || 1 })}
                className="w-32"
              />
            </div>
          )}

          {/* Pattern Summary */}
          <Card className="p-3 bg-muted">
            <p className="text-sm font-medium mb-2">Summary</p>
            <p className="text-sm text-muted-foreground">{patternToString(pattern)}</p>
          </Card>

          {/* Preview */}
          {validation.valid && preview.length > 0 && (
            <div className="space-y-2">
              <Label>Next 5 occurrences</Label>
              <Card className="p-3">
                <ul className="space-y-1 text-sm">
                  {preview.map((item, index) => (
                    <li key={index} className="text-muted-foreground">
                      {item.formatted}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Validation Errors */}
          {!validation.valid && (
            <Card className="p-3 bg-destructive/10 border-destructive">
              <p className="text-sm font-medium text-destructive mb-1">Invalid pattern</p>
              <ul className="text-sm text-destructive space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
