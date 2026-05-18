import { useState, useEffect } from 'react';
import { UserProfile, Appointment } from '../types';
import { 
  Calendar, Clock, AlertCircle, CheckCircle, 
  ChevronRight, ArrowRight, User, Settings, ShieldCheck, Activity
} from 'lucide-react';
import { listAppointments } from '../lib/appointments-api';

interface PatientPortalProps {
  user: UserProfile;
}

export default function PatientPortal({ user }: PatientPortalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyAppointments = async () => {
      try {
        const allAppointments = await listAppointments();
        const mine = allAppointments.filter((item) => item.email === user.email);
        setAppointments(mine as unknown as Appointment[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyAppointments();
  }, [user.email]);

  return (
    <div className="bg-brand-bg min-h-screen py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">Patient Portal</h1>
            <h2 className="text-4xl lg:text-5xl font-bold font-display text-brand-ink tracking-tight italic">
              Hello, {user.displayName.split(' ')[0]}
            </h2>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-brand-border flex items-center space-x-3">
             <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                <ShieldCheck className="h-5 w-5" />
             </div>
             <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Medical Record Status</p>
               <p className="text-sm font-bold text-brand-ink">Verified & Secure</p>
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column - Appointments */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-[40px] p-8 lg:p-10 shadow-sm border border-gray-50">
               <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-bold text-brand-ink flex items-center">
                   <Calendar className="mr-3 h-5 w-5 text-brand-primary" />
                   My Appointments
                 </h3>
                 <button className="text-sm font-bold text-brand-primary flex items-center hover:underline">
                   View History <ChevronRight className="ml-1 h-4 w-4" />
                 </button>
               </div>

               {loading ? (
                 <div className="py-12 text-center text-gray-400">Loading your schedule...</div>
               ) : appointments.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-400 mb-6 italic">No upcoming appointments found.</p>
                    <button onClick={() => window.location.href = '/book'} className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold">
                       Schedule Your First Visit
                    </button>
                  </div>
               ) : (
                 <div className="space-y-6">
                   {appointments.map((apt) => (
                     <div key={apt.id} className="flex items-center justify-between p-6 bg-brand-bg-soft rounded-3xl border border-transparent hover:border-brand-primary/20 transition">
                       <div className="flex items-center space-x-6">
                         <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{apt.date.split('-')[1]}</span>
                            <span className="text-2xl font-bold font-display leading-none">{apt.date.split('-')[2]}</span>
                         </div>
                         <div>
                            <p className="font-bold text-brand-ink">{apt.treatmentType}</p>
                            <p className="text-sm text-gray-500 font-medium flex items-center">
                               <Clock className="h-3 w-3 mr-1" /> {apt.time}
                            </p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-6">
                         <StatusBadge status={apt.status} />
                         <ChevronRight className="h-5 w-5 text-gray-300" />
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </section>
            
            {/* Quick Tips */}
            <div className="bg-brand-primary rounded-[40px] p-10 text-white relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-2xl font-bold font-display mb-4 italic">Doctor's Health Tip</h4>
                 <p className="text-lg text-white/80 max-w-md mb-8">
                   "Remember to floss at least once a day before bed. It removes plaque from places where a toothbrush can't reach."
                 </p>
                 <button className="flex items-center text-sm font-bold bg-white/20 hover:bg-white/30 p-3 px-6 rounded-full transition">
                    Learn More <ArrowRight className="ml-2 h-4 w-4" />
                 </button>
               </div>
               <div className="absolute top-0 right-0 p-10 opacity-10">
                  <Activity className="h-32 w-32" />
               </div>
            </div>
          </div>

          {/* Right Column - Profile/Settings */}
          <div className="lg:col-span-4 space-y-8">
             <section className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                <div className="flex flex-col items-center text-center mb-8">
                   <div className="w-24 h-24 rounded-[30px] overflow-hidden mb-6 border-4 border-gray-50">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-full h-full object-cover" />
                   </div>
                   <h4 className="font-bold text-xl mb-1">{user.displayName}</h4>
                   <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                
                <div className="space-y-3">
                   <button className="w-full flex items-center justify-between p-4 bg-brand-bg-soft rounded-2xl hover:bg-white hover:ring-1 hover:ring-gray-100 transition group text-sm font-semibold">
                      <div className="flex items-center space-x-3">
                         <User className="h-4 w-4 text-gray-400 group-hover:text-brand-primary" />
                         <span>Edit Profile</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                   </button>
                   <button className="w-full flex items-center justify-between p-4 bg-brand-bg-soft rounded-2xl hover:bg-white hover:ring-1 hover:ring-gray-100 transition group text-sm font-semibold">
                      <div className="flex items-center space-x-3">
                         <Settings className="h-4 w-4 text-gray-400 group-hover:text-brand-primary" />
                         <span>Account Settings</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                   </button>
                </div>
             </section>

             <section className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                <h4 className="font-bold text-lg mb-6">Clinic Information</h4>
                <div className="space-y-6">
                   <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-brand-bg-soft rounded-xl flex items-center justify-center shrink-0">
                         <AlertCircle className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Emergency Line</p>
                         <p className="font-bold">+1 (555) 999-HELP</p>
                      </div>
                   </div>
                </div>
             </section>
          </div>
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
    completed: 'bg-brand-bg-soft text-blue-600 border-brand-border'
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}
