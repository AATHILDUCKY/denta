import { motion } from 'motion/react';
import { Search, ChevronRight, Clock, User as UserIcon } from 'lucide-react';

export default function Blog() {
  const posts = [
    {
      title: 'Digital Dentistry: The Future of Your Smile',
      excerpt: 'How modern scanners and 3D printing are making dental procedures faster and more accurate.',
      author: 'Dr. James Wilson',
      date: 'May 15, 2024',
      category: 'Technology',
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2670&auto=format&fit=crop'
    },
    {
      title: '5 Habits for Healthier Gums',
      excerpt: 'Simple daily choices that can prevent periodontitis and keep your gums strong for life.',
      author: 'Dr. Elena Rossi',
      date: 'May 12, 2024',
      category: 'Oral Health',
      image: 'https://images.unsplash.com/photo-1593059080506-517a6936d370?q=80&w=2670&auto=format&fit=crop'
    },
    {
      title: 'Invisalign vs. Traditional Braces',
      excerpt: 'An in-depth look at the pros and cons of clear aligners for adults and teens.',
      author: 'Dr. Sarah Chen',
      date: 'May 08, 2024',
      category: 'Orthodontics',
      image: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=2574&auto=format&fit=crop'
    }
  ];

  return (
    <div className="bg-white min-h-screen py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-20 text-center">
          <h1 className="text-sm font-bold text-brand-primary uppercase tracking-[0.2em] mb-4">Dental Health Blog</h1>
          <h2 className="text-5xl lg:text-7xl font-bold font-display tracking-tight text-brand-ink italic">
            Knowledge for a <br/>Longer Lasting Smile.
          </h2>
          
          <div className="mt-12 max-w-xl mx-auto relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="w-full bg-brand-bg-soft border-none rounded-full py-5 pl-16 pr-8 text-brand-ink focus:ring-2 focus:ring-brand-primary transition shadow-inner"
            />
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-16">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-16">
            {posts.map((post, i) => (
              <motion.article 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="aspect-[21/9] rounded-[40px] overflow-hidden mb-8 relative">
                   <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                   />
                   <div className="absolute top-6 left-6">
                      <span className="bg-white/90 backdrop-blur text-brand-primary text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/20 shadow-sm">
                        {post.category}
                      </span>
                   </div>
                </div>
                <div className="flex items-center space-x-6 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                   <span className="flex items-center"><UserIcon className="h-3 w-3 mr-2" /> {post.author}</span>
                   <span className="flex items-center"><Clock className="h-3 w-3 mr-2" /> {post.date}</span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-brand-ink mb-6 group-hover:text-brand-primary transition leading-tight">
                  {post.title}
                </h3>
                <p className="text-lg text-brand-muted leading-relaxed max-w-2xl mb-8">
                  {post.excerpt}
                </p>
                <button className="flex items-center text-brand-primary font-bold hover:translate-x-2 transition">
                  Read Full Article <ChevronRight className="ml-2 h-5 w-5" />
                </button>
              </motion.article>
            ))}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="bg-brand-bg-soft rounded-[40px] p-10">
               <h4 className="text-xl font-bold mb-8">Categories</h4>
               <ul className="space-y-4">
                  {['Oral Hygiene', 'Cosmetic Tips', 'Orthodontics', 'Patient Stories'].map(cat => (
                    <li key={cat} className="flex items-center justify-between group cursor-pointer">
                       <span className="text-brand-muted group-hover:text-brand-primary font-medium transition">{cat}</span>
                       <span className="text-xs bg-white px-2 py-1 rounded-lg text-gray-400 border border-brand-border italic">12</span>
                    </li>
                  ))}
               </ul>
            </div>

            <div className="bg-brand-primary rounded-[40px] p-10 text-white">
               <h4 className="text-xl font-bold mb-6 italic">Newsletter</h4>
               <p className="text-sm text-white/80 mb-8 leading-relaxed">
                  Get monthly dental health tips and exclusive office updates directly in your inbox.
               </p>
               <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-sm placeholder-white/70 mb-4 focus:ring-2 focus:ring-white transition"
               />
               <button className="w-full bg-white text-brand-primary py-4 rounded-2xl font-bold hover:bg-brand-bg-soft transition">
                  Subscribe
               </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
