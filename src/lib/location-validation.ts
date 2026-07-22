import { isValidCoordinates, type Coordinates } from './distance';

export function parseOptionalCoordinates(
  latitudeValue: FormDataEntryValue | string | null,
  longitudeValue: FormDataEntryValue | string | null,
): Coordinates | undefined {
  const latitudeText = String(latitudeValue ?? '').trim();
  const longitudeText = String(longitudeValue ?? '').trim();
  if (!latitudeText && !longitudeText) return undefined;
  if (!latitudeText || !longitudeText) throw new Error('กรุณากรอกพิกัดให้ครบทั้งสองช่อง');
  const coordinates = { latitude: Number(latitudeText), longitude: Number(longitudeText) };
  if (!isValidCoordinates(coordinates)) throw new Error('พิกัดไม่ถูกต้อง กรุณาตรวจสอบละติจูดและลองจิจูด');
  return coordinates;
}
