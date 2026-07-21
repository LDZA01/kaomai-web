import { describe, expect, it } from 'vitest';
import { parseOptionalCoordinates } from './location-validation';

describe('parseOptionalCoordinates', () => {
  it('returns undefined when both fields are blank', () => {
    expect(parseOptionalCoordinates('', '')).toBeUndefined();
  });

  it('returns numeric coordinates for a valid pair', () => {
    expect(parseOptionalCoordinates('13.7563', '100.5018')).toEqual({ latitude: 13.7563, longitude: 100.5018 });
  });

  it('throws when only one coordinate is supplied', () => {
    expect(() => parseOptionalCoordinates('13.7', '')).toThrow('กรุณากรอกพิกัดให้ครบทั้งสองช่อง');
  });

  it('throws when coordinates are outside valid ranges', () => {
    expect(() => parseOptionalCoordinates('91', '100')).toThrow('พิกัดไม่ถูกต้อง');
  });
});
