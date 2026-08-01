import type {
  DocumentCategory,
  PaymentPreference,
  PreferredWorkType,
} from '@/types';

export const MAX_RESIDENT_DOCUMENTS = 5;
export const MAX_RESIDENT_DOCUMENT_SIZE = 5 * 1024 * 1024;

export const DOCUMENT_CATEGORIES: ReadonlyArray<{
  value: DocumentCategory;
  label: string;
}> = [
  { value: 'education', label: 'วุฒิการศึกษา' },
  { value: 'training', label: 'ใบรับรองการฝึกอบรม' },
  { value: 'employment', label: 'เอกสารรับรองการทำงาน' },
  { value: 'other', label: 'เอกสารอื่น ๆ' },
];

const SUPPORTED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type DocumentFileLike = {
  name: string;
  type: string;
  size: number;
};

export function validateResidentDocuments(
  files: ReadonlyArray<DocumentFileLike>,
  existingCount: number,
): string | null {
  if (existingCount + files.length > MAX_RESIDENT_DOCUMENTS) {
    return 'อัปโหลดเอกสารได้ไม่เกิน 5 ไฟล์';
  }
  if (files.some((file) => !SUPPORTED_DOCUMENT_TYPES.has(file.type))) {
    return 'รองรับเฉพาะ PDF, JPG, PNG และ WebP';
  }
  if (files.some((file) => file.size > MAX_RESIDENT_DOCUMENT_SIZE)) {
    return 'ไฟล์ต้องมีขนาดไม่เกิน 5 MB';
  }
  return null;
}

export function sanitizeDocumentFileName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex) : '';
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
  const sanitizedBase = baseName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${sanitizedBase || 'document'}${extension}`;
}

export function formatPreferredWorkType(value?: PreferredWorkType): string {
  if (value === 'full_time') return 'งานเต็มเวลา';
  if (value === 'part_time') return 'งานพาร์ทไทม์';
  return 'ยังไม่ระบุ';
}

export function formatPaymentPreference(value?: PaymentPreference): string {
  if (value === 'cash') return 'เงินสด';
  if (value === 'bank_transfer') return 'โอนเข้าบัญชีธนาคาร';
  return 'ยังไม่ระบุ';
}

export function formatDocumentCategory(value: DocumentCategory): string {
  return DOCUMENT_CATEGORIES.find((category) => category.value === value)?.label ?? 'เอกสารอื่น ๆ';
}
