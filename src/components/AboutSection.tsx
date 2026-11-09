import React from 'react';
import { Sparkles, Utensils, HeartHandshake, ShieldCheck } from 'lucide-react';
import { BUSINESS_INFO } from '../data/menuData';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 bg-[#0e1015] border-y border-stone-800/60 relative overflow-hidden">
      {/* Decorative ambient subtle background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-widest mb-3">
            <span>Our Badami Bagh Legacy</span>
            <span aria-hidden="true">·</span>
            <span>Est. Authentic Lahore</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 tracking-tight text-balance">
            Where Historic Lahori Tradition Meets Uncompromising Freshness
          </h2>
          <p className="mt-4 text-stone-300 text-sm sm:text-base leading-relaxed">
            Located in the bustling heart of Badami Bagh, Lahore, <strong className="text-stone-100 font-semibold">{BUSINESS_INFO.name}</strong> has been the morning sanctuary for food lovers seeking genuine slow-simmered Murgh Channay and crisp, ajwain-scented fried fish.
          </p>
        </div>

        {/* 3 Pillars of Authenticity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <div className="bg-[#141720] border border-stone-800 rounded-2xl p-7 hover:border-amber-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-100 mb-2">
              Overnight Slow-Coal Simmering
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              We never rush the degh. Our chickpeas are soaked in alkaline spring water and simmered for over 8 hours on gentle coals with whole black cardamoms, cinnamon, and cumin until buttery smooth.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-800/80 text-xs text-amber-300 font-medium">
              No artificial baking soda or thickeners
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-[#141720] border border-stone-800 rounded-2xl p-7 hover:border-amber-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-100 mb-2">
              Ancestral Ajwain Fish Marinade
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Our Rahu and Kala fish cuts are fresh daily catches. Seasoned with wild pomegranate seeds (anardana), crushed garlic, ajwain, and freshly pounded chili before frying in pure crisp oil.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-800/80 text-xs text-amber-300 font-medium">
              Served with signature dark imli-aaloo bukhara chutney
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#141720] border border-stone-800 rounded-2xl p-7 hover:border-amber-500/40 transition-colors shadow-lg shadow-black/40">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-100 mb-2">
              Pure Desi Ghee & Fresh Dairy
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              Our crowning glory is the sizzling desi ghee tarka roghan poured fresh on every plate. Paired with clay-oven sesame roghni naans and Pehlwani malai lassi churned from buffalo milk.
            </p>
            <div className="mt-4 pt-4 border-t border-stone-800/80 text-xs text-amber-300 font-medium">
              100% Halal and verified food grade standards
            </div>
          </div>

        </div>

        {/* Badami Bagh Location Banner Highlight */}
        <div className="mt-12 bg-gradient-to-r from-stone-900 via-[#181a24] to-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <div className="text-xs text-amber-400 font-semibold tracking-wide">
              Badami Bagh Food Street Landmark
            </div>
            <div className="text-lg font-serif font-bold text-stone-100">
              Abu Bakar Road, Sadiq Pura, Badami Bagh, Lahore
            </div>
            <p className="text-xs text-stone-400">
              Easily accessible for breakfast lovers coming from Ravi Road, Azadi Chowk, Circular Road, and Shahdara.
            </p>
          </div>

          <a
            href={BUSINESS_INFO.googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 text-xs font-semibold rounded-lg border border-amber-500/40 transition-colors shrink-0 whitespace-nowrap"
          >
            Get Direction on Google Maps
          </a>
        </div>

      </div>
    </section>
  );
};
