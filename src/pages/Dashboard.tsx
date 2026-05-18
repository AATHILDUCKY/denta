import { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { UserProfile, PatientRecord } from '../types';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
  Users, Calendar as CalendarIcon, Activity, Settings, ShieldCheck, FileClock
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { createAppointment, listAppointments, updateAppointmentSlot, updateAppointmentStatus, type AppointmentRecord } from '../lib/appointments-api';
import { listStaff, listPatients, createPatient, getHospitalHours, updateHospitalHours, getNotificationSettings, updateNotificationSettings, listPatientHistories, type StaffRecord, type PatientHistoryRecord, type NotificationSettings } from '../lib/management-api';

interface DashboardProps {
  user: UserProfile | null;
}

export default function Dashboard({ user }: DashboardProps) {
  const location = useLocation();
  
  const guestUser: UserProfile = {
    uid: 'guest',
    email: 'guest@dentacare.pro',
    displayName: 'Guest Administrator',
    role: 'admin', // Allow guest to see everything for demo purposes
    createdAt: new Date().toISOString()
  };

  const currentUser = user || guestUser;
  
  const sidebarLinks = [
    { name: 'Overview', path: '/dashboard', icon: Activity },
    { name: 'Appointments', path: '/dashboard/appointments', icon: CalendarIcon },
    { name: 'History', path: '/dashboard/history', icon: FileClock },
    { name: 'Patients', path: '/dashboard/patients', icon: Users },
    { name: 'Staff Management', path: '/dashboard/staff', icon: Settings, adminOnly: true },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings, adminOnly: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-brand-bg">
      {/* Editorial Sidebar */}
      <aside className="w-72 border-r border-brand-border flex flex-col p-10 hidden lg:flex">
        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted mb-8 font-bold">Menu</p>
          <nav className="space-y-6">
            {sidebarLinks.map((link) => {
              if (link.adminOnly && currentUser.role !== 'admin') return null;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-4 text-xs font-bold uppercase tracking-widest transition-all ${
                    isActive(link.path) 
                      ? 'text-brand-primary border-l-4 border-brand-primary pl-4 -ml-4' 
                      : 'text-brand-muted hover:text-brand-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto pt-10 border-t border-brand-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-brand-primary flex items-center justify-center text-white text-xs font-bold">
              {currentUser.displayName[0]}
            </div>
            <div>
              <p className="text-xs font-bold">{currentUser.displayName}</p>
              <p className="text-[10px] text-brand-muted capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto bg-brand-bg-soft">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/appointments" element={<DashboardAppointments userRole={currentUser.role} />} />
          <Route path="/history" element={<DashboardHistory />} />
          <Route path="/patients" element={<DashboardPatients />} />
          <Route path="/staff" element={<DashboardStaff />} />
          <Route path="/settings" element={<DashboardSettings />} />
        </Routes>
      </main>
    </div>
  );
}

function DashboardStaff() {
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const data = await listStaff();
        setStaff(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <div className="p-10 lg:p-16 space-y-12">
      <header className="flex justify-between items-end">
        <div>
           <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Operations</h2>
           <h3 className="text-5xl font-serif italic text-brand-primary">Clinical Staff</h3>
        </div>
        <button className="bg-brand-primary text-white text-[10px] px-8 py-3 uppercase tracking-widest font-bold shadow-xl">
           Add Delegate
        </button>
      </header>

      <div className="bg-white border border-brand-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-teal-900/5">
           <div className="flex items-center space-x-2 text-brand-primary">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Credential Verification: Active</p>
           </div>
        </div>
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-brand-bg text-[10px] uppercase tracking-[0.2em] text-brand-muted font-bold border-b border-brand-border">
              <th className="px-8 py-5">Practitioner</th>
              <th className="px-8 py-5">Designation</th>
              <th className="px-8 py-5">Standing</th>
              <th className="px-8 py-5 text-right">Administrative</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {loading ? (
               <tr><td colSpan={4} className="px-8 py-20 text-center text-brand-muted italic font-serif">Querying registry...</td></tr>
            ) : staff.length === 0 ? (
               <tr><td colSpan={4} className="px-8 py-20 text-center text-brand-muted italic font-serif">No credentials found.</td></tr>
            ) : staff.map(s => (
              <tr key={s.id} className="hover:bg-brand-bg-soft transition group">
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                     <div className="w-10 h-10 bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-bold text-xs">
                        {s.displayName[0]}
                     </div>
                     <div>
                        <p className="font-bold text-brand-primary">{s.displayName}</p>
                        <p className="text-[10px] text-brand-muted font-bold tracking-widest uppercase">{s.email}</p>
                     </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`inline-block px-3 py-1 border text-[9px] font-bold uppercase tracking-widest ${
                    s.role === 'admin' ? 'bg-brand-primary text-white border-brand-primary' : 'bg-brand-bg-soft text-brand-muted border-slate-200'
                  }`}>
                    {s.role}
                  </span>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">Verified</span>
                   </div>
                </td>
                <td className="px-8 py-6 text-right">
                   <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted hover:text-brand-primary transition">Manage Permissions</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const data = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 18 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 22 },
    { name: 'Fri', count: 30 },
    { name: 'Sat', count: 10 },
  ];

  return (
    <div className="p-10 lg:p-16 flex flex-col min-h-full">
      <header className="mb-12">
        <h1 className="font-serif text-6xl italic text-brand-primary mb-2">Clinical Pulse.</h1>
        <p className="text-brand-muted text-[10px] uppercase tracking-[0.3em] font-bold border-l border-brand-primary pl-4">Network status: Active — Operational Overview</p>
      </header>

      {/* Editorial Metrics Grid */}
      <div className="grid grid-cols-12 gap-10 mb-16">
        <div className="col-span-12 lg:col-span-8">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
             {[
               { label: 'Surgical Throughput', value: '24', trend: '+12% Over Median', color: 'border-brand-primary' },
               { label: 'Aesthetic Registry', value: '18', trend: 'Goal: 20 Cases', color: 'border-slate-200' },
               { label: 'Clinical Retention', value: '98%', trend: 'Verified Rating', color: 'border-slate-200' },
             ].map((stat, i) => (
                <div key={i} className={`bg-white p-10 border ${stat.color} shadow-sm group hover:bg-brand-bg-soft transition duration-500`}>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-brand-muted mb-4 font-bold">{stat.label}</p>
                  <p className="text-5xl font-serif italic text-brand-primary">{stat.value}</p>
                  <div className="flex items-center mt-6 text-[9px] font-bold uppercase tracking-widest text-cyan-600">
                     <Activity className="h-3 w-3 mr-2 text-brand-primary/40" />
                     {stat.trend}
                  </div>
                </div>
             ))}
           </div>

           <div className="mt-10 bg-white border border-brand-border p-8 h-[350px]">
              <h3 className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-primary mb-10">Traffic Flow — 7D</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '0', border: '1px solid #E5E1DA', boxShadow: 'none', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#134e4a" strokeWidth={2} fill="#134e4a" fillOpacity={0.05} />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-brand-primary text-white p-10 flex flex-col justify-between">
           <div>
              <p className="text-[10px] uppercase tracking-[0.4em] opacity-50 mb-4 font-bold">Clinic Liquidity</p>
              <p className="text-5xl font-serif italic">$14,280.00</p>
              <p className="text-[10px] opacity-40 mt-2 uppercase tracking-widest">USD — Net Revenue (W12)</p>
           </div>
           
           <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 border-b border-white/10 pb-4 mb-4">Department Density</p>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                 <span className="text-[10px] uppercase tracking-widest opacity-60">Surgical Arts</span>
                 <span className="font-serif italic text-lg">62%</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-2">
                 <span className="text-[10px] uppercase tracking-widest opacity-60">Aesthetic Architecture</span>
                 <span className="font-serif italic text-lg">24%</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function DashboardAppointments({ userRole }: { userRole: UserProfile['role'] }) {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [selected, setSelected] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDurationMins, setEditDurationMins] = useState(60);
  const [savingSlot, setSavingSlot] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingAppointment, setCreatingAppointment] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    treatmentType: 'Consultation',
    date: '',
    time: '',
    notes: '',
    durationMins: 15,
  });
  const [hospitalHours, setHospitalHours] = useState({ openTime: '08:00', closeTime: '18:00', ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm Change',
    loading: false,
  });
  const confirmActionRef = useRef<null | (() => Promise<void>)>(null);
  const cancelActionRef = useRef<null | (() => void)>(null);
  const calendarRefs = useRef<Array<{ getApi: () => { gotoDate: (date: Date) => void } } | null>>([]);
  const syncingCalendarsRef = useRef(false);
  const toMins = (value: string) => {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };
  const formatTimeWithSeconds = (mins: number) => {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0');
    const mm = String(mins % 60).padStart(2, '0');
    return `${hh}:${mm}:00`;
  };
  const openRanges = useMemo(() => (
    [...hospitalHours.ranges].sort((a, b) => toMins(a.start) - toMins(b.start))
  ), [hospitalHours.ranges]);
  const canAddAppointment = userRole === 'admin' || userRole === 'staff';
  const normalizedCreatePhone = useMemo(() => createForm.phone.replace(/\s|-/g, ''), [createForm.phone]);
  const isCreatePhoneValid = useMemo(() => /^(?:\+?\d{10,15})$/.test(normalizedCreatePhone), [normalizedCreatePhone]);
  const isCreateEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email.trim()), [createForm.email]);
  const resetCreateForm = () => {
    setCreateForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      treatmentType: 'Consultation',
      date: '',
      time: '',
      notes: '',
      durationMins: 15,
    });
  };

  const fifteenMinuteSlots = useMemo(() => {
    const slots: string[] = [];
    openRanges.forEach((range) => {
      for (let mins = toMins(range.start); mins < toMins(range.end); mins += 15) {
        const hh = String(Math.floor(mins / 60)).padStart(2, '0');
        const mm = String(mins % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    });
    return slots;
  }, [openRanges]);
  const syncCalendarDate = (sourceIndex: number, date: Date) => {
    if (syncingCalendarsRef.current) return;
    syncingCalendarsRef.current = true;
    calendarRefs.current.forEach((calendar, index) => {
      if (index !== sourceIndex) calendar?.getApi().gotoDate(date);
    });
    window.setTimeout(() => {
      syncingCalendarsRef.current = false;
    }, 0);
  };
  const openRescheduleConfirm = (
    title: string,
    message: string,
    onConfirm: () => Promise<void>,
    onCancel?: () => void
  ) => {
    confirmActionRef.current = onConfirm;
    cancelActionRef.current = onCancel || null;
    setConfirmState({
      open: true,
      title,
      message,
      confirmLabel: 'Confirm Change',
      loading: false,
    });
  };
  const openCreateAppointmentModal = (date = '', time = '') => {
    setActionError('');
    const nextTime = fifteenMinuteSlots.includes(time) ? time : (fifteenMinuteSlots[0] || '');
    setCreateForm((prev) => ({
      ...prev,
      date: date || prev.date,
      time: nextTime || prev.time,
    }));
    setShowCreateModal(true);
  };
  const closeRescheduleConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, loading: false }));
    confirmActionRef.current = null;
    cancelActionRef.current = null;
  };
  const handleCancelReschedule = () => {
    cancelActionRef.current?.();
    closeRescheduleConfirm();
  };
  const handleConfirmReschedule = async () => {
    if (!confirmActionRef.current) {
      closeRescheduleConfirm();
      return;
    }
    setConfirmState((prev) => ({ ...prev, loading: true }));
    try {
      await confirmActionRef.current();
      closeRescheduleConfirm();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Reschedule failed.');
      setConfirmState((prev) => ({ ...prev, loading: false }));
    }
  };
  const confirmCalendarMove = (
    event: {
      id: string;
      startStr: string;
      start: Date | null;
      extendedProps: Partial<AppointmentRecord>;
    },
    revert: () => void
  ) => {
    const date = event.startStr.slice(0, 10);
    const hours = String(event.start?.getHours() || 9).padStart(2, '0');
    const minutes = String(event.start?.getMinutes() || 0).padStart(2, '0');
    const nextTime = `${hours}:${minutes}`;
    const durationMins = event.extendedProps.durationMins || 60;
    openRescheduleConfirm(
      'Confirm Appointment Change',
      `Move this appointment to ${date} at ${nextTime} for ${durationMins} minutes?`,
      async () => {
        setActionError('');
        await updateAppointmentSlot(event.id, {
          date,
          time: nextTime,
          status: event.extendedProps.status || 'pending',
          durationMins,
        });
        await fetchAppointments();
      },
      revert
    );
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await listAppointments();
      setAppointments(data);
      if (selected) {
        const selectedItem = data.find((item) => item.id === selected.id) || null;
        setSelected(selectedItem);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    const loadHospitalHours = async () => {
      try {
        const hours = await getHospitalHours();
        setHospitalHours(hours);
      } catch {
        setHospitalHours({ openTime: '08:00', closeTime: '18:00', ranges: [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '18:00' }] });
      }
    };
    loadHospitalHours();
  }, []);

  useEffect(() => {
    if (selected) {
      setEditDate(selected.date);
      setEditTime(selected.time);
      setEditDurationMins(selected.durationMins || 60);
    }
  }, [selected]);

  const visibleAppointments = appointments.filter((apt) => {
    const statusOk = statusFilter === 'all' ? true : apt.status === statusFilter;
    const keyword = `${apt.firstName} ${apt.lastName} ${apt.treatmentType}`.toLowerCase();
    const searchOk = keyword.includes(search.toLowerCase());
    return statusOk && searchOk;
  });

  useEffect(() => {
    if (!selected) return;
    const isStillVisible = visibleAppointments.some((apt) => apt.id === selected.id);
    if (!isStillVisible) setSelected(null);
  }, [visibleAppointments, selected]);

  const calendarEvents = visibleAppointments.map(apt => {
    const start = `${apt.date}T${apt.time || '09:00'}:00`;
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + (apt.durationMins || 60) * 60 * 1000);
    const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
    const statusStyles = {
      pending: { backgroundColor: '#fef3c7', textColor: '#92400e', borderColor: '#f59e0b' },
      confirmed: { backgroundColor: '#d1fae5', textColor: '#065f46', borderColor: '#10b981' },
      completed: { backgroundColor: '#e2e8f0', textColor: '#475569', borderColor: '#94a3b8' },
      cancelled: { backgroundColor: '#fee2e2', textColor: '#991b1b', borderColor: '#f87171' },
    } as const;
    const style = statusStyles[apt.status];

    return {
      id: apt.id,
      title: `${apt.firstName} ${apt.lastName} — ${apt.treatmentType}`,
      start: start,
      end,
      extendedProps: { ...apt },
      backgroundColor: style.backgroundColor,
      textColor: style.textColor,
      borderColor: style.borderColor,
      classNames: [apt.status === 'completed' ? 'calendar-event-completed' : ''],
    };
  });

  const occupiedSlotHighlights = visibleAppointments
    .filter((item) => item.status !== 'cancelled')
    .map((item) => {
      const start = new Date(`${item.date}T${item.time}:00`);
      const end = new Date(start.getTime() + (item.durationMins || 60) * 60 * 1000);
      const formatLocal = (value: Date) => {
        const yyyy = value.getFullYear();
        const mm = String(value.getMonth() + 1).padStart(2, '0');
        const dd = String(value.getDate()).padStart(2, '0');
        const hh = String(value.getHours()).padStart(2, '0');
        const min = String(value.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}T${hh}:${min}:00`;
      };
      return {
        start: formatLocal(start),
        end: formatLocal(end),
        display: 'background' as const,
        backgroundColor: item.status === 'confirmed' ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.13)',
      };
    });

  return (
    <div className="p-10 lg:p-16 space-y-12 h-full flex flex-col">
      <header className="flex flex-wrap gap-6 justify-between items-end">
        <div>
           <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Scheduling</h2>
           <h3 className="text-5xl font-serif italic text-brand-primary">Clinical Calendar</h3>
        </div>
        <div className="flex items-center space-x-4">
           <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient or treatment"
              className="px-4 py-3 border border-brand-border text-xs min-w-[220px]"
           />
           <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="px-4 py-3 border border-brand-border text-xs"
           >
              <option value="all">All status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
           </select>
          <button
            onClick={fetchAppointments}
            className="bg-brand-primary text-white text-[10px] px-8 py-3 uppercase tracking-widest font-bold shadow-xl shadow-teal-900/20"
          >
              Refresh
           </button>
           {canAddAppointment ? (
             <button
              onClick={() => openCreateAppointmentModal()}
              className="bg-slate-900 text-white text-[10px] px-8 py-3 uppercase tracking-widest font-bold shadow-xl"
            >
              Add Appointment
             </button>
           ) : null}
        </div>
      </header>
      {actionError && <p className="text-xs text-red-600 font-semibold">{actionError}</p>}
      <div className="grid xl:grid-cols-[1fr_320px] gap-4 flex-1">
        <div className="bg-white border border-brand-border p-8 shadow-sm appointment-calendar">
          <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-widest font-bold">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700">Pending</span>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">Confirmed</span>
            <span className="px-3 py-1 rounded-full bg-slate-200 text-brand-muted">Completed</span>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700">Cancelled</span>
          </div>
          <div className="space-y-3">
            {openRanges.map((range, index) => (
              <div key={`${range.start}-${range.end}`} className="calendar-open-range">
                <div className="flex items-center gap-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">
                  <span className="h-px flex-1 bg-brand-border" />
                  <span>{range.start} - {range.end}</span>
                  <span className="h-px flex-1 bg-brand-border" />
                </div>
                <FullCalendar
                  ref={(calendar) => {
                    calendarRefs.current[index] = calendar;
                  }}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={index === 0 ? {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  } : false}
                  datesSet={(arg) => syncCalendarDate(index, arg.start)}
                  events={[...occupiedSlotHighlights, ...calendarEvents]}
                  height="auto"
                  expandRows={false}
                  slotMinTime={formatTimeWithSeconds(toMins(range.start))}
                  slotMaxTime={formatTimeWithSeconds(toMins(range.end))}
                  slotDuration="00:15:00"
                  snapDuration="00:15:00"
                  businessHours={[{
                    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
                    startTime: `${range.start}:00`,
                    endTime: `${range.end}:00`,
                  }]}
                  allDaySlot={false}
                  nowIndicator={true}
                  editable={true}
                  droppable={true}
                  eventDurationEditable={false}
                  eventMinHeight={8}
                  eventShortHeight={18}
                  slotEventOverlap={false}
                  eventClick={(info) => {
                    const appointment = info.event.extendedProps as AppointmentRecord;
                    setSelected((current) => (current?.id === appointment.id ? null : appointment));
                  }}
                  dateClick={(info) => {
                    if (!canAddAppointment) return;
                    const clickedDate = `${info.date.getFullYear()}-${String(info.date.getMonth() + 1).padStart(2, '0')}-${String(info.date.getDate()).padStart(2, '0')}`;
                    const clickedTime = `${String(info.date.getHours()).padStart(2, '0')}:${String(info.date.getMinutes()).padStart(2, '0')}`;
                    openCreateAppointmentModal(clickedDate, clickedTime);
                  }}
                  eventDrop={(info) => confirmCalendarMove(info.event, () => info.revert())}
                  eventReceive={(info) => confirmCalendarMove(info.event, () => info.revert())}
                />
              </div>
            ))}
          </div>
          <style>{`
            .appointment-calendar .fc {
              font-family: "Outfit", sans-serif;
              --fc-border-color: #f1f5f9;
              --fc-button-bg-color: #0f172a;
              --fc-button-border-color: #0f172a;
              --fc-button-hover-bg-color: #1e293b;
              --fc-today-bg-color: #f8fafc;
              --fc-event-border-color: transparent;
            }
            .appointment-calendar .fc-toolbar-title {
              font-family: inherit;
              font-size: 1.25rem !important;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #0f172a;
            }
            .appointment-calendar .fc-button {
              border-radius: 0;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.1em;
              padding: 8px 16px;
            }
            .appointment-calendar .fc-col-header-cell {
              padding: 12px 0;
              background: #f9f7f4;
            }
            .appointment-calendar .fc-col-header-cell-cushion {
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 700;
              letter-spacing: 0.1em;
              color: #94a3b8;
            }
            .appointment-calendar .fc-timegrid-slot-label-cushion {
              font-size: 10px;
              font-weight: 600;
              color: #94a3b8;
            }
            .appointment-calendar .fc-event {
              cursor: pointer;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              transition: transform 0.2s;
              padding: 4px;
              border-left-width: 4px;
              border-radius: 8px;
            }
            .appointment-calendar .fc-event:hover {
              transform: scale(1.02);
            }
            .appointment-calendar .calendar-event-completed {
              opacity: 0.5;
            }
            .appointment-calendar .fc-timegrid-slot {
              height: 1.75rem;
            }
            .appointment-calendar .fc-non-business {
              background: transparent !important;
            }
            .appointment-calendar .fc-event-title {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
          `}</style>
        </div>
        <div className="bg-white border border-brand-border p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted mb-4">Appointment Details</p>
          {!selected ? (
            <p className="text-sm text-brand-muted">Select an event from the calendar to review and update.</p>
          ) : (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-brand-primary">{selected.firstName} {selected.lastName}</h4>
              <p className="text-xs text-brand-muted">{selected.treatmentType}</p>
              <p className="text-xs">{selected.date} at {selected.time}</p>
              <p className="text-xs">Duration: {selected.durationMins || 60} minutes</p>
              <p className="text-xs">{selected.email}</p>
              <p className="text-xs">{selected.phone}</p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                  className="border border-brand-border px-2 py-2 text-xs"
                />
                <select
                  value={editTime}
                  onChange={(event) => setEditTime(event.target.value)}
                  className="border border-brand-border px-2 py-2 text-xs"
                  >
                  {fifteenMinuteSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
                <select
                  value={String(editDurationMins)}
                  onChange={(event) => setEditDurationMins(Number(event.target.value))}
                  className="border border-brand-border px-2 py-2 text-xs"
                >
                  {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240].map((mins) => (
                    <option key={mins} value={String(mins)}>{mins}m</option>
                  ))}
                </select>
              </div>
              <button
                onClick={async () => {
                  if (!selected || !editDate || !editTime) return;
                  openRescheduleConfirm(
                    'Confirm Appointment Change',
                    `Move this appointment to ${editDate} at ${editTime} for ${editDurationMins} minutes?`,
                    async () => {
                      setSavingSlot(true);
                      setActionError('');
                      try {
                        await updateAppointmentSlot(selected.id, {
                          date: editDate,
                          time: editTime,
                          status: selected.status,
                          durationMins: editDurationMins,
                        });
                        await fetchAppointments();
                      } finally {
                        setSavingSlot(false);
                      }
                    }
                  );
                }}
                disabled={savingSlot}
                className="w-full px-3 py-2 text-[10px] font-bold uppercase bg-slate-900 text-white disabled:opacity-50"
              >
                {savingSlot ? 'Saving Slot...' : 'Save Date & Time'}
              </button>
              <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-full ${
                selected.status === 'confirmed'
                  ? 'bg-emerald-100 text-emerald-700'
                  : selected.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : selected.status === 'completed'
                      ? 'bg-slate-200 text-brand-muted'
                      : 'bg-rose-100 text-rose-700'
              }`}>
                {selected.status}
              </span>
              <div className="flex gap-2">
                <button onClick={async () => { await updateAppointmentStatus(selected.id, 'confirmed'); fetchAppointments(); }} className="px-3 py-2 text-[10px] font-bold uppercase bg-brand-primary text-white">Confirm</button>
                <button onClick={async () => { await updateAppointmentStatus(selected.id, 'completed'); fetchAppointments(); }} className="px-3 py-2 text-[10px] font-bold uppercase border border-brand-border">Complete</button>
                <button onClick={async () => { await updateAppointmentStatus(selected.id, 'cancelled'); fetchAppointments(); }} className="px-3 py-2 text-[10px] font-bold uppercase border border-red-200 text-red-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
      {confirmState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={handleCancelReschedule} />
          <div className="relative w-full max-w-md border border-brand-border bg-white p-6 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-primary mb-3">Reschedule Check</p>
            <h4 className="text-2xl font-serif italic text-slate-900">{confirmState.title}</h4>
            <p className="mt-3 text-sm text-brand-muted">{confirmState.message}</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelReschedule}
                disabled={confirmState.loading}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-brand-border text-brand-muted disabled:opacity-50"
              >
                Keep Original
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={confirmState.loading}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest bg-brand-primary text-white disabled:opacity-50"
              >
                {confirmState.loading ? 'Saving...' : confirmState.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && canAddAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={() => {
            setShowCreateModal(false);
            resetCreateForm();
          }} />
          <div className="relative w-full max-w-2xl border border-brand-border bg-white p-6 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-primary mb-3">New Appointment</p>
            <h4 className="text-2xl font-serif italic text-slate-900">Create Clinical Booking</h4>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="First name"
                value={createForm.firstName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Last name"
                value={createForm.lastName}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              />
              <input
                type="email"
                placeholder="Email"
                value={createForm.email}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={createForm.phone}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Treatment"
                value={createForm.treatmentType}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, treatmentType: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              />
              <select
                value={String(createForm.durationMins)}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, durationMins: Number(event.target.value) }))}
                className="border border-brand-border px-3 py-2 text-xs"
              >
                {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240].map((mins) => (
                  <option key={mins} value={String(mins)}>{mins}m</option>
                ))}
              </select>
              <input
                type="date"
                value={createForm.date}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, date: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              />
              <select
                value={createForm.time}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, time: event.target.value }))}
                className="border border-brand-border px-3 py-2 text-xs"
              >
                <option value="" disabled>Select time</option>
                {fifteenMinuteSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={createForm.notes}
                onChange={(event) => setCreateForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="sm:col-span-2 border border-brand-border px-3 py-2 text-xs min-h-[90px]"
              />
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                disabled={creatingAppointment}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest border border-brand-border text-brand-muted disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                disabled={creatingAppointment}
                onClick={async () => {
                  if (!createForm.firstName || !createForm.lastName || !createForm.email || !createForm.phone || !createForm.treatmentType || !createForm.date || !createForm.time) {
                    setActionError('Please complete all required fields before creating an appointment.');
                    return;
                  }
                  if (!isCreatePhoneValid) {
                    setActionError('Use a valid phone number like 0757545358 or +94757545358.');
                    return;
                  }
                  if (!isCreateEmailValid) {
                    setActionError('Use a valid email address.');
                    return;
                  }
                  setCreatingAppointment(true);
                  setActionError('');
                  try {
                    const created = await createAppointment({
                      firstName: createForm.firstName.trim(),
                      lastName: createForm.lastName.trim(),
                      email: createForm.email.trim(),
                      phone: normalizedCreatePhone,
                      treatmentType: createForm.treatmentType.trim(),
                      date: createForm.date,
                      time: createForm.time,
                      notes: createForm.notes.trim(),
                      status: 'pending',
                      durationMins: createForm.durationMins,
                    });
                    await fetchAppointments();
                    setSelected(created);
                    setShowCreateModal(false);
                    resetCreateForm();
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : 'Failed to create appointment.');
                  } finally {
                    setCreatingAppointment(false);
                  }
                }}
                className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest bg-brand-primary text-white disabled:opacity-50"
              >
                {creatingAppointment ? 'Creating...' : 'Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSettings() {
  const [ranges, setRanges] = useState<Array<{ start: string; end: string }>>([
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notificationDraft, setNotificationDraft] = useState<NotificationSettings>({
    recipients: [],
    sendToPatientOnBooking: true,
    sendToPatientOnConfirmed: true,
    sendToPatientOnReschedule: true,
    sendToTeamOnBooking: true,
    sendToTeamOnConfirmed: true,
    sendToTeamOnReschedule: true,
  });
  const [recipientsInput, setRecipientsInput] = useState('');

  const slotOptions = useMemo(() => {
    const values: string[] = [];
    for (let hour = 0; hour < 24; hour += 1) {
      for (let min = 0; min < 60; min += 15) {
        values.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
      }
    }
    return values;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [data, notificationSettings] = await Promise.all([
          getHospitalHours(),
          getNotificationSettings(),
        ]);
        setRanges(data.ranges?.length ? data.ranges : [{ start: data.openTime, end: data.closeTime }]);
        setNotificationDraft(notificationSettings);
        setRecipientsInput(notificationSettings.recipients.join(', '));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-10 lg:p-16 space-y-10">
      <header>
        <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Configuration</h2>
        <h3 className="text-5xl font-serif italic text-brand-primary">Hospital & Mail Settings</h3>
        <p className="text-brand-muted mt-4 max-w-xl">Only slots inside these hours can be assigned. Closed times are shaded in calendar.</p>
      </header>

      <div className="bg-white border border-brand-border p-8 max-w-4xl space-y-10">
        {loading ? <p className="text-sm text-brand-muted">Loading settings...</p> : null}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-muted mb-4">Hospital Hours</p>
          <div className="space-y-3">
          {ranges.map((range, index) => (
            <div key={index} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Open Time</label>
                <select value={range.start} onChange={(e) => {
                  const copy = [...ranges];
                  copy[index] = { ...copy[index], start: e.target.value };
                  setRanges(copy);
                }} className="w-full border border-brand-border px-4 py-3 text-sm">
                  {slotOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">Close Time</label>
                <select value={range.end} onChange={(e) => {
                  const copy = [...ranges];
                  copy[index] = { ...copy[index], end: e.target.value };
                  setRanges(copy);
                }} className="w-full border border-brand-border px-4 py-3 text-sm">
                  {slotOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
              <button
                disabled={ranges.length <= 1}
                onClick={() => setRanges(ranges.filter((_, i) => i !== index))}
                className="px-4 py-3 border border-red-200 text-red-700 text-xs font-bold uppercase disabled:opacity-40"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => setRanges([...ranges, { start: '19:00', end: '21:00' }])}
            className="px-4 py-2 border border-brand-border text-xs font-bold uppercase"
          >
            Add Time Range
          </button>
          </div>
        </div>

        <div className="border-t border-brand-border pt-8 space-y-5">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-muted">Mail Recipients & Rules</p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-2">
              Team recipients (comma separated emails)
            </label>
            <textarea
              value={recipientsInput}
              onChange={(e) => setRecipientsInput(e.target.value)}
              rows={3}
              placeholder="manager@clinic.com, frontdesk@clinic.com"
              className="w-full border border-brand-border px-4 py-3 text-sm"
            />
            <p className="text-xs text-brand-muted mt-2">These people receive internal booking/confirmation/reschedule alerts.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notificationDraft.sendToPatientOnBooking} onChange={(e) => setNotificationDraft((prev) => ({ ...prev, sendToPatientOnBooking: e.target.checked }))} />
              Send patient email on booking
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notificationDraft.sendToPatientOnConfirmed} onChange={(e) => setNotificationDraft((prev) => ({ ...prev, sendToPatientOnConfirmed: e.target.checked }))} />
              Send patient email on admin confirmation
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notificationDraft.sendToPatientOnReschedule} onChange={(e) => setNotificationDraft((prev) => ({ ...prev, sendToPatientOnReschedule: e.target.checked }))} />
              Send patient email on calendar reassignment
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notificationDraft.sendToTeamOnBooking} onChange={(e) => setNotificationDraft((prev) => ({ ...prev, sendToTeamOnBooking: e.target.checked }))} />
              Send team email on booking
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notificationDraft.sendToTeamOnConfirmed} onChange={(e) => setNotificationDraft((prev) => ({ ...prev, sendToTeamOnConfirmed: e.target.checked }))} />
              Send team email on confirmation
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={notificationDraft.sendToTeamOnReschedule} onChange={(e) => setNotificationDraft((prev) => ({ ...prev, sendToTeamOnReschedule: e.target.checked }))} />
              Send team email on reschedule
            </label>
          </div>
        </div>

        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setError('');
            setMessage('');
            try {
              const [updated, updatedNotifications] = await Promise.all([
                updateHospitalHours({ openTime: '00:00', closeTime: '00:00', ranges }),
                updateNotificationSettings({
                  ...notificationDraft,
                  recipients: recipientsInput
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                }),
              ]);
              setRanges(updated.ranges);
              setNotificationDraft(updatedNotifications);
              setRecipientsInput(updatedNotifications.recipients.join(', '));
              setMessage('Settings updated successfully.');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to save settings.');
            } finally {
              setSaving(false);
            }
          }}
          className="px-6 py-3 bg-brand-primary text-white text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message ? <p className="text-sm text-emerald-700 font-semibold">{message}</p> : null}
        {error ? <p className="text-sm text-red-600 font-semibold">{error}</p> : null}
      </div>
    </div>
  );
}

