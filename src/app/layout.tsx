import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

export const metadata: Metadata = {
  title: { default: 'ก้าวใหม่ — เชื่อมโอกาสการจ้างงาน', template: '%s | ก้าวใหม่' },
  description: 'แพลตฟอร์มเชื่อมคนไร้บ้านกับโอกาสการจ้างงานที่มั่นคง ผ่านความร่วมมือของศูนย์พักพิง ผู้จ้างงาน และชุมชน',
  icons: { icon: '/pic/kaowmai-mark.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" data-scroll-behavior="smooth">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
