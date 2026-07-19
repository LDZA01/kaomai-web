import React, { useCallback, useEffect, useState } from 'react';
import { Edit3, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { getResidents, upsertResident, deleteResident } from '../../lib/db';
import { useAuthContext } from '../../App';
import type { Resident } from '../../types';

const emptyDraft = {
  name: '',
  age: 30,
  skills: '',
  availability: 'เต็มเวลา',
  notes: '',
};

const availabilityOptions = ['เต็มเวลา', 'พาร์ทไทม์', 'เฉพาะสุดสัปดาห์'];

const Residents = () => {
  const { org } = useAuthContext();
  const shelterId = org.shelter?.id ?? '';

  const [residents, setResidents] = useState<Resident[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchResidents = useCallback(async () => {
    if (!shelterId) return;
    setPageLoading(true);
    try {
      const data = await getResidents(shelterId);
      setResidents(data);
    } catch {
      setError('โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setPageLoading(false);
    }
  }, [shelterId]);

  useEffect(() => { fetchResidents(); }, [fetchResidents]);

  // ── Create / Update ────────────────────────────────────────────────────────
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!shelterId) {
      setError('ไม่พบข้อมูลศูนย์คนไร้บ้าน');
      return;
    }
    setError('');
    setSaving(true);

    try {
      const payload: Omit<Resident, 'id'> & { id?: string } = {
        shelterId,
        name: draft.name,
        age: Number(draft.age),
        skills: draft.skills.split(',').map((s) => s.trim()).filter(Boolean),
        availability: draft.availability,
        workAvailability: true,
        notes: draft.notes || undefined,
        photoUrl: editingId
          ? residents.find((r) => r.id === editingId)?.photoUrl
          : 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=70',
      };
      if (editingId) payload.id = editingId;

      const saved = await upsertResident(payload);

      setResidents((current) =>
        editingId
          ? current.map((r) => (r.id === editingId ? saved : r))
          : [saved, ...current],
      );
      setEditingId(null);
      setDraft(emptyDraft);
    } catch {
      setError('บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await deleteResident(id);
      setResidents((current) => current.filter((r) => r.id !== id));
    } catch {
      setError('ลบข้อมูลไม่สำเร็จ');
    }
  };

  const startEdit = (resident: Resident) => {
    setEditingId(resident.id);
    setDraft({
      name: resident.name,
      age: resident.age,
      skills: resident.skills.join(', '),
      availability: resident.availability,
      notes: resident.notes || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">โปรไฟล์คนไร้บ้าน</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          {org.shelter?.name ?? 'ศูนย์คนไร้บ้าน'} — เพิ่ม แก้ไข และจัดการข้อมูลความพร้อมในการทำงาน
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs sm:text-sm text-red-700">
          <span>⚠</span> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Form Card */}
      <Card>
        <div className="mb-4 sm:mb-5 flex items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${editingId ? 'bg-amber-100' : 'bg-blue-100'}`}>
            {editingId ? <Edit3 size={18} className="text-amber-700" /> : <Plus size={18} className="text-blue-700" />}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">{editingId ? 'แก้ไขโปรไฟล์คนไร้บ้าน' : 'เพิ่มคนไร้บ้านใหม่'}</h2>
            <p className="text-xs text-slate-400">{editingId ? 'อัปเดตข้อมูลด้านล่างแล้วกดบันทึก' : 'กรอกข้อมูลเพื่อสร้างโปรไฟล์ใหม่'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          <Input
            label="ชื่อ-นามสกุล"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="เช่น สมชาย ใจดี"
            required
          />
          <Input
            label="อายุ"
            type="number"
            value={draft.age}
            onChange={(e) => setDraft({ ...draft, age: Number(e.target.value) })}
            placeholder="30"
            required
          />
          <Input
            label="ทักษะ (คั่นด้วยเครื่องหมายจุลภาค)"
            value={draft.skills}
            onChange={(e) => setDraft({ ...draft, skills: e.target.value })}
            placeholder="ทำความสะอาด, ทำอาหาร, ช่างทั่วไป"
            required
          />
          <div className="flex flex-col mb-3">
            <label className="mb-1.5 text-xs sm:text-sm font-semibold text-slate-700">
              ความพร้อมในการทำงาน <span className="text-red-400">*</span>
            </label>
            <select
              value={draft.availability}
              onChange={(e) => setDraft({ ...draft, availability: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {availabilityOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Input
              label="หมายเหตุเพิ่มเติม"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="ข้อมูลเพิ่มเติม เช่น ประสบการณ์, ข้อจำกัด, ความต้องการพิเศษ"
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2.5 pt-1">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving
                ? <Loader2 size={18} className="animate-spin" aria-hidden />
                : editingId ? <Save size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
              {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มโปรไฟล์'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>
                ยกเลิก
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Residents Grid */}
      <section>
        <h2 className="mb-4 text-base sm:text-lg font-bold text-slate-700">
          คนไร้บ้านทั้งหมด{' '}
          <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs sm:text-sm font-bold text-blue-700">
            {pageLoading ? '...' : residents.length}
          </span>
        </h2>

        {pageLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={28} className="animate-spin mr-2" /> กำลังโหลด...
          </div>
        ) : residents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center text-xs sm:text-sm text-slate-400">
            ยังไม่มีข้อมูลคนไร้บ้าน — กรอกฟอร์มด้านบนเพื่อเพิ่มโปรไฟล์แรก
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {residents.map((resident) => (
              <Card key={resident.id} imageUrl={resident.photoUrl} skills={resident.skills} className="flex flex-col justify-between">
                <div className="mt-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">{resident.name}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">อายุ</span>
                      <p className="font-semibold text-slate-700">{resident.age} ปี</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">ความพร้อม</span>
                      <p className="font-semibold text-slate-700">{resident.availability}</p>
                    </div>
                  </div>
                  {resident.notes && (
                    <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">{resident.notes}</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2 pt-1 border-t border-slate-100">
                  <Button type="button" variant="secondary" size="small" className="flex-1" onClick={() => startEdit(resident)}>
                    <Edit3 size={14} aria-hidden /> แก้ไข
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="small"
                    className="flex-1"
                    onClick={() => handleDelete(resident.id)}
                  >
                    <Trash2 size={14} aria-hidden /> ลบ
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Residents;
