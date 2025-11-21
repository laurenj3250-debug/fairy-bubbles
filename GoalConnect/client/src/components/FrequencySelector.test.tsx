import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FrequencySelector } from './FrequencySelector'
import { FrequencyType } from '@shared/lib/habitFrequency'

describe('FrequencySelector', () => {
  it('renders all three type buttons', () => {
    const onChange = vi.fn()
    render(<FrequencySelector onChange={onChange} />)

    expect(screen.getByRole('button', { name: /daily/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument()
  })

  it('daily button sets 1/1 frequency', () => {
    const onChange = vi.fn()
    render(<FrequencySelector onChange={onChange} />)

    const dailyButton = screen.getByRole('button', { name: /daily/i })
    fireEvent.click(dailyButton)

    expect(onChange).toHaveBeenCalledWith({
      numerator: 1,
      denominator: 1,
      type: FrequencyType.DAILY
    })
  })

  it('weekly button shows presets and sets 1/7 frequency', () => {
    const onChange = vi.fn()
    render(<FrequencySelector onChange={onChange} />)

    const weeklyButton = screen.getByRole('button', { name: /weekly/i })
    fireEvent.click(weeklyButton)

    // Should show weekly presets
    expect(screen.getByRole('button', { name: '1x/week' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3x/week' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '5x/week' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7x/week' })).toBeInTheDocument()

    // Should call onChange with weekly frequency
    expect(onChange).toHaveBeenCalledWith({
      numerator: 1,
      denominator: 7,
      type: FrequencyType.WEEKLY
    })
  })

  it('weekly preset buttons work correctly', () => {
    const onChange = vi.fn()
    render(
      <FrequencySelector
        value={{ numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }}
        onChange={onChange}
      />
    )

    // Click 3x/week preset
    const threeTimesButton = screen.getByRole('button', { name: '3x/week' })
    fireEvent.click(threeTimesButton)

    expect(onChange).toHaveBeenCalledWith({
      numerator: 3,
      denominator: 7,
      type: FrequencyType.WEEKLY
    })

    // Click 5x/week preset
    onChange.mockClear()
    const fiveTimesButton = screen.getByRole('button', { name: '5x/week' })
    fireEvent.click(fiveTimesButton)

    expect(onChange).toHaveBeenCalledWith({
      numerator: 5,
      denominator: 7,
      type: FrequencyType.WEEKLY
    })
  })

  it('custom button shows numerator/denominator inputs', () => {
    const onChange = vi.fn()
    render(<FrequencySelector onChange={onChange} />)

    const customButton = screen.getByRole('button', { name: /custom/i })
    fireEvent.click(customButton)

    // Should show custom inputs
    expect(screen.getByLabelText(/number of times/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/number of days/i)).toBeInTheDocument()
  })

  it('custom inputs validate min/max values', () => {
    const onChange = vi.fn()
    render(
      <FrequencySelector
        value={{ numerator: 1, denominator: 1, type: FrequencyType.CUSTOM }}
        onChange={onChange}
      />
    )

    const numeratorInput = screen.getByLabelText(/number of times/i) as HTMLInputElement
    const denominatorInput = screen.getByLabelText(/number of days/i) as HTMLInputElement

    // Test min validation (should clamp to 1)
    fireEvent.change(numeratorInput, { target: { value: '0' } })
    expect(onChange).toHaveBeenCalledWith({
      numerator: 1,
      denominator: 1,
      type: FrequencyType.CUSTOM
    })

    // Test max validation (should clamp to 365)
    onChange.mockClear()
    fireEvent.change(denominatorInput, { target: { value: '500' } })
    expect(onChange).toHaveBeenCalledWith({
      numerator: 1,
      denominator: 365,
      type: FrequencyType.CUSTOM
    })
  })

  it('custom inputs update correctly', () => {
    const onChange = vi.fn()
    render(
      <FrequencySelector
        value={{ numerator: 1, denominator: 1, type: FrequencyType.CUSTOM }}
        onChange={onChange}
      />
    )

    const numeratorInput = screen.getByLabelText(/number of times/i) as HTMLInputElement
    const denominatorInput = screen.getByLabelText(/number of days/i) as HTMLInputElement

    // Update numerator to 2
    fireEvent.change(numeratorInput, { target: { value: '2' } })
    expect(onChange).toHaveBeenCalledWith({
      numerator: 2,
      denominator: 1,
      type: FrequencyType.CUSTOM
    })

    // Update denominator to 5
    onChange.mockClear()
    fireEvent.change(denominatorInput, { target: { value: '5' } })
    expect(onChange).toHaveBeenCalledWith({
      numerator: 2,
      denominator: 5,
      type: FrequencyType.CUSTOM
    })
  })

  it('onChange callback is called with correct values', () => {
    const onChange = vi.fn()
    render(<FrequencySelector onChange={onChange} />)

    // Test daily
    const dailyButton = screen.getByRole('button', { name: /daily/i })
    fireEvent.click(dailyButton)
    expect(onChange).toHaveBeenLastCalledWith({
      numerator: 1,
      denominator: 1,
      type: FrequencyType.DAILY
    })

    // Test weekly
    onChange.mockClear()
    const weeklyButton = screen.getByRole('button', { name: /weekly/i })
    fireEvent.click(weeklyButton)
    expect(onChange).toHaveBeenLastCalledWith({
      numerator: 1,
      denominator: 7,
      type: FrequencyType.WEEKLY
    })
  })

  it('displays current selection summary', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <FrequencySelector
        value={{ numerator: 1, denominator: 1, type: FrequencyType.DAILY }}
        onChange={onChange}
      />
    )

    // Should show "Every day" for daily
    expect(screen.getByText(/every day/i)).toBeInTheDocument()

    // Change to weekly
    rerender(
      <FrequencySelector
        value={{ numerator: 1, denominator: 7, type: FrequencyType.WEEKLY }}
        onChange={onChange}
      />
    )
    expect(screen.getByText(/once per week/i)).toBeInTheDocument()

    // Change to 3x per week
    rerender(
      <FrequencySelector
        value={{ numerator: 3, denominator: 7, type: FrequencyType.WEEKLY }}
        onChange={onChange}
      />
    )
    expect(screen.getByText(/3 times per week/i)).toBeInTheDocument()

    // Change to custom: 2 every 5 days
    rerender(
      <FrequencySelector
        value={{ numerator: 2, denominator: 5, type: FrequencyType.CUSTOM }}
        onChange={onChange}
      />
    )
    expect(screen.getByText(/2 times every 5 days/i)).toBeInTheDocument()
  })

  it('pre-selects value prop if provided', () => {
    const onChange = vi.fn()
    render(
      <FrequencySelector
        value={{ numerator: 3, denominator: 7, type: FrequencyType.WEEKLY }}
        onChange={onChange}
      />
    )

    // Should show 3x per week as selected
    expect(screen.getByText(/3 times per week/i)).toBeInTheDocument()

    // Should show weekly presets since type is WEEKLY
    const threeTimesButton = screen.getByRole('button', { name: '3x/week' })
    expect(threeTimesButton).toBeInTheDocument()
  })

  it('handles edge cases in display text', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <FrequencySelector
        value={{ numerator: 1, denominator: 14, type: FrequencyType.CUSTOM }}
        onChange={onChange}
      />
    )

    // "Once every 14 days"
    expect(screen.getByText(/once every 14 days/i)).toBeInTheDocument()

    // "7 times per week" (denominator is 7)
    rerender(
      <FrequencySelector
        value={{ numerator: 7, denominator: 7, type: FrequencyType.CUSTOM }}
        onChange={onChange}
      />
    )
    expect(screen.getByText(/every day/i)).toBeInTheDocument()
  })

  it('validates numerator cannot exceed denominator in UI', () => {
    const onChange = vi.fn()
    render(
      <FrequencySelector
        value={{ numerator: 2, denominator: 5, type: FrequencyType.CUSTOM }}
        onChange={onChange}
      />
    )

    const numeratorInput = screen.getByLabelText(/number of times/i) as HTMLInputElement
    const denominatorInput = screen.getByLabelText(/number of days/i) as HTMLInputElement

    // Try to set numerator > denominator (this should be handled by parent/API validation)
    // The component itself just validates min/max, not relationship
    fireEvent.change(numeratorInput, { target: { value: '10' } })
    expect(onChange).toHaveBeenCalledWith({
      numerator: 10,
      denominator: 5,
      type: FrequencyType.CUSTOM
    })
  })
})
