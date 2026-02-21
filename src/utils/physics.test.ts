import { describe, it, expect } from 'vitest';
import { simulateRace } from './physics';
import { DEFAULT_CAR, DEFAULT_TRACK } from '../constants';

describe('Physics Simulation', () => {
  it('Monotonicity: Higher friction should result in slower time', () => {
    const lowFriction = simulateRace(DEFAULT_CAR, DEFAULT_TRACK, 0.05);
    const highFriction = simulateRace(DEFAULT_CAR, DEFAULT_TRACK, 0.1);
    
    expect(highFriction.finishTime).toBeGreaterThan(lowFriction.finishTime);
  });

  it('No-loss Energy Conservation: Energy error should be negligible', () => {
    const losslessCar = { ...DEFAULT_CAR, losslessTest: true };
    // Use smaller dt for better accuracy
    const result = simulateRace(losslessCar, DEFAULT_TRACK, undefined, 0.001);
    
    expect(Math.abs(result.energy.energyError)).toBeLessThan(0.05); // 0.05 Joules tolerance
  });

  it('dt Stability: Smaller time steps should converge', () => {
    const dt1 = 0.01;
    const dt2 = 0.001;
    
    const result1 = simulateRace(DEFAULT_CAR, DEFAULT_TRACK, undefined, dt1);
    const result2 = simulateRace(DEFAULT_CAR, DEFAULT_TRACK, undefined, dt2);
    
    const diff = Math.abs(result1.finishTime - result2.finishTime);
    // With smaller dt, the simulation is more accurate. The difference should be small.
    // 0.01s dt is quite coarse, so 0.001s should be noticeably different but close.
    expect(diff).toBeLessThan(0.05); // 50ms tolerance
  });
});
