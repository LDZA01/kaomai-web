import React, { useState } from 'react';
import { Save, Briefcase } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

const CreateJob = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [location, setLocation] = useState('');
  const [dailyWage, setDailyWage] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const payload = {
      employer_id: 'employer-1',
      title: jobTitle,
      job_description: jobDescription,
      required_skills: requiredSkills.split(',').map((skill) => skill.trim()).filter(Boolean),
      location,
      daily_wage: Number(dailyWage),
      status: 'open',
    };

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('jobs').insert(payload);
      if (error) {
        setMessage(`เกิดข้อผิดพลาด: ${error.message}`);
        setLoading(false);
        return;
      }
    }

    setMessage(isSupabaseConfigured ? 'ลงประกาศงานสำเร็จแล้ว!' : 'ลงประกาศงานสำเร็จ (ข้อมูล Mock)');
    setJobTitle('');
    setJobDescription('');
    setRequiredSkills('');
    setLocation('');
    setDailyWage('');
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">ลงประกาศงานใหม่</h1>
        <p className="mt-1 text-slate-500">กรอกรายละเอียดงาน ทักษะที่ต้องการ สถานที่ และอัตราค่าจ้าง</p>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <Briefcase size={20} className="text-emerald-700" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">ข้อมูลตำแหน่งงาน</h2>
            <p className="text-xs text-slate-400">ข้อมูลที่กรอกจะถูกใช้จับคู่กับผู้พักพิงที่เหมาะสม</p>
          </div>
        </div>

        {message && (
          <div className={`mb-5 flex items-center gap-2 rounded-xl p-3 text-sm ${
            message.includes('ผิดพลาด')
              ? 'bg-red-50 border border-red-100 text-red-700'
              : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
          }`}>
            <span>{message.includes('ผิดพลาด') ? '⚠' : '✓'}</span>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            label="ชื่อตำแหน่งงาน"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="เช่น ผู้ช่วยทำอาหาร, พนักงานทำความสะอาด"
            required
          />
          <div className="flex flex-col mb-4">
            <label className="mb-1.5 text-sm font-semibold text-slate-700">
              รายละเอียดงาน <span className="text-red-400">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="อธิบายลักษณะงาน ระยะเวลา และสภาพแวดล้อมการทำงาน"
              rows={3}
              required
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
          <Input
            label="ทักษะที่ต้องการ (คั่นด้วยเครื่องหมายจุลภาค)"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="เช่น ทำอาหาร, ทำความสะอาด, ยกของหนัก"
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="สถานที่ทำงาน"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="เช่น บางรัก, อารีย์, สาทร"
              required
            />
            <div className="flex flex-col mb-4">
              <label className="mb-1.5 text-sm font-semibold text-slate-700">
                อัตราค่าจ้าง (ต่อวัน) <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">฿</span>
                <input
                  type="number"
                  value={dailyWage}
                  onChange={(e) => setDailyWage(e.target.value)}
                  placeholder="500"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={loading} size="large">
            <Save size={18} aria-hidden />
            {loading ? 'กำลังบันทึก...' : 'ลงประกาศงาน'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default CreateJob;
