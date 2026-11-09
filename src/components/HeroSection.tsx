import React from 'react';
import { Star, Flame, Clock, MapPin, MessageCircle, ArrowRight, PlusCircle, Sparkles } from 'lucide-react';
import { BUSINESS_INFO, MenuItem } from '../data/menuData';

interface HeroSectionProps {
  onExploreMenu: () => void;
  onQuickOrder: (item: MenuItem) => void;
  specialItem?: MenuItem;
  fishItem?: MenuItem;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreMenu,
  onQuickOrder,
  specialItem,
  fishItem,
}) => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-8 pb-16 lg:py-20">
      {/* Background Hero Image with Dark Contrast Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_lahori_feast_1793753249117.jpg"
          alt="Lahori Murgh Channay and Crispy Fried Fish Feast"
          className="w-full h-full object-cover object-center scale-105 transform motion-safe:animate-pulse motion-safe:duration-[10000ms]"
          referrerPolicy="no-referrer"
        />
        {/* Measured dark scrim for WCAG AA readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/85 to-[#0c0d10]/70" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-[#0c0d10]/60 to-[#0c0d10]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Bold Headline & Editorial Story */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Trust Proof Micro-Strip */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 font-medium tracking-wide">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-mono tabular-nums font-bold">4.1 / 5.0</span>
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span>640+ Lahore Foodie Reviews</span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="text-stone-300">Badami Bagh Tradition</span>
            </div>

            {/* High-Impact Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-stone-100 tracking-tight leading-[1.12] text-balance">
              The Royal Taste of Lahore,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500">
                Delivered Fresh.
              </span>
            </h1>

            {/* Subheadline with cultural depth */}
            <p className="text-base sm:text-lg text-stone-300 font-normal leading-relaxed max-w-2xl">
              Authentic slow-coal braised <strong className="text-amber-200 font-semibold">Murgh Channay</strong> infused with pure desi ghee roghan, and famous winter <strong className="text-amber-200 font-semibold">Crispy Lahori Rahu Fish</strong> seasoned in ancestral ajwain spices. Crafted fresh daily at Abu Bakar Road, Badami Bagh.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreMenu}
                type="button"
                className="px-7 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-900/30 transition-all transform active:scale-98 flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <span>Explore Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href={`https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent('Salam! I want to place an order from Butt Murgh Channay & Fish Corner Badami Bagh.')}`}
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 bg-stone-900/80 hover:bg-stone-850 border border-stone-700/80 hover:border-amber-500/50 text-stone-100 font-semibold text-sm rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Order via WhatsApp</span>
              </a>
            </div>

            {/* Service & Freshness Highlights */}
            <div className="pt-6 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-stone-100">100% Desi Ghee</span>
                  <span className="text-stone-400">Authentic aroma</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-stone-100">Hot & Fresh</span>
                  <span className="text-stone-400">6 AM Breakfast Start</span>
                </div>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-stone-100">Express Delivery</span>
                  <span className="text-stone-400">Across Lahore</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Specialty Cards or Fresh Kitchen Badge */}
          <div className="lg:col-span-5 space-y-4">
            
            {specialItem ? (
              /* Spotlight Card 1: Special Dish */
              <div className="group bg-[#14161d]/90 backdrop-blur-md rounded-2xl p-4 border border-amber-900/30 hover:border-amber-500/50 transition-all shadow-xl shadow-black/60">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-stone-800 relative">
                    <img
                      src={specialItem.image}
                      alt={specialItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 left-1 bg-amber-500/90 text-stone-950 font-bold text-[10px] px-1.5 py-0.5 rounded">
                      Featured
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-stone-100 truncate">
                        {specialItem.name}
                      </h3>
                    </div>
                    {specialItem.nameUrdu && (
                      <p className="text-xs text-amber-400/90 font-serif italic mb-1" dir="rtl">
                        {specialItem.nameUrdu}
                      </p>
                    )}
                    <p className="text-xs text-stone-400 line-clamp-2 mb-2">
                      {specialItem.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-amber-400 font-mono tabular-nums">
                        Rs. {specialItem.price}
                      </span>
                      <button
                        onClick={() => onQuickOrder(specialItem)}
                        type="button"
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 text-xs font-semibold rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
                      >
                        + Add to Basket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {fishItem && fishItem.id !== specialItem?.id ? (
              /* Spotlight Card 2: Second Special Dish */
              <div className="group bg-[#14161d]/90 backdrop-blur-md rounded-2xl p-4 border border-amber-900/30 hover:border-amber-500/50 transition-all shadow-xl shadow-black/60">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-stone-800 relative">
                    <img
                      src={fishItem.image}
                      alt={fishItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1 left-1 bg-emerald-500/90 text-stone-950 font-bold text-[10px] px-1.5 py-0.5 rounded">
                      Special
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-stone-100 truncate">
                        {fishItem.name}
                      </h3>
                    </div>
                    {fishItem.nameUrdu && (
                      <p className="text-xs text-amber-400/90 font-serif italic mb-1" dir="rtl">
                        {fishItem.nameUrdu}
                      </p>
                    )}
                    <p className="text-xs text-stone-400 line-clamp-2 mb-2">
                      {fishItem.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-amber-400 font-mono tabular-nums">
                        Rs. {fishItem.price}
                      </span>
                      <button
                        onClick={() => onQuickOrder(fishItem)}
                        type="button"
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-stone-950 text-xs font-semibold rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
                      >
                        + Add to Basket
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* When no products are uploaded yet by admin */}
            {!specialItem && !fishItem && (
              <div className="bg-[#14161d]/90 backdrop-blur-md rounded-2xl p-6 border border-amber-900/40 text-center space-y-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-100">
                    Fresh Desi Ghee Menu Today
                  </h3>
                  <p className="text-xs text-stone-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Authentic Murgh Channay, Desi Murgh Kofta, and fresh Rahu Fish prepared daily at our Badami Bagh counter.
                  </p>
                </div>
                <button
                  onClick={onExploreMenu}
                  type="button"
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl shadow transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Explore Menu & Daily Specials</span>
                </button>
              </div>
            )}

            {/* Timings ticker bar */}
            <div className="bg-[#101217] border border-stone-800/80 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-medium text-stone-200">Open for Orders Today</span>
              </div>
              <span className="font-mono text-stone-400">Breakfast 6am · Fish 4pm-12am</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
