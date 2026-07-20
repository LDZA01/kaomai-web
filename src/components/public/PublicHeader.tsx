'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const links = [{ href:'/#about', label:'เกี่ยวกับเรา' }, { href:'/#impact', label:'ผลลัพธ์ของเรา' }, { href:'/#partners', label:'ร่วมเป็นพาร์ทเนอร์' }];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const targets = { about: 'main section:nth-of-type(3)', impact: 'main section:nth-of-type(5)', partners: 'main section:nth-of-type(6)' };
    for (const [id, selector] of Object.entries(targets)) document.querySelector<HTMLElement>(selector)?.setAttribute('id', id);
    const id = window.location.hash.slice(1) as keyof typeof targets;
    if (targets[id]) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, []);
  return <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
    <div className="container-page flex min-h-[4.5rem] items-center justify-between gap-5">
      <Logo />
      <nav aria-label="เมนูหลัก" className="hidden items-center gap-1 lg:flex">{links.map(link => <Link key={link.href} href={link.href} className="rounded-[10px] px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700">{link.label}</Link>)}</nav>
      <div className="hidden items-center gap-2 lg:flex"><Link href="/login" className="inline-flex min-h-11 items-center rounded-[10px] px-4 font-bold text-brand-700 hover:bg-brand-50">เข้าสู่ระบบ</Link><Link href="/register" className="inline-flex min-h-11 items-center rounded-[12px] bg-brand-600 px-5 text-sm font-bold text-white shadow-[0_3px_6px_oklch(55%_0.2_260_/_0.2)] transition hover:bg-brand-700">เริ่มต้นใช้งาน</Link></div>
      <button type="button" className="grid h-11 w-11 place-items-center rounded-[10px] text-brand-700 hover:bg-brand-50 lg:hidden" aria-expanded={open} aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav aria-label="เมนูมือถือ" className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">{links.map(link => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} className="block min-h-11 rounded-[10px] px-3 py-2.5 font-semibold text-slate-800 hover:bg-brand-50">{link.label}</Link>)}<div className="mt-3 grid grid-cols-2 gap-2"><Link href="/login" className="grid min-h-11 place-items-center rounded-[12px] border border-brand-200 font-bold text-brand-700">เข้าสู่ระบบ</Link><Link href="/register" className="grid min-h-11 place-items-center rounded-[12px] bg-brand-600 font-bold text-white">เริ่มต้นใช้งาน</Link></div></nav>}
  </header>;
}
