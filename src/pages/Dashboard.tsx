import { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Users, Calendar as CalendarIcon, Settings, ShieldCheck, FileClock,
  LayoutDashboard, CreditCard, Stethoscope, Plus, ChevronRight, CheckCircle2,
  Clock, AlertCircle, Ban, Banknote, RefreshCw
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
  createAppointment, listAppointments, updateAppointmentSlot, updateAppointmentStatus,
  addTreatment, deleteTreatment, upsertPayment, saveClinicalNote,
  type AppointmentRecord, type TreatmentRecord, type TreatmentInput, type PaymentInput, type PaymentStatus
} from '../lib/appointments-api';
import {
  listStaff, createStaff, updateStaff, deleteStaff, createPatient, getHospitalHours, updateHospitalHours,
  getNotificationSettings, updateNotificationSettings, listPatientHistories,
  getOverviewStats, listTreatmentTypes, saveTreatmentTypes,
  type StaffRecord, type PatientHistoryRecord, type NotificationSettings
} from '../lib/management-api';

interface DashboardProps {
  user: UserProfile | null;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function PageHeader({ label, title, action }: { label: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold mb-0.5">{label}</p>
        <h1 className="text-xl font-bold text-brand-ink">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    pending:   { cls: 'bg-amber-50 text-amber-700 border-amber-100',   icon: <Clock className="h-3 w-3" />,         label: 'Pending' },
    confirmed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Confirmed' },
    cancelled: { cls: 'bg-red-50 text-red-600 border-red-100',         icon: <Ban className="h-3 w-3" />,           label: 'Cancelled' },
    completed: { cls: 'bg-blue-50 text-blue-600 border-blue-100',      icon: <CheckCircle2 className="h-3 w-3" />,   label: 'Completed' },
  };
  const s = map[status] ?? { cls: 'bg-brand-bg text-brand-muted border-brand-border', icon: null, label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus | null | undefined }) {
  if (!status) return <span className="text-[10px] text-brand-muted italic">No payment</span>;
  const map: Record<PaymentStatus, { cls: string; label: string }> = {
    pending: { cls: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Payment Pending' },
    partial: { cls: 'bg-yellow-50 text-yellow-700 border-yellow-100', label: 'Partial' },
    paid:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Paid' },
    waived:  { cls: 'bg-slate-50 text-slate-500 border-slate-200', label: 'Waived' },
  };
  const s = map[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}><Banknote className="h-3 w-3" />{s.label}</span>;
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function Dashboard({ user }: DashboardProps) {
  const location = useLocation();

  const currentUser: UserProfile = user ?? {
    uid: 'guest', email: 'guest@dentacare.pro', displayName: 'Guest Administrator',
    role: 'admin', createdAt: new Date().toISOString(),
  };

  const sidebarLinks = [
    { name: 'Overview',        path: '/dashboard',                     icon: LayoutDashboard },
    { name: 'Appointments',    path: '/dashboard/appointments',        icon: CalendarIcon },
    { name: 'Patient History', path: '/dashboard/patient_history',     icon: FileClock },
    { name: 'Staff',           path: '/dashboard/staff',               icon: ShieldCheck, adminOnly: true },
    { name: 'Settings',        path: '/dashboard/settings',            icon: Settings,    adminOnly: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg-soft">
      <aside className="w-52 border-r border-brand-border flex flex-col bg-white hidden lg:flex shrink-0">
        <div className="p-4 border-b border-brand-border">
          <p className="text-[9px] uppercase tracking-[0.25em] text-brand-muted font-bold">Navigation</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {sidebarLinks.map((link) => {
            if (link.adminOnly && currentUser.role !== 'admin') return null;
            const Icon = link.icon;
            return (
              <Link key={link.path} to={link.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive(link.path) ? 'bg-brand-primary text-white' : 'text-brand-muted hover:bg-brand-bg hover:text-brand-ink'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" /><span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-brand-border space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.displayName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-ink truncate">{currentUser.displayName}</p>
              <p className="text-[10px] text-brand-muted capitalize">{currentUser.role}</p>
            </div>
          </div>
          <Link to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-muted hover:bg-brand-bg hover:text-brand-ink transition-all w-full">
            <ChevronRight className="h-3.5 w-3.5 rotate-180 shrink-0" />
            <span>Back to Website</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/"                 element={<DashboardOverview />} />
          <Route path="/appointments"     element={<DashboardAppointments userRole={currentUser.role} />} />
          <Route path="/patient_history"  element={<DashboardPatientHistory />} />
          <Route path="/staff"            element={<DashboardStaff />} />
          <Route path="/settings"         element={<DashboardSettings />} />
        </Routes>
      </main>
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────

function DashboardOverview() {
  const [stats, setStats] = useState({ todayCount: 0, pendingCount: 0, pendingPayments: 0, totalPatients: 0, weeklyChart: [] as { name: string; count: number }[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverviewStats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Today's Appointments", value: String(stats.todayCount), icon: <CalendarIcon className="h-5 w-5" />, color: 'text-brand-primary', bg: 'bg-brand-bg' },
    { label: 'Pending Confirmations', value: String(stats.pendingCount), icon: <Clock className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Payments Due',          value: String(stats.pendingPayments), icon: <CreditCard className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Registered Patients',   value: String(stats.totalPatients), icon: <Users className="h-5 w-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-5 space-y-4">
      <PageHeader label="Dashboard" title="Clinical Overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-brand-border rounded-xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-bold text-brand-ink">{loading ? '—' : s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-brand-muted font-bold mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-white border border-brand-border rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted mb-3">Appointments — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.weeklyChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #c7d9f5', boxShadow: 'none', fontSize: '11px' }} />
              <Area type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2} fill="#1d4ed8" fillOpacity={0.07} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-brand-primary text-white rounded-xl p-5 flex flex-col gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-60 font-bold mb-1">Clinic Status</p>
            <p className="text-2xl font-bold">Active</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Today', value: loading ? '—' : `${stats.todayCount} appts` },
              { label: 'Awaiting Confirm', value: loading ? '—' : `${stats.pendingCount}` },
              { label: 'Payments Due', value: loading ? '—' : `${stats.pendingPayments}` },
              { label: 'Total Patients', value: loading ? '—' : `${stats.totalPatients}` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center border-b border-white/10 pb-1.5">
                <span className="text-xs opacity-70">{item.label}</span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Appointments ──────────────────────────────────────────────────────────────

const DENTAL_TREATMENTS = [
  'Consultation', 'Dental Cleaning / Scaling', 'Tooth Extraction', 'Root Canal Treatment',
  'Crown Placement', 'Composite Filling', 'Amalgam Filling', 'Dental Implant', 'Teeth Whitening',
  'Orthodontic Consultation', 'Dentures', 'Bridge', 'Veneer', 'Periodontal Treatment',
  'Fluoride Treatment', 'Dental X-Ray', 'Cavity Check-up', 'Wisdom Tooth Removal',
];

const isConsultationType = (type: string) => type.toLowerCase().includes('consultation');

function AppointmentDetailPanel({
  appointment,
  fifteenMinuteSlots,
  onRefresh,
  onRescheduleRequest,
  savingSlot,
}: {
  appointment: AppointmentRecord;
  fifteenMinuteSlots: string[];
  onRefresh: () => void;
  onRescheduleRequest: (date: string, time: string, duration: number) => void;
  savingSlot: boolean;
}) {
  const [editDate, setEditDate] = useState(appointment.date);
  const [editTime, setEditTime] = useState(appointment.time);
  const [editDuration, setEditDuration] = useState(appointment.durationMins ?? 60);

  const isConsult = isConsultationType(appointment.treatmentType);
  const initPay = (): PaymentInput => ({
    amount: appointment.payment?.amount ?? (isConsult ? 0 : (appointment.treatments ?? []).reduce((s, t) => s + t.cost, 0)),
    amountPaid: appointment.payment?.amountPaid ?? 0,
    status: appointment.payment?.status ?? 'pending',
    method: appointment.payment?.method ?? '',
    notes: appointment.payment?.notes ?? '',
  });
  const [payForm, setPayForm] = useState<PaymentInput>(initPay);
  const [showPayForm, setShowPayForm] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [payMsg, setPayMsg] = useState('');

  const [showNotesForm, setShowNotesForm] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesMsg, setNotesMsg] = useState('');

  useEffect(() => {
    setEditDate(appointment.date);
    setEditTime(appointment.time);
    setEditDuration(appointment.durationMins ?? 60);
    setPayForm(initPay());
    setShowPayForm(false);
    setPayMsg('');
    setShowNotesForm(false);
    setNotesDraft('');
    setNotesMsg('');
  }, [appointment.id]);

  const saveNotes = async () => {
    setSavingNotes(true); setNotesMsg('');
    try {
      await saveClinicalNote(appointment.id, notesDraft);
      setNotesMsg('Saved.');
      setShowNotesForm(false);
      onRefresh();
    } catch (err) { setNotesMsg(err instanceof Error ? err.message : 'Failed.'); }
    finally { setSavingNotes(false); }
  };

  const balance = payForm.amount - payForm.amountPaid;
  const existingPay = appointment.payment;

  const savePayment = async (overrides?: Partial<PaymentInput>) => {
    setSavingPay(true); setPayMsg('');
    try {
      await upsertPayment(appointment.id, { ...payForm, ...overrides });
      setPayMsg('Saved.');
      onRefresh();
    } catch (err) { setPayMsg(err instanceof Error ? err.message : 'Failed.'); }
    finally { setSavingPay(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-brand-border bg-brand-bg-soft">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-brand-ink">{appointment.firstName} {appointment.lastName}</h3>
            <p className="text-xs text-brand-muted mt-0.5">{appointment.treatmentType}</p>
          </div>
          <StatusBadge status={appointment.status ?? 'pending'} />
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-brand-muted">
          <span>{appointment.date}</span><span>·</span>
          <span>{appointment.time}</span><span>·</span>
          <span>{appointment.durationMins ?? 60} min</span>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <PaymentBadge status={existingPay?.status} />
          {(appointment.treatments ?? []).map((t) => (
            <span key={t.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isConsult ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
              <Stethoscope className="h-3 w-3" />{t.treatmentName}{!isConsult && t.cost > 0 ? ` · LKR ${t.cost.toLocaleString()}` : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Contact */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[['Email', appointment.email], ['Phone', appointment.phone]].map(([k, v]) => (
            <div key={k} className="bg-brand-bg-soft rounded-lg px-3 py-2">
              <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">{k}</p>
              <p className="font-semibold text-brand-ink truncate mt-0.5">{v}</p>
            </div>
          ))}
        </div>

        {appointment.notes && (
          <div className="bg-brand-bg-soft rounded-lg px-3 py-2 text-xs">
            <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wide mb-1">Booking Notes</p>
            <p className="text-brand-ink break-words whitespace-pre-wrap overflow-hidden">{appointment.notes}</p>
          </div>
        )}

        {/* Clinical Notes — one note per appointment */}
        <div className="border border-brand-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-brand-bg-soft border-b border-brand-border">
            <Stethoscope className="h-3.5 w-3.5 text-brand-primary shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex-1">Clinical Notes</p>
            {appointment.clinicalNotes && !showNotesForm && (
              <button onClick={() => { setNotesDraft(appointment.clinicalNotes ?? ''); setShowNotesForm(true); setNotesMsg(''); }}
                className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary transition">
                Edit
              </button>
            )}
          </div>

          <div className="p-3 space-y-2">
            {showNotesForm ? (
              <>
                <textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={4}
                  placeholder="Observations, diagnosis, findings, treatment notes…"
                  autoFocus
                  className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowNotesForm(false); setNotesDraft(''); setNotesMsg(''); }}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-muted hover:bg-brand-bg transition">
                    Cancel
                  </button>
                  <button
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="flex-1 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                    {savingNotes ? 'Saving…' : 'Save Note'}
                  </button>
                </div>
                {notesMsg && <p className={`text-xs font-semibold ${notesMsg === 'Saved.' ? 'text-emerald-700' : 'text-red-600'}`}>{notesMsg}</p>}
              </>
            ) : appointment.clinicalNotes ? (
              <p className="text-xs text-brand-ink leading-relaxed whitespace-pre-wrap break-words">{appointment.clinicalNotes}</p>
            ) : (
              <button
                onClick={() => { setNotesDraft(''); setShowNotesForm(true); setNotesMsg(''); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg border-2 border-dashed border-brand-border text-brand-muted hover:border-brand-primary hover:text-brand-primary hover:bg-brand-bg transition">
                <Plus className="h-3.5 w-3.5" />Add Clinical Note
              </button>
            )}
          </div>
        </div>

        {/* Status actions */}
        <div className="border border-brand-border rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">Change Status</p>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={async () => { await updateAppointmentStatus(appointment.id, 'confirmed'); onRefresh(); }}
              className="py-2 text-[10px] font-bold uppercase rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">Confirm</button>
            <button onClick={async () => { await updateAppointmentStatus(appointment.id, 'completed'); onRefresh(); }}
              className="py-2 text-[10px] font-bold uppercase rounded-lg border border-brand-border text-brand-muted hover:bg-brand-bg transition">Complete</button>
            <button onClick={async () => { await updateAppointmentStatus(appointment.id, 'cancelled'); onRefresh(); }}
              className="py-2 text-[10px] font-bold uppercase rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition">Cancel</button>
          </div>
        </div>

        {/* Payment */}
        <div className="border border-brand-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex items-center gap-1.5">
              <CreditCard className="h-3 w-3" />Payment
            </p>
            <button onClick={() => { setShowPayForm((v) => !v); setPayMsg(''); }}
              className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary transition">
              {showPayForm ? 'Hide' : existingPay ? 'Edit' : '+ Add Payment'}
            </button>
          </div>

          {/* Summary (when payment exists and form hidden) */}
          {existingPay && !showPayForm && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="bg-brand-bg-soft rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] text-brand-muted font-bold uppercase tracking-wide">Total</p>
                  <p className="font-bold text-brand-ink">LKR {existingPay.amount.toLocaleString()}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg px-2 py-1.5 text-center">
                  <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wide">Paid</p>
                  <p className="font-bold text-emerald-700">LKR {existingPay.amountPaid.toLocaleString()}</p>
                </div>
                <div className={`rounded-lg px-2 py-1.5 text-center ${existingPay.amount - existingPay.amountPaid > 0 ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                  <p className={`text-[9px] font-bold uppercase tracking-wide ${existingPay.amount - existingPay.amountPaid > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>Balance</p>
                  <p className={`font-bold ${existingPay.amount - existingPay.amountPaid > 0 ? 'text-orange-700' : 'text-emerald-700'}`}>
                    LKR {Math.max(0, existingPay.amount - existingPay.amountPaid).toLocaleString()}
                  </p>
                </div>
              </div>
              {existingPay.method && (
                <p className="text-[10px] text-brand-muted">Method: <span className="font-semibold capitalize">{existingPay.method.replace('_', ' ')}</span></p>
              )}
              {existingPay.status !== 'paid' && existingPay.status !== 'waived' && (
                <button onClick={() => savePayment({ amountPaid: existingPay.amount, status: 'paid' })}
                  disabled={savingPay}
                  className="w-full py-1.5 text-[10px] font-bold uppercase rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition">
                  {savingPay ? 'Saving…' : '✓ Mark as Fully Paid'}
                </button>
              )}
            </div>
          )}

          {/* No payment yet */}
          {!existingPay && !showPayForm && (
            <p className="text-xs text-brand-muted italic">No payment recorded yet.</p>
          )}

          {/* Payment form */}
          {showPayForm && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Total (LKR)</label>
                  <input type="number" min="0" step="100" value={payForm.amount}
                    onChange={(e) => setPayForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Paid (LKR)</label>
                  <input type="number" min="0" step="100" value={payForm.amountPaid}
                    onChange={(e) => setPayForm((p) => ({ ...p, amountPaid: Number(e.target.value) }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
              </div>
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 border text-xs font-bold ${balance <= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                <span className="uppercase tracking-wide">Balance Due</span>
                <span>LKR {Math.max(0, balance).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={payForm.method ?? ''} onChange={(e) => setPayForm((p) => ({ ...p, method: e.target.value }))}
                  className="w-full border border-brand-border rounded-lg px-2 py-2 text-xs">
                  <option value="">Method…</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
                <select value={payForm.status} onChange={(e) => setPayForm((p) => ({ ...p, status: e.target.value as PaymentStatus }))}
                  className="w-full border border-brand-border rounded-lg px-2 py-2 text-xs">
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="waived">Waived</option>
                </select>
              </div>
              <textarea value={payForm.notes ?? ''} onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2} placeholder="Receipt no., notes…"
                className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs resize-none" />
              <button onClick={() => savePayment()} disabled={savingPay}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                {savingPay ? 'Saving…' : existingPay ? 'Update Payment' : 'Save Payment'}
              </button>
              {payMsg && <p className={`text-xs font-semibold ${payMsg === 'Saved.' ? 'text-emerald-700' : 'text-red-600'}`}>{payMsg}</p>}
            </div>
          )}
          {payMsg && !showPayForm && <p className={`text-xs font-semibold ${payMsg === 'Saved.' ? 'text-emerald-700' : 'text-red-600'}`}>{payMsg}</p>}
        </div>

        {/* Reschedule */}
        <div className="border border-brand-border rounded-lg p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">Reschedule</p>
          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
            className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <select value={editTime} onChange={(e) => setEditTime(e.target.value)}
              className="border border-brand-border rounded-lg px-2 py-2 text-xs">
              {fifteenMinuteSlots.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={String(editDuration)} onChange={(e) => setEditDuration(Number(e.target.value))}
              className="border border-brand-border rounded-lg px-2 py-2 text-xs">
              {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <button onClick={() => onRescheduleRequest(editDate, editTime, editDuration)} disabled={savingSlot}
            className="w-full py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
            {savingSlot ? 'Saving…' : 'Save New Time'}
          </button>
        </div>

        {/* Link to patient history (treatment records) */}
        <Link to="/dashboard/patient_history"
          state={{ firstName: appointment.firstName, lastName: appointment.lastName, email: appointment.email }}
          className="flex items-center justify-between px-3 py-2.5 bg-brand-bg border border-brand-border rounded-lg hover:border-brand-accent transition group">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">Treatment Records · Full History</p>
            <p className="text-xs font-semibold text-brand-ink mt-0.5">Open in Patient History</p>
          </div>
          <ChevronRight className="h-4 w-4 text-brand-primary group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

function DashboardAppointments({ userRole }: { userRole: UserProfile['role'] }) {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selected, setSelected] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'uncompleted' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('uncompleted');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [actionError, setActionError] = useState('');
  const [savingSlot, setSavingSlot] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', nic: '', age: '' as string | number, gender: '',
    treatmentType: 'Consultation', date: '', time: '', notes: '', durationMins: 30,
  });
  const [hospitalHours, setHospitalHours] = useState({
    openTime: '08:00', closeTime: '18:00',
    ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }],
  });
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>(DENTAL_TREATMENTS);
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', loading: false });
  const confirmActionRef = useRef<null | (() => Promise<void>)>(null);
  const cancelActionRef = useRef<null | (() => void)>(null);
  const calendarRefs = useRef<Array<{ getApi: () => { gotoDate: (date: Date) => void } } | null>>([]);
  const syncingCalendarsRef = useRef(false);

  const toMins = (v: string) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
  const fmtSecs = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}:00`;
  const openRanges = useMemo(() => [...hospitalHours.ranges].sort((a, b) => toMins(a.start) - toMins(b.start)), [hospitalHours.ranges]);
  const canAdd = userRole === 'admin' || userRole === 'staff';

  const fifteenMinuteSlots = useMemo(() => {
    const slots: string[] = [];
    openRanges.forEach((r) => {
      for (let m = toMins(r.start); m < toMins(r.end); m += 15) {
        slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
      }
    });
    return slots;
  }, [openRanges]);

  const availableCreateSlots = useMemo(() => {
    if (!createForm.date) return fifteenMinuteSlots;
    const dayApts = appointments.filter((a) => a.date === createForm.date && a.status !== 'cancelled');
    if (dayApts.length === 0) return fifteenMinuteSlots;
    return fifteenMinuteSlots.filter((slot) => {
      const slotStart = toMins(slot);
      const slotEnd = slotStart + (createForm.durationMins ?? 30);
      return !dayApts.some((apt) => {
        const aptStart = toMins(apt.time);
        const aptEnd = aptStart + (apt.durationMins ?? 60);
        return slotStart < aptEnd && slotEnd > aptStart;
      });
    });
  }, [fifteenMinuteSlots, appointments, createForm.date, createForm.durationMins]);

  useEffect(() => {
    if (createForm.time && !availableCreateSlots.includes(createForm.time)) {
      setCreateForm((p) => ({ ...p, time: '' }));
    }
  }, [availableCreateSlots]);

  const normalizedPhone = useMemo(() => createForm.phone.replace(/\s|-/g, ''), [createForm.phone]);
  const phoneValid = useMemo(() => /^(?:\+?\d{10,15})$/.test(normalizedPhone), [normalizedPhone]);
  const emailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim()), [createForm.email]);

  const fetchAppointments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await listAppointments();
      setAppointments(data);
      setLastRefresh(Date.now());
      if (selected) setSelected(data.find((a) => a.id === selected.id) ?? null);
    } catch (err) {
      if (!silent) setActionError(err instanceof Error ? err.message : 'Failed to load.');
    } finally { if (!silent) setLoading(false); }
  };

  useEffect(() => { fetchAppointments(); }, []);
  useEffect(() => {
    getHospitalHours().then(setHospitalHours).catch(() => {});
    listTreatmentTypes().then((t) => { if (t.length > 0) setTreatmentTypes(t); }).catch(() => {});
  }, []);

  // Auto-refresh every 30 seconds to catch new patient bookings
  useEffect(() => {
    const id = window.setInterval(() => fetchAppointments(true), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const visible = appointments.filter((a) => {
    const statusOk =
      statusFilter === 'all' ||
      (statusFilter === 'uncompleted' ? a.status !== 'completed' && a.status !== 'cancelled' : a.status === statusFilter);
    const q = `${a.firstName} ${a.lastName} ${a.treatmentType} ${a.phone} ${a.email}`.toLowerCase();
    return statusOk && q.includes(search.toLowerCase());
  });

  useEffect(() => {
    if (selected && !visible.some((a) => a.id === selected.id)) setSelected(null);
  }, [visible]);

  // Quick-action: confirm without a modal
  const quickConfirm = async (id: string) => {
    try { await updateAppointmentStatus(id, 'confirmed'); await fetchAppointments(true); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed.'); }
  };

  // Summary counts
  const today = new Date().toISOString().slice(0, 10);
  const counts = useMemo(() => ({
    all: appointments.length,
    today: appointments.filter((a) => a.date === today && a.status !== 'cancelled').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    confirmed: appointments.filter((a) => a.status === 'confirmed').length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    uncompleted: appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled').length,
  }), [appointments]);

  // "New" = created within the last 2 hours
  const isNew = (a: AppointmentRecord) => {
    if (!a.createdAt) return false;
    return Date.now() - new Date(a.createdAt).getTime() < 2 * 60 * 60 * 1000;
  };

  // Group visible appointments by date, sorted newest date first
  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>();
    const sorted = [...visible].sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
    });
    for (const a of sorted) {
      const list = map.get(a.date) ?? [];
      list.push(a);
      map.set(a.date, list);
    }
    return Array.from(map.entries());
  }, [visible]);

  const syncCalendarDate = (srcIdx: number, date: Date) => {
    if (syncingCalendarsRef.current) return;
    syncingCalendarsRef.current = true;
    calendarRefs.current.forEach((cal, i) => { if (i !== srcIdx) cal?.getApi().gotoDate(date); });
    window.setTimeout(() => { syncingCalendarsRef.current = false; }, 0);
  };

  const openConfirm = (title: string, message: string, onConfirm: () => Promise<void>, onCancel?: () => void) => {
    confirmActionRef.current = onConfirm;
    cancelActionRef.current = onCancel ?? null;
    setConfirmState({ open: true, title, message, loading: false });
  };
  const closeConfirm = () => { setConfirmState((p) => ({ ...p, open: false, loading: false })); confirmActionRef.current = null; cancelActionRef.current = null; };
  const handleConfirm = async () => {
    if (!confirmActionRef.current) { closeConfirm(); return; }
    setConfirmState((p) => ({ ...p, loading: true }));
    try { await confirmActionRef.current(); closeConfirm(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed.'); setConfirmState((p) => ({ ...p, loading: false })); }
  };

  const handleRescheduleRequest = (date: string, time: string, duration: number) => {
    if (!selected) return;
    openConfirm(
      'Confirm Reschedule',
      `Move to ${date} at ${time} for ${duration} minutes?`,
      async () => {
        setSavingSlot(true);
        try { await updateAppointmentSlot(selected.id, { date, time, status: selected.status ?? 'pending', durationMins: duration }); await fetchAppointments(); }
        finally { setSavingSlot(false); }
      }
    );
  };

  const fmtDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const calendarEvents = visible.map((a) => {
    const start = `${a.date}T${a.time || '09:00'}:00`;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + (a.durationMins ?? 60) * 60000);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`;

    // Payment-first color scheme; cancelled always red
    const paymentStyle = (() => {
      if (a.status === 'cancelled') return { backgroundColor: '#fee2e2', textColor: '#991b1b', borderColor: '#f87171' };
      switch (a.payment?.status) {
        case 'paid':    return { backgroundColor: '#dcfce7', textColor: '#15803d', borderColor: '#22c55e' };
        case 'waived':  return { backgroundColor: '#f1f5f9', textColor: '#475569', borderColor: '#94a3b8' };
        case 'partial': return { backgroundColor: '#fef9c3', textColor: '#854d0e', borderColor: '#eab308' };
        case 'pending': return { backgroundColor: '#ffedd5', textColor: '#9a3412', borderColor: '#f97316' };
        default:
          // No payment record yet — fall back to appointment status colour
          return a.status === 'completed'
            ? { backgroundColor: '#e2e8f0', textColor: '#475569', borderColor: '#94a3b8' }
            : a.status === 'confirmed'
              ? { backgroundColor: '#dbeafe', textColor: '#1e3a8a', borderColor: '#3b82f6' }
              : { backgroundColor: '#fef3c7', textColor: '#92400e', borderColor: '#f59e0b' };
      }
    })();

    // Payment indicator suffix in title
    const payLabel = a.payment?.status === 'paid' ? ' ✓' : a.payment?.status === 'partial' ? ' ½' : a.payment?.status === 'waived' ? '' : a.payment ? ' $' : '';
    return {
      id: a.id, start, end: fmt(endDate), extendedProps: { ...a }, ...paymentStyle,
      title: `${a.firstName} ${a.lastName}${payLabel} — ${a.treatmentType}`,
      classNames: [a.status === 'completed' ? 'calendar-event-completed' : ''],
    };
  });

  const bgHighlights = visible.filter((a) => a.status !== 'cancelled').map((a) => {
    const s = new Date(`${a.date}T${a.time}:00`);
    const e = new Date(s.getTime() + (a.durationMins ?? 60) * 60000);
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`;
    const bg = a.payment?.status === 'paid' ? 'rgba(34,197,94,0.10)' : a.payment?.status === 'partial' ? 'rgba(234,179,8,0.10)' : a.payment?.status === 'pending' ? 'rgba(249,115,22,0.10)' : 'rgba(59,130,246,0.08)';
    return { start: fmt(s), end: fmt(e), display: 'background' as const, backgroundColor: bg };
  });

  const resetCreate = () => setCreateForm({ firstName: '', lastName: '', email: '', phone: '', nic: '', age: '', gender: '', treatmentType: 'Consultation', date: '', time: '', notes: '', durationMins: 30 });

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      {/* ── Header ── */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold mb-0.5">Scheduling</p>
          <h1 className="text-xl font-bold text-brand-ink">Appointments</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-lg border border-brand-border overflow-hidden bg-white">
            {(['list', 'calendar'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide transition ${viewMode === mode ? 'bg-brand-primary text-white' : 'text-brand-muted hover:bg-brand-bg'}`}>
                {mode === 'list' ? '≡ List' : '⊞ Calendar'}
              </button>
            ))}
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, treatment…"
            className="px-3 py-2 border border-brand-border rounded-lg text-xs min-w-[160px] bg-white" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-brand-border rounded-lg text-xs bg-white">
            <option value="uncompleted">Uncompleted ({counts.uncompleted})</option>
            <option value="all">All ({counts.all})</option>
            <option value="pending">Pending ({counts.pending})</option>
            <option value="confirmed">Confirmed ({counts.confirmed})</option>
            <option value="completed">Completed ({counts.completed})</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => fetchAppointments()} className="flex items-center gap-1.5 bg-white border border-brand-border text-brand-ink text-xs px-3 py-2 rounded-lg font-semibold hover:bg-brand-bg transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {canAdd && (
            <button onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 bg-brand-primary text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-brand-secondary transition shadow-sm">
              <Plus className="h-3.5 w-3.5" />New Appointment
            </button>
          )}
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Today', value: counts.today, color: 'border-l-brand-primary', text: 'text-brand-primary' },
          { label: 'Pending', value: counts.pending, color: 'border-l-amber-500', text: 'text-amber-700' },
          { label: 'Confirmed', value: counts.confirmed, color: 'border-l-emerald-500', text: 'text-emerald-700' },
          { label: 'Completed', value: counts.completed, color: 'border-l-slate-400', text: 'text-slate-600' },
        ].map((s) => (
          <div key={s.label} className={`bg-white border border-brand-border border-l-2 ${s.color} rounded-lg px-3 py-2 flex items-center justify-between`}>
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-muted">{s.label}</span>
            <span className={`text-lg font-bold ${s.text}`}>{loading ? '—' : s.value}</span>
          </div>
        ))}
      </div>

      {actionError && <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{actionError}</p>}

      <div className={`grid gap-3 flex-1 min-h-0 ${selected ? 'xl:grid-cols-[1fr_380px]' : ''}`}>

        {/* ── List View ── */}
        {viewMode === 'list' && (
          <div className="bg-white border border-brand-border rounded-xl overflow-hidden flex flex-col">
            {/* Last refresh indicator */}
            <div className="px-4 py-2 border-b border-brand-border bg-brand-bg-soft flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                {visible.length} appointment{visible.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-brand-muted">
                Auto-refreshes every 30s · Last: {new Date(lastRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <RefreshCw className="h-5 w-5 text-brand-muted animate-spin" />
                  <p className="text-sm text-brand-muted">Loading appointments…</p>
                </div>
              ) : grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-brand-muted">
                  <CalendarIcon className="h-8 w-8 opacity-30" />
                  <p className="text-sm font-semibold">No appointments found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
              ) : (
                <div>
                  {grouped.map(([date, apts]) => (
                    <div key={date}>
                      <div className="sticky top-0 z-10 px-4 py-2 bg-brand-bg-soft border-b border-brand-border flex items-center gap-3">
                        <span className={`text-xs font-bold ${date === today ? 'text-brand-primary' : 'text-brand-ink'}`}>
                          {fmtDateLabel(date)}
                        </span>
                        <span className="text-[10px] text-brand-muted font-semibold">{date}</span>
                        <span className="ml-auto text-[10px] font-bold bg-brand-bg border border-brand-border px-2 py-0.5 rounded-full text-brand-muted">{apts.length}</span>
                      </div>
                      <div className="divide-y divide-brand-border">
                        {apts.map((apt) => {
                          const isSelected = selected?.id === apt.id;
                          const newTag = isNew(apt);
                          return (
                            <div key={apt.id} onClick={() => setSelected((cur) => cur?.id === apt.id ? null : apt)}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition group ${isSelected ? 'bg-brand-bg border-l-2 border-l-brand-primary' : 'hover:bg-brand-bg-soft'}`}>
                              {/* Avatar */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                apt.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                                apt.status === 'cancelled' ? 'bg-red-50 text-red-400' :
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {apt.firstName[0]}{apt.lastName[0]}
                              </div>
                              {/* Main info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-brand-ink truncate">{apt.firstName} {apt.lastName}</p>
                                  {newTag && (
                                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-primary text-white animate-pulse">New</span>
                                  )}
                                </div>
                                <p className="text-xs text-brand-muted truncate">{apt.treatmentType}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-brand-muted font-semibold">{apt.time} · {apt.durationMins ?? 60} min</span>
                                  {apt.phone && <span className="text-[10px] text-brand-muted">{apt.phone}</span>}
                                </div>
                              </div>
                              {/* Badges + actions */}
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <StatusBadge status={apt.status ?? 'pending'} />
                                <div className="flex items-center gap-1">
                                  {apt.treatments.length > 0 && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100 flex items-center gap-0.5">
                                      <Stethoscope className="h-2.5 w-2.5" />Tx×{apt.treatments.length}
                                    </span>
                                  )}
                                  <PaymentBadge status={apt.payment?.status} />
                                </div>
                                {apt.status === 'pending' && (
                                  <button onClick={(e) => { e.stopPropagation(); quickConfirm(apt.id); }}
                                    className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition opacity-0 group-hover:opacity-100">
                                    Confirm
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Calendar View ── */}
        {viewMode === 'calendar' && (
          <div className="bg-white border border-brand-border rounded-xl p-4 overflow-auto appointment-calendar">
            <div className="mb-3 flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
              <span className="text-brand-muted">Payment:</span>
              {([
                { label: 'Paid ✓',   bg: '#dcfce7', text: '#15803d', border: '#22c55e' },
                { label: 'Partial ½', bg: '#fef9c3', text: '#854d0e', border: '#eab308' },
                { label: 'Unpaid $',  bg: '#ffedd5', text: '#9a3412', border: '#f97316' },
                { label: 'No record', bg: '#dbeafe', text: '#1e3a8a', border: '#3b82f6' },
                { label: 'Cancelled', bg: '#fee2e2', text: '#991b1b', border: '#f87171' },
              ]).map(({ label, bg, text, border }) => (
                <span key={label} style={{ backgroundColor: bg, color: text, borderLeft: `3px solid ${border}` }}
                  className="px-2.5 py-1 rounded-r-full text-[10px] font-bold">{label}</span>
              ))}
            </div>
            {openRanges.map((range, idx) => (
              <div key={`${range.start}-${range.end}`}>
                <div className="flex items-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                  <span className="h-px flex-1 bg-brand-border" /><span>{range.start} — {range.end}</span><span className="h-px flex-1 bg-brand-border" />
                </div>
                <FullCalendar
                  ref={(cal) => { calendarRefs.current[idx] = cal; }}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={idx === 0 ? { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' } : false}
                  datesSet={(arg) => syncCalendarDate(idx, arg.start)}
                  events={[...bgHighlights, ...calendarEvents]}
                  height="auto" expandRows={false}
                  slotMinTime={fmtSecs(toMins(range.start))} slotMaxTime={fmtSecs(toMins(range.end))}
                  slotDuration="00:15:00" snapDuration="00:15:00"
                  businessHours={[{ daysOfWeek: [0,1,2,3,4,5,6], startTime: `${range.start}:00`, endTime: `${range.end}:00` }]}
                  allDaySlot={false} nowIndicator editable droppable eventDurationEditable={false}
                  eventMinHeight={8} eventShortHeight={18} slotEventOverlap={false}
                  eventClick={(info) => {
                    const apt = info.event.extendedProps as AppointmentRecord;
                    setSelected((cur) => cur?.id === apt.id ? null : apt);
                  }}
                  dateClick={(info) => {
                    if (!canAdd) return;
                    const d = `${info.date.getFullYear()}-${String(info.date.getMonth()+1).padStart(2,'0')}-${String(info.date.getDate()).padStart(2,'0')}`;
                    const t = `${String(info.date.getHours()).padStart(2,'0')}:${String(info.date.getMinutes()).padStart(2,'0')}`;
                    const slot = fifteenMinuteSlots.includes(t) ? t : (fifteenMinuteSlots[0] ?? '');
                    setCreateForm((p) => ({ ...p, date: d, time: slot }));
                    setShowCreateModal(true);
                  }}
                  eventDrop={(info) => {
                    const date = info.event.startStr.slice(0, 10);
                    const h = String(info.event.start?.getHours() ?? 9).padStart(2, '0');
                    const m = String(info.event.start?.getMinutes() ?? 0).padStart(2, '0');
                    const durationMins = (info.event.extendedProps as AppointmentRecord).durationMins ?? 60;
                    openConfirm('Confirm Move', `Move to ${date} at ${h}:${m} for ${durationMins} min?`, async () => {
                      await updateAppointmentSlot(info.event.id, { date, time: `${h}:${m}`, status: (info.event.extendedProps as AppointmentRecord).status ?? 'pending', durationMins });
                      await fetchAppointments();
                    }, () => info.revert());
                  }}
                />
              </div>
            ))}
            <style>{`
              .appointment-calendar .fc { font-family:"Manrope",sans-serif; --fc-border-color:#c7d9f5; --fc-button-bg-color:#1d4ed8; --fc-button-border-color:#1d4ed8; --fc-button-hover-bg-color:#2563eb; --fc-today-bg-color:#f4f8ff; --fc-event-border-color:transparent; }
              .appointment-calendar .fc-toolbar-title { font-family:inherit; font-size:1rem!important; font-weight:700; color:#0f1f46; }
              .appointment-calendar .fc-button { border-radius:6px; font-size:10px; font-weight:700; letter-spacing:0.05em; padding:5px 12px; }
              .appointment-calendar .fc-col-header-cell { padding:8px 0; background:#f4f8ff; }
              .appointment-calendar .fc-col-header-cell-cushion { font-size:10px; text-transform:uppercase; font-weight:700; letter-spacing:0.08em; color:#46608e; }
              .appointment-calendar .fc-timegrid-slot-label-cushion { font-size:10px; font-weight:600; color:#94a3b8; }
              .appointment-calendar .fc-event { cursor:pointer; box-shadow:0 1px 3px rgb(0 0 0/0.1); transition:transform 0.15s; padding:2px 4px; border-left-width:3px; border-radius:6px; }
              .appointment-calendar .fc-event:hover { transform:scale(1.01); }
              .appointment-calendar .calendar-event-completed { opacity:0.5; }
              .appointment-calendar .fc-timegrid-slot { height:1.5rem; }
              .appointment-calendar .fc-non-business { background:transparent!important; }
              .appointment-calendar .fc-event-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.03em; }
            `}</style>
          </div>
        )}

        {/* ── Detail Panel ── */}
        {selected && (
          <div className="bg-white border border-brand-border rounded-xl overflow-hidden flex flex-col">
            <AppointmentDetailPanel
              appointment={selected}
              fifteenMinuteSlots={fifteenMinuteSlots}
              onRefresh={fetchAppointments}
              onRescheduleRequest={handleRescheduleRequest}
              savingSlot={savingSlot}
            />
          </div>
        )}
      </div>

      {/* ── Confirm Modal ── */}
      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { cancelActionRef.current?.(); closeConfirm(); }} />
          <div className="relative w-full max-w-sm border border-brand-border bg-white rounded-xl p-5 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-1">Confirm Action</p>
            <h4 className="text-base font-bold text-brand-ink">{confirmState.title}</h4>
            <p className="mt-2 text-sm text-brand-muted">{confirmState.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { cancelActionRef.current?.(); closeConfirm(); }} disabled={confirmState.loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-muted disabled:opacity-50 hover:bg-brand-bg transition">Cancel</button>
              <button onClick={handleConfirm} disabled={confirmState.loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                {confirmState.loading ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Appointment Modal ── */}
      {showCreateModal && canAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowCreateModal(false); resetCreate(); }} />
          <div className="relative w-full max-w-lg border border-brand-border bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-border bg-brand-bg-soft">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-0.5">New Appointment</p>
              <h4 className="text-base font-bold text-brand-ink">Book an Appointment</h4>
            </div>
            <div className="p-5">
              <div className="grid sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">First name *</label>
                  <input type="text" value={createForm.firstName} onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Last name *</label>
                  <input type="text" value={createForm.lastName} onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Email (optional)</label>
                  <input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Phone *</label>
                  <input type="tel" value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Age *</label>
                  <input type="number" min="0" max="150" value={createForm.age} onChange={(e) => setCreateForm((p) => ({ ...p, age: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" placeholder="e.g. 35" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Gender *</label>
                  <select value={createForm.gender} onChange={(e) => setCreateForm((p) => ({ ...p, gender: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">NIC (optional)</label>
                  <input type="text" value={createForm.nic} onChange={(e) => setCreateForm((p) => ({ ...p, nic: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" placeholder="e.g. 991234567V" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Treatment type *</label>
                  <input list="dental-treatments-create" value={createForm.treatmentType} onChange={(e) => setCreateForm((p) => ({ ...p, treatmentType: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                  <datalist id="dental-treatments-create">{treatmentTypes.map((t) => <option key={t} value={t} />)}</datalist>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Duration</label>
                  <select value={String(createForm.durationMins)} onChange={(e) => setCreateForm((p) => ({ ...p, durationMins: Number(e.target.value) }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                    {[15, 30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Date *</label>
                  <input type="date" value={createForm.date} onChange={(e) => setCreateForm((p) => ({ ...p, date: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Time *</label>
                  <select value={createForm.time} onChange={(e) => setCreateForm((p) => ({ ...p, time: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                    <option value="" disabled>{createForm.date ? `${availableCreateSlots.length} slot${availableCreateSlots.length !== 1 ? 's' : ''} available` : 'Select a date first'}</option>
                    {availableCreateSlots.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Notes</label>
                  <textarea placeholder="Optional notes…" value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs min-h-[56px] resize-none" />
                </div>
              </div>
              {actionError && <p className="mt-2 text-xs text-red-600 font-semibold">{actionError}</p>}
            </div>
            <div className="px-5 py-3 border-t border-brand-border bg-brand-bg-soft flex justify-end gap-2">
              <button onClick={() => { setShowCreateModal(false); resetCreate(); }} disabled={creatingAppointment}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-muted disabled:opacity-50 hover:bg-brand-bg transition">Cancel</button>
              <button disabled={creatingAppointment} onClick={async () => {
                if (!createForm.firstName || !createForm.lastName || !createForm.phone || !createForm.treatmentType || !createForm.date || !createForm.time) {
                  setActionError('Please complete all required fields.'); return;
                }
                if (!phoneValid) { setActionError('Valid phone required (10–15 digits).'); return; }
                if (createForm.email && !emailValid) { setActionError('Invalid email format.'); return; }
                setCreatingAppointment(true); setActionError('');
                try {
                  const created = await createAppointment({ ...createForm, phone: normalizedPhone, status: 'pending', age: createForm.age !== '' ? Number(createForm.age) : undefined });
                  await fetchAppointments();
                  setSelected(created);
                  setShowCreateModal(false); resetCreate();
                } catch (err) { setActionError(err instanceof Error ? err.message : 'Failed.'); }
                finally { setCreatingAppointment(false); }
              }} className="px-5 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                {creatingAppointment ? 'Creating…' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ── Patient History ───────────────────────────────────────────────────────────

function DashboardPatientHistory() {
  const location = useLocation();
  const [records, setRecords] = useState<PatientHistoryRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [hospitalHours, setHospitalHours] = useState({ openTime: '08:00', closeTime: '18:00', ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] });
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>(DENTAL_TREATMENTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [activeTab, setActiveTab] = useState<'appointments' | 'book' | 'events'>('appointments');
  const [selectedAptId, setSelectedAptId] = useState('');
  const selectedAptIdRef = useRef('');

  // Register modal
  const [showRegister, setShowRegister] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPatient, setNewPatient] = useState({ firstName: '', lastName: '', email: '', phone: '', nic: '', age: '' as string | number, gender: '' });
  const [registerError, setRegisterError] = useState('');

  // Treatment form
  const [treatment, setTreatment] = useState<TreatmentInput>({ treatmentName: '', cost: 0 });
  const [savingTreatment, setSavingTreatment] = useState(false);
  const [treatmentMsg, setTreatmentMsg] = useState('');

  // Clinical note (one per appointment)
  const [aptNotesDraft, setAptNotesDraft] = useState('');
  const [savingAptNote, setSavingAptNote] = useState(false);
  const [aptNoteMsg, setAptNoteMsg] = useState('');

  // Payment form
  const [payment, setPayment] = useState<PaymentInput>({ amount: 0, amountPaid: 0, status: 'pending', method: '', notes: '' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentMsg, setPaymentMsg] = useState('');

  // Book form
  const [bookForm, setBookForm] = useState({ treatmentType: '', date: '', time: '', durationMins: 30, notes: '' });
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState('');

  const toMins = (v: string) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
  const openRanges = useMemo(() => [...hospitalHours.ranges].sort((a, b) => toMins(a.start) - toMins(b.start)), [hospitalHours.ranges]);
  const fifteenMinuteSlots = useMemo(() => {
    const slots: string[] = [];
    openRanges.forEach((r) => { for (let m = toMins(r.start); m < toMins(r.end); m += 15) slots.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`); });
    return slots;
  }, [openRanges]);

  // Free slots for the booking form: remove any slot that overlaps an existing (non-cancelled) appointment
  const availableSlots = useMemo(() => {
    if (!bookForm.date) return fifteenMinuteSlots;
    const dayApts = appointments.filter((a) => a.date === bookForm.date && a.status !== 'cancelled');
    if (dayApts.length === 0) return fifteenMinuteSlots;
    return fifteenMinuteSlots.filter((slot) => {
      const slotStart = toMins(slot);
      const slotEnd = slotStart + bookForm.durationMins;
      return !dayApts.some((apt) => {
        const aptStart = toMins(apt.time);
        const aptEnd = aptStart + (apt.durationMins ?? 60);
        return slotStart < aptEnd && slotEnd > aptStart;
      });
    });
  }, [fifteenMinuteSlots, appointments, bookForm.date, bookForm.durationMins]);

  // Clear selected time if it's no longer available after date/duration change
  useEffect(() => {
    if (bookForm.time && !availableSlots.includes(bookForm.time)) {
      setBookForm((p) => ({ ...p, time: '' }));
    }
  }, [availableSlots]);

  useEffect(() => { selectedAptIdRef.current = selectedAptId; }, [selectedAptId]);

  const refreshData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [hist, apts] = await Promise.all([listPatientHistories(), listAppointments()]);
      setRecords(hist);
      setAppointments(apts);
      if (selectedAptIdRef.current) {
        const upd = apts.find((a) => a.id === selectedAptIdRef.current);
        if (upd) {
          const totalCost = upd.treatments.reduce((s, t) => s + t.cost, 0);
          setTreatment({ treatmentName: '', notes: '', cost: 0 });
          setPayment({ amount: upd.payment?.amount ?? totalCost, amountPaid: upd.payment?.amountPaid ?? 0, status: upd.payment?.status ?? 'pending', method: upd.payment?.method ?? '', notes: upd.payment?.notes ?? '' });
        }
      }
    } catch (err) { if (!silent) setError(err instanceof Error ? err.message : 'Failed to load.'); }
    finally { if (!silent) setLoading(false); }
  };

  useEffect(() => {
    refreshData();
    getHospitalHours().then(setHospitalHours).catch(() => {});
    listTreatmentTypes().then((t) => { if (t.length > 0) setTreatmentTypes(t); }).catch(() => {});
  }, []);

  // Auto-select patient when navigated from an appointment's "Manage in Patient History" link
  useEffect(() => {
    if (!location.state || records.length === 0) return;
    const { firstName, lastName, email } = location.state as { firstName?: string; lastName?: string; email?: string };
    const match = records.find((r) => {
      const nameMatch = r.firstName.toLowerCase() === (firstName ?? '').toLowerCase() &&
                        r.lastName.toLowerCase() === (lastName ?? '').toLowerCase();
      const emailMatch = email && r.email && r.email.toLowerCase() === email.toLowerCase();
      return nameMatch || emailMatch;
    });
    if (match) setSelectedId(match.id);
  }, [records, location.state]);

  useEffect(() => {
    setSelectedAptId('');
    setActiveTab('appointments');
    setTreatmentMsg('');
    setPaymentMsg('');
    setBookMsg('');
    setBookForm({ treatmentType: '', date: '', time: '', durationMins: 30, notes: '' });
  }, [selectedId]);

  const selectApt = (apt: AppointmentRecord | null) => {
    if (!apt) { setSelectedAptId(''); return; }
    setSelectedAptId(apt.id);
    const totalCost = apt.treatments.reduce((s, t) => s + t.cost, 0);
    setTreatment({ treatmentName: '', cost: 0 });
    setPayment({ amount: apt.payment?.amount ?? totalCost, amountPaid: apt.payment?.amountPaid ?? 0, status: apt.payment?.status ?? 'pending', method: apt.payment?.method ?? '', notes: apt.payment?.notes ?? '' });
    setTreatmentMsg(''); setPaymentMsg('');
    setAptNotesDraft(''); setAptNoteMsg('');
  };

  const [visibleCount, setVisibleCount] = useState(9);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => `${r.firstName} ${r.lastName} ${r.phone} ${r.email ?? ''}`.toLowerCase().includes(q));
  }, [records, search]);

  // Reset pagination when search changes
  useEffect(() => { setVisibleCount(9); }, [search]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filtered.length) {
        setVisibleCount((prev) => prev + 9);
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const selected = useMemo(() => filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null, [filtered, selectedId]);

  const patientApts = useMemo(() => {
    if (!selected) return [];
    return [...appointments.filter((apt) => {
      const nameMatch = apt.firstName.toLowerCase() === selected.firstName.toLowerCase() && apt.lastName.toLowerCase() === selected.lastName.toLowerCase();
      const emailMatch = selected.email && apt.email && selected.email.toLowerCase() === apt.email.toLowerCase();
      return nameMatch || emailMatch;
    })].sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [selected, appointments]);

  const balance = payment.amount - payment.amountPaid;

  const eventLabel = (type: string) => ({
    appointment_created: 'Appointment Created', appointment_rescheduled: 'Rescheduled',
    appointment_status_changed: 'Status Changed', appointment_deleted: 'Deleted',
    patient_registered: 'Patient Registered',
  }[type] ?? type.replace(/_/g, ' '));

  return (
    <div className="p-4 space-y-3 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold mb-0.5">Records</p>
          <h1 className="text-xl font-bold text-brand-ink">Patient History</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email…"
            className="px-3 py-2 border border-brand-border rounded-lg text-xs min-w-[200px] bg-white" />
          <button onClick={() => refreshData()} className="flex items-center gap-1.5 bg-white border border-brand-border text-brand-ink text-xs px-3 py-2 rounded-lg font-semibold hover:bg-brand-bg transition">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setShowRegister(true)}
            className="flex items-center gap-1.5 bg-brand-primary text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-brand-secondary transition shadow-sm">
            <Plus className="h-3.5 w-3.5" />Register Patient
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>}

      <div className="grid xl:grid-cols-[300px_1fr] gap-3 flex-1 min-h-0">
        {/* Patient List */}
        <div className="bg-white border border-brand-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-brand-border bg-brand-bg-soft shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
              {Math.min(visibleCount, filtered.length)} / {filtered.length} patient{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-brand-border">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 text-brand-muted animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-brand-muted">
                <Users className="h-7 w-7 opacity-30" />
                <p className="text-xs font-semibold">No records found</p>
              </div>
            ) : (
              <>
                {filtered.slice(0, visibleCount).map((item) => {
                  const isSel = selected?.id === item.id;
                  return (
                    <button key={item.id} onClick={() => setSelectedId(item.id)}
                      className={`w-full text-left px-4 py-3 transition ${isSel ? 'bg-brand-bg border-l-2 border-l-brand-primary' : 'hover:bg-brand-bg-soft'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isSel ? 'bg-brand-primary text-white' : 'bg-brand-bg text-brand-primary border border-brand-border'}`}>
                          {item.firstName[0]}{item.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-brand-ink truncate">{item.firstName} {item.lastName}</p>
                            <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${item.isRegisteredPatient ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {item.isRegisteredPatient ? 'Reg' : 'Lead'}
                            </span>
                          </div>
                          <p className="text-[10px] text-brand-muted">{item.phone}</p>
                          <p className="text-[10px] text-brand-muted">{item.appointmentCount} appt{item.appointmentCount !== 1 ? 's' : ''}</p>
                          {item.emailChangedLikely && <p className="text-[9px] text-amber-700 font-bold mt-0.5">Multiple emails</p>}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {visibleCount < filtered.length && (
                  <div ref={sentinelRef} className="flex items-center justify-center py-4 gap-2 text-brand-muted">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-[10px] font-semibold">Loading more…</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Patient Detail */}
        {selected ? (
          <div className="bg-white border border-brand-border rounded-xl overflow-hidden flex flex-col">
            {/* Patient header */}
            <div className="p-4 border-b border-brand-border bg-brand-bg-soft shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                  {selected.firstName[0]}{selected.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-brand-ink">{selected.firstName} {selected.lastName}</h2>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${selected.isRegisteredPatient ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {selected.isRegisteredPatient ? 'Registered' : 'Lead'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-brand-muted">
                    <span>{selected.phone}</span>
                    {selected.email && !selected.email.endsWith('@noemail.local') && <span>{selected.email}</span>}
                    {selected.alternateEmails.length > 0 && <span className="text-amber-700 font-semibold">+{selected.alternateEmails.length} alt email(s)</span>}
                    {selected.dateOfBirth && <span>DOB: {selected.dateOfBirth}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-brand-ink">{patientApts.length}</p>
                  <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">Appts</p>
                </div>
              </div>
              {selected.medicalHistory && (
                <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                  <span className="font-bold">Medical Note: </span>{selected.medicalHistory}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-brand-border bg-white shrink-0">
              {([
                { id: 'appointments' as const, label: 'Appointments', icon: <CalendarIcon className="h-4 w-4" />, count: patientApts.length },
                { id: 'book'         as const, label: 'Book Appt',    icon: <Plus className="h-4 w-4" />,         count: 0 },
                { id: 'events'       as const, label: 'History',      icon: <FileClock className="h-4 w-4" />,    count: selected.events.length },
              ]).map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap transition relative ${
                    activeTab === t.id ? 'text-brand-primary border-b-2 border-brand-primary -mb-px bg-brand-bg/40' : 'text-brand-muted hover:text-brand-ink hover:bg-brand-bg-soft'
                  }`}>
                  {t.icon}{t.label}
                  {t.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === t.id ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-bg border border-brand-border text-brand-muted'}`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">

              {/* Appointments Tab */}
              {activeTab === 'appointments' && (
                <div className="space-y-2">
                  {patientApts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-brand-muted">
                      <CalendarIcon className="h-7 w-7 opacity-30" />
                      <p className="text-sm font-semibold">No appointments yet</p>
                      <button onClick={() => setActiveTab('book')} className="text-xs font-semibold text-brand-primary hover:underline">Book one now</button>
                    </div>
                  ) : patientApts.map((apt) => {
                    const isSel = selectedAptId === apt.id;
                    const aptIsConsult = isConsultationType(apt.treatmentType);
                    return (
                      <div key={apt.id} onClick={() => selectApt(isSel ? null : apt)}
                        className={`border rounded-xl p-3 cursor-pointer transition ${isSel ? 'border-brand-primary bg-brand-bg' : 'border-brand-border hover:border-brand-accent hover:bg-brand-bg-soft'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-brand-ink">{apt.treatmentType}</p>
                            <p className="text-xs text-brand-muted mt-0.5">{apt.date} at {apt.time} · {apt.durationMins ?? 60} min</p>
                          </div>
                          <StatusBadge status={apt.status ?? 'pending'} />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {apt.treatments.length > 0 ? (
                            apt.treatments.map((t) => (
                              <span key={t.id} className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${aptIsConsult ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                <Stethoscope className="h-2.5 w-2.5" />{t.treatmentName}{!aptIsConsult && t.cost > 0 ? ` · LKR ${t.cost.toLocaleString()}` : ''}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-brand-muted italic">No {aptIsConsult ? 'plan' : 'treatment'} recorded</span>
                          )}
                          <PaymentBadge status={apt.payment?.status} />
                        </div>
                        {isSel && (
                          <div className="mt-3 pt-3 border-t border-brand-border space-y-4" onClick={(e) => e.stopPropagation()}>
                            {/* Treatments / Treatment Plan */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex items-center gap-1.5">
                                  <Stethoscope className="h-3 w-3" />{aptIsConsult ? 'Treatment Plan' : 'Treatments'}
                                </p>
                                {aptIsConsult && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Consultation — plan treatments below</span>
                                )}
                              </div>
                              {apt.treatments.length > 0 && (
                                <div className="space-y-1">
                                  {apt.treatments.map((t: TreatmentRecord) => (
                                    <div key={t.id} className={`flex items-center justify-between gap-2 border rounded-lg px-3 py-1.5 ${aptIsConsult ? 'bg-violet-50 border-violet-100' : 'bg-blue-50 border-blue-100'}`}>
                                      <div className="min-w-0 flex-1">
                                        <p className={`text-xs font-semibold truncate ${aptIsConsult ? 'text-violet-700' : 'text-blue-700'}`}>{t.treatmentName}</p>
                                        {(!aptIsConsult && t.cost > 0) && (
                                          <p className={`text-[10px] ${aptIsConsult ? 'text-violet-600' : 'text-blue-600'}`}>LKR {t.cost.toLocaleString()}</p>
                                        )}
                                      </div>
                                      <button onClick={async (e) => {
                                        e.stopPropagation();
                                        try { await deleteTreatment(apt.id, t.id); await refreshData(true); } catch { /* silent */ }
                                      }} className="shrink-0 text-[10px] text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition">✕</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <input list="dental-treatments-hist" value={treatment.treatmentName}
                                onChange={(e) => setTreatment((p) => ({ ...p, treatmentName: e.target.value }))}
                                placeholder={aptIsConsult ? 'Treatment needed (e.g. Crown Placement) *' : 'Treatment name *'}
                                className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                              <datalist id="dental-treatments-hist">{treatmentTypes.map((t) => <option key={t} value={t} />)}</datalist>
                              {!aptIsConsult && (
                                <input type="number" min="0" step="100" value={treatment.cost ?? 0}
                                  onChange={(e) => setTreatment((p) => ({ ...p, cost: Number(e.target.value) }))}
                                  placeholder="Cost (LKR)"
                                  className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                              )}
                              <button onClick={async (e) => {
                                e.stopPropagation();
                                if (!treatment.treatmentName.trim()) return;
                                setSavingTreatment(true); setTreatmentMsg('');
                                try {
                                  await addTreatment(apt.id, { ...treatment, cost: aptIsConsult ? 0 : (treatment.cost ?? 0) });
                                  setTreatmentMsg(aptIsConsult ? 'Added to plan.' : 'Treatment added.');
                                  setTreatment({ treatmentName: '', cost: 0 });
                                  await refreshData(true);
                                } catch (err) { setTreatmentMsg(err instanceof Error ? err.message : 'Failed.'); }
                                finally { setSavingTreatment(false); }
                              }} disabled={savingTreatment || !treatment.treatmentName.trim()}
                                className={`w-full py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 transition ${aptIsConsult ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {savingTreatment ? 'Saving…' : aptIsConsult ? '+ Add to Plan' : '+ Add Treatment'}
                              </button>
                              {treatmentMsg && <p className={`text-xs font-semibold ${treatmentMsg.startsWith('Failed') ? 'text-red-600' : 'text-emerald-700'}`}>{treatmentMsg}</p>}
                            </div>

                            {/* Clinical Notes — one shared note log per appointment */}
                            <div className="space-y-2 pt-3 border-t border-brand-border">
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex items-center gap-1.5">
                                <Stethoscope className="h-3 w-3" />Clinical Notes
                              </p>
                              {apt.clinicalNotes && (
                                <div className="bg-brand-bg-soft border border-brand-border rounded-lg px-3 py-2.5 text-xs text-brand-ink whitespace-pre-wrap break-words leading-relaxed">
                                  {apt.clinicalNotes}
                                </div>
                              )}
                              <textarea
                                value={aptNotesDraft}
                                onChange={(e) => setAptNotesDraft(e.target.value)}
                                rows={3}
                                placeholder={apt.clinicalNotes ? 'Add another note…' : 'Observations, diagnosis, findings…'}
                                className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button onClick={async (e) => {
                                e.stopPropagation();
                                if (!aptNotesDraft.trim()) return;
                                setSavingAptNote(true); setAptNoteMsg('');
                                try {
                                  const ts = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                  const entry = `[${ts}]\n${aptNotesDraft.trim()}`;
                                  const combined = apt.clinicalNotes ? `${apt.clinicalNotes}\n\n${entry}` : entry;
                                  await saveClinicalNote(apt.id, combined);
                                  setAptNotesDraft('');
                                  setAptNoteMsg('Note saved.');
                                  await refreshData(true);
                                } catch (err) { setAptNoteMsg(err instanceof Error ? err.message : 'Failed.'); }
                                finally { setSavingAptNote(false); }
                              }} disabled={savingAptNote || !aptNotesDraft.trim()}
                                className="w-full py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                                {savingAptNote ? 'Saving…' : apt.clinicalNotes ? '+ Add Note' : 'Save Note'}
                              </button>
                              {aptNoteMsg && <p className={`text-xs font-semibold ${aptNoteMsg === 'Note saved.' ? 'text-emerald-700' : 'text-red-600'}`}>{aptNoteMsg}</p>}
                            </div>

                            {/* Inline Payment Form */}
                            <div className="space-y-2 pt-3 border-t border-brand-border">
                              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex items-center gap-1.5">
                                <CreditCard className="h-3 w-3" />{aptIsConsult ? 'Consultation Fee' : 'Payment'}
                              </p>
                              {aptIsConsult ? (
                                <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 text-xs text-violet-700 flex items-center gap-2">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />Treatment plan above is free to set. Enter the consultation fee here.
                                </div>
                              ) : apt.treatments.length === 0 && (
                                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />Record treatment first to auto-fill cost.
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Total (LKR)</label>
                                  <input type="number" min="0" step="100" value={payment.amount}
                                    onChange={(e) => setPayment((p) => ({ ...p, amount: Number(e.target.value) }))}
                                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Paid (LKR)</label>
                                  <input type="number" min="0" step="100" value={payment.amountPaid}
                                    onChange={(e) => setPayment((p) => ({ ...p, amountPaid: Number(e.target.value) }))}
                                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                                </div>
                              </div>
                              <div className={`flex items-center justify-between rounded-lg px-3 py-2 font-bold border ${balance <= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                                <span className="text-xs font-bold uppercase tracking-wide">Balance Due</span>
                                <span className="text-sm">LKR {Math.max(0, balance).toLocaleString()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select value={payment.method ?? ''} onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
                                  className="w-full border border-brand-border rounded-lg px-2 py-2 text-xs">
                                  <option value="">Method…</option>
                                  <option value="cash">Cash</option>
                                  <option value="card">Card</option>
                                  <option value="insurance">Insurance</option>
                                  <option value="bank_transfer">Bank Transfer</option>
                                  <option value="other">Other</option>
                                </select>
                                <select value={payment.status} onChange={(e) => setPayment((p) => ({ ...p, status: e.target.value as PaymentStatus }))}
                                  className="w-full border border-brand-border rounded-lg px-2 py-2 text-xs">
                                  <option value="pending">Pending</option>
                                  <option value="partial">Partial</option>
                                  <option value="paid">Paid</option>
                                  <option value="waived">Waived</option>
                                </select>
                              </div>
                              <button onClick={async (e) => {
                                e.stopPropagation();
                                setSavingPayment(true); setPaymentMsg('');
                                try {
                                  await upsertPayment(apt.id, payment);
                                  setPaymentMsg('Payment saved.');
                                  await refreshData(true);
                                } catch (err) { setPaymentMsg(err instanceof Error ? err.message : 'Failed.'); }
                                finally { setSavingPayment(false); }
                              }} disabled={savingPayment}
                                className="w-full py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-700 transition">
                                {savingPayment ? 'Saving…' : apt.payment ? 'Update Payment' : 'Save Payment'}
                              </button>
                              {paymentMsg && <p className={`text-xs font-semibold ${paymentMsg.startsWith('Failed') ? 'text-red-600' : 'text-emerald-700'}`}>{paymentMsg}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Book Tab */}
              {activeTab === 'book' && (
                <div className="space-y-3">
                  <div className="bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5">
                    <p className="text-[10px] text-brand-muted font-bold uppercase tracking-wide mb-0.5">Booking for</p>
                    <p className="text-sm font-bold text-brand-ink">{selected.firstName} {selected.lastName}</p>
                    <p className="text-xs text-brand-muted">{selected.phone}{selected.email ? ` · ${selected.email}` : ''}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Treatment Type *</label>
                    <input list="dental-treatments-book-h" value={bookForm.treatmentType}
                      onChange={(e) => setBookForm((p) => ({ ...p, treatmentType: e.target.value }))}
                      placeholder="e.g. Crown Placement"
                      className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                    <datalist id="dental-treatments-book-h">{treatmentTypes.map((t) => <option key={t} value={t} />)}</datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Date *</label>
                      <input type="date" value={bookForm.date} onChange={(e) => setBookForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Duration</label>
                      <select value={bookForm.durationMins} onChange={(e) => setBookForm((p) => ({ ...p, durationMins: Number(e.target.value) }))}
                        className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                        {[15, 30, 45, 60, 75, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted">Time Slot *</label>
                      {bookForm.date && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${availableSlots.length === 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {availableSlots.length === 0 ? 'No slots available' : `${availableSlots.length} free`}
                        </span>
                      )}
                    </div>
                    {availableSlots.length === 0 && bookForm.date ? (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />All slots are fully booked for this date. Try a different date.
                      </div>
                    ) : (
                      <select value={bookForm.time} onChange={(e) => setBookForm((p) => ({ ...p, time: e.target.value }))}
                        className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                        <option value="">{bookForm.date ? 'Select available time' : 'Select a date first'}</option>
                        {availableSlots.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Notes</label>
                    <textarea value={bookForm.notes} onChange={(e) => setBookForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={2} placeholder="Instructions, special requirements…"
                      className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs resize-none" />
                  </div>
                  <button onClick={async () => {
                    if (!bookForm.treatmentType || !bookForm.date || !bookForm.time) {
                      setBookMsg('Treatment type, date and time are required.'); return;
                    }
                    setBooking(true); setBookMsg('');
                    try {
                      await createAppointment({
                        firstName: selected.firstName,
                        lastName: selected.lastName,
                        email: selected.email ?? '',
                        phone: selected.phone,
                        treatmentType: bookForm.treatmentType,
                        date: bookForm.date,
                        time: bookForm.time,
                        durationMins: bookForm.durationMins,
                        notes: bookForm.notes,
                        status: 'confirmed',
                      });
                      setBookMsg('Appointment booked!');
                      setBookForm({ treatmentType: '', date: '', time: '', durationMins: 30, notes: '' });
                      await refreshData(true);
                      setActiveTab('appointments');
                    } catch (err) { setBookMsg(err instanceof Error ? err.message : 'Failed.'); }
                    finally { setBooking(false); }
                  }} disabled={booking}
                    className="w-full py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                    {booking ? 'Booking…' : 'Book Appointment'}
                  </button>
                  {bookMsg && <p className={`text-xs font-semibold ${bookMsg === 'Appointment booked!' ? 'text-emerald-700' : 'text-red-600'}`}>{bookMsg}</p>}
                </div>
              )}

              {/* Events Tab */}
              {activeTab === 'events' && (
                <div className="space-y-3">
                  {(selected.dateOfBirth || selected.medicalHistory) && (
                    <div className="bg-brand-bg-soft border border-brand-border rounded-lg p-3 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Medical Profile</p>
                      {selected.dateOfBirth && <p className="text-xs text-brand-ink">DOB: <span className="font-semibold">{selected.dateOfBirth}</span></p>}
                      {selected.medicalHistory && <p className="text-xs text-brand-ink">{selected.medicalHistory}</p>}
                    </div>
                  )}
                  {selected.alternateEmails.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700 mb-1">Alternate Emails</p>
                      {selected.alternateEmails.map((e) => <p key={e} className="text-xs text-amber-800">{e}</p>)}
                    </div>
                  )}
                  {selected.events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-brand-muted">
                      <FileClock className="h-7 w-7 opacity-30" />
                      <p className="text-xs font-semibold">No events recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {selected.events.map((ev) => (
                        <div key={ev.id} className="border border-brand-border rounded-lg px-3 py-2 flex flex-wrap gap-2 items-center justify-between">
                          <p className="text-xs font-semibold text-brand-ink">{eventLabel(ev.eventType)}</p>
                          <div className="text-right">
                            <p className="text-[10px] text-brand-muted">{new Date(ev.createdAt).toLocaleString()}</p>
                            <p className="text-[10px] text-brand-muted">{ev.source ?? 'system'} · {ev.actorRole ?? 'unknown'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="bg-white border border-brand-border rounded-xl flex items-center justify-center">
            <div className="text-center space-y-2 p-8">
              <FileClock className="h-10 w-10 text-brand-muted opacity-25 mx-auto" />
              <p className="text-sm font-semibold text-brand-muted">Select a patient to view history</p>
              <p className="text-xs text-brand-muted">Appointments · Treatment · Payment · Events</p>
            </div>
          </div>
        )}
      </div>

      {/* Register Patient Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowRegister(false); setRegisterError(''); setNewPatient({ firstName: '', lastName: '', email: '', phone: '', nic: '', age: '', gender: '' }); }} />
          <div className="relative w-full max-w-md border border-brand-border bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-border bg-brand-bg-soft">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-0.5">Patient Registry</p>
              <h4 className="text-base font-bold text-brand-ink">Register New Patient</h4>
            </div>
            <div className="p-5 grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">First name *</label>
                <input type="text" value={newPatient.firstName} onChange={(e) => setNewPatient((p) => ({ ...p, firstName: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Last name *</label>
                <input type="text" value={newPatient.lastName} onChange={(e) => setNewPatient((p) => ({ ...p, lastName: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Email *</label>
                <input type="email" value={newPatient.email} onChange={(e) => setNewPatient((p) => ({ ...p, email: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Phone *</label>
                <input type="tel" value={newPatient.phone} onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Age *</label>
                <input type="number" min="0" max="150" value={newPatient.age} onChange={(e) => setNewPatient((p) => ({ ...p, age: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" placeholder="e.g. 35" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Gender *</label>
                <select value={newPatient.gender} onChange={(e) => setNewPatient((p) => ({ ...p, gender: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">NIC (optional)</label>
                <input type="text" value={newPatient.nic} onChange={(e) => setNewPatient((p) => ({ ...p, nic: e.target.value }))} className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" placeholder="e.g. 991234567V" />
              </div>
            </div>
            {registerError && <p className="px-5 pb-2 text-xs text-red-600 font-semibold">{registerError}</p>}
            <div className="px-5 py-3 border-t border-brand-border bg-brand-bg-soft flex justify-end gap-2">
              <button onClick={() => { setShowRegister(false); setRegisterError(''); setNewPatient({ firstName: '', lastName: '', email: '', phone: '', nic: '', age: '', gender: '' }); }} disabled={creating}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-muted disabled:opacity-50 hover:bg-brand-bg transition">Cancel</button>
              <button disabled={creating} onClick={async () => {
                if (!newPatient.firstName || !newPatient.lastName || !newPatient.email || !newPatient.phone || !newPatient.age || !newPatient.gender) {
                  setRegisterError('First name, last name, email, phone, age and gender are required.'); return;
                }
                setCreating(true); setRegisterError('');
                try {
                  await createPatient({ ...newPatient, age: newPatient.age !== '' ? Number(newPatient.age) : undefined });
                  setNewPatient({ firstName: '', lastName: '', email: '', phone: '', nic: '', age: '', gender: '' });
                  setShowRegister(false);
                  await refreshData();
                } catch (err) { setRegisterError(err instanceof Error ? err.message : 'Failed.'); }
                finally { setCreating(false); }
              }} className="px-5 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                {creating ? 'Registering…' : 'Register Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Staff ─────────────────────────────────────────────────────────────────────

function DashboardStaff() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ displayName: '', email: '', username: '', password: '', role: 'staff' as 'staff' | 'admin' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    listStaff().then(setStaff).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const resetForm = () => { setForm({ displayName: '', email: '', username: '', password: '', role: 'staff' }); setFormError(''); setEditingId(null); };

  const openCreate = () => { resetForm(); setModalMode('create'); setShowModal(true); };

  const openEdit = (s: StaffRecord) => {
    setForm({ displayName: s.displayName, email: s.email, username: s.username ?? '', password: '', role: s.role === 'admin' ? 'admin' : 'staff' });
    setFormError('');
    setEditingId(s.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (modalMode === 'create') {
      if (!form.displayName || !form.email || !form.username || !form.password) {
        setFormError('All fields are required.'); return;
      }
      if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
      setSaving(true); setFormError('');
      try {
        await createStaff(form);
        setShowModal(false); resetForm(); refresh();
      } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed.'); }
      finally { setSaving(false); }
    } else {
      if (!form.displayName || !form.email) { setFormError('Name and email are required.'); return; }
      if (form.password && form.password.length < 6) { setFormError('New password must be at least 6 characters.'); return; }
      setSaving(true); setFormError('');
      try {
        await updateStaff(editingId!, {
          displayName: form.displayName,
          email: form.email,
          username: form.username || undefined,
          password: form.password || undefined,
          role: form.role,
        });
        setShowModal(false); resetForm(); refresh();
      } catch (err) { setFormError(err instanceof Error ? err.message : 'Failed.'); }
      finally { setSaving(false); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this staff member? This cannot be undone.')) return;
    setDeletingId(id);
    try { await deleteStaff(id); refresh(); }
    catch (err) { alert(err instanceof Error ? err.message : 'Failed to delete.'); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="p-5 space-y-4">
      <PageHeader label="Operations" title="Clinical Staff"
        action={
          <button onClick={openCreate}
            className="flex items-center gap-1.5 bg-brand-primary text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-brand-secondary transition shadow-sm">
            <Plus className="h-3.5 w-3.5" />Add Doctor
          </button>
        }
      />
      <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-brand-border flex items-center gap-2 bg-brand-bg">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-primary" />
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">Staff Login Accounts</p>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-brand-bg-soft text-[10px] uppercase tracking-[0.15em] text-brand-muted font-bold border-b border-brand-border">
              <th className="px-4 py-3">Practitioner</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading
              ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-brand-muted">Loading…</td></tr>
              : staff.length === 0
                ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-brand-muted">No staff found.</td></tr>
                : staff.map((s) => (
                  <tr key={s.id} className="hover:bg-brand-bg-soft transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">{s.displayName[0]}</div>
                        <div>
                          <p className="font-semibold text-brand-ink text-sm">{s.displayName}</p>
                          <p className="text-xs text-brand-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-brand-ink">{s.username ?? <span className="italic text-brand-muted">—</span>}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-brand-bg text-brand-muted'}`}>{s.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.canLogin ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs text-brand-muted font-medium">{s.canLogin ? 'Enabled' : 'No account'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(s)}
                          className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id}
                          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-40 transition">
                          {deletingId === s.id ? 'Removing…' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setShowModal(false); resetForm(); }} />
          <div className="relative w-full max-w-md border border-brand-border bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-brand-border bg-brand-bg-soft">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary mb-0.5">Staff Management</p>
              <h4 className="text-base font-bold text-brand-ink">{modalMode === 'edit' ? 'Edit Doctor' : 'Add Doctor'}</h4>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Display Name *</label>
                  <input type="text" value={form.displayName} onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" placeholder="Dr. Ayesha Silva" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" placeholder="doctor@clinic.lk" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Role</label>
                  <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as 'staff' | 'admin' }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs">
                    <option value="staff">Doctor / Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">Username {modalMode === 'create' ? '*' : ''}</label>
                  <input type="text" value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs font-mono" placeholder="dr.ayesha" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-brand-muted mb-1">
                    Password {modalMode === 'create' ? '* (min 6)' : '(leave blank to keep)'}
                  </label>
                  <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs"
                    placeholder={modalMode === 'edit' ? '••••••' : ''} />
                </div>
              </div>
              {formError && <p className="text-xs text-red-600 font-semibold">{formError}</p>}
            </div>
            <div className="px-5 py-3 border-t border-brand-border bg-brand-bg-soft flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} disabled={saving}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-brand-border text-brand-muted disabled:opacity-50 hover:bg-brand-bg transition">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-brand-primary text-white disabled:opacity-50 hover:bg-brand-secondary transition">
                {saving ? (modalMode === 'edit' ? 'Saving…' : 'Creating…') : (modalMode === 'edit' ? 'Save Changes' : 'Create Account')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────────────

function DashboardSettings() {
  const [ranges, setRanges] = useState([{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notif, setNotif] = useState<NotificationSettings>({
    recipients: [], sendToPatientOnBooking: true, sendToPatientOnConfirmed: true, sendToPatientOnReschedule: true,
    sendToTeamOnBooking: true, sendToTeamOnConfirmed: true, sendToTeamOnReschedule: true,
  });
  const [recipientsInput, setRecipientsInput] = useState('');

  // Treatment types
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>(DENTAL_TREATMENTS);
  const [newType, setNewType] = useState('');
  const [savingTypes, setSavingTypes] = useState(false);
  const [typesMsg, setTypesMsg] = useState('');

  // Backup
  const [backupSchedule, setBackupSchedule] = useState<'weekly' | 'monthly'>('weekly');
  const [savingBackup, setSavingBackup] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [downloadingCsv, setDownloadingCsv] = useState<'appointments' | 'patients' | null>(null);

  const slotOptions = useMemo(() => {
    const v: string[] = [];
    for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 15) v.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    return v;
  }, []);

  useEffect(() => {
    Promise.all([getHospitalHours(), getNotificationSettings(), listTreatmentTypes(), fetch('/api/backup/settings', { credentials: 'include' }).then((r) => r.json()).catch(() => null)]).then(([hrs, n, types, bk]) => {
      setRanges(hrs.ranges?.length ? hrs.ranges : [{ start: hrs.openTime, end: hrs.closeTime }]);
      setNotif(n); setRecipientsInput(n.recipients.join(', '));
      if (types.length > 0) setTreatmentTypes(types);
      if (bk?.data?.backupSchedule) setBackupSchedule(bk.data.backupSchedule);
    }).catch((err) => setError(err instanceof Error ? err.message : 'Failed.')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-5 space-y-4">
      <PageHeader label="Configuration" title="Hospital & Notification Settings" />
      <div className="max-w-2xl space-y-4">
        <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">Hospital Hours</p>
          {loading && <p className="text-sm text-brand-muted">Loading…</p>}
          <div className="space-y-2">
            {ranges.map((range, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                {(['start','end'] as const).map((k) => (
                  <div key={k}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">{k === 'start' ? 'Open' : 'Close'}</label>
                    <select value={range[k]} onChange={(e) => { const c = [...ranges]; c[i] = { ...c[i], [k]: e.target.value }; setRanges(c); }}
                      className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm">
                      {slotOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                ))}
                <button disabled={ranges.length <= 1} onClick={() => setRanges(ranges.filter((_, j) => j !== i))}
                  className="px-3 py-2 border border-red-200 text-red-600 text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-red-50 transition">Remove</button>
              </div>
            ))}
            <button onClick={() => setRanges([...ranges, { start: '19:00', end: '21:00' }])}
              className="px-3 py-2 border border-brand-border rounded-lg text-xs font-semibold text-brand-muted hover:bg-brand-bg transition">+ Add Range</button>
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">Email Notifications</p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Team recipients (comma-separated)</label>
            <textarea value={recipientsInput} onChange={(e) => setRecipientsInput(e.target.value)} rows={2}
              placeholder="manager@clinic.com, frontdesk@clinic.com"
              className="w-full border border-brand-border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {([
              ['sendToPatientOnBooking','Patient: on booking'],['sendToPatientOnConfirmed','Patient: on confirmation'],
              ['sendToPatientOnReschedule','Patient: on reschedule'],['sendToTeamOnBooking','Team: on booking'],
              ['sendToTeamOnConfirmed','Team: on confirmation'],['sendToTeamOnReschedule','Team: on reschedule'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-brand-ink cursor-pointer">
                <input type="checkbox" checked={notif[key] as boolean} onChange={(e) => setNotif((p) => ({ ...p, [key]: e.target.checked }))} className="accent-brand-primary" />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Treatment Types */}
        <div className="bg-white border border-brand-border rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">Treatment Types</p>
          <p className="text-[11px] text-brand-muted">These appear in the treatment type dropdown when booking appointments.</p>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {treatmentTypes.map((type, i) => (
              <div key={i} className="flex items-center justify-between gap-2 border border-brand-border rounded-lg px-3 py-2 bg-brand-bg-soft">
                <span className="text-xs font-semibold text-brand-ink">{type}</span>
                <button onClick={() => setTreatmentTypes((prev) => prev.filter((_, j) => j !== i))}
                  className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-wide transition shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newType} onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newType.trim()) {
                  e.preventDefault();
                  if (!treatmentTypes.includes(newType.trim())) setTreatmentTypes((p) => [...p, newType.trim()]);
                  setNewType('');
                }
              }}
              placeholder="Add treatment type…"
              className="flex-1 border border-brand-border rounded-lg px-3 py-2 text-xs" />
            <button onClick={() => {
              if (!newType.trim() || treatmentTypes.includes(newType.trim())) return;
              setTreatmentTypes((p) => [...p, newType.trim()]);
              setNewType('');
            }} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-secondary transition">
              Add
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button disabled={savingTypes} onClick={async () => {
              setSavingTypes(true); setTypesMsg('');
              try {
                const saved = await saveTreatmentTypes(treatmentTypes);
                setTreatmentTypes(saved);
                setTypesMsg('Treatment types saved.');
              } catch (err) { setTypesMsg(err instanceof Error ? err.message : 'Failed.'); }
              finally { setSavingTypes(false); }
            }} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-brand-secondary transition">
              {savingTypes ? 'Saving…' : 'Save Treatment Types'}
            </button>
            {typesMsg && <p className={`text-xs font-semibold ${typesMsg.startsWith('Failed') ? 'text-red-600' : 'text-emerald-700'}`}>{typesMsg}</p>}
          </div>
        </div>

        {/* Backup */}
        <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-brand-muted">Data Backup</p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1">Backup Schedule</label>
              <div className="flex gap-2">
                {(['weekly', 'monthly'] as const).map((opt) => (
                  <button key={opt} onClick={() => setBackupSchedule(opt)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${backupSchedule === opt ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-muted hover:bg-brand-bg'}`}>
                    {opt === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button disabled={savingBackup} onClick={async () => {
                setSavingBackup(true); setBackupMsg('');
                try {
                  await fetch('/api/backup/settings', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backupSchedule }) });
                  setBackupMsg('Schedule saved.');
                } catch { setBackupMsg('Failed to save.'); }
                finally { setSavingBackup(false); }
              }} className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-brand-secondary transition">
                {savingBackup ? 'Saving…' : 'Save Schedule'}
              </button>
              {backupMsg && <p className={`text-xs font-semibold ${backupMsg.startsWith('Failed') ? 'text-red-600' : 'text-emerald-700'}`}>{backupMsg}</p>}
            </div>
            <div className="border-t border-brand-border pt-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Download Backup CSV</p>
              <div className="flex gap-2 flex-wrap">
                {(['appointments', 'patients'] as const).map((type) => (
                  <button key={type} disabled={downloadingCsv === type} onClick={async () => {
                    setDownloadingCsv(type);
                    try {
                      const res = await fetch(`/api/backup/${type}.csv`, { credentials: 'include' });
                      if (!res.ok) throw new Error('Failed');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
                      a.click(); URL.revokeObjectURL(url);
                    } catch { alert('Download failed.'); }
                    finally { setDownloadingCsv(null); }
                  }} className="flex items-center gap-1.5 px-4 py-2 border border-brand-border rounded-lg text-xs font-semibold text-brand-ink hover:bg-brand-bg disabled:opacity-50 transition">
                    {downloadingCsv === type ? 'Downloading…' : `Download ${type === 'appointments' ? 'Appointments' : 'Patients'} CSV`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button disabled={saving} onClick={async () => {
            setSaving(true); setError(''); setMessage('');
            try {
              const [upd, updN] = await Promise.all([
                updateHospitalHours({ openTime: '00:00', closeTime: '00:00', ranges }),
                updateNotificationSettings({ ...notif, recipients: recipientsInput.split(',').map((s) => s.trim()).filter(Boolean) }),
              ]);
              setRanges(upd.ranges); setNotif(updN); setRecipientsInput(updN.recipients.join(', '));
              setMessage('Settings saved.');
            } catch (err) { setError(err instanceof Error ? err.message : 'Failed.'); }
            finally { setSaving(false); }
          }} className="px-5 py-2.5 bg-brand-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-brand-secondary transition">
            {saving ? 'Saving…' : 'Save Hours & Notifications'}
          </button>
          {message && <p className="text-xs text-emerald-700 font-semibold">{message}</p>}
          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Doctor Dashboard ──────────────────────────────────────────────────────────

export function DoctorDashboard({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'upcoming' | 'all'>('today');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [treatment, setTreatment] = useState<TreatmentInput>({ treatmentName: '', cost: 0 });
  const [savingTx, setSavingTx] = useState(false);
  const [txMsg, setTxMsg] = useState('');
  const [consultPrice, setConsultPrice] = useState(0);
  const [savingConsultPrice, setSavingConsultPrice] = useState(false);
  const [clinicalNoteDraft, setClinicalNoteDraft] = useState('');
  const [savingClinicalNote, setSavingClinicalNote] = useState(false);
  const [clinicalNoteMsg, setClinicalNoteMsg] = useState('');
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>(DENTAL_TREATMENTS);
  const [nowMins, setNowMins] = useState(() => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); });

  const today = new Date().toISOString().slice(0, 10);
  const toMinsDr = (v: string) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };

  useEffect(() => {
    const id = setInterval(() => { const d = new Date(); setNowMins(d.getHours() * 60 + d.getMinutes()); }, 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchAll = async () => {
    try {
      const data = await listAppointments();
      const sorted = [...data].sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : a.time.localeCompare(b.time);
      });
      setAppointments(sorted);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchAll();
    listTreatmentTypes().then((t) => { if (t.length > 0) setTreatmentTypes(t); }).catch(() => {});
    const id = window.setInterval(() => fetchAll(), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const visible = appointments.filter((a) => {
    if (tab === 'today') return a.date === today && a.status !== 'cancelled';
    if (tab === 'upcoming') return a.date > today && a.status !== 'cancelled';
    return true;
  });

  const selectCard = (apt: AppointmentRecord) => {
    if (expandedId === apt.id) { setExpandedId(null); return; }
    setExpandedId(apt.id);
    setTreatment({ treatmentName: '', cost: 0 });
    setTxMsg('');
    setClinicalNoteDraft('');
    setClinicalNoteMsg('');
    setEditingNoteIdx(null);
    setEditingNoteText('');
    setConsultPrice(apt.payment?.amount ?? 0);
  };

  const saveConsultPrice = async (aptId: string) => {
    setSavingConsultPrice(true);
    try {
      const apt = appointments.find((a) => a.id === aptId);
      const existingPaid = apt?.payment?.amountPaid ?? 0;
      const existingStatus = apt?.payment?.status ?? 'pending';
      await upsertPayment(aptId, { amount: consultPrice, amountPaid: existingPaid, status: existingStatus });
      setAppointments((prev) => prev.map((a) => a.id === aptId ? { ...a, payment: { ...a.payment, amount: consultPrice } as any } : a));
    } catch { /* silent */ }
    finally { setSavingConsultPrice(false); }
  };

  const saveTx = async (aptId: string) => {
    if (!treatment.treatmentName.trim()) { setTxMsg('Treatment name is required.'); return; }
    const apt = appointments.find((a) => a.id === aptId);
    const isConsult = apt ? isConsultationType(apt.treatmentType) : false;
    setSavingTx(true); setTxMsg('');
    try {
      const saved = await addTreatment(aptId, { ...treatment, cost: isConsult ? 0 : (treatment.cost ?? 0) });
      setAppointments((prev) => prev.map((a) => a.id === aptId ? { ...a, treatments: [...a.treatments, saved] } : a));
      setTreatment({ treatmentName: '', cost: 0 });
      setTxMsg('Added.');
      fetchAll();
    } catch (err) { setTxMsg(err instanceof Error ? err.message : 'Failed.'); }
    finally { setSavingTx(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg-soft">
      {/* Sidebar */}
      <aside className="w-52 border-r border-brand-border flex flex-col bg-white hidden lg:flex shrink-0">
        <div className="p-4 border-b border-brand-border">
          <p className="text-[9px] uppercase tracking-[0.25em] text-brand-muted font-bold">Doctor Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-semibold">
            <CalendarIcon className="h-4 w-4 shrink-0" /><span>Appointments</span>
          </div>
        </nav>
        <div className="p-3 border-t border-brand-border space-y-2">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.displayName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-brand-ink truncate">{user.displayName}</p>
              <p className="text-[10px] text-brand-muted capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={async () => {
              try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* ignore */ }
              onLogout();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition w-full">
            <Ban className="h-3.5 w-3.5 shrink-0" /><span>Logout</span>
          </button>
          <Link to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-brand-muted hover:bg-brand-bg hover:text-brand-ink transition w-full">
            <ChevronRight className="h-3.5 w-3.5 rotate-180 shrink-0" /><span>Back to Website</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold mb-0.5">Doctor View</p>
          <h1 className="text-xl font-bold text-brand-ink">My Appointments</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex rounded-lg border border-brand-border overflow-hidden bg-white w-fit">
          {(['today', 'upcoming', 'all'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition ${tab === t ? 'bg-brand-primary text-white' : 'text-brand-muted hover:bg-brand-bg'}`}>
              {t === 'today' ? 'Today' : t === 'upcoming' ? 'Upcoming' : 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-5 w-5 text-brand-muted animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-brand-muted">
            <CalendarIcon className="h-8 w-8 opacity-30" />
            <p className="text-sm font-semibold">No appointments for this view</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {visible.map((apt) => {
              const isExpanded = expandedId === apt.id;
              const aptIsConsult = isConsultationType(apt.treatmentType);
              const aptStartMins = toMinsDr(apt.time);
              const isHappeningNow = apt.date === today && aptStartMins <= nowMins && nowMins < aptStartMins + (apt.durationMins ?? 60);
              return (
                <div key={apt.id}
                  className={`bg-white border rounded-xl transition cursor-pointer ${isExpanded ? 'border-brand-primary' : isHappeningNow ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-brand-border hover:border-brand-accent'}`}
                  onClick={() => selectCard(apt)}>
                  {/* Card header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-brand-ink">{apt.firstName} {apt.lastName}</p>
                        <p className="text-xs text-brand-muted mt-0.5">{apt.treatmentType}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className="text-xs text-brand-muted">{apt.date} · <span className={`font-bold ${isHappeningNow ? 'text-emerald-600' : ''}`}>{apt.time}</span> · {apt.durationMins ?? 60} min</p>
                          {isHappeningNow && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500 text-white animate-pulse">● NOW</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <StatusBadge status={apt.status ?? 'pending'} />
                        {apt.treatments.map((t) => (
                          <span key={t.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${aptIsConsult ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            <Stethoscope className="h-3 w-3" />{t.treatmentName}{!aptIsConsult && t.cost > 0 ? ` · LKR ${t.cost.toLocaleString()}` : ''}
                          </span>
                        ))}
                        {apt.payment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            LKR {apt.payment.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline treatment form */}
                  {isExpanded && (
                    <div className="border-t border-brand-border p-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex items-center gap-1.5">
                          <Stethoscope className="h-3 w-3" />{aptIsConsult ? 'Treatment Plan' : 'Treatments'}
                        </p>
                        {aptIsConsult && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Plan — no price needed</span>
                        )}
                      </div>
                      {apt.treatments.length > 0 && (
                        <div className="space-y-1">
                          {apt.treatments.map((t: TreatmentRecord) => (
                            <div key={t.id} className={`border rounded-lg px-3 py-2 space-y-1.5 ${aptIsConsult ? 'bg-violet-50 border-violet-100' : 'bg-blue-50 border-blue-100'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className={`text-xs font-semibold ${aptIsConsult ? 'text-violet-700' : 'text-blue-700'}`}>{t.treatmentName}</p>
                                  {(!aptIsConsult && t.cost > 0) && (
                                    <p className={`text-[10px] ${aptIsConsult ? 'text-violet-600' : 'text-blue-600'}`}>LKR {t.cost.toLocaleString()}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await deleteTreatment(apt.id, t.id);
                                      setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, treatments: a.treatments.filter((x) => x.id !== t.id) } : a));
                                    } catch { /* silent */ }
                                  }} className="text-[10px] text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition">✕</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <input list="doc-dental-treatments" value={treatment.treatmentName}
                        onChange={(e) => setTreatment((p) => ({ ...p, treatmentName: e.target.value }))}
                        placeholder={aptIsConsult ? 'Treatment needed (e.g. Crown Placement) *' : 'Treatment name *'}
                        className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                      <datalist id="doc-dental-treatments">{treatmentTypes.map((t) => <option key={t} value={t} />)}</datalist>
                      {!aptIsConsult && (
                        <input value={treatment.cost ?? 0} type="number" min="0" step="100"
                          onChange={(e) => setTreatment((p) => ({ ...p, cost: Number(e.target.value) }))}
                          placeholder="Cost in LKR"
                          className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs" />
                      )}
                      <button onClick={() => saveTx(apt.id)} disabled={savingTx || !treatment.treatmentName.trim()}
                        className={`w-full py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 transition ${aptIsConsult ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {savingTx ? 'Saving…' : aptIsConsult ? '+ Add to Plan' : '+ Add Treatment'}
                      </button>
                      {txMsg && <p className={`text-xs font-semibold ${txMsg === 'Added.' ? 'text-emerald-700' : 'text-red-600'}`}>{txMsg}</p>}

                      {/* Clinical Notes */}
                      <div className="pt-3 border-t border-brand-border space-y-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">Clinical Notes</p>

                        {/* Existing note entries */}
                        {apt.clinicalNotes && (() => {
                          const entries = apt.clinicalNotes.split('\n\n').filter(Boolean);
                          return (
                            <div className="space-y-2">
                              {entries.map((entry, idx) => {
                                const tsMatch = entry.match(/^\[(.+?)\]\n?/);
                                const timestamp = tsMatch ? tsMatch[1] : null;
                                const body = tsMatch ? entry.slice(tsMatch[0].length) : entry;
                                const accentBg = aptIsConsult ? 'bg-violet-50 border-violet-100' : 'bg-blue-50 border-blue-100';
                                const accentText = aptIsConsult ? 'text-violet-700' : 'text-blue-700';
                                const accentBtn = aptIsConsult ? 'text-violet-500 hover:text-violet-700 hover:bg-violet-100' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-100';
                                return (
                                  <div key={idx} className={`border rounded-lg px-3 py-2 space-y-1.5 ${accentBg}`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0 flex-1">
                                        {timestamp && <p className="text-[9px] text-brand-muted font-semibold mb-0.5">{timestamp}</p>}
                                        {editingNoteIdx !== idx && (
                                          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${accentText}`}>{body}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => {
                                          if (editingNoteIdx === idx) { setEditingNoteIdx(null); } else { setEditingNoteIdx(idx); setEditingNoteText(body); }
                                        }} className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${accentBtn}`}>
                                          {editingNoteIdx === idx ? 'Cancel' : 'Edit'}
                                        </button>
                                        <button onClick={async () => {
                                          const updated = entries.filter((_, i) => i !== idx).join('\n\n');
                                          try {
                                            await saveClinicalNote(apt.id, updated || '');
                                            setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, clinicalNotes: updated || null } : a));
                                            if (editingNoteIdx === idx) setEditingNoteIdx(null);
                                          } catch { /* silent */ }
                                        }} className="text-[10px] text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50 transition">✕</button>
                                      </div>
                                    </div>
                                    {editingNoteIdx === idx && (
                                      <div className="space-y-1.5">
                                        <textarea
                                          value={editingNoteText}
                                          onChange={(e) => setEditingNoteText(e.target.value)}
                                          rows={3}
                                          autoFocus
                                          className={`w-full border rounded-lg px-3 py-2 text-xs resize-none bg-white ${aptIsConsult ? 'border-violet-200' : 'border-blue-200'}`}
                                        />
                                        <button onClick={async () => {
                                          if (!editingNoteText.trim()) return;
                                          const updated = entries.map((e, i) => i === idx ? (timestamp ? `[${timestamp}]\n${editingNoteText.trim()}` : editingNoteText.trim()) : e).join('\n\n');
                                          try {
                                            await saveClinicalNote(apt.id, updated);
                                            setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, clinicalNotes: updated } : a));
                                            setEditingNoteIdx(null);
                                          } catch { /* silent */ }
                                        }} className={`w-full py-1.5 text-xs font-semibold rounded-lg text-white transition ${aptIsConsult ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                          Save
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}

                        {/* Add new note */}
                        <textarea
                          value={clinicalNoteDraft}
                          onChange={(e) => { setClinicalNoteDraft(e.target.value); setClinicalNoteMsg(''); }}
                          rows={2}
                          placeholder="Add clinical note…"
                          className="w-full border border-brand-border rounded-lg px-3 py-2 text-xs resize-none"
                        />
                        {clinicalNoteDraft.trim() && (
                          <button
                            onClick={async () => {
                              if (!clinicalNoteDraft.trim()) return;
                              setSavingClinicalNote(true); setClinicalNoteMsg('');
                              try {
                                const ts = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                const entry = `[${ts}]\n${clinicalNoteDraft.trim()}`;
                                const existing = apt.clinicalNotes;
                                const combined = existing ? `${existing}\n\n${entry}` : entry;
                                await saveClinicalNote(apt.id, combined);
                                setAppointments((prev) => prev.map((a) => a.id === apt.id ? { ...a, clinicalNotes: combined } : a));
                                setClinicalNoteDraft('');
                                setClinicalNoteMsg('Saved.');
                              } catch (err) { setClinicalNoteMsg(err instanceof Error ? err.message : 'Failed.'); }
                              finally { setSavingClinicalNote(false); }
                            }}
                            disabled={savingClinicalNote}
                            className={`w-full py-2 text-xs font-semibold rounded-lg text-white disabled:opacity-50 transition ${aptIsConsult ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {savingClinicalNote ? 'Saving…' : '+ Add Note'}
                          </button>
                        )}
                        {clinicalNoteMsg && <p className={`text-xs font-semibold ${clinicalNoteMsg === 'Saved.' ? 'text-emerald-700' : 'text-red-600'}`}>{clinicalNoteMsg}</p>}
                      </div>

                      {aptIsConsult && (
                        <div className="pt-3 border-t border-brand-border space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3" />Consultation Fee
                          </p>
                          <div className="flex gap-2">
                            <input type="number" min="0" step="100" value={consultPrice}
                              onChange={(e) => setConsultPrice(Number(e.target.value))}
                              placeholder="Consultation price (LKR)"
                              className="flex-1 border border-brand-border rounded-lg px-3 py-2 text-xs" />
                            <button onClick={() => saveConsultPrice(apt.id)} disabled={savingConsultPrice}
                              className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition shrink-0">
                              {savingConsultPrice ? 'Saving…' : 'Save Fee'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
