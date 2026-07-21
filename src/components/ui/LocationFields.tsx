'use client';

import { useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { Field } from '@/components/ui/Field';

type Props = {
  addressName?: string;
  addressLabel: string;
  defaultAddress?: string;
  defaultLatitude?: number;
  defaultLongitude?: number;
};

export function LocationFields({
  addressName = 'location',
  addressLabel,
  defaultAddress = '',
  defaultLatitude,
  defaultLongitude,
}: Props) {
  const [latitude, setLatitude] = useState(defaultLatitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(defaultLongitude?.toString() ?? '');
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  function captureLocation() {
    if (!navigator.geolocation) {
      setMessage({ tone: 'error', text: 'อุปกรณ์นี้ไม่รองรับการค้นหาตำแหน่ง กรุณากรอกพิกัดด้วยตนเอง' });
      return;
    }
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
        setMessage({ tone: 'success', text: 'เพิ่มพิกัดจากตำแหน่งปัจจุบันแล้ว กรุณาตรวจสอบที่อยู่ก่อนบันทึก' });
      },
      () => {
        setLocating(false);
        setMessage({ tone: 'error', text: 'ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงหรือกรอกพิกัดด้วยตนเอง' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return <fieldset className="grid gap-4 rounded-[12px] bg-slate-50 p-4 sm:p-5">
    <legend className="px-1 font-extrabold text-slate-950"><span className="inline-flex items-center gap-2"><MapPin size={18} className="text-brand-600"/>{addressLabel}</span></legend>
    <Field name={addressName} label="ที่อยู่" defaultValue={defaultAddress} placeholder="เลขที่ ถนน เขต/อำเภอ จังหวัด รหัสไปรษณีย์" required />
    <div className="grid gap-4 sm:grid-cols-2">
      <Field name="latitude" label="ละติจูด" type="number" inputMode="decimal" step="any" min={-90} max={90} value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="13.756300" />
      <Field name="longitude" label="ลองจิจูด" type="number" inputMode="decimal" step="any" min={-180} max={180} value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="100.501800" />
    </div>
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <button type="button" onClick={captureLocation} disabled={locating} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60 focus-visible:ring-4 focus-visible:ring-brand-100"><LocateFixed size={18}/>{locating ? 'กำลังค้นหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบัน'}</button>
      <p className="text-sm text-slate-500">พิกัดช่วยคำนวณระยะทางโดยประมาณและไม่ถูกเปิดเผยก่อนอนุมัติ</p>
    </div>
    {message && <p role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-[10px] p-3 text-sm font-semibold ${message.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-hope-50 text-hope-700'}`}>{message.text}</p>}
  </fieldset>;
}
