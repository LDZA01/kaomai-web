import { describe, expect, it } from 'vitest';
import {
  formatCaseManagerAssignment,
  validateCaseManager,
} from './case-managers';

describe('formatCaseManagerAssignment', () => {
  it('shows the assigned manager name and phone', () => {
    expect(
      formatCaseManagerAssignment({
        id: 'manager-1',
        name: 'อรทัย ใจดี',
        phone: '081-234-5678',
      }),
    ).toBe('อรทัย ใจดี · 081-234-5678');
  });

  it('shows an unassigned label when there is no manager', () => {
    expect(formatCaseManagerAssignment()).toBe('ยังไม่ได้มอบหมาย');
  });
});

describe('validateCaseManager', () => {
  it('rejects a whitespace-only name', () => {
    expect(validateCaseManager({ name: '   ', phone: '081-234-5678' })).toBe(
      'กรุณากรอกชื่อผู้จัดการรายกรณี',
    );
  });

  it('rejects a whitespace-only phone number', () => {
    expect(validateCaseManager({ name: 'อรทัย ใจดี', phone: '   ' })).toBe(
      'กรุณากรอกเบอร์โทรศัพท์',
    );
  });

  it('accepts a complete contact', () => {
    expect(
      validateCaseManager({ name: ' อรทัย ใจดี ', phone: ' 081-234-5678 ' }),
    ).toBeNull();
  });
});
