import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Home, Building2, HeartHandshake } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthContext } from '../../App';
import type { UserRole } from '../../types';

const Register = () => {
  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('shelter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await signUp(email, password, role, displayName);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate(role === 'employer' ? '/employer/dashboard' : '/shelter/dashboard');
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-10 animate-fade-in">
      {/* Logo & Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-200">
          <HeartHandshake size={30} className="text-white" aria-hidden />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-slate-500">เลือกบทบาทของคุณและเริ่มต้นสร้างโอกาส</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100">
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            <span className="text-red-400">⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-1">
          <Input
            label="ชื่อหรือชื่อองค์กร"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            placeholder="เช่น บ้านใหม่ สุวรรณภูมิ"
          />
          <Input
            label="อีเมล"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
          />
          <Input
            label="รหัสผ่าน"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="อย่างน้อย 8 ตัวอักษร"
          />

          {/* Role Selector */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              บทบาทของคุณ <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('shelter')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-all duration-150 ${
                  role === 'shelter'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Home size={22} className={role === 'shelter' ? 'text-blue-600' : 'text-slate-400'} />
                เจ้าหน้าที่ศูนย์
              </button>
              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-all duration-150 ${
                  role === 'employer'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Building2 size={22} className={role === 'employer' ? 'text-emerald-600' : 'text-slate-400'} />
                ผู้จ้างงาน
              </button>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus size={18} aria-hidden />
              {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
