const integrityService = require('../../src/services/integrity.service');

describe('IntegrityService Unit Tests', () => {
  test('aggregateSignals calculates total score and risk level correctly', () => {
    const signals = [
      { signalType: 'TAB_SWITCH', timestamp: new Date() },
      { signalType: 'FULLSCREEN_EXIT', timestamp: new Date() },
      { signalType: 'FACE_NOT_DETECTED', timestamp: new Date() },
    ];
    const timings = [{ timeSpentSeconds: 2 }, { timeSpentSeconds: 15 }];

    const result = integrityService.aggregateSignals(signals, timings);

    expect(result.totalSignals).toBe(4); // 3 signals + 1 timing anomaly
    expect(result.signalCounts['TAB_SWITCH']).toBe(1);
    expect(result.signalCounts['FULLSCREEN_EXIT']).toBe(1);
    expect(result.signalCounts['FACE_NOT_DETECTED']).toBe(1);
    expect(result.signalCounts['UNUSUAL_ANSWER_TIMING']).toBe(1);
    expect(result.riskLevel).toBe('MEDIUM');
  });

  test('aggregateSignals assigns HIGH risk when total score exceeds threshold', () => {
    const signals = [
      { signalType: 'MULTIPLE_PERSON_DETECTED', timestamp: new Date() },
      { signalType: 'COPY_ATTEMPT', timestamp: new Date() },
      { signalType: 'PASTE_ATTEMPT', timestamp: new Date() },
    ];
    const result = integrityService.aggregateSignals(signals, []);

    expect(result.riskLevel).toBe('HIGH');
    expect(result.totalScore).toBeGreaterThanOrEqual(50);
  });

  test('buildDeterministicSummary produces neutral explanation', () => {
    const aggregation = {
      totalSignals: 2,
      riskLevel: 'MEDIUM',
      signalCounts: { TAB_SWITCH: 2 },
    };

    const summary = integrityService.buildDeterministicSummary(aggregation);
    expect(summary).toContain('indicators for instructor review');
    expect(summary).not.toContain('cheated');
  });
});
