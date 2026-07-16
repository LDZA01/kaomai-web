import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, HeartHandshake } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthContext } from '../../App';

const Login = () => {
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('shelter@kaomai.test');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { user, error: authError } = await login(email, password);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const redirectTo = (user as { role?: string })?.role === 'employer'
      ? '/employer/dashboard'
      : '/shelter/dashboard';
    navigate(redirectTo);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center py-10 animate-fade-in">
      {/* Logo & Branding */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg shadow-blue-200">
          <HeartHandshake size={30} className="text-white" aria-hidden />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">เข้าสู่ระบบ</h1>
        <p className="mt-1 text-sm text-slate-500">แพลตฟอร์มก้าวใหม่ — เชื่อมโอกาสสู่ชีวิตที่ดีกว่า</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-100">
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            <span className="text-red-400">⚠</span> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-1">
          <Input label="อีเมล" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
          <Input label="รหัสผ่าน" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn size={18} aria-hidden />
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </div>
        </form>

        {/* Quick login hints */}
        <div className="mt-6 rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">บัญชีทดสอบ</p>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span className="font-semibold text-blue-700">ศูนย์พักพิง:</span>
              <span className="font-mono">shelter@kaomai.test</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-emerald-700">ผู้จ้างงาน:</span>
              <span className="font-mono">employer@kaomai.test</span>
            </div>
            <p className="text-slate-400 pt-1">รหัสผ่าน: <span className="font-mono">password</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
