import type { CaseManagerContact } from '@/types';

type CaseManagerInput = {
  name: string;
  phone: string;
};

export function validateCaseManager(input: CaseManagerInput): string | null {
  if (!input.name.trim()) return 'กรุณากรอกชื่อผู้จัดการรายกรณี';
  if (!input.phone.trim()) return 'กรุณากรอกเบอร์โทรศัพท์';
  return null;
}

export function formatCaseManagerAssignment(
  contact?: CaseManagerContact,
): string {
  if (!contact) return 'ยังไม่ได้มอบหมาย';
  return `${contact.name} · ${contact.phone}`;
}