function DashboardPatients() {
  const [patients, setPatients] = useState<Array<PatientRecord & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const data = await listPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="p-10 lg:p-16 space-y-12">
      <header className="flex justify-between items-end">
        <div>
           <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Registry</h2>
           <h3 className="text-5xl font-serif italic text-brand-primary">Patient Archive</h3>
        </div>
        <button
          onClick={async () => {
            if (!newPatient.firstName || !newPatient.lastName || !newPatient.email || !newPatient.phone) return;
            setCreating(true);
            try {
              await createPatient(newPatient);
              setNewPatient({ firstName: '', lastName: '', email: '', phone: '' });
              await fetchPatients();
            } catch (err) {
              console.error(err);
            } finally {
              setCreating(false);
            }
          }}
          disabled={creating}
          className="bg-brand-primary text-white text-[10px] px-8 py-3 uppercase tracking-widest font-bold shadow-xl disabled:opacity-40"
        >
           {creating ? 'Saving...' : 'Register Patient'}
        </button>
      </header>

      <div className="grid md:grid-cols-4 gap-3">
        <input
          value={newPatient.firstName}
          onChange={(event) => setNewPatient({ ...newPatient, firstName: event.target.value })}
          className="border border-brand-border px-4 py-3 text-xs"
          placeholder="First name"
        />
        <input
          value={newPatient.lastName}
          onChange={(event) => setNewPatient({ ...newPatient, lastName: event.target.value })}
          className="border border-brand-border px-4 py-3 text-xs"
          placeholder="Last name"
        />
        <input
          value={newPatient.email}
          onChange={(event) => setNewPatient({ ...newPatient, email: event.target.value })}
          className="border border-brand-border px-4 py-3 text-xs"
          placeholder="Email"
        />
        <input
          value={newPatient.phone}
          onChange={(event) => setNewPatient({ ...newPatient, phone: event.target.value })}
          className="border border-brand-border px-4 py-3 text-xs"
          placeholder="Phone"
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
        {loading ? (
          <div className="col-span-full py-20 text-center text-brand-muted italic font-serif">Querying medical database...</div>
        ) : patients.length === 0 ? (
          <div className="col-span-full py-20 text-center text-brand-muted italic font-serif">No records found.</div>
        ) : patients.map((p) => (
           <div key={p.id} className="bg-white p-10 border border-brand-border shadow-sm hover:bg-brand-bg-soft transition group">
              <div className="flex items-center space-x-5 mb-8">
                <div className="w-14 h-14 bg-brand-bg border border-brand-border flex items-center justify-center text-brand-primary font-bold text-xl font-serif italic">
                  {p.firstName[0]}{p.lastName[0]}
                </div>
                <div>
                   <h4 className="font-bold text-lg text-brand-primary leading-tight">{p.firstName} {p.lastName}</h4>
                   <p className="text-[10px] text-brand-muted font-bold uppercase tracking-widest mt-1">ID #{(p.id || '').toUpperCase().slice(0, 8)}</p>
                </div>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center justify-between text-[10px] uppercase tracking-widest">
                   <span className="text-brand-muted font-bold">Last Clinical Cycle</span>
                   <span className="text-brand-primary font-bold">{p.lastVisit || 'N/A'}</span>
                 </div>
                 <button className="w-full text-center text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary border border-brand-border py-3 hover:bg-white transition">
                    View Archival History
                 </button>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
}

function DashboardHistory() {
  const [records, setRecords] = useState<PatientHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listPatientHistories();
      setRecords(data);
      if (!selectedId && data.length > 0) {
        setSelectedId(data[0].id);
      } else if (selectedId && !data.some((item) => item.id === selectedId)) {
        setSelectedId(data[0]?.id || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((item) => {
      const fullName = `${item.firstName} ${item.lastName}`.toLowerCase();
      return fullName.includes(q) || item.email.toLowerCase().includes(q) || item.phone.toLowerCase().includes(q);
    });
  }, [records, search]);

  const selected = useMemo(
    () => filtered.find((item) => item.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );
  const eventLabel = (eventType: string) => {
    const map: Record<string, string> = {
      appointment_created: 'Appointment Created',
      appointment_rescheduled: 'Appointment Rescheduled',
      appointment_status_changed: 'Appointment Status Changed',
      appointment_deleted: 'Appointment Deleted',
      patient_registered: 'Patient Registered',
    };
    return map[eventType] || eventType.replace(/_/g, ' ');
  };

  return (
    <div className="p-10 lg:p-16 space-y-8 h-full flex flex-col">
      <header className="flex flex-wrap gap-4 justify-between items-end">
        <div>
          <h2 className="text-sm font-bold text-brand-primary uppercase tracking-[0.3em] mb-4">Records</h2>
          <h3 className="text-5xl font-serif italic text-brand-primary">Patient History</h3>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient, email, phone"
            className="px-4 py-3 border border-brand-border text-xs min-w-[240px]"
          />
          <button
            onClick={fetchHistory}
            className="bg-brand-primary text-white text-[10px] px-8 py-3 uppercase tracking-widest font-bold shadow-xl shadow-teal-900/20"
          >
            Refresh
          </button>
        </div>
      </header>

      {error ? <p className="text-xs text-red-600 font-semibold">{error}</p> : null}

      <div className="grid xl:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
        <div className="bg-white border border-brand-border overflow-y-auto">
          <div className="p-4 border-b border-brand-border">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted">
              Users ({filtered.length})
            </p>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-brand-muted">Loading history...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-sm text-brand-muted">No patient history found.</p>
          ) : (
            <div className="divide-y divide-brand-border">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left p-4 transition ${
                    selected?.id === item.id ? 'bg-brand-bg-soft' : 'bg-white hover:bg-brand-bg'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-brand-primary">{item.firstName} {item.lastName}</p>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold ${
                      item.isRegisteredPatient ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {item.isRegisteredPatient ? 'Registered' : 'Booking Lead'}
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-muted mt-1">{item.appointmentCount} appointments • {item.events.length} events</p>
                  <p className="text-xs text-brand-muted mt-2">Primary: {item.email}</p>
                  {item.emailChangedLikely ? (
                    <p className="text-[10px] mt-1 font-bold text-amber-700 uppercase tracking-wider">Multiple emails detected</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-brand-border p-6 overflow-y-auto">
          {!selected ? (
            <p className="text-sm text-brand-muted">Select a patient to view complete history.</p>
          ) : (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-3">
                <div className="border border-brand-border p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">Patient</p>
                  <p className="text-xl font-bold text-brand-primary mt-2">{selected.firstName} {selected.lastName}</p>
                </div>
                <div className="border border-brand-border p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">Primary Email Identity</p>
                  <p className="text-sm mt-2 font-bold text-brand-primary">{selected.email}</p>
                  <p className="text-sm">{selected.phone}</p>
                  {selected.alternateEmails.length > 0 ? (
                    <p className="text-xs text-amber-700 mt-2">
                      Other emails used: {selected.alternateEmails.join(', ')}
                    </p>
                  ) : null}
                </div>
                <div className="border border-brand-border p-4">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-muted">Summary</p>
                  <p className="text-sm mt-2">Total appointments: <span className="font-bold">{selected.appointmentCount}</span></p>
                  <p className="text-sm">Total events: <span className="font-bold">{selected.events.length}</span></p>
                  <p className="text-sm">Last appointment: <span className="font-bold">{selected.lastAppointmentAt || 'N/A'}</span></p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted mb-4">Action Timeline</p>
                {selected.events.length === 0 ? (
                  <p className="text-sm text-brand-muted mb-6">No action events recorded yet.</p>
                ) : (
                  <div className="space-y-3 mb-6">
                    {selected.events.map((event) => (
                      <div key={event.id} className="border border-brand-border p-4">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                          <p className="text-sm font-bold text-brand-primary">{eventLabel(event.eventType)}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-muted">{new Date(event.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-brand-muted mt-2">
                          Source: {event.source || 'system'} • Actor: {event.actorRole || 'unknown'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted mb-4">Appointment Timeline</p>
                {selected.appointments.length === 0 ? (
                  <p className="text-sm text-brand-muted">No appointment records linked for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {selected.appointments.map((apt) => (
                      <div key={apt.id} className="border border-brand-border p-4">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                          <p className="text-sm font-bold text-brand-primary">{apt.treatmentType}</p>
                          <StatusBadge status={apt.status} />
                        </div>
                        <div className="mt-2 grid md:grid-cols-4 gap-2 text-xs text-brand-muted">
                          <p>Date: {apt.date}</p>
                          <p>Time: {apt.time}</p>
                          <p>Duration: {apt.durationMins} mins</p>
                          <p>Created: {new Date(apt.createdAt).toLocaleDateString()}</p>
                        </div>
                        {apt.notes ? <p className="mt-2 text-xs text-brand-muted">Notes: {apt.notes}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-muted mb-2">Medical Profile</p>
                <p className="text-sm text-brand-muted">
                  DOB: {selected.dateOfBirth || 'N/A'} | Last Visit: {selected.lastVisit || 'N/A'}
                </p>
                <p className="text-sm text-brand-muted mt-1">
                  Medical History: {selected.medicalHistory || 'No medical history notes available.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    confirmed: 'bg-green-50 text-green-600 border-green-100',
    cancelled: 'bg-red-50 text-red-600 border-red-100',
    completed: 'bg-blue-50 text-blue-600 border-blue-100'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}
