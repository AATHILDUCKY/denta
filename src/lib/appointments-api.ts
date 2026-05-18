export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

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
}

export interface AppointmentRecord extends AppointmentInput {
  id: string;
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

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data as T;
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
  await request<{ success: boolean; message: string }>(`/api/appointments/${id}`, {
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
