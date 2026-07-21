export type UserRole = 'shelter' | 'employer';

export interface Resident {
    id: string;
    name: string;
    age: number;
    gender?: 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
    skills: string[];
    photoUrl?: string;
    availability: string;
    workAvailability: boolean;
    notes?: string;
    shelterId: string;
    hasIdCard?: boolean | null;
    idCardStatus?: 'has_card' | 'in_progress' | 'needs_support' | 'not_started';
    availableDays?: string[];
    availableFrom?: string;
    availableTo?: string;
}

export interface Shelter {
    id: string;
    name: string;
    address: string;
    contactInfo: string;
    phone?: string;
    emergencyPhone?: string;
    latitude?: number;
    longitude?: number;
}

export interface Employer {
    id: string;
    businessName: string;
    industry: string;
    contactInfo: string;
    phone?: string;
    address?: string;
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
    latitude?: number;
    longitude?: number;
}

export interface JobMatch {
    id: string;
    jobId: string;
    residentId: string;
    status: 'suggested' | 'worker_accepted' | 'worker_declined' | 'shelter_approved' | 'shelter_declined';
    score: number;
    requestedAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    displayName: string;
}
