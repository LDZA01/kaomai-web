import Link from 'next/link';
import { Facebook, Linkedin, Mail } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export function PublicFooter() {
  return <footer className="border-t border-brand-100 bg-gradient-to-b from-brand-50 to-white py-14 text-slate-800">
    <div className="container-page grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
      <div><Logo /><p className="mt-5 max-w-md text-slate-600">เชื่อมศักยภาพกับโอกาส เพื่อให้ทุกคนก้าวไปสู่ชีวิตที่มั่นคงด้วยตนเอง</p><div className="mt-5 flex gap-2"><a href="#" aria-label="Facebook" className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm"><Facebook size={18}/></a><a href="#" aria-label="LinkedIn" className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm"><Linkedin size={18}/></a><a href="mailto:hello@kaowmai.org" aria-label="อีเมล" className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-700 shadow-sm"><Mail size={18}/></a></div></div>
      <div><h2 className="font-bold text-slate-950">สำรวจ</h2><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link href="/about">เกี่ยวกับเรา</Link><Link href="/impact">ผลลัพธ์ของเรา</Link><Link href="/partners">ร่วมเป็นพาร์ทเนอร์</Link></div></div>
      <div><h2 className="font-bold text-slate-950">แพลตฟอร์ม</h2><div className="mt-3 grid gap-2 text-sm text-slate-600"><Link href="/login">เข้าสู่ระบบ</Link><Link href="/register">สมัครใช้งาน</Link><a href="mailto:hello@kaowmai.org">hello@kaowmai.org</a></div></div>
    </div>
    <div className="container-page mt-10 border-t border-brand-100 pt-5 text-sm text-slate-600">© 2026 ก้าวใหม่ · ออกแบบเพื่อการเข้าถึงตาม WCAG 2.2 AA</div>
  </footer>;
}
