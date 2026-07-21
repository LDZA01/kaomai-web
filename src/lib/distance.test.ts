import { describe, expect, it } from 'vitest';
import {
  distanceKilometers,
  formatDistanceThai,
  getApproximateDistance,
  isValidCoordinates,
} from './distance';

describe('distance utilities', () => {
  it('calculates a known Bangkok distance', () => {
    const km = distanceKilometers(
      { latitude: 13.7563, longitude: 100.5018 },
      { latitude: 13.7367, longitude: 100.5231 },
    );
    expect(km).toBeGreaterThan(2);
    expect(km).toBeLessThan(4);
  });

  it('returns zero for identical coordinates', () => {
    expect(distanceKilometers(
      { latitude: 13.7563, longitude: 100.5018 },
      { latitude: 13.7563, longitude: 100.5018 },
    )).toBe(0);
  });

  it('rejects coordinates outside valid ranges', () => {
    expect(isValidCoordinates({ latitude: 91, longitude: 100 })).toBe(false);
    expect(isValidCoordinates({ latitude: 13, longitude: 181 })).toBe(false);
  });

  it('returns null when either location is missing', () => {
    expect(getApproximateDistance(undefined, { latitude: 13, longitude: 100 })).toBeNull();
  });

  it('formats short and long distances in Thai', () => {
    expect(formatDistanceThai(0.45)).toBe('ประมาณ 450 เมตร');
    expect(formatDistanceThai(8.43)).toBe('ประมาณ 8.4 กม.');
  });
});
