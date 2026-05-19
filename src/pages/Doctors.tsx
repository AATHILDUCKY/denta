import { Link } from 'react-router-dom';
import { CalendarDays, Star } from 'lucide-react';

const doctors = [
  {
    name: 'Dr. Jiyath Hassan',
    specialty: 'Crown & Bridge Dentistry',
    experience: 'Restorative care',
    education: 'J rish Dental Surgery',
    availability: 'Call for available slots',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Restorative Care Team',
    specialty: 'Crowns, Bridges & Follow-up',
    experience: 'Treatment support',
    education: 'Bite and smile planning',
    availability: 'By appointment',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Patient Care Desk',
    specialty: 'Booking & Guidance',
    experience: 'Care coordination',
    education: 'Appointment assistance',
    availability: '+94 77 207 1641',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Dental Surgery Support',
    specialty: 'Tooth Protection',
    experience: 'Clinical assistance',
    education: 'Preparation and fitting support',
    availability: 'By appointment',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Smile Design Support',
    specialty: 'Shade & Shape Matching',
    experience: 'Aesthetic support',
    education: 'Natural restoration planning',
    availability: 'By appointment',
    image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'Maintenance Team',
    specialty: 'Review & Oral Hygiene',
    experience: 'Aftercare support',
    education: 'Long-term restoration care',
    availability: 'Follow-up visits',
    image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1000&auto=format&fit=crop',
  },
];

export default function Doctors() {
  return (
    <div className="min-h-screen bg-brand-bg-soft py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-14 lg:mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-secondary">J rish Dental Surgery</p>
          <h1 className="mt-4 text-5xl lg:text-6xl font-serif text-brand-ink">Meet Your Crown & Bridge Team</h1>
          <p className="mt-5 max-w-2xl mx-auto text-brand-muted text-lg leading-relaxed">
            Care led by Dr. Jiyath Hassan, focused on restoring bite strength, smile confidence, and long-term comfort.
          </p>
        </header>

        <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-7">
          {doctors.map((doctor) => (
            <article key={doctor.name} className="bg-white border border-brand-border rounded-[1.75rem] overflow-hidden shadow-[0_16px_40px_-30px_rgba(32,40,51,0.45)]">
              <div className="aspect-[4/3] overflow-hidden">
                <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" loading="lazy" />
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-brand-ink">{doctor.name}</h2>
                    <p className="text-sm font-semibold text-brand-primary mt-1">{doctor.specialty}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-bg px-3 py-1.5 text-[11px] font-bold text-brand-muted">
                    <Star className="h-3.5 w-3.5 text-brand-accent" /> 4.9
                  </span>
                </div>

                <div className="mt-5 space-y-2.5 text-sm text-brand-muted">
                  <p><span className="font-semibold text-brand-ink">Experience:</span> {doctor.experience}</p>
                  <p><span className="font-semibold text-brand-ink">Focus:</span> {doctor.education}</p>
                  <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-accent" /> {doctor.availability}</p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Link to="/book" className="flex-1 text-center rounded-full bg-brand-accent text-white py-2.5 text-xs font-bold uppercase tracking-[0.14em] hover:brightness-95 transition">
                    Book Visit
                  </Link>
                  <button className="rounded-full border border-brand-border px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-brand-ink hover:bg-brand-bg transition">
                    Profile
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-14 lg:mt-16 rounded-3xl border border-brand-border bg-white p-7 lg:p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-secondary">Trusted Care</p>
            <h3 className="mt-2 text-2xl lg:text-3xl font-serif text-brand-ink">Need help with crown or bridge treatment?</h3>
            <p className="mt-2 text-brand-muted">Call +94 77 207 1641 or book online for J rish Dental Surgery, 127/A, Main Street, Kinniya 02.</p>
          </div>
          <Link to="/book" className="inline-flex items-center justify-center rounded-full bg-brand-primary text-white px-7 py-3 text-xs font-bold uppercase tracking-[0.14em] hover:brightness-95 transition">
            Talk to Care Desk
          </Link>
        </div>
      </div>
    </div>
  );
}
