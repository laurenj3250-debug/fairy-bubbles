import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HabitScoreIndicator } from './HabitScoreIndicator';

describe('HabitScoreIndicator', () => {
  describe('score rendering', () => {
    it('should render strong score (>=75%) with green styling', () => {
      render(<HabitScoreIndicator score={0.8} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
      expect(indicator.className).toContain('green');
    });

    it('should render building score (50-74%) with blue styling', () => {
      render(<HabitScoreIndicator score={0.65} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('Building')).toBeInTheDocument();
      expect(indicator.className).toContain('blue');
    });

    it('should render growing score (25-49%) with yellow styling', () => {
      render(<HabitScoreIndicator score={0.35} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(screen.getByText('35%')).toBeInTheDocument();
      expect(screen.getByText('Growing')).toBeInTheDocument();
      expect(indicator.className).toContain('yellow');
    });

    it('should render weak score (<25%) with gray styling', () => {
      render(<HabitScoreIndicator score={0.15} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(screen.getByText('15%')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();
      expect(indicator.className).toContain('gray');
    });
  });

  describe('edge cases', () => {
    it('should handle score of 0', () => {
      render(<HabitScoreIndicator score={0} />);

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('Weak')).toBeInTheDocument();
    });

    it('should handle score of 1 (100%)', () => {
      render(<HabitScoreIndicator score={1} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('should handle boundary at 0.75 (strong)', () => {
      render(<HabitScoreIndicator score={0.75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Strong')).toBeInTheDocument();
    });

    it('should handle boundary at 0.50 (building)', () => {
      render(<HabitScoreIndicator score={0.50} />);

      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('Building')).toBeInTheDocument();
    });

    it('should handle boundary at 0.25 (growing)', () => {
      render(<HabitScoreIndicator score={0.25} />);

      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText('Growing')).toBeInTheDocument();
    });

    it('should handle decimal scores with rounding', () => {
      render(<HabitScoreIndicator score={0.847} />);

      // Should round 84.7% to 85%
      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('should apply small size classes', () => {
      render(<HabitScoreIndicator score={0.8} size="sm" />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator.className).toContain('text-[10px]');
    });

    it('should apply medium size classes by default', () => {
      render(<HabitScoreIndicator score={0.8} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator.className).toContain('text-xs');
    });

    it('should apply large size classes', () => {
      render(<HabitScoreIndicator score={0.8} size="lg" />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator.className).toContain('text-sm');
    });
  });

  describe('accessibility', () => {
    it('should have a descriptive title attribute', () => {
      render(<HabitScoreIndicator score={0.8} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator).toHaveAttribute('title', 'Habit strength: 80% (Strong)');
    });

    it('should update title based on score category', () => {
      render(<HabitScoreIndicator score={0.3} />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator).toHaveAttribute('title', 'Habit strength: 30% (Growing)');
    });
  });

  describe('custom className', () => {
    it('should accept and apply custom className', () => {
      render(<HabitScoreIndicator score={0.8} className="custom-class" />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator.className).toContain('custom-class');
    });

    it('should preserve built-in classes when custom className is provided', () => {
      render(<HabitScoreIndicator score={0.8} className="custom-class" />);

      const indicator = screen.getByTestId('habit-score-indicator');
      expect(indicator.className).toContain('inline-flex');
      expect(indicator.className).toContain('rounded-full');
      expect(indicator.className).toContain('custom-class');
    });
  });

  describe('visual consistency', () => {
    it('should always show percentage and label', () => {
      const testScores = [0, 0.25, 0.5, 0.75, 1];

      testScores.forEach(score => {
        const { container } = render(<HabitScoreIndicator score={score} />);

        // Should have both percentage and label
        const percentageText = screen.getByText(`${Math.round(score * 100)}%`);
        expect(percentageText).toBeInTheDocument();

        // Should have a label
        const labels = ['Weak', 'Growing', 'Building', 'Strong'];
        const hasLabel = labels.some(label => {
          try {
            screen.getByText(label);
            return true;
          } catch {
            return false;
          }
        });
        expect(hasLabel).toBe(true);

        // Clean up for next iteration
        container.remove();
      });
    });
  });
});
