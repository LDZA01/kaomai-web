import React, { useState } from 'react';
import { Edit3, Plus, Save, Trash2, UserCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { mockResidents } from '../../data/mockData';
import type { Resident } from '../../types';

const emptyResident = {
  name: '',
  age: 30,
  skills: '',
  availability: 'เต็มเวลา',
  notes: '',
};

const availabilityOptions = ['เต็มเวลา', 'พาร์ทไทม์', 'เฉพาะสุดสัปดาห์'];

const Residents = () => {
  const [residents, setResidents] = useState<Resident[]>(mockResidents);
  const [draft, setDraft] = useState(emptyResident);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resident: Resident = {
      id: editingId || crypto.randomUUID(),
      shelterId: 'shelter-1',
      name: draft.name,
      age: Number(draft.age),
      skills: draft.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      availability: draft.availability,
      workAvailability: true,
      notes: draft.notes,
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=70',
    };

    setResidents((current) =>
      editingId ? current.map((item) => (item.id === editingId ? resident : item)) : [resident, ...current],
    );
    setEditingId(null);
    setDraft(emptyResident);
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">โปรไฟล์ผู้พักพิง</h1>
        <p className="mt-1 text-slate-500">เพิ่ม แก้ไข และจัดการข้อมูลความพร้อมในการทำงานของผู้พักพิง</p>
      </div>

      {/* Form Card */}
      <Card>
        <div className="mb-5 flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${editingId ? 'bg-amber-100' : 'bg-blue-100'}`}>
            {editingId ? <Edit3 size={18} className="text-amber-700" /> : <Plus size={18} className="text-blue-700" />}
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{editingId ? 'แก้ไขโปรไฟล์ผู้พักพิง' : 'เพิ่มผู้พักพิงใหม่'}</h2>
            <p className="text-xs text-slate-400">{editingId ? 'อัปเดตข้อมูลด้านล่างแล้วกดบันทึก' : 'กรอกข้อมูลเพื่อสร้างโปรไฟล์ใหม่'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
          <div className="flex flex-col mb-4">
            <label className="mb-1.5 text-sm font-semibold text-slate-700">
              ความพร้อมในการทำงาน <span className="text-red-400">*</span>
            </label>
            <select
              value={draft.availability}
              onChange={(e) => setDraft({ ...draft, availability: e.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {availabilityOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Input
              label="หมายเหตุเพิ่มเติม"
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="ข้อมูลเพิ่มเติม เช่น ประสบการณ์, ข้อจำกัด, ความต้องการพิเศษ"
            />
          </div>
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit">
              {editingId ? <Save size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
              {editingId ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มโปรไฟล์'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={() => { setEditingId(null); setDraft(emptyResident); }}>
                ยกเลิก
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Residents Grid */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-700">
          ผู้พักพิงทั้งหมด <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-bold text-blue-700">{residents.length}</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {residents.map((resident) => (
            <Card key={resident.id} imageUrl={resident.photoUrl} skills={resident.skills}>
              <div className="mt-3">
                <h3 className="text-lg font-bold text-slate-900">{resident.name}</h3>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">อายุ</span>
                    <p className="font-semibold text-slate-700">{resident.age} ปี</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">ความพร้อม</span>
                    <p className="font-semibold text-slate-700">{resident.availability}</p>
                  </div>
                </div>
                {resident.notes && (
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">{resident.notes}</p>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="secondary" size="small" onClick={() => startEdit(resident)}>
                  <Edit3 size={14} aria-hidden />
                  แก้ไข
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="small"
                  onClick={() => setResidents((current) => current.filter((item) => item.id !== resident.id))}
                >
                  <Trash2 size={14} aria-hidden />
                  ลบ
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Residents;
