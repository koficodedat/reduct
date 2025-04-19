import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { List } from '../../../src/list';
import { setAdaptiveImplementationEnabled, setCollectionThresholds } from '../../../src/list';
import { getUsagePatternMonitor, clearUsagePatternData, setAdaptiveImplementationEnabled as setMonitorAdaptiveEnabled } from '../../../src/profiling/usage-pattern-monitor';

describe('Adaptive Implementation Selection', () => {
  beforeEach(() => {
    // Enable adaptive implementation selection
    setAdaptiveImplementationEnabled(true);
    setMonitorAdaptiveEnabled(true);
    clearUsagePatternData();
  });

  afterEach(() => {
    // Reset to default settings
    setAdaptiveImplementationEnabled(false);
    setMonitorAdaptiveEnabled(false);
    clearUsagePatternData();

    // Reset thresholds to defaults
    setCollectionThresholds({
      small: 31,
      medium: 26,
      large: 10000
    });
  });

  it('should record operations for usage pattern monitoring', () => {
    // Create a list and perform operations
    const list = List.from([1, 2, 3, 4, 5]);

    // Perform various operations
    list.get(0);
    list.set(1, 10);
    list.append(6);
    list.prepend(0);
    list.map(x => x * 2);
    list.filter(x => x % 2 === 0);
    list.reduce((acc, x) => acc + x, 0);
    list.slice(1, 3);
    list.concat(List.from([7, 8, 9]));

    // Get the usage pattern monitor
    const monitor = getUsagePatternMonitor();
    const pattern = monitor.getUsagePattern();

    // Check that operations were recorded
    expect(pattern.frequentOperations.length).toBeGreaterThan(0);

    // Check that the average size is correct
    expect(pattern.averageSize).toBeGreaterThan(0);
  });

  it('should adapt thresholds based on usage patterns', () => {
    // Create a list and perform many append operations to influence the recommendation
    const list = List.from([1, 2, 3, 4, 5]);

    // Perform many append operations
    for (let i = 0; i < 200; i++) {
      list.append(i);
    }

    // Get the usage pattern monitor
    const monitor = getUsagePatternMonitor();
    const recommendation = monitor.getRecommendation();

    // Check that a recommendation was made
    expect(recommendation).not.toBeNull();

    if (recommendation) {
      // Check that the recommendation has a confidence level
      expect(recommendation.confidence).toBeGreaterThan(0);
    }
  });

  it('should disable adaptive implementation selection when custom thresholds are set', () => {
    // Enable adaptive implementation selection
    setAdaptiveImplementationEnabled(true);

    // Set custom thresholds
    setCollectionThresholds({
      small: 20,
      medium: 50,
      large: 5000
    });

    // Create a list and perform operations
    const list = List.from([1, 2, 3, 4, 5]);
    list.append(6);

    // Get the usage pattern monitor
    const monitor = getUsagePatternMonitor();
    const pattern = monitor.getUsagePattern();

    // Check that operations were recorded
    expect(pattern.frequentOperations.length).toBeGreaterThan(0);

    // Check that adaptive implementation selection is disabled
    expect(monitor.getRecommendation()).toBeNull();
  });
});
