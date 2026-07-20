import Image from 'next/image';
import Link from 'next/link';

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-3 rounded-lg" aria-label="ก้าวใหม่ หน้าแรก">
      <Image src="/pic/kaowmai-mark.svg" alt="" width={38} height={38} priority className={inverse ? 'brightness-0 invert' : ''} />
      <span className="leading-none">
        <span className={`block text-lg font-extrabold tracking-[-.02em] ${inverse ? 'text-white' : 'text-navy-900'}`}>ก้าวใหม่</span>
        <span className={`mt-1 block text-[.7rem] font-medium ${inverse ? 'text-navy-100' : 'text-slate-600'}`}>โอกาสใหม่ของชีวิต</span>
      </span>
    </Link>
  );
}
