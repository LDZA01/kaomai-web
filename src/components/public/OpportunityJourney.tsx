'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

const steps = [
  'ค้นพบตัวเอง',
  'เรียนรู้และพัฒนา',
  'ค้นหาโอกาส',
  'สมัครและเตรียมตัว',
  'เริ่มงานและเติบโต',
];

export function OpportunityJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    setEnhanced(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="journey-section py-20 lg:py-28"
      data-enhanced={enhanced}
      data-visible={visible}
    >
      <div className="container-page grid gap-14 lg:grid-cols-[.65fr_1.35fr] lg:items-center">
        <div className="journey-intro">
          <h2 className="text-4xl font-extrabold text-slate-950">เส้นทางสู่โอกาสของคุณ</h2>
          <p className="mt-4 text-lg text-slate-600">
            เราอยู่เคียงข้างในแต่ละช่วง ตั้งแต่ค้นหาตัวเองจนถึงเริ่มงานอย่างมั่นคง
          </p>
          <Link
            href="/impact"
            className="journey-link mt-6 inline-flex min-h-11 items-center gap-2 rounded-[12px] bg-brand-50 px-4 font-bold text-brand-700"
          >
            ดูแนวทางติดตามผล <ArrowRight className="journey-link-arrow" size={17} />
          </Link>
        </div>

        <ol className="journey-track relative grid gap-0 sm:grid-cols-5" aria-label="5 ขั้นตอนสู่โอกาสการทำงาน">
          <span aria-hidden className="journey-line journey-line-background" />
          <span aria-hidden className="journey-line journey-line-progress" />
          {steps.map((label, index) => (
            <li
              key={label}
              className="journey-step relative flex gap-4 pb-7 pl-7 sm:block sm:pb-0 sm:pl-0 sm:pt-7"
              style={{ '--journey-index': index } as CSSProperties}
            >
              <span className="journey-node absolute left-0 top-0 z-10 grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-extrabold text-white shadow-[0_0_0_5px_white] sm:-top-3.5">
                {index + 1}
              </span>
              <div className="journey-step-copy">
                <p className="font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">มีข้อมูลและผู้ประสานงานช่วยในขั้นตอนนี้</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
