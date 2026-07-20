import type { Employer, Job, JobMatch, Resident, Shelter, UserProfile } from '../types';

export const mockShelters: Shelter[] = [
  {
    id: 'shelter-1',
    name: 'ศูนย์คนไร้บ้านบ้านใหม่',
    address: 'ปทุมวัน, กรุงเทพมหานคร',
    contactInfo: 'coordination@baanmai.org',
    phone: '02-354-3388',
    emergencyPhone: '1300',
  },
];

export const mockEmployers: Employer[] = [
  {
    id: 'employer-1',
    businessName: 'ครัวเขียว เคเทอริ่ง',
    industry: 'ธุรกิจอาหาร',
    contactInfo: 'jobs@greenkitchen.example',
  },
  {
    id: 'employer-2',
    businessName: 'ซิตี้แคร์ บริการ',
    industry: 'ซ่อมบำรุงและสิ่งอำนวยความสะดวก',
    contactInfo: 'people@citycare.example',
  },
];

export const mockUsers: UserProfile[] = [
  {
    id: 'user-shelter',
    email: 'shelter@kaowmai.test',
    role: 'shelter',
    displayName: 'ผู้ประสานงานบ้านใหม่',
  },
  {
    id: 'user-employer',
    email: 'employer@kaowmai.test',
    role: 'employer',
    displayName: 'ฝ่ายสรรหาครัวเขียว',
  },
];

export const mockResidents: Resident[] = [
  {
    id: 'resident-1',
    shelterId: 'shelter-1',
    name: 'สมชาย ก.',
    age: 34,
    gender: 'male',
    skills: ['ช่างไม้', 'ทาสี', 'ซ่อมบำรุง'],
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=70',
    availability: 'เต็มเวลา',
    workAvailability: true,
    notes: 'มีประสบการณ์งานซ่อมแซมและเชื่อถือได้สำหรับกะเช้า',
  },
  {
    id: 'resident-2',
    shelterId: 'shelter-1',
    name: 'มาลี ส.',
    age: 28,
    gender: 'female',
    skills: ['ทำอาหาร', 'ทำความสะอาด', 'เตรียมอาหาร'],
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=70',
    availability: 'พาร์ทไทม์',
    workAvailability: true,
    notes: 'ชอบทำงานช่วงกลางวันในครัว มีประสบการณ์งานเลี้ยงรับรอง',
  },
  {
    id: 'resident-3',
    shelterId: 'shelter-1',
    name: 'อนันต์ พ.',
    age: 45,
    gender: 'male',
    skills: ['จัดสวน', 'ซ่อมบำรุง', 'ส่งของ'],
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=70',
    availability: 'เต็มเวลา',
    workAvailability: true,
    notes: 'เหมาะกับงานกลางแจ้ง ดูแลสนาม และขนส่งเบา',
  },
  {
    id: 'resident-4',
    shelterId: 'shelter-1',
    name: 'นก ต.',
    age: 39,
    gender: 'female',
    skills: ['จัดเรียงสินค้า', 'ทำความสะอาด', 'บริการลูกค้า'],
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=70',
    availability: 'เฉพาะสุดสัปดาห์',
    workAvailability: true,
    notes: 'มีอัธยาศัยดีและรับกะกระชั้นได้',
  },
];

export const mockJobs: Job[] = [
  {
    id: 'job-1',
    employerId: 'employer-2',
    title: 'ผู้ช่วยงานซ่อมแซมชุมชน',
    description: 'สนับสนุนโครงการซ่อมแซมศูนย์ชุมชนระยะสองสัปดาห์',
    requiredSkills: ['ช่างไม้', 'ซ่อมบำรุง'],
    location: 'บางรัก',
    dailyWage: 650,
    status: 'open',
  },
  {
    id: 'job-2',
    employerId: 'employer-1',
    title: 'ผู้ช่วยเตรียมอาหารเลี้ยงรับรอง',
    description: 'เตรียมวัตถุดิบ จัดชุดอาหารกลางวัน และดูแลความสะอาดสถานีครัว',
    requiredSkills: ['ทำอาหาร', 'เตรียมอาหาร', 'ทำความสะอาด'],
    location: 'อารีย์',
    dailyWage: 520,
    status: 'open',
  },
  {
    id: 'job-3',
    employerId: 'employer-2',
    title: 'ทีมดูแลสวนสาธารณะ',
    description: 'ช่วยปลูกต้นไม้ กวาดทางเดิน และเคลื่อนย้ายอุปกรณ์เบา',
    requiredSkills: ['จัดสวน', 'ซ่อมบำรุง'],
    location: 'จตุจักร',
    dailyWage: 580,
    status: 'open',
  },
];

export const mockJobMatches: JobMatch[] = [
  {
    id: 'match-1',
    jobId: 'job-1',
    residentId: 'resident-1',
    status: 'suggested',
    score: 100,
    requestedAt: '2026-07-14T09:00:00.000Z',
  },
  {
    id: 'match-2',
    jobId: 'job-2',
    residentId: 'resident-2',
    status: 'shelter_approved',
    score: 100,
    requestedAt: '2026-07-15T10:30:00.000Z',
  },
  {
    id: 'match-3',
    jobId: 'job-3',
    residentId: 'resident-3',
    status: 'worker_accepted',
    score: 100,
    requestedAt: '2026-07-15T13:15:00.000Z',
  },
];
