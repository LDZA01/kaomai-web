export type UserRole = 'shelter' | 'employer';
export type PreferredWorkType = 'full_time' | 'part_time';
export type PaymentPreference = 'cash' | 'bank_transfer';
export type DocumentCategory = 'education' | 'training' | 'employment' | 'other';

export interface ResidentDocument {
    id: string;
    residentId: string;
    category: DocumentCategory;
    originalName: string;
    storagePath: string;
    mimeType: string;
    sizeBytes: number;
}

export interface CaseManagerContact {
    id: string;
    name: string;
    phone: string;
}

export interface CaseManager extends CaseManagerContact {
    shelterId: string;
}

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
    chronicConditions?: string;
    preferredWorkType?: PreferredWorkType;
    paymentPreference?: PaymentPreference;
    documents?: ResidentDocument[];
    caseManagerId?: string;
    caseManager?: CaseManagerContact;
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

export type EmploymentCadence = 'fortnightly' | 'monthly';
export type EmploymentSupportState = 'good' | 'needs_support' | 'urgent';
export type EmploymentEndReason =
    | 'contract_completed'
    | 'resigned'
    | 'employer_ended'
    | 'health_or_personal'
    | 'lost_contact'
    | 'other';

export interface EmploymentTracking {
    id: string;
    matchId: string;
    residentId: string;
    jobId: string;
    shelterId: string;
    caseManagerId?: string;
    startedAt: string;
    cadence: EmploymentCadence;
    nextFollowUpAt: string;
    supportState: EmploymentSupportState;
    status: 'active' | 'ended';
    endedAt?: string;
    endReason?: EmploymentEndReason;
    finalNote?: string;
    returnToMatching: boolean;
}

export interface EmploymentCheckIn {
    id: string;
    employmentTrackingId: string;
    checkInDate: string;
    attendance: 'normal' | 'absent' | 'late';
    adjustment: EmploymentSupportState;
    participantFeedback?: string;
    employerFeedback?: string;
    privateNote?: string;
    nextFollowUpAt: string;
    createdBy?: string;
    createdAt: string;
}

export interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    displayName: string;
}
