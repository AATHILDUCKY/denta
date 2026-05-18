import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Smile,
  Users,
} from 'lucide-react';

const quickStats = [
  { value: '15+', label: 'Years of clinical care' },
  { value: '12k+', label: 'Consultations completed' },
  { value: '4.9/5', label: 'Average patient rating' },
  { value: '24h', label: 'Emergency guidance' },
];

const services = [
  {
    title: 'Consultation & Checkup',
    description: 'Complete oral screening, digital findings, risk review, and a clear care plan.',
    icon: Stethoscope,
  },
  {
    title: 'Preventive Cleaning',
    description: 'Plaque removal, gum assessment, fluoride guidance, and personalized hygiene advice.',
    icon: ShieldCheck,
  },
  {
    title: 'Whitening & Smile Design',
    description: 'Safe shade improvement and cosmetic planning for a natural, balanced smile.',
    icon: Sparkles,
  },
  {
    title: 'Aligners & Orthodontics',
    description: 'Straightening options for bite comfort, spacing, crowding, and confident smiles.',
    icon: Smile,
  },
  {
    title: 'Root Canal Therapy',
    description: 'Pain-focused treatment for infected teeth, with restoration planning afterward.',
    icon: HeartPulse,
  },
  {
    title: 'Implants & Restorations',
    description: 'Replacement and repair options for missing, cracked, or weakened teeth.',
    icon: CheckCircle2,
  },
];

const visitSteps = [
  ['Book Consultation', 'Choose an available time and share your contact number.'],
  ['Clinical Screening', 'We examine teeth, gums, mouth, symptoms, health history, and risk factors.'],
  ['Clear Treatment Plan', 'You receive options, expected steps, timing, and cost guidance before care starts.'],
  ['Follow-up Care', 'We recommend the right recall interval based on your oral health risk.'],
];

const doctors = [
  {
    name: 'Dr. Amelia Hart',
    specialty: 'Cosmetic Dentistry',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Dr. Noah Bennett',
    specialty: 'Orthodontics',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=900&auto=format&fit=crop',
  },
  {
    name: 'Dr. Sofia Lane',
    specialty: 'Endodontics',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=900&auto=format&fit=crop',
  },
];

const faqs = [
  ['How often should I visit?', 'Your dentist recommends timing based on your risk. Some patients need more frequent reviews, while low-risk patients may need fewer.'],
  ['Is email required to book?', 'No. Consultation booking only requires your name, phone number, date, and time.'],
  ['What happens at a consultation?', 'We check your mouth, teeth, gums, symptoms, health history, and discuss suitable options before treatment.'],
  ['What if I have pain or swelling?', 'Book urgently or call the clinic. Severe facial swelling, trauma, or uncontrolled bleeding should be treated as urgent.'],
];

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-brand-bg-soft">
      <section className="relative min-h-[82vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=2200&auto=format&fit=crop"
          alt="Modern dental consultation room"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/24" />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 pt-28 pb-16 min-h-[82vh] flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Dentiva Care Studio</p>
            <h1 className="mt-5 text-5xl sm:text-6xl lg:text-7xl leading-[0.96] font-sans font-extrabold text-brand-ink">
              Consultation-led care for healthier smiles
            </h1>
            <p className="mt-6 text-lg sm:text-xl leading-relaxed text-brand-muted max-w-xl">
              Start with a focused dental consultation, understand your oral health clearly, and choose treatment only when the plan makes sense.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-accent px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:brightness-95"
              >
                Book Consultation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/service"
                className="inline-flex items-center justify-center rounded-full border border-brand-border bg-white px-7 py-3.5 text-sm font-bold uppercase tracking-[0.1em] text-brand-ink transition hover:bg-brand-bg"
              >
                View Services
              </Link>
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Complete Care</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Dental services patients search for first</h2>
            <p className="mt-4 text-brand-muted text-lg leading-relaxed">
              A strong dental homepage needs more than a booking button. Patients compare prevention, cosmetic care, pain relief, emergencies, and team credibility before they trust a clinic.
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
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Clear care before clinical care</h2>
            <p className="mt-4 text-brand-muted text-lg leading-relaxed">
              The first visit should answer the important questions: what is happening, why it matters, what it costs, and what can wait.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              ['Transparent treatment planning', 'Options, benefits, risks, timing, and estimated costs are discussed before treatment.'],
              ['Comfort for anxious patients', 'Breaks, slower pacing, and clear consent help make the visit easier.'],
              ['Prevention-first dentistry', 'We focus on early detection so problems stay simpler and more affordable.'],
              ['Emergency triage support', 'Pain, trauma, swelling, and broken teeth receive practical guidance quickly.'],
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
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Prevention Matters</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">A checkup can prevent bigger treatment later</h2>
            <p className="mt-4 text-brand-muted text-lg leading-relaxed">
              Routine dental reviews help find tooth decay, gum problems, oral changes, and habits that can affect future treatment needs. The goal is simple: catch small issues while they are easier to manage.
            </p>
            <div className="mt-7 grid sm:grid-cols-2 gap-3">
              {['Tooth and gum examination', 'Oral cancer awareness', 'Diet and hygiene review', 'Risk-based recall timing'].map((item) => (
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
              <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Doctors</p>
              <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Meet the clinical team</h2>
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

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 border border-brand-border rounded-lg p-7 lg:p-9 bg-brand-primary text-white">
            <Phone className="h-7 w-7" />
            <h2 className="mt-5 text-3xl lg:text-4xl font-serif text-white">Dental pain, swelling, or trauma?</h2>
            <p className="mt-4 text-white/85 leading-relaxed">
              Emergencies need quick direction. Call us with details if you have severe pain, a knocked-out tooth, swelling, bleeding, or a broken restoration.
            </p>
            <Link to="/book" className="mt-7 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-brand-primary">
              Book urgent consultation
            </Link>
          </div>
          <div className="lg:col-span-5 border border-brand-border rounded-lg p-7 lg:p-9 bg-brand-bg-soft">
            <Clock3 className="h-7 w-7 text-brand-accent" />
            <h3 className="mt-5 text-2xl font-serif text-brand-ink">Clinic Hours</h3>
            <div className="mt-5 space-y-3 text-brand-muted">
              <p className="flex justify-between border-b border-brand-border pb-3"><span>Mon - Fri</span><span>9:00 AM - 7:00 PM</span></p>
              <p className="flex justify-between border-b border-brand-border pb-3"><span>Saturday</span><span>9:00 AM - 4:00 PM</span></p>
              <p className="flex justify-between"><span>Sunday</span><span>Emergency guidance</span></p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-brand-bg-soft">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
          <div className="max-w-2xl mb-9">
            <p className="text-[11px] uppercase tracking-[0.18em] text-brand-secondary font-bold">Patient Voices</p>
            <h2 className="mt-3 text-4xl lg:text-5xl font-serif text-brand-ink">Confidence comes from clarity</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            {[
              ['The consultation was calm, direct, and easy to understand. I knew what could wait and what needed attention.', 'Sarah M.'],
              ['They explained every option before treatment. No pressure, just a clear plan and good care.', 'Daniel R.'],
              ['I was anxious about the dentist, but the team gave me breaks and explained each step.', 'Priya K.'],
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
            <h2 className="mt-5 text-4xl lg:text-6xl font-serif text-white">Start with a consultation</h2>
            <p className="mt-4 text-white/75 text-lg leading-relaxed">
              Book a time, bring your questions, and leave with a practical dental plan.
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
