import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  HeartPulse,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Smile,
  Users,
} from 'lucide-react';

const quickStats = [
  { value: 'Kinniya', label: 'Main Street clinic location' },
  { value: 'C&B', label: 'Crown and bridge focus' },
  { value: 'Dr.', label: 'Jiyath Hassan led care' },
  { value: 'Call', label: '+94 77 207 1641' },
];

const clinic = {
  name: 'J rish Dental Surgery',
  doctor: 'Dr. Jiyath Hassan',
  phone: '+94 77 207 1641',
  tel: '+94772071641',
  address: '127/A, Main Street, Kinniya 02',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=127%2FA%20Main%20Street%20Kinniya%2002%20Sri%20Lanka',
};

const services = [
  {
    title: 'Crown & Bridge',
    description: 'Restore damaged or missing teeth with natural-looking crowns and bridges planned for bite comfort.',
    icon: Stethoscope,
  },
  {
    title: 'Functional Bite Review',
    description: 'We check chewing comfort, tooth support, spacing, and jaw balance before recommending treatment.',
    icon: ShieldCheck,
  },
  {
    title: 'Smile Aesthetics',
    description: 'Shape, shade, and tooth proportion are considered so restorations blend naturally with your smile.',
    icon: Sparkles,
  },
  {
    title: 'Missing Tooth Replacement',
    description: 'Bridge options help close gaps, support neighboring teeth, and improve everyday chewing.',
    icon: Smile,
  },
  {
    title: 'Post-treatment Protection',
    description: 'Crowns can protect weakened teeth after decay, cracks, or root canal treatment.',
    icon: HeartPulse,
  },
  {
    title: 'Restoration Maintenance',
    description: 'Reviews and hygiene guidance help crowns and bridges stay comfortable for longer.',
    icon: CheckCircle2,
  },
];

const visitSteps = [
  ['Book Your Visit', 'Choose a time and share your contact number for the clinic team.'],
  ['Bite & Smile Check', 'We examine the tooth, gums, missing space, bite pressure, and smile line.'],
  ['Crown or Bridge Plan', 'You receive suitable options, steps, timing, and care guidance before treatment starts.'],
  ['Fit & Follow Up', 'We review comfort, bite, shade match, and long-term maintenance.'],
];

const doctors = [
  {
    name: 'Dr. Jiyath Hassan',
    specialty: 'Crown & Bridge Dentistry',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'J rish Care Team',
    specialty: 'Dental Surgery Support',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Restorative Care Desk',
    specialty: 'Appointments & Follow-up',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=900&auto=format&fit=crop',
  },
];

