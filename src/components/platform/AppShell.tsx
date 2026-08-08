'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BriefcaseBusiness, CalendarCheck2, ChevronDown, ClipboardCheck, HeartHandshake, LayoutDashboard, LogOut, Menu, PlusCircle, Settings, UserRound, UsersRound, X } from 'lucide-react';
import { useAuthContext } from '@/components/providers/AuthProvider';

const nav = { shelter:[['/shelter/dashboard','ภาพรวม',LayoutDashboard],['/shelter/case-management','การดูแลรายกรณี',HeartHandshake],['/shelter/work-tracking','ติดตามการทำงาน',CalendarCheck2],['/shelter/residents','ผู้เข้าร่วม',UsersRound],['/shelter/matching','การจับคู่',ClipboardCheck]], employer:[['/employer/dashboard','ภาพรวม',LayoutDashboard],['/employer/create-job','ประกาศงานใหม่',PlusCircle],['/employer/matches','งานและผู้สมัคร',BriefcaseBusiness]] } as const;

export function AppShell({ children, role }: { children:React.ReactNode; role:'shelter'|'employer' }) {
  const { user, loading, signOut } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => { if (!loading && !user) router.replace('/login'); else if (user && user.role !== role) router.replace(`/${user.role}/dashboard`); }, [loading,user,role,router]);
  useEffect(() => {
    if (!profileOpen) return;
    const actions = Array.from(document.querySelectorAll<HTMLButtonElement>('div.absolute.right-0.z-20 button'));
    const openProfile = () => { setProfileOpen(false); router.push(`/${role}/profile`); };
    const openSettings = () => { setProfileOpen(false); router.push(`/${role}/settings`); };
    actions[0]?.addEventListener('click', openProfile);
    actions[1]?.addEventListener('click', openSettings);
    return () => { actions[0]?.removeEventListener('click', openProfile); actions[1]?.removeEventListener('click', openSettings); };
  }, [profileOpen, role, router]);
  if (loading || !user) return <div className="grid min-h-screen place-items-center bg-brand-50"><div role="status" className="text-center"><div className="mx-auto h-10 w-10 animate-pulse rounded-full bg-brand-100"/><p className="mt-3 font-semibold text-brand-700">กำลังเตรียมพื้นที่ทำงาน…</p></div></div>;
  async function logout(){await signOut();router.push('/')}
  return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white"><div className="flex min-h-[4.5rem] items-center justify-between gap-4 px-4 lg:px-6"><Link href={`/${role}/dashboard`} className="flex items-center gap-3 rounded-lg"><Image src="/pic/kaowmai-mark.svg" alt="" width={36} height={36}/><div><span className="block font-extrabold leading-tight text-slate-950">ก้าวใหม่</span><span className="block text-xs text-slate-500">{role==='shelter'?'พื้นที่ศูนย์พักพิง':'พื้นที่ผู้จ้างงาน'}</span></div></Link><div className="flex items-center gap-1 sm:gap-2"><div className="relative hidden sm:block"><button onClick={()=>setProfileOpen(!profileOpen)} aria-expanded={profileOpen} className="flex min-h-11 items-center gap-3 rounded-[12px] px-2.5 hover:bg-slate-50"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-100 to-opportunity-100 font-bold text-brand-700">{user.displayName?.[0]}</span><span className="max-w-40 truncate text-sm font-bold text-slate-800">{user.displayName}</span><ChevronDown size={16} className="text-slate-500"/></button>{profileOpen&&<><button aria-label="ปิดเมนูโปรไฟล์" className="fixed inset-0 z-10" onClick={()=>setProfileOpen(false)}/><div className="absolute right-0 z-20 mt-2 w-64 rounded-[14px] bg-white p-2 shadow-[0_8px_20px_oklch(21%_0.025_255_/_0.16)]"><div className="border-b border-slate-100 px-3 py-3"><p className="font-bold text-slate-950">{user.displayName}</p><p className="truncate text-sm text-slate-500">{user.email}</p></div><button className="mt-1 flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-slate-700 hover:bg-brand-50"><UserRound size={18}/>ดูโปรไฟล์</button><button className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-slate-700 hover:bg-brand-50"><Settings size={18}/>การตั้งค่า</button><button onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut size={18}/>ออกจากระบบ</button></div></>}</div><button aria-label={menuOpen?'ปิดเมนู':'เปิดเมนู'} aria-expanded={menuOpen} onClick={()=>setMenuOpen(!menuOpen)} className="grid h-11 w-11 place-items-center rounded-[10px] text-brand-700 lg:hidden">{menuOpen?<X/>:<Menu/>}</button></div></div></header>
    <div className="mx-auto flex max-w-[96rem]"><aside className={`${menuOpen?'fixed inset-x-0 top-[4.5rem] z-30 block':'hidden'} border-b border-slate-200 bg-white p-4 lg:sticky lg:top-[4.5rem] lg:block lg:h-[calc(100vh-4.5rem)] lg:w-64 lg:border-b-0 lg:border-r`}><nav aria-label="เมนูพื้นที่ทำงาน" className="space-y-1">{nav[role].map(([href,label,Icon])=><Link onClick={()=>setMenuOpen(false)} key={href} href={href} aria-current={pathname===href?'page':undefined} className={`flex min-h-11 items-center gap-3 rounded-[12px] px-3 font-semibold transition-colors ${pathname===href?'bg-brand-50 text-brand-700':'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}><Icon size={19}/>{label}</Link>)}<button onClick={logout} className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 font-semibold text-red-700 hover:bg-red-50 lg:hidden"><LogOut size={19}/>ออกจากระบบ</button></nav><div className="absolute bottom-5 left-4 right-4 hidden rounded-[14px] bg-gradient-to-br from-brand-50 to-opportunity-50 p-4 lg:block"><p className="font-bold text-slate-950">ต้องการความช่วยเหลือ?</p><p className="mt-1 text-sm text-slate-600">ดูคู่มือหรือพูดคุยกับทีมก้าวใหม่</p><Link href="/about" className="mt-3 inline-flex text-sm font-bold text-brand-700">เปิดศูนย์ช่วยเหลือ</Link></div></aside><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>;
}
