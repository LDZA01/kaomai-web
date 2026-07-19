import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Home, Building2, Check, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthContext } from '../../App';
import type { UserRole } from '../../types';

// ── Validation rules ──────────────────────────────────────────────────────────

// local part ≥2 chars, domain, TLD ≥2 chars
const emailRegex = /^[a-zA-Z0-9._%+\-]{2,}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const validators = {
  displayName: (v: string) => {
    if (!v.trim()) return 'กรุณากรอกชื่อ';
    if (v.trim().length < 2) return 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
    return '';
  },
  email: (v: string) => {
    if (!v.trim()) return 'กรุณากรอกอีเมล';
    if (!emailRegex.test(v)) return 'รูปแบบอีเมลไม่ถูกต้อง เช่น name@email.com';
    return '';
  },
  password: (v: string) => {
    if (!v) return 'กรุณากรอกรหัสผ่าน';
    if (v.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
    if (!/[A-Z]/.test(v)) return 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A–Z)';
    if (!/[a-z]/.test(v)) return 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว (a–z)';
    if (!/[0-9]/.test(v)) return 'ต้องมีตัวเลขอย่างน้อย 1 ตัว (0–9)';
    return '';
  },
  shelterName: (v: string) => (!v.trim() ? 'กรุณากรอกชื่อศูนย์' : ''),
  shelterAddress: (v: string) => (!v.trim() ? 'กรุณากรอกที่อยู่หรือย่าน' : ''),
  businessName: (v: string) => (!v.trim() ? 'กรุณากรอกชื่อบริษัทหรือร้าน' : ''),
  industry: (v: string) => (!v.trim() ? 'กรุณากรอกประเภทธุรกิจ' : ''),
};

// ── Password strength ─────────────────────────────────────────────────────────

