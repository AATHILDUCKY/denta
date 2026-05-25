import type { PatientRecord } from '../types';

export interface StaffRecord {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff' | 'patient';
  createdAt: string;
  username: string | null;
  canLogin: boolean;
}

export interface StaffInput {
  displayName: string;
  email: string;
  username: string;
  password: string;
  role?: 'staff' | 'admin';
}

export interface StaffUpdateInput {
  displayName?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: 'staff' | 'admin';
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  medicalHistory?: string;
  nic?: string;
  age?: number;
  gender?: string;
}
export interface HospitalHours {
  openTime: string;
  closeTime: string;
  ranges: Array<{ start: string; end: string }>;
}
export interface NotificationSettings {
  recipients: string[];
  sendToPatientOnBooking: boolean;
  sendToPatientOnConfirmed: boolean;
  sendToPatientOnReschedule: boolean;
  sendToTeamOnBooking: boolean;
  sendToTeamOnConfirmed: boolean;
  sendToTeamOnReschedule: boolean;
}

export interface PatientHistoryAppointment {
  id: string;
  date: string;
  time: string;
  treatmentType: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  durationMins: number;
  notes?: string | null;
  email: string;
  phone: string;
  createdAt: string;
}

export interface PatientHistoryEvent {
  id: number;
  eventType: string;
  actorRole?: string | null;
  source?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  email?: string | null;
  phone?: string | null;
  payloadJson?: string | null;
  createdAt: string;
}

export interface PatientHistoryRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  dateOfBirth?: string | null;
  medicalHistory?: string | null;
  createdAt: string;
  lastVisit?: string | null;
  appointmentCount: number;
  lastAppointmentAt?: string | null;
  appointments: PatientHistoryAppointment[];
  events: PatientHistoryEvent[];
  isRegisteredPatient: boolean;
  alternateEmails: string[];
  emailChangedLikely: boolean;
}

export interface OverviewStats {
  todayCount: number;
  pendingCount: number;
  pendingPayments: number;
  totalPatients: number;
  weeklyChart: Array<{ name: string; count: number }>;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...init,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'Request failed');
  }
  return payload as T;
}

export async function listStaff() {
  const result = await request<{ success: boolean; data: StaffRecord[] }>('/api/staff');
  return result.data;
}

export async function createStaff(input: StaffInput) {
  const result = await request<{ success: boolean; data: StaffRecord & { username: string } }>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data;
}

export async function updateStaff(id: string, input: StaffUpdateInput) {
  const result = await request<{ success: boolean; data: StaffRecord }>(`/api/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data;
}

export async function deleteStaff(id: string) {
  await request<{ success: boolean }>(`/api/staff/${id}`, { method: 'DELETE' });
}

export async function listPatients() {
  const result = await request<{ success: boolean; data: Array<PatientRecord & { id: string }> }>('/api/patients');
  return result.data;
}

export async function createPatient(input: PatientInput) {
  const result = await request<{ success: boolean; data: PatientRecord & { id: string } }>('/api/patients', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data;
}

export async function getHospitalHours() {
  const result = await request<{ success: boolean; data: HospitalHours }>('/api/settings/hours');
  return result.data;
}

export async function updateHospitalHours(input: HospitalHours) {
  const result = await request<{ success: boolean; data: HospitalHours }>('/api/settings/hours', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data;
}

export async function listPatientHistories() {
  const result = await request<{ success: boolean; data: PatientHistoryRecord[] }>('/api/history/patients');
  return result.data;
}

export async function getNotificationSettings() {
  const result = await request<{ success: boolean; data: NotificationSettings }>('/api/settings/notifications');
  return result.data;
}

export async function getOverviewStats() {
  const result = await request<{ success: boolean; data: OverviewStats }>('/api/stats/overview');
  return result.data;
}

export async function listTreatmentTypes(): Promise<string[]> {
  const result = await request<{ success: boolean; data: string[] }>('/api/settings/treatment-types');
  return result.data;
}

export async function saveTreatmentTypes(types: string[]): Promise<string[]> {
  const result = await request<{ success: boolean; data: string[] }>('/api/settings/treatment-types', {
    method: 'PUT',
    body: JSON.stringify({ types }),
  });
  return result.data;
}

export async function updateNotificationSettings(input: NotificationSettings) {
  const result = await request<{ success: boolean; data: NotificationSettings }>('/api/settings/notifications', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data;
}
