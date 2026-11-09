import React, { useState } from 'react';
import { ShoppingBag, Phone, Menu as MenuIcon, X, Bell } from 'lucide-react';
import { BUSINESS_INFO } from '../data/menuData';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  pendingOrdersCount?: number;
  onOpenOrders?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  pendingOrdersCount = 0,
  onOpenOrders,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0d10]/95 backdrop-blur-md border-b border-amber-950/40 transition-colors w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4 md:gap-8 w-full">
          
          {/* Zone 1: Brand title, single line wordmark */}
          <div className="flex items-center min-w-0 flex-1 sm:flex-initial">
            <button
              onClick={handleLogoClick}
              type="button"
              title="Butt Murgh Channay & Fish Corner"
              className="flex items-center gap-2.5 sm:gap-3 text-left transition-transform active:scale-95 group focus:outline-none rounded-lg p-1 min-w-0 cursor-pointer"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center shadow-lg shadow-amber-950/60 border border-amber-500/30 shrink-0 relative overflow-hidden">
                <span className="font-serif font-black text-lg sm:text-xl text-amber-100 tracking-tighter">B</span>
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base md:text-lg font-serif font-bold tracking-tight text-stone-100 block truncate max-w-[145px] xs:max-w-[185px] sm:max-w-none">
                  Butt Murgh Channay
                </span>
                <span className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium tracking-wider block truncate">
                  Badami Bagh, Lahore
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-300">
            <a href="#menu" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
              Menu & Specials
            </a>
            <a href="#about" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
              Heritage Story
            </a>
            <a href="#reviews" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
              Customer Reviews
            </a>
            <a href="#location" className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0">
              Location & Timings
            </a>
          </nav>

          {/* Zone 3: Actions (Hotline call, Kitchen orders badge if active, Order Basket, Hamburger) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href={`tel:${BUSINESS_INFO.phone.replace(/\s+/g, '')}`}
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-300 hover:text-amber-300 transition-colors"
              title="Call Badami Bagh counter directly"
            >
              <Phone className="w-4 h-4 text-amber-400" />
              <span className="font-mono tabular-nums">{BUSINESS_INFO.phone}</span>
            </a>

            {pendingOrdersCount > 0 && onOpenOrders && (
              <button
                onClick={onOpenOrders}
                type="button"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-950/80 border border-red-700/80 hover:bg-red-900 text-red-200 text-xs font-semibold rounded-lg shadow-md animate-pulse cursor-pointer transition-colors shrink-0"
                title={`${pendingOrdersCount} New Kitchen Orders`}
              >
                <Bell className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                <span className="hidden sm:inline">Orders</span>
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
                  {pendingOrdersCount}
                </span>
              </button>
            )}

            {/* Customer Order Basket Drawer Trigger */}
            <button
              onClick={onOpenCart}
              type="button"
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-semibold text-xs sm:text-sm rounded-lg shadow-md shadow-amber-950/40 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 cursor-pointer"
              title="View Order Basket"
            >
              <ShoppingBag className="w-4 h-4 text-stone-950 shrink-0" />
              <span className="hidden xs:inline">Basket</span>
              {cartCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-bold bg-stone-950 text-amber-400 rounded-md font-mono tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile menu hamburger toggle: positioned comfortably inside the right margin */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 text-stone-300 hover:text-amber-400 active:text-white rounded-lg focus:outline-none shrink-0 cursor-pointer transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111318] border-b border-stone-800 px-4 pt-3 pb-5 space-y-3">
          <a
            href="#menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-200 hover:text-amber-400 rounded-md transition-colors"
          >
            Menu & Specials
          </a>
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-200 hover:text-amber-400 rounded-md transition-colors"
          >
            Heritage Story
          </a>
          <a
            href="#reviews"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-200 hover:text-amber-400 rounded-md transition-colors"
          >
            Customer Reviews
          </a>
          <a
            href="#location"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-stone-200 hover:text-amber-400 rounded-md transition-colors"
          >
            Location & Timings
          </a>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400 px-3">
            <span>Direct Counter Hotline:</span>
            <a
              href={`tel:${BUSINESS_INFO.phone.replace(/\s+/g, '')}`}
              className="text-amber-400 font-mono font-medium"
            >
              {BUSINESS_INFO.phone}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