const pwRules = [
  { label: 'อย่างน้อย 8 ตัวอักษร', test: (p: string) => p.length >= 8 },
  { label: 'มีตัวพิมพ์ใหญ่ (A–Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'มีตัวพิมพ์เล็ก (a–z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'มีตัวเลข (0–9)', test: (p: string) => /[0-9]/.test(p) },
];

const strengthMeta = [
  { label: '', color: '#e2e8f0', bg: 'bg-slate-200' },
  { label: 'อ่อนมาก', color: '#ef4444', bg: 'bg-red-400' },
  { label: 'อ่อน', color: '#f97316', bg: 'bg-orange-400' },
  { label: 'ปานกลาง', color: '#eab308', bg: 'bg-yellow-400' },
  { label: 'แข็งแกร่ง', color: '#22c55e', bg: 'bg-green-500' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const Register = () => {
  const { signUp } = useAuthContext();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('shelter');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shelterName, setShelterName] = useState('');
  const [shelterAddress, setShelterAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  // Compute errors for currently visible fields
  const errors = {
    displayName: validators.displayName(displayName),
    email: validators.email(email),
    password: validators.password(password),
    ...(role === 'shelter'
      ? {
          shelterName: validators.shelterName(shelterName),
          shelterAddress: validators.shelterAddress(shelterAddress),
        }
      : {
          businessName: validators.businessName(businessName),
          industry: validators.industry(industry),
        }),
  };

  const hasErrors = Object.values(errors).some(Boolean);

  const fieldProps = (
    field: keyof typeof errors,
    value: string,
  ): { error?: string; success?: boolean } => {
    // server-side error takes priority
    if (fieldErrors[field]) return { error: fieldErrors[field] };
    if (!touched[field]) return {};
    const err = errors[field];
    return err ? { error: err } : { success: true };
  };

  const handleChange = (field: string, setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    // clear server error on re-type
    if (fieldErrors[field]) setFieldErrors((fe) => ({ ...fe, [field]: '' }));
    if (touched[field]) touch(field);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Touch all fields to reveal any hidden errors
    const allFields = ['displayName', 'email', 'password',
      ...(role === 'shelter' ? ['shelterName', 'shelterAddress'] : ['businessName', 'industry'])];
    setTouched(Object.fromEntries(allFields.map((f) => [f, true])));

    if (hasErrors) return;

    setSubmitError('');
    setFieldErrors({});
    setLoading(true);

    const orgInfo =
      role === 'shelter'
        ? { shelterName, shelterAddress }
        : { businessName, industry };

    const { error: authError } = await signUp(email, password, role, displayName, orgInfo);

    if (authError) {
      // Map known Supabase error codes to the correct field
      const code: string = (authError as any).code ?? '';
      const msg: string = authError.message ?? '';

      if (code === 'email_address_invalid' || msg.toLowerCase().includes('email')) {
        setFieldErrors({ email: 'อีเมลนี้ไม่ถูกต้องหรือไม่มีอยู่จริง กรุณาใช้อีเมลที่ถูกต้อง' });
        setTouched((t) => ({ ...t, email: true }));
      } else if (code === 'user_already_exists' || msg.toLowerCase().includes('already')) {
        setFieldErrors({ email: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น' });
        setTouched((t) => ({ ...t, email: true }));
      } else if (code === 'weak_password' || msg.toLowerCase().includes('password')) {
        setFieldErrors({ password: 'รหัสผ่านไม่ผ่านเงื่อนไขความปลอดภัย กรุณาลองใหม่' });
        setTouched((t) => ({ ...t, password: true }));
      } else {
        setSubmitError(msg);
      }
      setLoading(false);
      return;
    }

    navigate(role === 'employer' ? '/employer/dashboard' : '/shelter/dashboard');
  };

  const pwStrength = pwRules.filter((r) => r.test(password)).length;
  const meta = strengthMeta[pwStrength];

  return (
    <div className="mx-auto flex max-w-lg flex-col justify-center py-10 animate-fade-in">
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0d4f47, #0d9488)', boxShadow: '0 8px 24px rgba(13,148,136,0.25)' }}
        >
          <img
            src="/pic/kaowmai-mark.svg"
            alt="ก้าวใหม่"
            className="h-9 w-9"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <h1 className="text-2xl font-extrabold" style={{ color: '#173A5E' }}>สมัครสมาชิก</h1>
        <p className="mt-1 text-sm text-slate-500">เลือกบทบาทของคุณและเริ่มต้นสร้างโอกาส</p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg">
        {/* Submit error */}
        {submitError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
            <span>⚠</span> {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* ── Role selector ──────────────────────────────────────────────── */}
          <div>
            <p className="mb-2 text-sm font-bold text-slate-700">
              ฉันเป็น <span className="text-red-400">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'shelter', label: 'ศูนย์คนไร้บ้าน', icon: Home },
                { value: 'employer', label: 'ผู้จ้างงาน', icon: Building2 },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRole(value);
                    // reset org fields when switching role
                    setShelterName(''); setShelterAddress('');
                    setBusinessName(''); setIndustry('');
                    setTouched((t) => ({
                      ...t,
                      shelterName: false, shelterAddress: false,
                      businessName: false, industry: false,
                    }));
                  }}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-all"
                  style={
                    role === value
                      ? { borderColor: '#173A5E', background: '#f0f6fc', color: '#173A5E' }
                      : { borderColor: '#e2e8f0', color: '#64748b' }
                  }
                >
                  <Icon size={22} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── User info ─────────────────────────────────────────────────── */}
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">ข้อมูลผู้ใช้</p>

            <Input
              label="ชื่อ-นามสกุล / ชื่อผู้ประสานงาน"
              value={displayName}
              onChange={handleChange('displayName', setDisplayName)}
              onBlur={() => handleBlur('displayName')}
              placeholder="เช่น คุณสมชาย ใจดี"
              required
              {...fieldProps('displayName', displayName)}
            />

            <Input
              label="อีเมล"
              type="email"
              value={email}
              onChange={handleChange('email', setEmail)}
              onBlur={() => handleBlur('email')}
              placeholder="your@email.com"
              hint="ใช้อีเมลที่ใช้งานได้จริง เช่น name@company.com"
              required
              {...fieldProps('email', email)}
            />

            {/* Password with strength bar */}
            <div>
              <Input
                label="รหัสผ่าน"
                type="password"
                value={password}
                onChange={handleChange('password', setPassword)}
                onBlur={() => handleBlur('password')}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                {...(touched.password && errors.password
                  ? { error: errors.password }
                  : touched.password && !errors.password
                  ? { success: true }
                  : {})}
              />

              {/* Strength indicator — shown whenever user starts typing */}
              {password.length > 0 && (
                <div className="mt-1 mb-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            level <= pwStrength ? meta.bg : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold w-14 text-right" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {pwRules.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                          {passed
                            ? <Check size={12} className="text-green-500 shrink-0" />
                            : <X size={12} className="text-red-400 shrink-0" />}
                          <span className={passed ? 'text-green-700' : 'text-slate-400'}>
                            {rule.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── Org info (conditional) ────────────────────────────────────── */}
          <div className="border-t border-slate-100 pt-4">
            {role === 'shelter' ? (
              <>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#173A5E' }}>
                  ข้อมูลศูนย์คนไร้บ้าน
                </p>
                <Input
                  label="ชื่อศูนย์"
                  value={shelterName}
                  onChange={handleChange('shelterName', setShelterName)}
                  onBlur={() => handleBlur('shelterName')}
                  placeholder="เช่น ศูนย์คนไร้บ้านบ้านใหม่"
                  required
                  hint="ชื่อที่จะแสดงในระบบสำหรับศูนย์ของคุณ"
                  {...fieldProps('shelterName', shelterName)}
                />
                <Input
                  label="ที่อยู่ / ย่าน"
                  value={shelterAddress}
                  onChange={handleChange('shelterAddress', setShelterAddress)}
                  onBlur={() => handleBlur('shelterAddress')}
                  placeholder="เช่น ปทุมวัน, กรุงเทพมหานคร"
                  required
                  hint="ระบุย่านหรือที่ตั้งคร่าวๆ ของศูนย์"
                  {...fieldProps('shelterAddress', shelterAddress)}
                />
              </>
            ) : (
              <>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#0d9488' }}>
                  ข้อมูลธุรกิจ
                </p>
                <Input
                  label="ชื่อบริษัท / ร้าน"
                  value={businessName}
                  onChange={handleChange('businessName', setBusinessName)}
                  onBlur={() => handleBlur('businessName')}
                  placeholder="เช่น ครัวเขียว เคเทอริ่ง"
                  required
                  hint="ชื่อที่จะแสดงให้ผู้สมัครเห็น"
                  {...fieldProps('businessName', businessName)}
                />
                <Input
                  label="ประเภทธุรกิจ"
                  value={industry}
                  onChange={handleChange('industry', setIndustry)}
                  onBlur={() => handleBlur('industry')}
                  placeholder="เช่น ร้านอาหาร, โรงแรม, เกษตร"
                  required
                  hint="ช่วยให้ระบบจับคู่ทักษะได้ตรงขึ้น"
                  {...fieldProps('industry', industry)}
                />
              </>
            )}
          </div>

          <Button
            type="submit"
            className="w-full !mt-5"
            disabled={loading}
          >
            <UserPlus size={18} aria-hidden />
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Register;
