import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, CheckCircle2, Clock3 } from 'lucide-react';
import { createAppointment, listAppointmentAvailability, type AppointmentAvailability } from '../lib/appointments-api';
import { getHospitalHours } from '../lib/management-api';

export default function Booking() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    treatmentType: 'Crown & Bridge Consultation',
    date: '',
    time: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    nic: '',
    age: '',
    gender: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState<AppointmentAvailability[]>([]);
  const [hospitalHours, setHospitalHours] = useState({
    openTime: '08:00',
    closeTime: '18:00',
    ranges: [
      { start: '08:00', end: '12:00' },
      { start: '14:00', end: '18:00' }
    ]
  });

  const userTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local Time', []);

  const timeSlots = useMemo(() => {
    const toMins = (value: string) => {
      const [h, m] = value.split(':').map(Number);
      return h * 60 + m;
    };
    const slots: string[] = [];
    hospitalHours.ranges.forEach((range) => {
      for (let mins = toMins(range.start); mins < toMins(range.end); mins += 15) {
        const hh = String(Math.floor(mins / 60)).padStart(2, '0');
        const mm = String(mins % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
    });
    return slots;
  }, [hospitalHours]);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const data = await listAppointmentAvailability();
        setAppointments(data);
      } catch {
        setAppointments([]);
      }
    };
    loadAppointments();
  }, []);

  useEffect(() => {
    const loadHours = async () => {
      try {
        const hours = await getHospitalHours();
        setHospitalHours(hours);
      } catch {
        setHospitalHours({
          openTime: '08:00',
          closeTime: '18:00',
          ranges: [
            { start: '08:00', end: '12:00' },
            { start: '14:00', end: '18:00' }
          ]
        });
      }
    };
    loadHours();
  }, []);

  const bookedSlots = useMemo(() => {
    if (!formData.date) return new Set<string>();

    const occupied = new Set<string>();
    const toMins = (value: string) => {
      const [h, m] = value.split(':').map(Number);
      return h * 60 + m;
    };

    appointments
      .filter((item) => item.date === formData.date && item.status !== 'cancelled')
      .forEach((item) => {
        const start = toMins(item.time);
        const duration = item.durationMins || 60;
        for (let mins = start; mins < start + duration; mins += 15) {
          const hh = String(Math.floor(mins / 60)).padStart(2, '0');
          const mm = String(mins % 60).padStart(2, '0');
          occupied.add(`${hh}:${mm}`);
        }
      });

    return occupied;
  }, [appointments, formData.date]);

  const normalizedPhone = useMemo(() => formData.phone.replace(/\s|-/g, ''), [formData.phone]);
  const isPhoneValid = useMemo(() => /^(?:\+?\d{10,15})$/.test(normalizedPhone), [normalizedPhone]);
  const isEmailValid = useMemo(() => {
    if (!formData.email.trim()) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  }, [formData.email]);

  const isStepOneValid = Boolean(formData.date && formData.time);
  const isStepTwoValid = Boolean(formData.firstName.trim() && formData.lastName.trim() && isPhoneValid && isEmailValid && formData.age && formData.gender);

  const nextStep = () => {
    setError('');

    if (step === 1 && !isStepOneValid) {
      setError('Please select date and time before continuing.');
      return;
    }

    if (step === 2) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Please enter first and last name.');
        return;
      }
      if (!isPhoneValid) {
        setError('Phone number is required. Use digits like 0757545358 or +94757545358.');
        return;
      }
      if (!isEmailValid) {
        setError('Please enter a valid email address or leave it blank.');
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');

    try {
      await createAppointment({
        ...formData,
        email: formData.email.trim(),
        phone: normalizedPhone,
        status: 'pending',
        durationMins: 15,
        age: formData.age !== '' ? Number(formData.age) : undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen py-16 sm:py-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center px-6"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-bg-soft border border-brand-border rounded-2xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-10 w-10 text-brand-accent" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-serif italic text-brand-primary mb-4">Booking Confirmed</h2>
          <p className="text-brand-muted mb-10 leading-relaxed text-base sm:text-lg">
            Your appointment for <span className="text-brand-primary font-semibold">{formData.date}</span> at{' '}
            <span className="text-brand-primary font-semibold">{formData.time}</span> ({userTimeZone}) is registered.
            Our care desk will contact you shortly.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-8 sm:px-12 py-4 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-xs uppercase tracking-[0.2em] hover:brightness-105 transition shadow-xl shadow-brand-border"
          >
            Return to Homepage
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 sm:py-14 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-10 sm:mb-14 text-center">
          <h2 className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.35em] mb-4">J rish Dental Surgery</h2>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif italic text-brand-primary mb-4 tracking-tight">Crown & Bridge Booking</h1>
          <p className="text-brand-muted max-w-xl mx-auto text-base sm:text-lg">
            Book a focused visit for crown, bridge, broken tooth, missing tooth, or bite comfort concerns.
          </p>
        </div>

        <div className="mb-8 sm:mb-10 grid grid-cols-3 max-w-2xl mx-auto gap-3 sm:gap-4">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex flex-col gap-2.5 sm:gap-3">
              <div className={`h-1 rounded-full transition-all duration-700 ${step >= num ? 'bg-brand-primary' : 'bg-brand-border'}`} />
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${step >= num ? 'text-brand-primary' : 'text-brand-muted/60'}`}>
                  Phase 0{num}
                </span>
                {step > num && <CheckCircle2 className="h-3.5 w-3.5 text-brand-accent" />}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/95 rounded-[1.6rem] sm:rounded-[2rem] border border-brand-border shadow-xl shadow-brand-border/30 overflow-hidden min-h-[620px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 sm:p-8 lg:p-12 flex-1"
              >
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
                  <div className="lg:col-span-4">
                    <h3 className="text-2xl font-serif italic text-brand-primary mb-3">Visit Time</h3>
                    <p className="text-brand-muted text-sm leading-relaxed mb-5">
                      Select your preferred consultation date and available time slot for Dr. Jiyath Hassan's team.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-bg-soft border border-brand-border px-4 py-2 text-xs font-semibold text-brand-muted">
                      <Clock3 className="h-4 w-4 text-brand-accent" />
                      Timezone: {userTimeZone}
                    </div>
                  </div>

                  <div className="lg:col-span-8 space-y-7">
                    <div>
                      <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Appointment Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full h-12 bg-brand-bg-soft rounded-xl border border-brand-border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Available Time Slots</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {timeSlots.map((time) => {
                          const isBooked = bookedSlots.has(time);
                          return (
                            <button
                              key={time}
                              disabled={isBooked}
                              onClick={() => setFormData({ ...formData, time })}
                              className={`h-12 rounded-xl border text-xs font-bold uppercase tracking-[0.12em] transition-all duration-200 ${
                                formData.time === time
                                  ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-brand-primary shadow-md shadow-brand-border/60'
                                  : isBooked
                                    ? 'bg-rose-50 border-rose-200 text-rose-400 cursor-not-allowed opacity-70'
                                    : 'bg-white border-brand-border text-brand-ink hover:border-brand-primary hover:text-brand-primary'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 sm:p-8 lg:p-12 flex-1"
              >
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
                  <div className="lg:col-span-4">
                    <h3 className="text-2xl font-serif italic text-brand-primary mb-3">Patient Information</h3>
                    <p className="text-brand-muted text-sm leading-relaxed">
                      Email is optional. Phone number is required for confirmation calls.
                    </p>
                  </div>

                  <div className="lg:col-span-8 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">First Name</label>
                        <input
                          type="text"
                          className="w-full h-12 bg-brand-bg-soft rounded-xl border border-brand-border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                          placeholder="Jane"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Last Name</label>
                        <input
                          type="text"
                          className="w-full h-12 bg-brand-bg-soft rounded-xl border border-brand-border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Email (Optional)</label>
                        <input
                          type="email"
                          className={`w-full h-12 bg-brand-bg-soft rounded-xl border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 ${!isEmailValid ? 'border-red-300 focus:ring-red-200' : 'border-brand-border focus:ring-brand-primary/25'}`}
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {!isEmailValid && <p className="mt-2 text-xs text-red-600">Invalid email format.</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Phone Number (Required)</label>
                        <input
                          type="tel"
                          className={`w-full h-12 bg-brand-bg-soft rounded-xl border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 ${formData.phone && !isPhoneValid ? 'border-red-300 focus:ring-red-200' : 'border-brand-border focus:ring-brand-primary/25'}`}
                          placeholder="0757545358"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <p className="mt-2 text-xs text-brand-muted">Accepted: `0757545358` or `+94757545358`.</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Age (Required)</label>
                        <input
                          type="number"
                          min="0"
                          max="150"
                          className="w-full h-12 bg-brand-bg-soft rounded-xl border border-brand-border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                          placeholder="e.g. 35"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Gender (Required)</label>
                        <select
                          className="w-full h-12 bg-brand-bg-soft rounded-xl border border-brand-border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">NIC (Optional)</label>
                      <input
                        type="text"
                        className="w-full h-12 bg-brand-bg-soft rounded-xl border border-brand-border px-4 text-sm font-semibold text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25"
                        placeholder="e.g. 991234567V"
                        value={formData.nic}
                        onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 sm:p-8 lg:p-12 flex-1"
              >
                <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">
                  <div className="lg:col-span-4">
                    <h3 className="text-2xl font-serif italic text-brand-primary mb-3">Review & Confirm</h3>
                    <p className="text-brand-muted text-sm leading-relaxed">Confirm details before final submission.</p>
                  </div>

                  <div className="lg:col-span-8 space-y-5">
                    <div className="bg-brand-bg-soft rounded-2xl p-5 sm:p-6 border border-brand-border space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">Patient</p>
                          <p className="text-xl sm:text-2xl font-serif italic text-brand-primary">{formData.firstName} {formData.lastName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">Booking Type</p>
                          <p className="text-xl sm:text-2xl font-serif italic text-brand-primary">Crown & Bridge Consultation</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">Schedule</p>
                          <p className="text-lg sm:text-xl font-serif italic text-brand-primary">{formData.date} - {formData.time}</p>
                          <p className="text-xs text-brand-muted mt-1">Timezone: {userTimeZone}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-widest mb-1.5">Contact</p>
                          <p className="text-sm font-semibold text-brand-ink">{formData.phone}</p>
                          <p className="text-sm text-brand-muted mt-1">{formData.email || 'No email provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-brand-muted uppercase tracking-widest mb-3">Additional Notes (Optional)</label>
                      <textarea
                        className="w-full bg-brand-bg-soft rounded-xl border border-brand-border p-4 h-28 text-sm text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-primary/25 resize-none"
                        placeholder="Share any medical history or treatment preference..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 sm:p-6 lg:p-8 bg-brand-bg-soft border-t border-brand-border flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="min-h-[20px]">
              {error ? <p className="text-xs text-red-600 font-semibold">{error}</p> : null}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {step > 1 && (
                <button
                  onClick={prevStep}
                  className="px-5 py-3 rounded-full border border-brand-border text-[11px] font-bold uppercase tracking-[0.12em] text-brand-muted hover:text-brand-primary hover:border-brand-primary transition"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  disabled={(step === 1 && !isStepOneValid) || (step === 2 && !isStepTwoValid)}
                  onClick={nextStep}
                  className="px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-[11px] uppercase tracking-[0.14em] shadow-lg shadow-brand-border/70 disabled:opacity-35 hover:brightness-105 transition flex items-center"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 sm:px-8 py-3 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-[11px] uppercase tracking-[0.14em] shadow-lg shadow-brand-border/70 hover:brightness-105 transition disabled:opacity-35"
                >
                  {submitting ? 'Submitting...' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
