import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingBag, Sparkles, ArrowUp, Bell, X } from 'lucide-react';
import {
  collection,
  onSnapshot,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { INITIAL_MENU, MenuItem, BUSINESS_INFO, CustomerOrder, OrderStatus } from './data/menuData';
import {
  playOrderNotificationChime,
  playOrderVoiceAnnouncement,
  playFullOrderAlert,
  showSystemOrderNotification,
} from './utils/audioAlert';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { MenuSection } from './components/MenuSection';
import { ReviewsSection } from './components/ReviewsSection';
import { LocationSection } from './components/LocationSection';
import { CartDrawer, CartItem } from './components/CartDrawer';
import { AdminModal } from './components/AdminModal';
import { Footer } from './components/Footer';

// Clean cache keys
const STORAGE_KEY_MENU = 'butt_restaurant_menu_fresh_v3';
const STORAGE_KEY_CART = 'butt_restaurant_cart_v1';
const PURGE_FLAG_KEY = 'butt_purged_legacy_dishes_v1';

export default function App() {
  // 100% Fresh empty menu initially: dishes will ONLY appear when Admin uploads them
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);

  // Load cart items with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CART);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved cart:', e);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [dailyNotice, setDailyNotice] = useState<string>(() => {
    return (
      localStorage.getItem('butt_daily_notice') ||
      'Fresh Rahu & Kala Fish Available Today at Badami Bagh Counter!'
    );
  });

  // Real-time Live Orders & Notification states
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [latestOrderAlert, setLatestOrderAlert] = useState<CustomerOrder | null>(null);
  const [adminDefaultTab, setAdminDefaultTab] = useState<'orders' | 'menu' | 'add_product' | 'team' | 'security' | 'backups'>('orders');
  const [currentAuthUser, setCurrentAuthUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentAuthUser(user);
    });
    return () => unsub();
  }, []);

  // 1. LIVE FIREBASE FIRESTORE SYNC & PURGE OF ANY PREVIOUS DUMMY/RANDOM DISHES
  useEffect(() => {
    let unsubscribe = () => {};

    const syncFirestoreMenu = async () => {
      try {
        const menuCollectionRef = collection(db, 'menu_items');

        // Check if legacy wipe is needed (removes old pre-seeded or dummy items from Firestore)
        if (!localStorage.getItem(PURGE_FLAG_KEY)) {
          // Clean legacy localStorage keys
          localStorage.removeItem('butt_restaurant_menu_v1');
          localStorage.removeItem('butt_restaurant_menu_v2');
          localStorage.removeItem(STORAGE_KEY_MENU);

          // Delete any existing pre-seeded documents in Firestore menu_items
          const existingSnap = await getDocs(menuCollectionRef);
          if (!existingSnap.empty) {
            const batch = writeBatch(db);
            existingSnap.docs.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
          }

          localStorage.setItem(PURGE_FLAG_KEY, 'true');
          setMenuItems([]);
        }

        // Set up real-time listener for live menu updates
        unsubscribe = onSnapshot(
          menuCollectionRef,
          (liveSnapshot) => {
            // Live snapshot maps docs directly; if empty, sets empty array []
            const items: MenuItem[] = liveSnapshot.docs.map((d) => d.data() as MenuItem);
            setMenuItems(items);
            setIsFirebaseLoaded(true);
          },
          (err) => {
            console.warn('Firestore menu snapshot listener notice:', err);
            // Fallback to local storage if offline
            const localSaved = localStorage.getItem(STORAGE_KEY_MENU);
            if (localSaved) {
              try {
                setMenuItems(JSON.parse(localSaved));
              } catch {
                setMenuItems([]);
              }
            } else {
              setMenuItems([]);
            }
          }
        );
      } catch (err) {
        console.warn('Firebase menu listener error:', err);
        setMenuItems([]);
      }
    };

    syncFirestoreMenu();

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. LIVE FIREBASE SETTINGS (ANNOUNCEMENT) SYNC
  useEffect(() => {
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const unsub = onSnapshot(
        settingsRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.dailyNotice) {
              setDailyNotice(data.dailyNotice);
            }
          }
        },
        (err) => {
          console.warn('Settings listener notice:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Settings listener notice:', e);
    }
  }, []);

  // 3. LIVE REAL-TIME ORDERS LISTENER & KITCHEN NOTIFICATION DISPATCH (Guarded for authorized staff)
  useEffect(() => {
    if (!currentAuthUser) {
      setOrders([]);
      return;
    }

    const userEmail = (currentAuthUser.email || '').toLowerCase();
    const isOwner = userEmail === 'rmashraf22@gmail.com';

    // If not master owner, verify if recognized admin in local team cache
    if (!isOwner) {
      let isTeam = false;
      try {
        const cached = localStorage.getItem('butt_admin_team_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            isTeam = parsed.some((m: any) => m.email?.toLowerCase() === userEmail);
          }
        }
      } catch {}
      if (!isTeam) {
        setOrders([]);
        return;
      }
    }

    let isInitialRun = true;
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveOrders: CustomerOrder[] = snapshot.docs.map(
          (docSnap) => docSnap.data() as CustomerOrder
        );
        setOrders(liveOrders);

        // Detect new order arrival in real time (excluding initial snapshot load)
        if (!isInitialRun) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newOrder = change.doc.data() as CustomerOrder;
              const alertMode = localStorage.getItem('butt_order_alert_mode') || 'voice';

              if (alertMode === 'voice') {
                playOrderVoiceAnnouncement('Order aya hai sahab!');
              } else if (alertMode === 'bell') {
                playOrderNotificationChime();
              } else if (alertMode === 'both') {
                playFullOrderAlert('Order aya hai sahab!');
              }

              // Show mobile lockscreen / desktop system notification
              showSystemOrderNotification(
                newOrder.orderNumber,
                newOrder.customerName,
                newOrder.totalAmount
              );

              setLatestOrderAlert(newOrder);
            }
          });
        }
        isInitialRun = false;
      },
      (err) => {
        console.warn('Orders listener notice:', err);
        setOrders([]);
      }
    );

    return () => unsubscribe();
  }, [currentAuthUser]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await setDoc(doc(db, 'orders', orderId), { status: newStatus }, { merge: true });
    } catch (err) {
      console.error('Failed to update order status in Firestore:', err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err) {
      console.error('Failed to delete order from Firestore:', err);
    }
  };

  const handleOpenOrdersAdmin = () => {
    setAdminDefaultTab('orders');
    setIsAdminOpen(true);
    setLatestOrderAlert(null);
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    // Clean up URL route or hash back to root without reloading page
    if (
      window.location.hash.toLowerCase().includes('admin') ||
      window.location.pathname.toLowerCase().endsWith('/admin') ||
      window.location.search.toLowerCase().includes('admin')
    ) {
      window.history.replaceState(null, '', '/');
    }
  };

  // Professional Admin Panel Triggers:
  // Direct URL Routes: #admin, /admin, ?admin=1 (Works seamlessly in dev, preview, and on Vercel deployment)
  useEffect(() => {
    const handleCheckUrl = () => {
      const hash = (window.location.hash || '').toLowerCase();
      const pathname = (window.location.pathname || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();

      if (
        hash === '#admin' ||
        hash === '#/admin' ||
        pathname === '/admin' ||
        pathname.endsWith('/admin') ||
        search.includes('admin=true') ||
        search.includes('admin=1')
      ) {
        setAdminDefaultTab('orders');
        setIsAdminOpen(true);
      }
    };

    handleCheckUrl();
    window.addEventListener('hashchange', handleCheckUrl);
    window.addEventListener('popstate', handleCheckUrl);

    return () => {
      window.removeEventListener('hashchange', handleCheckUrl);
      window.removeEventListener('popstate', handleCheckUrl);
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart:', e);
    }
  }, [cart]);

  // Save menu to localStorage as backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MENU, JSON.stringify(menuItems));
    } catch (e) {
      console.error('Failed to save menu backup:', e);
    }
  }, [menuItems]);

  // Scroll to top indicator
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Live Admin operations with Firebase persistence
  const handleSaveMenuItems = async (updated: MenuItem[]) => {
    // Determine deleted items
    const updatedIds = new Set(updated.map((i) => i.id));
    const deletedItems = menuItems.filter((i) => !updatedIds.has(i.id));

    // Update local state immediately
    setMenuItems(updated);

    // Save to Firestore in real-time
    try {
      const batch = writeBatch(db);

      // Upsert updated/added items
      updated.forEach((item) => {
        const itemRef = doc(db, 'menu_items', item.id);
        // Defensively sanitize item to prevent FirebaseError on undefined fields
        const cleanItem: Record<string, any> = {};
        Object.entries(item).forEach(([key, val]) => {
          if (val !== undefined) {
            cleanItem[key] = val;
          }
        });
        batch.set(itemRef, cleanItem);
      });

      // Delete removed items
      deletedItems.forEach((del) => {
        const delRef = doc(db, 'menu_items', del.id);
        batch.delete(delRef);
      });

      // Update notice setting
      const noticeToSave = localStorage.getItem('butt_daily_notice') || dailyNotice;
      const settingsRef = doc(db, 'settings', 'general');
      batch.set(settingsRef, { dailyNotice: noticeToSave }, { merge: true });

      await batch.commit();
    } catch (err) {
      console.error('Failed to commit menu changes to Firestore:', err);
    }
  };

  const handleResetDefaults = async () => {
    // Completely wipe all items for a 100% fresh start
    localStorage.removeItem(STORAGE_KEY_MENU);
    localStorage.removeItem('butt_daily_notice');
    setMenuItems([]);
    setDailyNotice('Fresh Rahu & Kala Fish Available Today at Badami Bagh Counter!');

    try {
      const snapshot = await getDocs(collection(db, 'menu_items'));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.error('Resetting Firestore menu error:', e);
    }
  };

  // Cart summary
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Map of cart quantities for quick badge lookups
  const cartItemsMap = cart.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.item.id] = curr.quantity;
    return acc;
  }, {});

  // Spotlight items only if products exist
  const specialItem = menuItems.length > 0 ? (
    menuItems.find((i) => i.isSpecial) ||
    menuItems.find((i) => i.id === 'signature-murgh-channay') ||
    menuItems[0]
  ) : undefined;

  const fishItem = menuItems.length > 1 ? (
    menuItems.find((i) => i.category === 'fish' && i.id !== specialItem?.id) ||
    menuItems.find((i) => i.id !== specialItem?.id)
  ) : undefined;

  const scrollToMenu = () => {
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f4efe6] selection:bg-amber-500 selection:text-black flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      
      {/* Top Slim Announcement Banner */}
      <aside aria-label="Announcement" className="w-full max-w-full overflow-hidden bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 text-stone-950 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-center tracking-wide flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[280px] xs:max-w-md sm:max-w-xl">{dailyNotice}</span>
        <span aria-hidden="true" className="hidden sm:inline">·</span>
        <a
          href={`https://wa.me/${BUSINESS_INFO.whatsappRaw}`}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline underline decoration-stone-950/40 hover:text-black font-bold whitespace-nowrap"
        >
          WhatsApp: {BUSINESS_INFO.phone}
        </a>
      </aside>

      {/* Sticky 3-Zone Navigation Bar */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        pendingOrdersCount={orders.filter((o) => o.status === 'pending').length}
        onOpenOrders={handleOpenOrdersAdmin}
      />

      {/* Real-time Kitchen Order Notification Alert Toast */}
      {latestOrderAlert && (
        <aside
          aria-label="New Order Alert"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-[#161825]/95 backdrop-blur-md border border-amber-500/80 rounded-2xl p-4 shadow-2xl shadow-black text-stone-100 flex flex-col gap-2.5 animate-fade-in"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Bell className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block flex items-center gap-1">
                  <span>🗣️ "Order aya ha sahb!"</span>
                </span>
                <h4 className="text-sm font-bold text-stone-100">
                  #{latestOrderAlert.orderNumber} · {latestOrderAlert.customerName}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setLatestOrderAlert(null)}
              className="text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-stone-300 bg-[#0e1017] p-2.5 rounded-xl border border-stone-800 space-y-1">
            <div className="truncate font-medium text-stone-200">
              {latestOrderAlert.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
            </div>
            <div className="flex justify-between items-center text-[11px] text-stone-400 pt-0.5">
              <span className="capitalize font-medium text-stone-300">
                {latestOrderAlert.orderType} (COD)
              </span>
              <span className="font-mono font-bold text-amber-400">
                Rs. {latestOrderAlert.totalAmount.toLocaleString()}
              </span>
            </div>
            {latestOrderAlert.customerGpsMapUrl && (
              <a
                href={latestOrderAlert.customerGpsMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 flex items-center justify-center gap-1.5 py-1 px-2 bg-emerald-950 border border-emerald-700/80 text-emerald-300 text-[11px] rounded-lg font-semibold hover:bg-emerald-900 transition-colors"
              >
                <span>📍 View Customer Live GPS Pin</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenOrdersAdmin}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow transition-colors text-center cursor-pointer"
            >
              Open Kitchen Console
            </button>
            <button
              type="button"
              onClick={() => setLatestOrderAlert(null)}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs rounded-xl transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </aside>
      )}

      {/* Main Page Content */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* 1. Hero Section */}
        <HeroSection
          onExploreMenu={scrollToMenu}
          onQuickOrder={(item) => {
            handleAddToCart(item);
            setIsCartOpen(true);
          }}
          specialItem={specialItem}
          fishItem={fishItem}
        />

        {/* 2. About Us / Heritage Story Section */}
        <AboutSection />

        {/* 3. Interactive Menu Grid with Category Filters & Search */}
        <MenuSection
          items={menuItems}
          onAddToCart={handleAddToCart}
          cartItemsMap={cartItemsMap}
        />

        {/* 4. Live Customer Reviews & Star ⭐ Rating System (Connected to Live Firebase Firestore) */}
        <ReviewsSection menuItems={menuItems} />

        {/* 5. Location, Operating Hours & Contact */}
        <LocationSection />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Cart & WhatsApp Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Professional Admin Security Console (Triggered via #admin URL, Ctrl+Shift+A, or 5 logo taps) */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        menuItems={menuItems}
        onSaveMenuItems={handleSaveMenuItems}
        onResetDefaults={handleResetDefaults}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        defaultTab={adminDefaultTab}
      />

      {/* Floating Action Controls */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Scroll To Top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            type="button"
            aria-label="Scroll back to top"
            className="w-10 h-10 rounded-full bg-stone-900/90 hover:bg-stone-850 text-stone-300 hover:text-amber-400 border border-stone-800 shadow-lg flex items-center justify-center transition-all pointer-events-auto active:scale-95 focus:outline-none cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        {/* Cart Quick Toggle Pill if items in basket */}
        {totalCartCount > 0 && (
          <button
            onClick={() => setIsCartOpen(true)}
            type="button"
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-full shadow-2xl shadow-black border border-amber-400/40 transition-transform active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-stone-950" />
            <span>View Basket ({totalCartCount})</span>
          </button>
        )}

        {/* Floating WhatsApp Action Button with Pulsing Notification Badge */}
        <div className="relative pointer-events-auto">
          {/* Pulsing ring animation */}
          <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-60 animate-ping pointer-events-none" />

          <a
            href={`https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encodeURIComponent('Salam Butt Murgh Channay & Fish Corner! I would like to order fresh food.')}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Direct WhatsApp Order Button"
            className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-full shadow-2xl shadow-emerald-950/80 transition-transform active:scale-95 border-2 border-emerald-400/30 group cursor-pointer"
          >
            <MessageCircle className="w-7 h-7 fill-white text-white transition-transform group-hover:scale-110" />

            {/* Pulsing Unread Notification Badge */}
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-stone-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0c0d10] font-mono shadow">
              1
            </span>
          </a>
        </div>

      </div>

    </div>
  );
}
