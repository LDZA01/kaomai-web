import { describe, expect, it } from 'vitest';
import {
  formatDocumentCategory,
  formatPaymentPreference,
  formatPreferredWorkType,
  sanitizeDocumentFileName,
  validateResidentDocuments,
} from './resident-intake';

const MB = 1024 * 1024;

describe('validateResidentDocuments', () => {
  it('accepts supported files at the size and count boundaries', () => {
    const files = [
      { name: 'degree.pdf', type: 'application/pdf', size: 5 * MB },
      { name: 'photo.jpg', type: 'image/jpeg', size: 500 },
    ];

    expect(validateResidentDocuments(files, 3)).toBeNull();
  });

  it('rejects unsupported file types', () => {
    const files = [{ name: 'archive.zip', type: 'application/zip', size: 100 }];

    expect(validateResidentDocuments(files, 0)).toBe(
      'รองรับเฉพาะ PDF, JPG, PNG และ WebP',
    );
  });

  it('rejects a file larger than 5 MB', () => {
    const files = [{ name: 'large.pdf', type: 'application/pdf', size: 5 * MB + 1 }];

    expect(validateResidentDocuments(files, 0)).toBe('ไฟล์ต้องมีขนาดไม่เกิน 5 MB');
  });

  it('rejects more than five total documents', () => {
    const files = [
      { name: 'one.pdf', type: 'application/pdf', size: 100 },
      { name: 'two.pdf', type: 'application/pdf', size: 100 },
    ];

    expect(validateResidentDocuments(files, 4)).toBe('อัปโหลดเอกสารได้ไม่เกิน 5 ไฟล์');
  });
});

describe('resident intake formatting', () => {
  it('sanitizes a file name without losing its extension', () => {
    expect(sanitizeDocumentFileName('วุฒิ การศึกษา (ฉบับจริง).PDF')).toBe(
      'document.PDF',
    );
    expect(sanitizeDocumentFileName('my degree 2026.pdf')).toBe('my-degree-2026.pdf');
  });

  it('formats stored enum values and legacy blanks in Thai', () => {
    expect(formatPreferredWorkType('full_time')).toBe('งานเต็มเวลา');
    expect(formatPreferredWorkType('part_time')).toBe('งานพาร์ทไทม์');
    expect(formatPreferredWorkType(undefined)).toBe('ยังไม่ระบุ');
    expect(formatPaymentPreference('cash')).toBe('เงินสด');
    expect(formatPaymentPreference('bank_transfer')).toBe('โอนเข้าบัญชีธนาคาร');
    expect(formatPaymentPreference(undefined)).toBe('ยังไม่ระบุ');
    expect(formatDocumentCategory('education')).toBe('วุฒิการศึกษา');
  });
});
