export type UserRole = 'shelter' | 'employer';

export interface Resident {
    id: string;
    name: string;
    age: number;
    skills: string[];
    photoUrl?: string;
    availability: string;
    workAvailability: boolean;
    notes?: string;
    shelterId: string;
}

export interface Shelter {
    id: string;
    name: string;
    address: string;
    contactInfo: string;
}

export interface Employer {
    id: string;
    businessName: string;
    industry: string;
    contactInfo: string;
}

export interface Job {
    id: string;
    title: string;
    description: string;
    requiredSkills: string[];
    location: string;
    dailyWage: number;
    employerId: string;
    status: 'draft' | 'open' | 'filled';
}

export interface JobMatch {
    id: string;
    jobId: string;
    residentId: string;
    status: 'pending' | 'hired' | 'rejected';
    score: number;
    requestedAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    displayName: string;
}
