export type UserRole = 'admin' | 'staff' | 'patient';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  medicalHistory?: string | null;
  lastVisit?: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  treatmentType: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  coverImage: string;
  tags: string[];
  createdAt: string;
}

export interface Testimonial {
  id: string;
  patientName: string;
  content: string;
  rating: number;
  status: 'approved' | 'pending';
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageBefore: string;
  imageAfter: string;
  category: string;
  createdAt: string;
}