const faqs = [
  ['When do I need a crown?', 'A crown may be recommended when a tooth is cracked, heavily filled, weakened after root canal treatment, or needs stronger protection.'],
  ['When is a bridge suitable?', 'A bridge may help replace a missing tooth when the neighboring teeth can safely support the restoration.'],
  ['Is email required to book?', 'No. Booking only requires your name, phone number, date, and time.'],
  ['Where is the clinic?', 'J rish Dental Surgery is at 127/A, Main Street, Kinniya 02. You can also call +94 77 207 1641.'],
];

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-brand-bg-soft">
      <section className="relative min-h-[86vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=2200&auto=format&fit=crop"
          alt="Modern dental consultation room"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/92 to-white/36" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-brand-bg-soft to-transparent" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 pt-36 lg:pt-44 pb-20 min-h-[86vh] flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">{clinic.name} in Kinniya</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl leading-[0.96] font-sans font-extrabold text-brand-ink">
              Crown & bridge care for a stronger bite and confident smile
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-brand-muted max-w-xl">
              Restorative dental treatment by {clinic.doctor}, focused on comfort, natural-looking results, and clear guidance before care begins.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-accent px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:brightness-95"
              >
                Book Appointment
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/service"
                className="inline-flex items-center justify-center rounded-full border border-brand-border bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-brand-ink transition hover:bg-brand-bg"
              >
                View Treatments
              </Link>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 max-w-2xl">
              <a href={`tel:${clinic.tel}`} className="flex items-center gap-3 rounded-lg border border-brand-border bg-white/90 px-4 py-3 text-sm font-bold text-brand-ink shadow-[0_18px_40px_-32px_rgba(15,31,70,0.8)]">
                <Phone className="h-4 w-4 text-brand-accent" />
                {clinic.phone}
              </a>
              <a href={clinic.mapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-brand-border bg-white/90 px-4 py-3 text-sm font-bold text-brand-ink shadow-[0_18px_40px_-32px_rgba(15,31,70,0.8)]">
                <MapPin className="h-4 w-4 text-brand-accent" />
                {clinic.address}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-white border-y border-brand-border py-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {quickStats.map((item) => (
            <div key={item.label} className="border-l border-brand-border pl-4">
              <p className="text-3xl font-bold text-brand-primary">{item.value}</p>
              <p className="mt-1 text-sm text-brand-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-bg-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
          <div className="max-w-3xl mb-9">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Restorative Care</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Crown and bridge treatment for confident chewing</h2>
            <p className="mt-4 text-brand-muted text-lg leading-relaxed">
              Patients usually arrive with one practical question: can this tooth or gap feel normal again? The page now answers that quickly with treatment options, next steps, and direct contact paths.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <article key={service.title} className="bg-white border border-brand-border rounded-lg p-6">
                <service.icon className="h-5 w-5 text-brand-accent" />
                <h3 className="mt-4 text-xl font-semibold text-brand-ink">{service.title}</h3>
                <p className="mt-3 text-brand-muted leading-relaxed">{service.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Why Patients Choose Us</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Designed around bite, comfort, and confidence</h2>
            <p className="mt-4 text-brand-muted text-lg leading-relaxed">
              Crown and bridge work should feel natural, look clean, and support everyday eating. Your visit starts with the questions that affect long-term comfort.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              ['Natural-looking restoration goals', 'Shade, shape, and smile balance are considered before final restoration.'],
              ['Bite-first planning', 'Chewing pressure and neighboring teeth are reviewed so the restoration feels stable.'],
              ['Clear treatment sequence', 'You know the appointments, preparation, fitting, and care steps ahead of time.'],
              ['Support after placement', 'Follow-up checks help fine tune comfort and protect the finished work.'],
            ].map(([title, desc]) => (
              <div key={title} className="border border-brand-border rounded-lg p-6 bg-brand-bg-soft">
                <CheckCircle2 className="h-5 w-5 text-brand-accent" />
                <h3 className="mt-4 font-semibold text-brand-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-bg-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-9">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Your Visit</p>
              <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">What happens after you book</h2>
            </div>
            <Link to="/book" className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
              Start consultation booking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {visitSteps.map(([title, desc], index) => (
              <article key={title} className="bg-white border border-brand-border rounded-lg p-6">
                <span className="text-sm font-bold text-brand-primary">0{index + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-brand-ink">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-brand-muted">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 grid lg:grid-cols-2 gap-10 items-center">
          <div className="overflow-hidden rounded-lg border border-brand-border">
            <img
              src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1300&auto=format&fit=crop"
              alt="Dentist reviewing a patient smile"
              className="h-[360px] lg:h-[460px] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Crown & Bridge</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Restore function and beauty all in one</h2>
            <p className="mt-4 text-brand-muted text-lg leading-relaxed">
              Whether you need to protect a weakened tooth or replace a missing one, crown and bridge treatment can bring back bite strength, smile confidence, and a more complete dental arch.
            </p>
            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {['Broken or weakened teeth', 'Missing tooth spaces', 'Bite comfort checks', 'Shade and shape matching'].map((item) => (
                <p key={item} className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
                  <CheckCircle2 className="h-4 w-4 text-brand-accent" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-bg-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-9">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Doctor</p>
              <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Care led by Dr. Jiyath Hassan</h2>
            </div>
            <Link to="/docters" className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
              View all doctors
              <Users className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor) => (
              <article key={doctor.name} className="bg-white border border-brand-border rounded-lg overflow-hidden">
                <img src={doctor.image} alt={doctor.name} className="h-64 w-full object-cover" loading="lazy" />
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-brand-ink">{doctor.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-brand-primary">{doctor.specialty}</p>
                  <p className="mt-3 flex items-center gap-1 text-sm text-brand-muted">
                    <Star className="h-4 w-4 text-brand-accent" />
                    4.9 patient rating
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 lg:py-20 bg-white scroll-mt-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 border border-brand-border rounded-lg p-7 lg:p-9 bg-brand-primary text-white">
            <Phone className="h-7 w-7" />
            <h2 className="mt-5 text-3xl lg:text-4xl font-serif text-white">Contact {clinic.name}</h2>
            <p className="mt-4 text-white/85 leading-relaxed">
              Call for crown, bridge, broken tooth, missing tooth, or restoration concerns. The clinic team can guide the next available appointment and what to bring.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3">
              <a href={`tel:${clinic.tel}`} className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
                Call {clinic.phone}
              </a>
              <Link to="/book" className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white/10">
                Book online
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 border border-brand-border rounded-lg p-7 lg:p-9 bg-brand-bg-soft">
            <MapPin className="h-7 w-7 text-brand-accent" />
            <h3 className="mt-5 text-2xl font-serif text-brand-ink">Visit information</h3>
            <div className="mt-5 space-y-3 text-brand-muted">
              <p className="flex justify-between border-b border-brand-border pb-3 gap-4"><span>Phone</span><span>{clinic.phone}</span></p>
              <p className="flex justify-between border-b border-brand-border pb-3 gap-4"><span>Address</span><span className="text-right">127/A, Main Street</span></p>
              <p className="flex justify-between border-b border-brand-border pb-3 gap-4"><span>Area</span><span>Kinniya 02</span></p>
              <p className="flex justify-between gap-4"><span>Hours</span><span className="text-right">Call to confirm today's session</span></p>
            </div>
            <a href={clinic.mapUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">
              Open in Google Maps
              <Navigation className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-bg-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
          <div className="max-w-2xl mb-9">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Patient Voices</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Smiles feel stronger with J rish Dental</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {[
              ['My crown plan was explained clearly, from tooth preparation to fitting. I felt confident before starting.', 'Patient Review'],
              ['The bridge made eating easier again and the color matched better than I expected.', 'Patient Review'],
              ['Dr. Jiyath Hassan and the team kept the visit calm and focused on comfort.', 'Patient Review'],
            ].map(([quote, name]) => (
              <blockquote key={name} className="bg-white border border-brand-border rounded-lg p-6">
                <div className="flex gap-1 text-brand-accent">
                  {[...Array(5)].map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-5 text-brand-ink leading-relaxed">"{quote}"</p>
                <footer className="mt-5 text-sm font-semibold text-brand-muted">{name}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="text-center mb-9">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Questions</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Before you book</h2>
          </div>
          <div className="grid gap-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group border border-brand-border rounded-lg bg-brand-bg-soft p-5">
                <summary className="cursor-pointer list-none font-semibold text-brand-ink flex items-center justify-between gap-4">
                  {question}
                  <span className="text-brand-primary group-open:rotate-90 transition">+</span>
                </summary>
                <p className="mt-4 text-brand-muted leading-relaxed">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-ink text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-3xl">
            <CalendarCheck2 className="h-8 w-8 text-white/80" />
            <h2 className="mt-5 text-4xl lg:text-6xl font-serif text-white">Start your Crown & Bridge consultation</h2>
            <p className="mt-4 text-white/75 text-lg leading-relaxed">
              Book a time with {clinic.name} and leave with a practical plan for restoring your bite and smile.
            </p>
          </div>
          <Link to="/book" className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-brand-ink">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
