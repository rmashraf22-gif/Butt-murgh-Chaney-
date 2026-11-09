import React from 'react';
import { MapPin, Clock, Phone, MessageCircle, ExternalLink, Navigation } from 'lucide-react';
import { BUSINESS_INFO } from '../data/menuData';

export const LocationSection: React.FC = () => {
  return (
    <section id="location" className="py-20 bg-[#0c0d11] border-t border-stone-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">
            <span>Visit Or Order From Our Counter</span>
            <span aria-hidden="true">·</span>
            <span>Badami Bagh Lahore</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 tracking-tight">
            Location & Operating Hours
          </h2>
          <p className="mt-3 text-sm text-stone-400">
            Dine-in with family, pick up piping hot takeaway, or request prompt home delivery anywhere in Lahore.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Details Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Address Card */}
            <div className="bg-[#13151f] border border-stone-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-stone-100 mb-1">
                    Storefront Address
                  </h3>
                  <p className="text-sm text-stone-300 leading-relaxed">
                    {BUSINESS_INFO.address}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Near Sadiq Pura Main Chowk, Badami Bagh, Lahore
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-800/80 flex items-center justify-between">
                <a
                  href={BUSINESS_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="bg-[#13151f] border border-stone-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-stone-100 mb-2">
                    Daily Operating Hours
                  </h3>
                  
                  {/* Timing 1: Breakfast */}
                  <div className="py-2 border-b border-stone-800/60 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-stone-200 block">Morning Breakfast</span>
                      <span className="text-[11px] text-stone-500">Murgh Channay, Anda Channay, Lassi</span>
                    </div>
                    <span className="text-amber-400 font-mono tabular-nums font-medium text-right">
                      6:00 AM – 1:30 PM
                    </span>
                  </div>

                  {/* Timing 2: Evening / Dinner */}
                  <div className="py-2 flex items-center justify-between text-xs sm:text-sm">
                    <div>
                      <span className="font-semibold text-stone-200 block">Evening & Night</span>
                      <span className="text-[11px] text-stone-500">Crispy Fried Fish, Dinner Specials</span>
                    </div>
                    <span className="text-amber-400 font-mono tabular-nums font-medium text-right">
                      4:00 PM – 12:00 AM
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Contact Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <a
                href={`tel:${BUSINESS_INFO.phone.replace(/\s+/g, '')}`}
                className="flex items-center justify-center gap-2 p-3.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 rounded-xl text-stone-200 text-xs font-semibold transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-400" />
                <span>Call {BUSINESS_INFO.phone}</span>
              </a>

              <a
                href={`https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent('Salam Butt Sahib! I want to order food or enquire about today special.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 p-3.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-xl text-emerald-200 text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

          </div>

          {/* Right Column: Embedded Stylized Map Card */}
          <div className="lg:col-span-7 bg-[#13151f] border border-stone-800 rounded-2xl overflow-hidden flex flex-col shadow-lg">
            
            <div className="p-4 bg-[#161925] border-b border-stone-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-stone-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Location: Badami Bagh, Lahore</span>
              </div>
              <span className="text-stone-500">31.6022° N, 74.3218° E</span>
            </div>

            {/* Interactive Google Maps Iframe */}
            <div className="relative w-full h-80 sm:h-96 flex-1 bg-stone-900">
              <iframe
                title="Butt Murgh Channay & Fish Corner Location"
                src="https://maps.google.com/maps?q=Abu+Bakar+Rd+Sadiq+Pura+Badami+Bagh+Lahore&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                className="w-full h-full border-0 filter contrast-125 brightness-90 grayscale-[20%]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />

              {/* Map Floating Overlay Card */}
              <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-xs bg-stone-950/90 backdrop-blur-md border border-stone-700/80 rounded-xl p-3 shadow-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-stone-100">Butt Murgh Channay & Fish</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Abu Bakar Rd, Sadiq Pura, Badami Bagh
                </p>
                <div className="mt-1 text-[10px] text-amber-300 font-medium">
                  Landmark: Badami Bagh General Bus Stand & Railway Station vicinity
                </div>
                <a
                  href={BUSINESS_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition-colors shadow"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate Directly (Google Maps)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
