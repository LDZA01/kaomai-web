import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, CheckCircle2, HeartHandshake, Search, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { OpportunityJourney } from '@/components/public/OpportunityJourney';

const pathways = [
  { icon: Search, title: 'ค้นหาโอกาสที่เหมาะกับคุณ', text: 'เริ่มจากความถนัด ความพร้อม และเป้าหมายที่คุณเลือกเอง', action: 'ดูโอกาสงาน', color: 'bg-brand-100 text-brand-700' },
  { icon: BookOpen, title: 'พัฒนาทักษะ เพิ่มความมั่นใจ', text: 'เรียนรู้ทักษะที่ตลาดต้องการ พร้อมการสนับสนุนระหว่างทาง', action: 'ดูการเตรียมความพร้อม', color: 'bg-opportunity-100 text-opportunity-700' },
  { icon: BriefcaseBusiness, title: 'เปิดพื้นที่ให้ศักยภาพเติบโต', text: 'ผู้จ้างงานค้นหาคนที่เหมาะสมและเริ่มต้นอย่างเข้าใจ', action: 'สำหรับผู้จ้างงาน', color: 'bg-hope-100 text-hope-700' },
];

export default function HomePage() {
  return <div className="overflow-hidden bg-white">
    <section className="relative border-b border-brand-100 bg-gradient-to-br from-white via-white to-brand-50">
      <div aria-hidden className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-opportunity-100/60 blur-3xl" />
      <div className="container-page grid min-h-[680px] items-center gap-10 py-14 lg:grid-cols-[.9fr_1.1fr] lg:py-20">
        <div className="hero-copy relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-brand-700 shadow-sm"><Sparkles size={16} className="text-opportunity-600" />พื้นที่ที่ศักยภาพได้พบโอกาส</p>
          <h1 className="mt-6 max-w-[12ch] text-[clamp(2.8rem,6vw,5.5rem)] font-extrabold leading-[1.08] tracking-[-.035em] text-slate-950">ทุกศักยภาพ ควรได้พบโอกาสที่ใช่</h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-8 text-slate-600">ก้าวใหม่เชื่อมคนที่พร้อมเริ่มต้น กับงานที่เหมาะสมและผู้จ้างงานที่เชื่อในศักยภาพของทุกคน</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/register" className="inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-brand-600 px-6 font-bold text-white shadow-[0_4px_8px_oklch(55%_0.2_260_/_0.22)] transition hover:-translate-y-0.5 hover:bg-brand-700">เริ่มต้นสร้างโอกาส <ArrowRight size={18}/></Link><Link href="/partners" className="inline-flex min-h-12 items-center gap-2 rounded-[12px] border border-opportunity-600 bg-white px-5 font-bold text-opportunity-700 hover:bg-opportunity-50">ร่วมเป็นพาร์ทเนอร์</Link></div>
          <div className="mt-10 grid max-w-xl gap-4 border-t border-brand-100 pt-5 sm:grid-cols-3">{[{icon:UsersRound,text:'เริ่มจากคนและเป้าหมาย'},{icon:ShieldCheck,text:'ปลอดภัย เคารพสิทธิ์'},{icon:HeartHandshake,text:'มีคนพร้อมสนับสนุน'}].map(({icon:Icon,text})=><div key={text} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Icon size={20} className="shrink-0 text-brand-600"/>{text}</div>)}</div>
        </div>
        <div className="hero-media relative min-h-[430px] lg:min-h-[570px]">
          <div className="absolute inset-0 overflow-hidden rounded-[16px] shadow-[0_8px_20px_oklch(55%_0.2_260_/_0.13)]"><Image src="/images/hero-workplace.webp" alt="ทีมงานกำลังเรียนรู้และทำงานร่วมกันในสถานที่ทำงาน" fill priority sizes="(max-width:1024px) 100vw, 55vw" className="object-cover" /></div>
          <div className="absolute -bottom-5 left-4 max-w-xs rounded-[14px] bg-white p-4 shadow-[0_6px_16px_oklch(15%_0.02_255_/_0.16)] sm:left-[-1.5rem]"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-hope-100 text-hope-700"><CheckCircle2/></span><div><p className="font-bold text-slate-950">พร้อมเริ่มต้นอย่างมั่นใจ</p><p className="text-sm text-slate-600">มีการเตรียมความพร้อมและติดตามผล</p></div></div></div>
        </div>
      </div>
    </section>

    <section className="py-16"><div className="container-page"><p className="text-center text-sm font-semibold text-slate-500">ความร่วมมือที่ทำให้โอกาสเดินหน้าต่อ</p><div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-bold text-slate-500"><span>ศูนย์พักพิง</span><span>เครือข่ายนายจ้าง</span><span>ผู้พัฒนาทักษะ</span><span>ชุมชนท้องถิ่น</span><span>ผู้สนับสนุน</span></div></div></section>

    <section className="bg-[oklch(97%_0.018_245)] py-20 lg:py-28"><div className="container-page"><div className="max-w-2xl"><h2 className="text-4xl font-extrabold tracking-[-.025em] text-slate-950 lg:text-5xl">เลือกเส้นทางที่ใช่สำหรับคุณ</h2><p className="mt-4 text-lg text-slate-600">ทุกบทบาทมีจุดเริ่มต้นและการสนับสนุนที่แตกต่างกัน</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{pathways.map(({icon:Icon,title,text,action,color},index)=><article key={title} className={`lift rounded-[16px] bg-white p-6 shadow-[0_3px_8px_oklch(21%_0.025_255_/_0.08)] ${index===1?'lg:translate-y-8':''}`}><span className={`grid h-12 w-12 place-items-center rounded-[14px] ${color}`}><Icon/></span><h3 className="mt-6 text-2xl font-bold text-slate-950">{title}</h3><p className="mt-3 text-slate-600">{text}</p><Link href={index===2?'/partners':'/register'} className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-brand-700">{action} <ArrowRight size={17}/></Link></article>)}</div></div></section>

    <OpportunityJourney />

    <section className="bg-gradient-to-br from-opportunity-50 to-brand-50 py-20 lg:py-28"><div className="container-page grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]"><div className="relative min-h-[480px] overflow-hidden rounded-[16px] shadow-[0_8px_20px_oklch(55%_0.2_260_/_0.12)]"><Image src="/images/impact-story.webp" alt="ผู้เข้าร่วมโครงการทำงานอย่างมั่นใจ" fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover"/></div><div className="lg:pl-8"><p className="font-bold text-opportunity-700">เรื่องราวความสำเร็จ</p><blockquote className="mt-5 text-3xl font-bold leading-snug text-slate-950 lg:text-4xl">“งานนี้ทำให้ฉันเห็นว่าตัวเองยังไปต่อได้ และเลือกอนาคตของตัวเองได้อีกครั้ง”</blockquote><p className="mt-6 max-w-xl text-lg text-slate-600">ผลลัพธ์ที่ดีไม่ได้จบที่การได้งาน แต่คือความมั่นใจ ทักษะ และเครือข่ายที่ช่วยให้แต่ละคนเดินหน้าต่อด้วยตัวเอง</p><Link href="/impact" className="mt-7 inline-flex min-h-11 items-center gap-2 font-bold text-brand-700">อ่านเรื่องราวและวิธีวัดผล <ArrowRight size={18}/></Link></div></div></section>

    <section className="py-20 lg:py-28"><div className="container-page grid overflow-hidden rounded-[16px] bg-slate-950 lg:grid-cols-2"><div className="p-8 text-white sm:p-12 lg:p-16"><p className="font-bold text-opportunity-100">สำหรับองค์กรและผู้จ้างงาน</p><h2 className="mt-4 text-4xl font-extrabold">ร่วมสร้างที่ทำงานที่เปิดรับและเติบโตไปด้วยกัน</h2><p className="mt-5 max-w-xl text-lg text-slate-300">เข้าถึงผู้สมัครที่ได้รับการเตรียมความพร้อม พร้อมเครื่องมือประสานงานและติดตามผลที่ชัดเจน</p><Link href="/partners" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-opportunity-600 px-6 font-bold text-slate-950">ร่วมงานกับเรา <ArrowRight size={18}/></Link></div><div className="relative min-h-[360px]"><Image src="/images/employer-collaboration.webp" alt="ผู้จ้างงานและทีมงานร่วมกันวางแผนการทำงาน" fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover"/></div></div></section>

    <section className="bg-brand-600 py-16 text-white"><div className="container-page flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><h2 className="text-4xl font-extrabold">อนาคตที่ดีกว่า เริ่มต้นได้วันนี้</h2><p className="mt-3 max-w-2xl text-lg text-brand-100">เลือกบทบาทของคุณ แล้วเริ่มสร้างโอกาสที่มีความหมายไปด้วยกัน</p></div><Link href="/register" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-[12px] bg-white px-6 font-bold text-brand-700 shadow-sm">เริ่มต้นใช้งาน <ArrowRight size={18}/></Link></div></section>
  </div>;
}
