import React from 'react';
import { Phone, MapPin, Clock, MessageCircle, Heart } from 'lucide-react';
import { BUSINESS_INFO } from '../data/menuData';

interface FooterProps {}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-[#090a0d] text-stone-400 border-t border-stone-800/80 pt-16 pb-24 lg:pb-12 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center font-serif font-black text-stone-950 text-lg">
                B
              </div>
              <span className="font-serif font-bold text-base text-stone-100 block">
                Butt Murgh Channay & Fish
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed text-xs">
              Authentic Lahori heritage cooking in Badami Bagh. Made with 100% pure desi ghee, freshly ground spices, and fresh river Rahu fish daily.
            </p>
            <div className="text-[11px] text-amber-400/90 font-medium">
              100% Halal Certified Kitchen
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-200 text-sm">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <a href="#menu" className="hover:text-amber-400 transition-colors">
                  Signature Menu & Prices
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-amber-400 transition-colors">
                  Our Badami Bagh Story
                </a>
              </li>
              <li>
                <a href="#reviews" className="hover:text-amber-400 transition-colors">
                  Foodie Reviews & Ratings
                </a>
              </li>
              <li>
                <a href="#location" className="hover:text-amber-400 transition-colors">
                  Find Our Location
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Timings & Counter */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-200 text-sm">Kitchen Hours</h4>
            <div className="space-y-2 text-stone-400">
              <div>
                <span className="text-stone-200 font-medium block">Breakfast Service</span>
                <span>6:00 AM – 1:30 PM (Daily)</span>
              </div>
              <div>
                <span className="text-stone-200 font-medium block">Evening Fish & Dinner</span>
                <span>4:00 PM – 12:00 AM Midnight</span>
              </div>
            </div>
          </div>

          {/* Column 4: Contact & Hotlines */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-200 text-sm">Direct Contact</h4>
            <div className="space-y-2 text-stone-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <a
                  href={BUSINESS_INFO.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-300 transition-colors"
                  title="Open exact restaurant location in Google Maps"
                >
                  {BUSINESS_INFO.address}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${BUSINESS_INFO.phone.replace(/\s+/g, '')}`} className="hover:text-amber-300 font-mono">
                  {BUSINESS_INFO.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${BUSINESS_INFO.whatsappRaw}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-300 font-mono"
                >
                  WhatsApp Ordering Available
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500">
          <div>
            © {new Date().getFullYear()} Butt Murgh Channay & Fish Corner. All rights reserved.
          </div>

          <div className="flex items-center gap-3 text-[11px] text-stone-500">
            <span>Crafted with pride in Lahore</span>
            <span aria-hidden="true">·</span>
            <span>Badami Bagh Tradition</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
