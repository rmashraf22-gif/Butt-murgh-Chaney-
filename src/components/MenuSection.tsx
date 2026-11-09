import React, { useState } from 'react';
import { Plus, Check, Search, Sparkles, AlertCircle } from 'lucide-react';
import { MenuItem, MenuCategory } from '../data/menuData';

interface MenuSectionProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  cartItemsMap: Record<string, number>;
}

type CategoryFilter = 'all' | MenuCategory;

export const MenuSection: React.FC<MenuSectionProps> = ({
  items,
  onAddToCart,
  cartItemsMap,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItemNotice, setAddedItemNotice] = useState<string | null>(null);

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Items' },
    { id: 'chanay_specials', label: 'Chanay & Specials' },
    { id: 'tandoor', label: 'Tandoor (Breads)' },
    { id: 'fish', label: 'Special Fish' },
    { id: 'sides', label: 'Sides' },
    { id: 'beverages', label: 'Beverages' },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nameUrdu && item.nameUrdu.includes(searchQuery)) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAdd = (item: MenuItem) => {
    if (!item.isAvailable) return;
    onAddToCart(item);
    setAddedItemNotice(item.id);
    setTimeout(() => {
      setAddedItemNotice((current) => (current === item.id ? null : current));
    }, 1200);
  };

  return (
    <section id="menu" className="py-20 bg-[#0c0d10] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold uppercase tracking-widest mb-2">
              <span>Authentic Lahori Menu</span>
              <span aria-hidden="true">·</span>
              <span>Live Cloud Kitchen</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-100 tracking-tight">
              Our Specialties & Menu
            </h2>
            <p className="mt-2 text-sm text-stone-400 max-w-xl">
              Freshly prepared in traditional degs and clay tandoor. Add items to order directly on WhatsApp.
            </p>
          </div>

          {/* Search Box */}
          {items.length > 0 && (
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search channay, fish, naan..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#14161f] border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500/70 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        {items.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                type="button"
                className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap shrink-0 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  activeCategory === cat.id
                    ? 'bg-amber-600 text-stone-950 font-bold shadow-md shadow-amber-950/40'
                    : 'bg-[#14161f] text-stone-400 hover:text-stone-200 hover:bg-[#1a1d28] border border-stone-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Menu Items Grid or 100% Fresh Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-16 bg-[#12141c] border border-stone-800/90 rounded-2xl p-8 space-y-4 max-w-xl mx-auto shadow-xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-stone-100">
                Fresh Daily Menu Loading
              </h3>
              <p className="text-xs text-stone-400 mt-2 max-w-md mx-auto leading-relaxed">
                Hamari rozana ki taaza Murgh Channay aur Fry Machli counter pr tayar ho rahi hai. Live specials ke liye direct counter se rabta karein.
              </p>
            </div>
            <a
              href="https://wa.me/923211115672?text=Salam%20Butt%20Murgh%20Channay!%20Aaj%20ka%20fresh%20menu%20aur%20specials%20bataiye."
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>WhatsApp Daily Specials Inquiry</span>
            </a>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[#12141c] border border-stone-800 rounded-2xl p-8">
            <AlertCircle className="w-10 h-10 text-stone-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-stone-300">No items found</h3>
            <p className="text-xs text-stone-500 mt-1">
              Try searching with another keyword or select "All Items".
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredItems.map((item) => {
              const inCartCount = cartItemsMap[item.id] || 0;
              const isJustAdded = addedItemNotice === item.id;

              return (
                <div
                  key={item.id}
                  className={`group bg-[#13151e] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 hover:-translate-y-1 ${
                    item.isAvailable
                      ? 'border-stone-800/90 hover:border-amber-500/40'
                      : 'border-stone-800/50 opacity-60'
                  }`}
                >
                  {/* Top Image Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback styled background in case of image load failure
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    
                    {/* Fallback pattern underneath if image fails */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-stone-900 to-[#1b1c24] flex items-center justify-center p-6 text-center">
                      <span className="font-serif text-sm text-stone-400">{item.name}</span>
                    </div>

                    {/* Gradient scrim at bottom of image */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#13151e] to-transparent pointer-events-none" />

                    {/* Special or Category Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {item.isSpecial && (
                        <span className="bg-amber-600/95 text-stone-950 font-bold text-[10px] tracking-wide px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Special</span>
                        </span>
                      )}
                      {item.tag && !item.isSpecial && (
                        <span className="bg-stone-900/80 backdrop-blur-md text-amber-300 border border-amber-900/40 text-[10px] px-2 py-0.5 rounded">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    {/* Availability Tag */}
                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-red-950/90 text-red-200 border border-red-800 text-xs font-bold px-3 py-1 rounded-md">
                          Currently Sold Out
                        </span>
                      </div>
                    )}

                    {/* In-Cart Counter Pill */}
                    {inCartCount > 0 && (
                      <div className="absolute top-3 right-3 bg-stone-950/90 text-amber-400 border border-amber-500/40 font-mono text-xs font-bold px-2.5 py-0.5 rounded shadow">
                        {inCartCount} in basket
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-base font-semibold text-stone-100 group-hover:text-amber-300 transition-colors">
                          {item.name}
                        </h3>
                      </div>
                      
                      {item.nameUrdu && (
                        <p className="text-xs text-amber-400/80 font-serif mb-2" dir="rtl">
                          {item.nameUrdu}
                        </p>
                      )}

                      <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed mb-3">
                        {item.description}
                      </p>

                      <div className="text-[11px] text-stone-500 mb-4">
                        {item.serving}
                      </div>
                    </div>

                    {/* Card Price & Action Button */}
                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                            Rs. {item.price}
                          </span>
                          {item.originalPrice && (
                            <span className="text-xs text-stone-500 line-through font-mono tabular-nums">
                              Rs. {item.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdd(item)}
                        disabled={!item.isAvailable}
                        type="button"
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                          !item.isAvailable
                            ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                            : isJustAdded
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inCartCount > 0 ? 'Add More' : 'Order Now'}</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
