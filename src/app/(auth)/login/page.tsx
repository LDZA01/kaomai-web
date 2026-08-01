import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { LoginForm } from '@/components/auth/LoginForm';

const benefits = ['ใช้งานง่าย', 'ข้อมูลปลอดภัย', 'มีทีมสนับสนุน'];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen min-w-0 bg-brand-50 lg:grid-cols-[1fr_1.05fr]">
      <section className="flex min-w-0 items-center justify-center p-4 sm:p-10">
        <div className="min-w-0 w-full max-w-lg rounded-[16px] bg-white p-5 shadow-[0_8px_20px_oklch(55%_0.2_260_/_0.1)] sm:p-10">
          <Logo />
          <h1 className="mt-10 text-3xl font-extrabold text-slate-950">ยินดีต้อนรับกลับ</h1>
          <p className="mt-2 text-slate-600">
            เข้าสู่พื้นที่ทำงาน แล้วเดินหน้าสร้างโอกาสไปด้วยกัน
          </p>
          <div className="mt-8 min-w-0">
            <LoginForm />
          </div>
        </div>
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/images/training-partnership.webp"
          alt="ทีมงานกำลังเรียนรู้และวางแผนร่วมกัน"
          fill
          priority
          className="object-cover"
          sizes="52vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <blockquote className="max-w-xl text-4xl font-bold leading-snug">
            ทุกขั้นตอนที่ชัดเจน ช่วยให้โอกาสเดินหน้าได้เร็วขึ้น
          </blockquote>
          <div className="mt-6 flex gap-5 text-sm font-semibold">
            {benefits.map((benefit) => (
              <span key={benefit} className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-opportunity-500" />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}
