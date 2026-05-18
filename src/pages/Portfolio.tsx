import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';

export default function Portfolio() {
  const cases = [
    {
      title: 'Full Smile Restoration',
      description: 'A complete transformation using porcelain veneers and advanced whitening techniques.',
      category: 'Cosmetic',
      imageBefore: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=2574&auto=format&fit=crop',
      imageAfter: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2670&auto=format&fit=crop'
    },
    {
      title: 'Invisalign Alignment',
      description: 'Corrected severe crowding and bite issues in just 14 months without metal braces.',
      category: 'Orthodontics',
      imageAfter: 'https://images.unsplash.com/photo-1593059080506-517a6936d370?q=80&w=2670&auto=format&fit=crop'
    },
    {
      title: 'Dental Implant Success',
      description: 'Restored function and aesthetics for a patient with missing molars.',
      category: 'Surgery',
      imageAfter: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=2574&auto=format&fit=crop'
    }
  ];

  return (
    <div className="py-20 lg:py-32 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20 max-w-3xl">
          <h1 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">Our Work</h1>
          <h2 className="text-5xl lg:text-7xl font-bold font-display leading-[0.95] tracking-tight text-brand-ink mb-8 italic">
            Artistry in every <br/>single smile.
          </h2>
          <p className="text-xl text-brand-muted leading-relaxed">
            Discover how we blend medical expertise with aesthetic vision to create results that are as healthy as they are beautiful.
          </p>
        </div>

        <div className="grid gap-24">
          {cases.map((caseItem, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
            >
              <div className="lg:w-1/2 relative group">
                <div className="aspect-[16/10] rounded-[40px] overflow-hidden shadow-2xl">
                  <img 
                    src={caseItem.imageAfter} 
                    alt={caseItem.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                  />
                </div>
                {caseItem.imageBefore && (
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-[30px] border-8 border-white shadow-xl overflow-hidden hidden sm:block">
                     <img src={caseItem.imageBefore} alt="Before" className="w-full h-full object-cover" />
                     <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Before</div>
                  </div>
                )}
              </div>
              
              <div className="lg:w-1/2">
                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4">{caseItem.category}</p>
                <h3 className="text-4xl font-bold text-brand-ink mb-6 font-display tracking-tight">{caseItem.title}</h3>
                <p className="text-lg text-brand-muted mb-8 leading-relaxed italic border-l-4 border-brand-primary pl-6">
                  {caseItem.description}
                </p>
                <button className="flex items-center text-brand-primary font-bold hover:translate-x-2 transition cursor-pointer">
                  View Case Details <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
