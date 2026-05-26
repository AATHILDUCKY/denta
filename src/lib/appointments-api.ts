export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'waived';

export interface AppointmentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  treatmentType: string;
  date: string;
  time: string;
  notes?: string;
  status?: AppointmentStatus;
  durationMins?: number;
  nic?: string;
  age?: number;
  gender?: string;
}

export interface TreatmentRecord {
  id: string;
  appointmentId: string;
  patientId?: string | null;
  treatmentName: string;
  teethNumbers?: string | null;
  notes?: string | null;
  cost: number;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentInput {
  treatmentName: string;
  teethNumbers?: string;
  notes?: string;
  cost?: number;
}

export interface PaymentRecord {
  id: string;
  appointmentId: string;
  amount: number;
  amountPaid: number;
  status: PaymentStatus;
  method?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInput {
  amount: number;
  amountPaid: number;
  status: PaymentStatus;
  method?: string;
  notes?: string;
}

export interface AppointmentRecord extends AppointmentInput {
  id: string;
  createdAt: string;
  treatments: TreatmentRecord[];
  payment?: PaymentRecord | null;
  clinicalNotes?: string | null;
}

export interface AppointmentAvailability {
  id: string;
  date: string;
  time: string;
  durationMins: number;
  status: AppointmentStatus;
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

export async function listAppointments() {
  const result = await request<{ success: boolean; data: AppointmentRecord[] }>('/api/appointments');
  return result.data;
}

export async function createAppointment(input: AppointmentInput) {
  const result = await request<{ success: boolean; data: AppointmentRecord }>('/api/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data;
}

export async function listAppointmentAvailability() {
  const result = await request<{ success: boolean; data: AppointmentAvailability[] }>('/api/appointments/availability');
  return result.data;
}

export async function updateAppointmentSlot(id: string, payload: Pick<AppointmentInput, 'date' | 'time' | 'status' | 'durationMins'>) {
  await request<{ success: boolean }>(`/api/appointments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  await request<{ success: boolean; message: string }>(`/api/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function addTreatment(appointmentId: string, data: TreatmentInput): Promise<TreatmentRecord> {
  const result = await request<{ success: boolean; data: TreatmentRecord }>(`/api/appointments/${appointmentId}/treatment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function updateTreatmentNotes(appointmentId: string, treatmentId: string, notes: string): Promise<void> {
  await request<{ success: boolean }>(`/api/appointments/${appointmentId}/treatment/${treatmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ notes }),
  });
}

export async function deleteTreatment(appointmentId: string, treatmentId: string): Promise<void> {
  await request<{ success: boolean }>(`/api/appointments/${appointmentId}/treatment/${treatmentId}`, {
    method: 'DELETE',
  });
}

export async function saveClinicalNote(appointmentId: string, clinicalNotes: string): Promise<void> {
  await request<{ success: boolean }>(`/api/appointments/${appointmentId}/clinical-notes`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicalNotes }),
  });
}

export async function upsertPayment(appointmentId: string, data: PaymentInput): Promise<PaymentRecord> {
  const result = await request<{ success: boolean; data: PaymentRecord }>(`/api/appointments/${appointmentId}/payment`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data;
}
