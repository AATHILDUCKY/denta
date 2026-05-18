import type { UserProfile, UserRole } from '../types';

const SESSION_KEY = 'dentacare_session';

interface SessionPayload {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export function getSessionUser(): UserProfile | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as SessionPayload;
    return {
      uid: data.uid,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt,
    };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function setSessionUser(user: Omit<UserProfile, 'createdAt'> & { createdAt?: string }) {
  const payload: SessionPayload = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt || new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function clearSessionUser() {
  localStorage.removeItem(SESSION_KEY);
}

export async function loginAdmin(username: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Login failed');
  }
  const user = data.data as UserProfile;
  setSessionUser(user);
  return user;
}

export async function logoutUser() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearSessionUser();
  }
}

export async function getAuthenticatedUser() {
  const response = await fetch('/api/auth/me', {
    credentials: 'include',
  });
  if (!response.ok) {
    clearSessionUser();
    return null;
  }
  const data = await response.json();
  const user = data.data as UserProfile;
  setSessionUser(user);
  return user;
}
