import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  ShieldCheck,
  Check,
  RotateCcw,
  Save,
  AlertCircle,
  KeyRound,
  UtensilsCrossed,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Bell,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  Printer,
  Copy,
  Clock,
  Bike,
  ShoppingBag,
  ExternalLink,
  Search,
  Users,
  UserPlus,
  Shield,
  Smartphone,
  MapPin,
  Mail,
  Mic,
  Database,
  Download,
  FileSpreadsheet,
  RefreshCw,
  HardDrive,
  LogOut,
  CheckCircle2,
  UserCheck,
  Cloud,
} from 'lucide-react';
import { MenuItem, MenuCategory, CustomerOrder, OrderStatus, BUSINESS_INFO, AdminUser } from '../data/menuData';
import {
  playOrderNotificationChime,
  playOrderVoiceAnnouncement,
  playFullOrderAlert,
  requestSystemNotificationPermission,
} from '../utils/audioAlert';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const MASTER_OWNER_EMAIL = 'rmashraf22@gmail.com';
const STORAGE_KEY_ADMIN_PASSWORD = 'butt_admin_password';
const DEFAULT_ADMIN_PASSWORD = 'admin21';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSaveMenuItems: (updatedItems: MenuItem[]) => void;
  onResetDefaults: () => void;
  orders?: CustomerOrder[];
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => Promise<void> | void;
  onDeleteOrder?: (orderId: string) => Promise<void> | void;
  defaultTab?: 'orders' | 'menu' | 'add_product' | 'team' | 'security' | 'backups';
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onSaveMenuItems,
  onResetDefaults,
  orders = [],
  onUpdateOrderStatus,
  onDeleteOrder,
  defaultTab = 'orders',
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Real Firebase Auth state
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  // Active navigation tab inside authenticated console: 'orders' | 'menu' | 'add_product' | 'team' | 'security' | 'backups'
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'add_product' | 'team' | 'security' | 'backups'>('orders');

  // Database Backups & Snapshots state
  const [cloudBackups, setCloudBackups] = useState<Array<{
    id: string;
    createdAt: number;
    createdAtFormatted: string;
    createdBy: string;
    menuCount: number;
    ordersCount: number;
    payloadJson: string;
  }>>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupRestorePreview, setBackupRestorePreview] = useState<{
    fileName: string;
    menuItems: MenuItem[];
    orders: CustomerOrder[];
    settings?: any;
  } | null>(null);

  // Admin Team & Multi-User Authorization
  const [adminTeam, setAdminTeam] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem('butt_admin_team_cache');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'admin-owner-default',
        name: 'Master Owner (Butt Sahib)',
        email: MASTER_OWNER_EMAIL,
        role: 'owner',
        receiveNotification: true,
        addedAt: '2025-01-01',
      },
    ];
  });
  const [loggedInAdmin, setLoggedInAdmin] = useState<AdminUser | null>(null);

  // New Admin creation inputs
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'owner' | 'manager' | 'dispatcher' | 'kitchen_staff'>('manager');
  const [newAdminNotify, setNewAdminNotify] = useState(true);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [teamActionNotice, setTeamActionNotice] = useState<string | null>(null);

  // Sound & Voice Alert Mode: 'voice' ("Order aya hai sahab!"), 'bell', 'both', 'muted'
  const [alertMode, setAlertMode] = useState<'voice' | 'bell' | 'both' | 'muted'>(() => {
    return (localStorage.getItem('butt_order_alert_mode') as 'voice' | 'bell' | 'both' | 'muted') || 'voice';
  });

  // Mobile / Desktop System Notification Permission state
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  // Menu items state
  const [draftItems, setDraftItems] = useState<MenuItem[]>(menuItems);
  const [dailyNotice, setDailyNotice] = useState<string>(() => {
    return (
      localStorage.getItem('butt_daily_notice') ||
      'Fresh winter Rahu & Kala fish available today at Badami Bagh counter!'
    );
  });

  // Password management states
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // New Product Form state
  const [newDishName, setNewDishName] = useState('');
  const [newDishNameUrdu, setNewDishNameUrdu] = useState('');
  const [newDishCategory, setNewDishCategory] = useState<MenuCategory>('chanay_specials');
  const [newDishPrice, setNewDishPrice] = useState<string>('');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishServing, setNewDishServing] = useState('');
  const [newDishImageUrl, setNewDishImageUrl] = useState('');
  const [newDishIsSpecial, setNewDishIsSpecial] = useState(false);
  const [imagePreviewName, setImagePreviewName] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [addProductSuccess, setAddProductSuccess] = useState(false);

  // In-app delete confirmation state (replaces window.confirm)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Editing state for existing item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editServing, setEditServing] = useState('');
  const [editImage, setEditImage] = useState('');
  const [isProcessingEditImage, setIsProcessingEditImage] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Preset image choices
  const PRESET_IMAGES = [
    { label: 'Murgh Channay', url: '/src/assets/images/dish_murgh_channay_1793753248807.jpg' },
    { label: 'Crispy Rahu Fish', url: '/src/assets/images/dish_crispy_fish_1793753250155.jpg' },
    { label: 'Tandoori Roghni Naan', url: '/src/assets/images/dish_breakfast_spread_1793753250404.jpg' },
    { label: 'Lahori Royal Feast', url: '/src/assets/images/hero_lahori_feast_1793753249117.jpg' },
  ];

  // Helper to retrieve current configured admin password
  const getStoredPassword = (): string => {
    return localStorage.getItem(STORAGE_KEY_ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;
  };

  // Orders management states
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('butt_kitchen_sound_enabled') !== 'false';
  });
  const [deleteOrderConfirmId, setDeleteOrderConfirmId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
    const q = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.toLowerCase().includes(q) ||
      (order.deliveryAddress && order.deliveryAddress.toLowerCase().includes(q)) ||
      order.items.some((it) => it.name.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  const handlePrintSlip = (order: CustomerOrder) => {
    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT - Order #${order.orderNumber}</title>
          <style>
            body { font-family: monospace; padding: 16px; font-size: 13px; color: #000; line-height: 1.4; margin: 0; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .title { font-size: 15px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center title">BUTT MURGH CHANNAY & FISH</div>
          <div class="center" style="font-size: 11px;">Badami Bagh, Lahore | 0321 1115672</div>
          <div class="divider"></div>
          <div class="row"><span class="bold">ORDER: #${order.orderNumber}</span><span>${order.formattedTime}</span></div>
          <div class="row"><span class="bold">TYPE:</span><span class="bold" style="text-transform:uppercase;">${order.orderType}</span></div>
          <div class="row"><span>Customer:</span><span class="bold">${order.customerName}</span></div>
          <div class="row"><span>Phone:</span><span class="bold" style="font-size: 14px;">${order.customerPhone}</span></div>
          ${order.deliveryAddress ? `<div style="margin-top:4px; padding:6px; border:1px solid #000; background:#f9f9f9;"><span class="bold">DELIVERY ADDRESS:</span><br/>${order.deliveryAddress}</div>` : ''}
          ${order.specialInstructions ? `<div style="margin-top:4px; font-style:italic;"><span class="bold">Kitchen Note:</span> ${order.specialInstructions}</div>` : ''}
          <div class="divider"></div>
          <div class="bold" style="margin-bottom: 4px;">KITCHEN ITEMS:</div>
          ${order.items
            .map(
              (it) => `
            <div class="row">
              <span>${it.quantity}x ${it.name}</span>
              <span>Rs. ${(it.price * it.quantity).toLocaleString()}</span>
            </div>
          `
            )
            .join('')}
          <div class="divider"></div>
          <div class="row"><span>Subtotal:</span><span>Rs. ${order.subtotal.toLocaleString()}</span></div>
          ${order.deliveryFee > 0 ? `<div class="row"><span>Delivery:</span><span>Rs. ${order.deliveryFee}</span></div>` : ''}
          <div class="row bold" style="font-size: 14px; margin-top: 4px;">
            <span>TOTAL (COD):</span>
            <span>Rs. ${order.totalAmount.toLocaleString()}</span>
          </div>
          <div class="divider"></div>
          <div class="center" style="font-size: 11px;">*** Live Kitchen Order Ticket (KOT) ***</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Sync draft when items change or modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftItems(menuItems);
      setSavedSuccess(false);
      setPasswordChangeMessage(null);
      setAddProductSuccess(false);
      setEditingItemId(null);
      setDeleteConfirmId(null);
      setDeleteOrderConfirmId(null);
      if (defaultTab) {
        setActiveTab(defaultTab);
      }
    }
  }, [isOpen, menuItems, defaultTab]);

  // Listen for Live Admin Team updates from Firestore doc(db, 'settings', 'admin_team')
  useEffect(() => {
    try {
      const unsub = onSnapshot(
        doc(db, 'settings', 'admin_team'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data?.members) && data.members.length > 0) {
              setAdminTeam(data.members);
              localStorage.setItem('butt_admin_team_cache', JSON.stringify(data.members));
            }
          }
        },
        (err) => {
          console.warn('Admin team sync notice:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Admin team sync notice:', e);
    }
  }, []);

  const handleSaveAdminTeamToFirestore = async (updatedTeam: AdminUser[]) => {
    setAdminTeam(updatedTeam);
    localStorage.setItem('butt_admin_team_cache', JSON.stringify(updatedTeam));
    try {
      await setDoc(doc(db, 'settings', 'admin_team'), { members: updatedTeam }, { merge: true });
    } catch (e) {
      console.error('Failed to sync admin team to Firestore:', e);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      setTeamActionNotice('Please provide admin name and Google account email.');
      return;
    }

    const emailClean = newAdminEmail.trim().toLowerCase();
    const existing = adminTeam.find((a) => a.email.toLowerCase() === emailClean);
    if (existing) {
      setTeamActionNotice('An admin with this email is already authorized.');
      return;
    }

    const newMember: AdminUser = {
      id: `admin-${Date.now()}`,
      name: newAdminName.trim(),
      email: emailClean,
      role: newAdminRole,
      receiveNotification: newAdminNotify,
      addedAt: new Date().toISOString().split('T')[0],
      pin: newAdminPin.trim() || undefined,
    };

    const updated = [...adminTeam, newMember];
    await handleSaveAdminTeamToFirestore(updated);
    setNewAdminName('');
    setNewAdminEmail('');
    setNewAdminPin('');
    setTeamActionNotice(`✅ ${newMember.name} successfully authorized as ${newMember.role.toUpperCase()}!`);
    setTimeout(() => setTeamActionNotice(null), 3000);
  };

  const handleRemoveAdmin = async (adminId: string) => {
    const updated = adminTeam.filter((a) => a.id !== adminId);
    await handleSaveAdminTeamToFirestore(updated);
    setTeamActionNotice('Admin removed from authorized list.');
    setTimeout(() => setTeamActionNotice(null), 2500);
  };

  const handleToggleAdminNotification = async (adminId: string) => {
    const updated = adminTeam.map((a) =>
      a.id === adminId ? { ...a, receiveNotification: !a.receiveNotification } : a
    );
    await handleSaveAdminTeamToFirestore(updated);
  };

  const handleSetAlertMode = (mode: 'voice' | 'bell' | 'both' | 'muted') => {
    setAlertMode(mode);
    localStorage.setItem('butt_order_alert_mode', mode);
    localStorage.setItem('butt_kitchen_sound_enabled', mode === 'muted' ? 'false' : 'true');
    if (mode === 'voice') {
      playOrderVoiceAnnouncement('Order aya hai sahab!');
    } else if (mode === 'bell') {
      playOrderNotificationChime();
    } else if (mode === 'both') {
      playFullOrderAlert('Order aya hai sahab!');
    }
  };

  const handleEnableNotifications = async () => {
    const perm = await requestSystemNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      setActionNotice('✅ Mobile & Background Lockscreen notifications enabled!');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentFirebaseUser(user);
      if (user && user.email) {
        const userEmail = user.email.toLowerCase();
        const isOwner = userEmail === MASTER_OWNER_EMAIL.toLowerCase();
        const isTeam = adminTeam.some((m) => m.email.toLowerCase() === userEmail);
        if (isOwner || isTeam) {
          setIsAuthenticated(true);
          setLoggedInAdmin({
            id: user.uid,
            name: user.displayName || (isOwner ? 'Master Owner' : 'Authorized Manager'),
            email: userEmail,
            role: isOwner ? 'owner' : 'manager',
            receiveNotification: true,
            addedAt: new Date().toISOString(),
          });
          // Ensure admin record in Firestore for server rules
          try {
            await setDoc(
              doc(db, 'admins', user.uid),
              {
                uid: user.uid,
                email: userEmail,
                name: user.displayName || (isOwner ? 'Master Owner' : 'Authorized Manager'),
                role: isOwner ? 'owner' : 'manager',
                photoURL: user.photoURL || '',
                lastSeen: Date.now(),
              },
              { merge: true }
            );
          } catch (e) {
            console.warn('Sync admin doc notice:', e);
          }
        }
      }
    });
    return () => unsub();
  }, [adminTeam]);

  // Listen to cloud backups from Firestore (only when authenticated with real Firebase credentials)
  useEffect(() => {
    if (!isAuthenticated || !currentFirebaseUser) return;
    try {
      const unsub = onSnapshot(
        collection(db, 'backups'),
        (snap) => {
          const items = snap.docs.map((d) => d.data() as any);
          items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          setCloudBackups(items);
        },
        (err) => {
          console.warn('Backups listener notice:', err);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Backups listener notice:', e);
    }
  }, [isAuthenticated, currentFirebaseUser]);

  // Real Google Sign-In with Firebase Authentication
  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true);
    setAuthErrorMessage(null);
    setPasswordError(false);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;
      const userEmail = (user.email || '').toLowerCase();
      const isOwner = userEmail === MASTER_OWNER_EMAIL.toLowerCase();
      const isTeam = adminTeam.some((m) => m.email.toLowerCase() === userEmail);

      if (isOwner || isTeam) {
        try {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              uid: user.uid,
              email: userEmail,
              name: user.displayName || (isOwner ? 'Master Owner' : 'Authorized Manager'),
              role: isOwner ? 'owner' : 'manager',
              photoURL: user.photoURL || '',
              lastLoginAt: Date.now(),
            },
            { merge: true }
          );
        } catch (e) {
          console.warn('Admin record sync notice:', e);
        }

        setIsAuthenticated(true);
        setLoggedInAdmin({
          id: user.uid,
          name: user.displayName || (isOwner ? 'Master Owner' : 'Authorized Manager'),
          email: userEmail,
          role: isOwner ? 'owner' : 'manager',
          receiveNotification: true,
          addedAt: new Date().toISOString(),
        });
        setActionNotice(`✅ Authenticated via Google as ${user.displayName || userEmail} (${isOwner ? 'OWNER' : 'MANAGER'})`);
        setTimeout(() => setActionNotice(null), 3500);
      } else {
        await signOut(auth);
        setAuthErrorMessage(`Access Denied: The Google Account "${userEmail}" is not authorized on the restaurant admin team. Please sign in with the owner account (${MASTER_OWNER_EMAIL}) or ask the owner to add your email.`);
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setAuthErrorMessage('Sign-in popup was closed before completing. Please try again.');
      } else {
        setAuthErrorMessage(err?.message || 'Google Sign-in failed. Please retry.');
      }
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setIsAuthenticated(false);
    setLoggedInAdmin(null);
    setPasswordInput('');
    setActionNotice('Signed out of admin session successfully.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const activePassword = getStoredPassword();
    const input = passwordInput.trim();

    // 1. Check Master Password
    if (input === activePassword) {
      setIsAuthenticated(true);
      setLoggedInAdmin({
        id: 'master-owner',
        name: 'Master Owner (Butt Sahib)',
        email: MASTER_OWNER_EMAIL,
        role: 'owner',
        receiveNotification: true,
        addedAt: '2025-01-01',
      });
      setPasswordError(false);
      setActionNotice('Logged in via Master Credential');
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    // 2. Check Authorized Admin Google Account Email or PIN
    const matchedAdmin = adminTeam.find(
      (m) =>
        m.email.toLowerCase() === input.toLowerCase() ||
        (m.pin && m.pin === input)
    );

    if (matchedAdmin) {
      setIsAuthenticated(true);
      setLoggedInAdmin(matchedAdmin);
      setPasswordError(false);
      setActionNotice(`Logged in as ${matchedAdmin.name} (${matchedAdmin.role.toUpperCase()})`);
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    setPasswordError(true);
  };

  // Full Database JSON Export (Dishes, Orders, Settings, Admins)
  const handleExportDatabaseJson = async () => {
    try {
      setIsBackingUp(true);
      const menuSnap = await getDocs(collection(db, 'menu_items'));
      const liveMenu = menuSnap.docs.map((d) => d.data() as MenuItem);
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const liveOrders = ordersSnap.docs.map((d) => d.data() as CustomerOrder);
      const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : { dailyNotice };
      const adminSnap = await getDocs(collection(db, 'admins'));
      const adminDocs = adminSnap.docs.map((d) => d.data());

      const backupPayload = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        exportedTimestamp: Date.now(),
        exportedBy: auth.currentUser?.email || loggedInAdmin?.email || 'admin',
        restaurant: 'Butt Murgh Channay & Fish Corner',
        location: 'Badami Bagh, Lahore',
        securityStatus: 'Server-Side Authorization (RBAC) Active',
        counts: {
          menuItems: liveMenu.length,
          orders: liveOrders.length,
          admins: adminDocs.length,
        },
        data: {
          menu_items: liveMenu,
          orders: liveOrders,
          settings: settingsData,
          admins: adminDocs,
        },
      };

      const jsonStr = JSON.stringify(backupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `butt-restaurant-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionNotice('✅ Full database JSON backup downloaded successfully!');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      console.error('Export backup failed:', err);
      setActionNotice('❌ Export failed: ' + (err.message || 'Error'));
    } finally {
      setIsBackingUp(false);
    }
  };

  // Create Cloud Snapshot in Firestore /backups
  const handleCreateCloudSnapshot = async () => {
    try {
      setIsBackingUp(true);
      const menuSnap = await getDocs(collection(db, 'menu_items'));
      const liveMenu = menuSnap.docs.map((d) => d.data() as MenuItem);
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const liveOrders = ordersSnap.docs.map((d) => d.data() as CustomerOrder);
      const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : { dailyNotice };

      const backupPayload = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        exportedTimestamp: Date.now(),
        exportedBy: auth.currentUser?.email || loggedInAdmin?.email || 'admin',
        restaurant: 'Butt Murgh Channay & Fish Corner',
        counts: {
          menuItems: liveMenu.length,
          orders: liveOrders.length,
        },
        data: {
          menu_items: liveMenu,
          orders: liveOrders,
          settings: settingsData,
        },
      };

      const backupId = 'snap_' + Date.now();
      await setDoc(doc(db, 'backups', backupId), {
        id: backupId,
        createdAt: Date.now(),
        createdAtFormatted: new Date().toLocaleString(),
        createdBy: auth.currentUser?.email || loggedInAdmin?.email || 'admin',
        menuCount: liveMenu.length,
        ordersCount: liveOrders.length,
        payloadJson: JSON.stringify(backupPayload),
      });

      setActionNotice('✅ Cloud snapshot backup saved to Firestore successfully!');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      console.error('Cloud snapshot failed:', err);
      setActionNotice('❌ Cloud snapshot failed: ' + (err.message || 'Permission denied'));
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle File Select for Restore
  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || !parsed.data) {
          alert('Invalid backup file. Must be a valid Butt Restaurant JSON backup.');
          return;
        }
        setBackupRestorePreview({
          fileName: file.name,
          menuItems: parsed.data.menu_items || [],
          orders: parsed.data.orders || [],
          settings: parsed.data.settings,
        });
      } catch {
        alert('Error parsing JSON backup file. Please ensure it is a valid file.');
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore to Firestore
  const handleExecuteRestore = async () => {
    if (!backupRestorePreview) return;
    try {
      setIsRestoring(true);
      const batch = writeBatch(db);

      if (backupRestorePreview.menuItems && backupRestorePreview.menuItems.length > 0) {
        backupRestorePreview.menuItems.forEach((dish) => {
          batch.set(doc(db, 'menu_items', dish.id), dish);
        });
        setDraftItems(backupRestorePreview.menuItems);
        onSaveMenuItems(backupRestorePreview.menuItems);
      }

      if (backupRestorePreview.settings?.dailyNotice) {
        batch.set(doc(db, 'settings', 'general'), { dailyNotice: backupRestorePreview.settings.dailyNotice }, { merge: true });
        setDailyNotice(backupRestorePreview.settings.dailyNotice);
      }

      await batch.commit();
      setActionNotice(`✅ Database restored successfully! (${backupRestorePreview.menuItems.length} dishes restored)`);
      setBackupRestorePreview(null);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.error('Restore failed:', err);
      setActionNotice('❌ Restore failed: ' + (err.message || 'Server permission denied'));
    } finally {
      setIsRestoring(false);
    }
  };

  // Export Orders to CSV (Spreadsheet)
  const handleExportOrdersCsv = () => {
    if (orders.length === 0) {
      alert('No orders available to export.');
      return;
    }
    const headers = ['Order Number', 'Date & Time', 'Customer Name', 'Phone', 'Address', 'Order Type', 'Status', 'Items Breakdown', 'Subtotal (PKR)', 'Delivery (PKR)', 'Total Amount (PKR)'];
    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.formattedTime}"`,
      `"${o.customerName.replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${(o.deliveryAddress || '').replace(/"/g, '""')}"`,
      `"${o.orderType}"`,
      `"${o.status}"`,
      `"${o.items.map((it) => `${it.quantity}x ${it.name}`).join('; ')}"`,
      o.subtotal,
      o.deliveryFee,
      o.totalAmount,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `butt-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActionNotice('✅ Orders exported to CSV spreadsheet successfully!');
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handlePriceChange = (id: string, newPrice: number) => {
    const safePrice = typeof newPrice === 'number' && !isNaN(newPrice) ? Math.max(0, newPrice) : 0;
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price: safePrice } : item))
    );
  };

  const handleToggleStock = (id: string) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isAvailable: !item.isAvailable } : item))
    );
  };

  const handleToggleSpecial = (id: string) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSpecial: !item.isSpecial } : item))
    );
  };

  // WORKABLE DELETE FUNCTION (No window.confirm, 100% reliable)
  const handleExecuteDelete = (id: string) => {
    const itemToDelete = draftItems.find((i) => i.id === id);
    const itemName = itemToDelete ? itemToDelete.name : 'Dish';
    const updated = draftItems.filter((item) => item.id !== id);

    setDraftItems(updated);
    onSaveMenuItems(updated);
    setDeleteConfirmId(null);

    // Show temporary feedback toast
    setActionNotice(`"${itemName}" deleted successfully.`);
    setTimeout(() => {
      setActionNotice(null);
    }, 2500);
  };

  // Start editing existing item
  const handleStartEdit = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditName(item.name ?? '');
    setEditDescription(item.description ?? '');
    setEditServing(item.serving ?? '');
    setEditImage(item.image ?? '');
  };

  // Save edit of existing item (including updated image if changed)
  const handleSaveEdit = (id: string) => {
    const updated = draftItems.map((item) =>
      item.id === id
        ? {
            ...item,
            name: editName.trim() || item.name,
            description: editDescription.trim() || item.description,
            serving: editServing.trim() || item.serving,
            image: editImage.trim() || item.image,
          }
        : item
    );
    setDraftItems(updated);
    onSaveMenuItems(updated);
    setEditingItemId(null);
    setActionNotice('Item updated successfully with new details & photo.');
    setTimeout(() => setActionNotice(null), 2200);
  };

  // Dedicated image compressor for inline editing of existing items
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingEditImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (!rawData) {
        setIsProcessingEditImage(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setEditImage(compressed);
          } else {
            setEditImage(rawData);
          }
        } catch {
          setEditImage(rawData);
        } finally {
          setIsProcessingEditImage(false);
        }
      };
      img.onerror = () => {
        setEditImage(rawData);
        setIsProcessingEditImage(false);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
  };

  // IMAGE FILE UPLOAD HANDLER with canvas compression
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setImagePreviewName(file.name);
    setImageUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawData = event.target?.result as string;
      if (!rawData) {
        setIsProcessingImage(false);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          // Resize image to max 600px for optimal speed, mobile rendering, and Firestore storage
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setNewDishImageUrl(compressedDataUrl);
          } else {
            setNewDishImageUrl(rawData);
          }
        } catch {
          setNewDishImageUrl(rawData);
        } finally {
          setIsProcessingImage(false);
        }
      };
      img.onerror = () => {
        setNewDishImageUrl(rawData);
        setIsProcessingImage(false);
      };
      img.src = rawData;
    };
    reader.onerror = () => {
      setIsProcessingImage(false);
      setImageUploadError('Could not read image file. Please try selecting again.');
    };
    reader.readAsDataURL(file);
  };

  // Add New Product Handler
  const handleAddNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    setImageUploadError(null);

    if (!newDishName.trim()) {
      setImageUploadError('Please enter a dish name.');
      return;
    }

    const parsedPrice = parseFloat(newDishPrice);
    if (!newDishPrice.trim() || isNaN(parsedPrice) || parsedPrice < 0) {
      setImageUploadError('Please enter a valid price in Rs.');
      return;
    }

    if (!newDishImageUrl.trim()) {
      setImageUploadError('Please upload a dish picture or paste an image link.');
      return;
    }

    // STRICT: use the exact image provided by the user, never replace with a random fallback
    const newProduct: MenuItem = {
      id: `dish-${Date.now()}`,
      name: newDishName.trim(),
      category: newDishCategory,
      price: Math.max(0, parsedPrice),
      description: newDishDescription.trim() || 'Authentic traditional recipe prepared fresh daily.',
      serving: newDishServing.trim() || 'Standard portion',
      image: newDishImageUrl.trim(),
      isAvailable: true,
      isSpecial: Boolean(newDishIsSpecial),
      ...(newDishNameUrdu.trim() ? { nameUrdu: newDishNameUrdu.trim() } : {}),
      ...(newDishIsSpecial ? { tag: 'Specialty' } : {}),
    };

    const updatedList = [newProduct, ...draftItems];
    setDraftItems(updatedList);
    onSaveMenuItems(updatedList);

    // Reset form cleanly
    setNewDishName('');
    setNewDishNameUrdu('');
    setNewDishPrice('');
    setNewDishDescription('');
    setNewDishServing('');
    setNewDishImageUrl('');
    setImagePreviewName('');
    setNewDishIsSpecial(false);
    setImageUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setAddProductSuccess(true);
    setActionNotice(`New dish "${newProduct.name}" added with your uploaded photo!`);

    setTimeout(() => {
      setAddProductSuccess(false);
      setActionNotice(null);
      setActiveTab('menu');
    }, 1200);
  };

  // Save all changes in table
  const handleSaveMenu = () => {
    onSaveMenuItems(draftItems);
    localStorage.setItem('butt_daily_notice', dailyNotice);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2200);
  };

  // Change Password Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);

    const storedPassword = getStoredPassword();

    if (currentPasswordInput.trim() !== storedPassword) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'Current password does not match.',
      });
      return;
    }

    if (newPasswordInput.trim().length < 4) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'New password must be at least 4 characters long.',
      });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }

    // Persist new password to localStorage
    localStorage.setItem(STORAGE_KEY_ADMIN_PASSWORD, newPasswordInput.trim());
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordChangeMessage({
      type: 'success',
      text: 'Admin password updated successfully! Future logins require your new password.',
    });
  };

  const handleResetPasswordToDefault = () => {
    localStorage.removeItem(STORAGE_KEY_ADMIN_PASSWORD);
    setPasswordChangeMessage({
      type: 'success',
      text: 'Password reset to default (admin21).',
    });
  };

  const handleResetMenu = () => {
    onResetDefaults();
    setIsAuthenticated(false);
    setPasswordInput('');
    onClose();
  };

  const handleClose = () => {
    setPasswordInput('');
    setPasswordError(false);
    setIsAuthenticated(false);
    setPasswordChangeMessage(null);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setEditingItemId(null);
    setDeleteConfirmId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl bg-[#11131b] border border-amber-900/40 rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#161825] border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-stone-100 flex items-center gap-2">
                <span>Executive Kitchen Console</span>
                {isAuthenticated && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                    Authenticated
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-stone-400">
                Product Image Upload, Live CRUD Management & Security Settings
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            type="button"
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Toast Action Notice */}
        {actionNotice && (
          <div className="bg-amber-500/20 border-b border-amber-500/40 text-amber-300 text-xs py-2 px-4 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-amber-400" />
              <span>{actionNotice}</span>
            </span>
            <button onClick={() => setActionNotice(null)} className="text-stone-400 hover:text-stone-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (Only when authenticated) */}
        {isAuthenticated && (
          <div className="bg-[#141622] border-b border-stone-800 px-4 sm:px-6 flex items-center gap-3 sm:gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Live Orders</span>
              {pendingCount > 0 ? (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono animate-pulse">
                  {pendingCount} New
                </span>
              ) : (
                <span className="bg-stone-800 text-stone-400 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'menu'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Products List ({draftItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add_product')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'add_product'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Dish (Image Upload)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'team'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Admin Team ({adminTeam.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Security & Roles</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backups')}
              className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'backups'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Backups & Recovery</span>
            </button>

            {loggedInAdmin && (
              <div className="ml-auto flex items-center gap-2 text-[11px] text-stone-400 py-2 shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-stone-200 truncate max-w-[130px]">
                  {loggedInAdmin.name}
                </span>
                <span className="uppercase text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold">
                  {loggedInAdmin.role}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-2 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ml-1"
                  title="Sign out of Admin Session"
                >
                  <LogOut className="w-3 h-3" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {!isAuthenticated ? (
            /* DUAL-TIER SECURE LOGIN GATE: Google OAuth Verified Auth + Counter Staff PIN */
            <div className="max-w-md mx-auto py-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-7 h-7 text-amber-400" />
                </div>
                <h4 className="text-lg font-bold text-stone-100 font-serif">
                  Restaurant Management Console
                </h4>
                <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                  Cryptographically secured by Firebase Authentication & Firestore Server-Side Rules.
                </p>
              </div>

              {/* Error Alert Display */}
              {authErrorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700/80 text-xs text-red-200 flex items-start gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <strong className="block font-semibold">Access Authorization Failed:</strong>
                    <p className="leading-relaxed">{authErrorMessage}</p>
                  </div>
                </div>
              )}

              {/* Tier 1: Real Firebase Google Sign-In */}
              <div className="bg-[#12141f] border border-amber-500/30 rounded-2xl p-5 space-y-3.5 shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h5 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Recommended: Google Verified Account
                  </h5>
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Log in directly with your authorized Google account (<strong className="text-amber-300 font-mono">rmashraf22@gmail.com</strong> or registered managers) for full database write permissions.
                </p>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSigningInWithGoogle}
                  className="w-full py-3 px-4 bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-900 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>{isSigningInWithGoogle ? 'Verifying with Google...' : 'Sign in with Google'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-stone-800 w-full" />
                <span className="bg-[#10121a] px-3 text-[10px] uppercase tracking-widest text-stone-500 font-bold whitespace-nowrap">
                  Or Staff Counter PIN
                </span>
                <div className="border-t border-stone-800 w-full" />
              </div>

              {/* Tier 2: Physical Counter PIN / Master Password Fallback */}
              <form onSubmit={handleVerifyPassword} className="bg-[#12141f] border border-stone-800 rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                  <h5 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Counter Staff PIN / Master Password
                  </h5>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter Master Password or 4-digit PIN"
                    value={passwordInput || ''}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setPasswordError(false);
                      setAuthErrorMessage(null);
                    }}
                    className={`w-full text-center text-sm font-mono bg-[#161824] border rounded-xl pl-4 pr-10 py-2.5 text-stone-100 focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-red-500 focus:ring-red-500/40'
                        : 'border-stone-800 focus:ring-amber-500/40 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {passwordError && (
                  <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Incorrect PIN or password. Try again or use Google Sign-in.</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 active:bg-stone-650 text-stone-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-stone-700"
                >
                  Verify Counter PIN
                </button>

                <p className="text-[10px] text-stone-500 text-center">
                  Default Master Password: <strong className="text-amber-400 font-mono">admin21</strong>
                </p>
              </form>
            </div>
          ) : activeTab === 'orders' ? (
            /* TAB 0: LIVE KITCHEN ORDERS & NOTIFICATIONS */
            <div className="space-y-5">
              
              {/* Top Controls Header */}
              <div className="bg-[#151724] border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-stone-100 flex items-center gap-2">
                      <span>Kitchen Orders Live Feed</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        Real-time Firestore
                      </span>
                    </h4>
                    <p className="text-[11px] text-stone-400">
                      Orders placed on WhatsApp or website sync in real-time with custom audio announcements.
                    </p>
                  </div>
                </div>

                {/* Sound Modes, Voice Test & Mobile Lockscreen Push */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-stretch md:self-auto flex-wrap">
                  {/* Alert Mode Selector */}
                  <div className="flex items-center bg-[#10121a] border border-stone-800 rounded-lg p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSetAlertMode('voice')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertMode === 'voice'
                          ? 'bg-amber-600 text-stone-950 font-bold shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      title="Urdu Voice: 'Order aya ha sahb!'"
                    >
                      <Mic className="w-3 h-3" />
                      <span>Voice: "Order aya ha sahb"</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetAlertMode('bell')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertMode === 'bell'
                          ? 'bg-amber-600 text-stone-950 font-bold shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      title="Traditional dual-frequency bell chime"
                    >
                      <Bell className="w-3 h-3" />
                      <span>Bell</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetAlertMode('both')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertMode === 'both'
                          ? 'bg-amber-600 text-stone-950 font-bold shadow'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                      title="Both Voice Announcement and Bell Chime"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Both</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetAlertMode('muted')}
                      className={`px-2 py-1 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                        alertMode === 'muted'
                          ? 'bg-stone-800 text-red-400 font-bold'
                          : 'text-stone-500 hover:text-stone-300'
                      }`}
                      title="Mute all audio"
                    >
                      <VolumeX className="w-3 h-3" />
                      <span>Mute</span>
                    </button>
                  </div>

                  {/* Test Voice Button */}
                  <button
                    type="button"
                    onClick={() => playOrderVoiceAnnouncement('Order aya hai sahab!')}
                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Test 'Order aya ha sahb!' voice synthesis"
                  >
                    <span>🗣️ Test Voice</span>
                  </button>

                  {/* Enable Mobile Background Notification Button */}
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      notificationPermission === 'granted'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                        : 'bg-amber-600/20 text-amber-300 border-amber-600/50 hover:bg-amber-600/30'
                    }`}
                    title="Allow lockscreen and background notifications on Android/Mobile"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>
                      {notificationPermission === 'granted'
                        ? '📱 Mobile Lockscreen Alert: Active'
                        : '📱 Enable Mobile Alerts'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
                  {[
                    { id: 'all', label: `All (${orders.length})` },
                    { id: 'pending', label: `Pending (${orders.filter((o) => o.status === 'pending').length})` },
                    { id: 'preparing', label: `In Kitchen (${orders.filter((o) => o.status === 'preparing').length})` },
                    { id: 'dispatched', label: `Dispatched (${orders.filter((o) => o.status === 'dispatched').length})` },
                    { id: 'completed', label: `Completed (${orders.filter((o) => o.status === 'completed').length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOrderFilter(tab.id as 'all' | OrderStatus)}
                      className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                        orderFilter === tab.id
                          ? 'bg-amber-600 text-stone-950 font-bold shadow'
                          : 'bg-[#151724] border border-stone-800 text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search name, phone, order #..."
                    value={orderSearch || ''}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-[#12141d] border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="bg-[#151724] border border-stone-800/90 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-semibold text-stone-200">
                    {orderSearch || orderFilter !== 'all' ? 'No orders match this filter' : 'No Live Orders Yet'}
                  </h5>
                  <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                    Jab b koi customer website se cart me items daal kar WhatsApp order send kare ga, uska mukammal order realtime me sound chime ke sath yahan samne show ho jaye ga.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const isConfirmingDelete = deleteOrderConfirmId === order.id;
                    const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
                    const effectiveMapUrl =
                      order.customerGpsMapUrl ||
                      (order.deliveryAddress
                        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            order.deliveryAddress + ', Lahore'
                          )}`
                        : 'https://maps.app.goo.gl/VfQMKDwHrkbs5PPq6');

                    return (
                      <div
                        key={order.id}
                        className={`bg-[#151724] border rounded-xl p-4 space-y-4 transition-colors shadow-sm ${
                          order.status === 'pending'
                            ? 'border-amber-600/70 ring-1 ring-amber-500/20'
                            : 'border-stone-800/90'
                        }`}
                      >
                        {/* Header: Order ID, Time, Method, Quick Contact Pill & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-800/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-amber-400 text-sm tracking-wide">
                              #{order.orderNumber}
                            </span>

                            <span className="text-[11px] text-stone-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-stone-500" />
                              <span>{order.formattedTime}</span>
                            </span>

                            {/* Order Type Badge */}
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                order.orderType === 'delivery'
                                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                                  : order.orderType === 'takeaway'
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                  : 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                              }`}
                            >
                              {order.orderType === 'delivery' ? (
                                <Bike className="w-3 h-3" />
                              ) : (
                                <ShoppingBag className="w-3 h-3" />
                              )}
                              <span>{order.orderType}</span>
                            </span>

                            {/* Quick Phone Badge in Header */}
                            <span className="text-[11px] font-mono font-semibold bg-[#11131c] text-amber-300/90 border border-stone-700/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-amber-400" />
                              <span>{order.customerPhone}</span>
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                                order.status === 'pending'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/80 animate-pulse'
                                  : order.status === 'preparing'
                                  ? 'bg-sky-950/80 text-sky-300 border-sky-600/80'
                                  : order.status === 'dispatched'
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-600/80'
                                  : order.status === 'completed'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/80'
                                  : 'bg-red-950/80 text-red-300 border-red-600/80'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                              <span className="capitalize">{order.status}</span>
                            </span>
                          </div>
                        </div>

                        {/* 2-Column Responsive Layout: Left = Food Items to Prepare | Right (ALONGSIDE) = Customer Phone & Where to Deliver */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                          {/* LEFT: Items Breakdown Table (lg:col-span-7) */}
                          <div className="lg:col-span-7 flex flex-col justify-between">
                            <div className="bg-[#10121a] border border-stone-800/80 rounded-xl overflow-hidden h-full flex flex-col">
                              <div className="px-3 py-2 bg-stone-900/70 border-b border-stone-800 text-[11px] font-semibold text-stone-300 uppercase tracking-wider flex justify-between items-center">
                                <span className="flex items-center gap-1.5">
                                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Kitchen Items to Prepare ({order.items.reduce((s, it) => s + it.quantity, 0)})</span>
                                </span>
                                <span className="text-[10px] text-stone-400 font-normal">Line Total</span>
                              </div>
                              <div className="divide-y divide-stone-850 flex-1">
                                {order.items.map((it, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 flex items-center justify-between text-xs hover:bg-stone-900/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {it.image && (
                                        <img
                                          src={it.image}
                                          alt=""
                                          className="w-9 h-9 rounded-md object-cover bg-stone-900 shrink-0 border border-stone-800"
                                          referrerPolicy="no-referrer"
                                        />
                                      )}
                                      <div className="truncate">
                                        <div className="font-medium text-stone-200 truncate">
                                          <span className="font-bold text-amber-400 text-sm mr-1.5">{it.quantity}x</span>
                                          <span className="font-semibold">{it.name}</span>
                                          {it.nameUrdu && (
                                            <span className="text-[10px] text-stone-400 ml-1.5 font-normal">
                                              ({it.nameUrdu})
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[10px] text-stone-400">Rs. {it.price} each</div>
                                      </div>
                                    </div>
                                    <div className="font-mono font-semibold text-stone-200 tabular-nums shrink-0 ml-2">
                                      Rs. {(it.price * it.quantity).toLocaleString()}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Special Cooking / Kitchen Instructions note if present */}
                              {order.specialInstructions && (
                                <div className="p-2.5 bg-amber-950/20 border-t border-amber-900/30 text-xs text-amber-200/90 flex items-start gap-1.5">
                                  <span className="font-semibold text-amber-400 shrink-0">🍳 Kitchen Note:</span>
                                  <span className="italic">{order.specialInstructions}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* RIGHT: Prominent Customer Phone & Delivery Destination Box (ALONGSIDE) (lg:col-span-5) */}
                          <div className="lg:col-span-5 flex flex-col justify-between space-y-2.5">
                            <div className="bg-[#10131d] border-2 border-amber-500/30 rounded-xl p-3.5 space-y-3 shadow-md flex-1 flex flex-col justify-between">
                              <div className="space-y-3">
                                {/* Title badge */}
                                <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-2">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                      <MapPin className="w-3.5 h-3.5" />
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-bold text-stone-100 uppercase tracking-wide">
                                        Where to Deliver & Contact
                                      </h6>
                                      <p className="text-[10px] text-stone-400">
                                        کسٹمر فون اور ڈیلیوری کا پتہ
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 shrink-0">
                                    {order.orderType === 'delivery' ? 'Home Delivery' : 'Self Pickup'}
                                  </span>
                                </div>

                                {/* Customer Name */}
                                <div className="flex items-center justify-between text-xs bg-[#161926]/60 p-2 rounded-lg border border-stone-800">
                                  <span className="text-stone-400">Customer:</span>
                                  <span className="font-bold text-stone-100">{order.customerName}</span>
                                </div>

                                {/* Customer Phone Number (Ultra Prominent) */}
                                <div className="bg-[#161926] border border-amber-500/40 rounded-lg p-2.5 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      <span>Customer Phone Number</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(order.customerPhone);
                                        setCopiedPhoneId(order.id);
                                        setTimeout(() => setCopiedPhoneId(null), 1500);
                                      }}
                                      className="text-[10px] text-stone-400 hover:text-amber-400 flex items-center gap-0.5 cursor-pointer"
                                      title="Copy phone number"
                                    >
                                      {copiedPhoneId === order.id ? (
                                        <span className="text-emerald-400 font-semibold">✓ Copied!</span>
                                      ) : (
                                        <>
                                          <Copy className="w-2.5 h-2.5" />
                                          <span>Copy</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-sm sm:text-base text-amber-300 tracking-wide">
                                      {order.customerPhone}
                                    </span>

                                    {/* Action buttons: Call & WhatsApp */}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {cleanPhone && (
                                        <a
                                          href={`tel:${cleanPhone}`}
                                          className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-100 text-[11px] font-semibold rounded-md border border-stone-700 flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Call customer directly"
                                        >
                                          <Phone className="w-3 h-3 text-amber-400" />
                                          <span>Call</span>
                                        </a>
                                      )}
                                      {cleanPhone && (
                                        <a
                                          href={`https://wa.me/${cleanPhone.startsWith('92') ? cleanPhone : '92' + cleanPhone.replace(/^0/, '')}?text=${encodeURIComponent(
                                            `Assalam-o-Alaikum ${order.customerName}, regarding your Order #${order.orderNumber} at Butt Murgh Channay & Fish Corner:`
                                          )}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-semibold rounded-md border border-emerald-800 flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Chat on WhatsApp"
                                        >
                                          <MessageCircle className="w-3 h-3 text-emerald-400" />
                                          <span>WhatsApp</span>
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Customer Delivery Address (Ultra Prominent, Full Address Un-truncated) */}
                                <div className="bg-[#141824] border-2 border-emerald-500/50 rounded-lg p-2.5 space-y-2">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>Delivery Destination (منزل / پتہ)</span>
                                    </span>
                                    {order.deliveryAddress && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(order.deliveryAddress);
                                          setCopiedOrderId(order.id);
                                          setTimeout(() => setCopiedOrderId(null), 1500);
                                        }}
                                        className="text-[10px] text-stone-400 hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer"
                                        title="Copy delivery address"
                                      >
                                        {copiedOrderId === order.id ? (
                                          <span className="text-emerald-400 font-semibold">✓ Copied!</span>
                                        ) : (
                                          <>
                                            <Copy className="w-2.5 h-2.5" />
                                            <span>Copy Address</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  <div className="text-xs sm:text-sm text-stone-100 font-medium leading-relaxed bg-[#0c0f17] p-2.5 rounded border border-stone-800 break-words">
                                    {order.deliveryAddress ? (
                                      <span className="font-semibold">{order.deliveryAddress}</span>
                                    ) : (
                                      <span className="text-stone-400 italic">
                                        No delivery address required (Takeaway / Self-Pickup at Restaurant)
                                      </span>
                                    )}
                                  </div>

                                  {/* Direct Google Maps Rider Navigation Button */}
                                  {effectiveMapUrl && (
                                    <a
                                      href={effectiveMapUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                      title="Open customer location in Google Maps app"
                                    >
                                      <MapPin className="w-3.5 h-3.5 fill-stone-950 text-stone-950" />
                                      <span>Open in Google Maps 🗺️</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Summary & Kitchen Action Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-stone-850">
                          {/* Financials */}
                          <div className="flex items-center gap-3 text-xs text-stone-300">
                            <span>
                              Subtotal: <strong className="font-mono text-stone-200">Rs. {order.subtotal}</strong>
                            </span>
                            {order.deliveryFee > 0 && (
                              <span>
                                Delivery: <strong className="font-mono text-stone-200">Rs. {order.deliveryFee}</strong>
                              </span>
                            )}
                            <span className="font-bold text-sm text-stone-100 flex items-center gap-1.5 pl-2 border-l border-stone-800">
                              <span>Total COD:</span>
                              <span className="text-amber-400 font-mono tabular-nums">
                                Rs. {order.totalAmount.toLocaleString()}
                              </span>
                            </span>
                          </div>

                          {/* Order State Advancers & Print Button */}
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {/* Fast Next-step status button */}
                            {order.status === 'pending' && onUpdateOrderStatus && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                              >
                                Accept & Start Preparing 🍳
                              </button>
                            )}

                            {order.status === 'preparing' && onUpdateOrderStatus && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'dispatched')}
                                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                              >
                                Dispatch / Ready 🛵
                              </button>
                            )}

                            {order.status === 'dispatched' && onUpdateOrderStatus && (
                              <button
                                type="button"
                                onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                              >
                                Mark Delivered / Completed ✅
                              </button>
                            )}

                            {/* Status Selector Dropdown */}
                            {onUpdateOrderStatus && (
                              <select
                                value={order.status}
                                onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                                className="bg-[#10121a] border border-stone-800 rounded-lg px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                              >
                                <option value="pending">Pending</option>
                                <option value="preparing">In Kitchen</option>
                                <option value="dispatched">Dispatched</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}

                            {/* Print KOT Slip Button */}
                            <button
                              type="button"
                              onClick={() => handlePrintSlip(order)}
                              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                              title="Print Kitchen Order Ticket (KOT)"
                            >
                              <Printer className="w-4 h-4" />
                            </button>

                            {/* Delete Order Button */}
                            {onDeleteOrder && (
                              <>
                                {!isConfirmingDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteOrderConfirmId(order.id)}
                                    className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Delete order"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-1.5 bg-red-950/70 border border-red-700/80 px-2 py-1 rounded-lg">
                                    <span className="text-[10px] text-red-200">Delete order?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteOrder(order.id);
                                        setDeleteOrderConfirmId(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteOrderConfirmId(null)}
                                      className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] rounded"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : activeTab === 'menu' ? (
            /* TAB 1: Menu & Live Pricing Console (Workable Delete & Inline Edit) */
            <div className="space-y-6">
              
              {/* Daily Announcement / Fish Catch Rate */}
              <div className="bg-[#151724] border border-stone-800 rounded-xl p-4 space-y-2">
                <label className="text-xs font-semibold text-stone-200 block">
                  Today's Counter Announcement / Fish Catch Note
                </label>
                <input
                  type="text"
                  value={dailyNotice || ''}
                  onChange={(e) => setDailyNotice(e.target.value)}
                  className="w-full bg-[#0f1118] border border-stone-800 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Menu Items Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-300">
                  <span className="font-semibold">Live Menu Products ({draftItems.length})</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add_product')}
                    className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Dish</span>
                  </button>
                </div>

                {draftItems.length === 0 ? (
                  <div className="bg-[#151724] border border-stone-800/90 rounded-2xl p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-stone-200">
                      Menu is 100% Fresh & Empty
                    </div>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto leading-relaxed">
                      Koi purani ya random dish nahi hai. Upar "+ Add Dish (Image Upload)" tab par click kar ke tasveer, rate aur detail ke sath nayi dish upload karein.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('add_product')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload Dish with Photo</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                  {draftItems.map((item) => {
                    const isConfirmingDelete = deleteConfirmId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`bg-[#151724] border rounded-xl p-3.5 flex flex-col gap-3 transition-colors ${
                          isConfirmingDelete ? 'border-red-600/80 bg-red-950/20' : 'border-stone-800/80'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt=""
                              className="w-12 h-12 rounded-lg object-cover bg-stone-900 border border-stone-800 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-stone-100 flex items-center gap-2">
                                <span>{item.name}</span>
                                <span className="text-[10px] bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded border border-stone-800 uppercase">
                                  {item.category.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-400 truncate max-w-sm">
                                {item.serving} · {item.description}
                              </div>
                            </div>
                          </div>

                          {/* Controls: Price, Special, Stock, Edit, Delete */}
                          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap sm:flex-nowrap justify-end">
                            {/* Price Input */}
                            <div className="flex items-center gap-1 bg-[#0e1017] border border-stone-800 rounded-lg px-2.5 py-1">
                              <span className="text-xs text-stone-400">Rs.</span>
                              <input
                                type="number"
                                value={typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0}
                                onChange={(e) => {
                                  const parsed = parseInt(e.target.value, 10);
                                  handlePriceChange(item.id, isNaN(parsed) ? 0 : Math.max(0, parsed));
                                }}
                                className="w-16 bg-transparent text-xs font-mono font-bold text-amber-400 focus:outline-none text-right tabular-nums"
                              />
                            </div>

                            {/* Special Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleSpecial(item.id)}
                              className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                                item.isSpecial
                                  ? 'bg-amber-950/60 text-amber-300 border-amber-700/60'
                                  : 'bg-stone-900 text-stone-500 border-stone-800'
                              }`}
                            >
                              Special
                            </button>

                            {/* Stock Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStock(item.id)}
                              className={`px-2 py-1 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                                item.isAvailable
                                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60'
                                  : 'bg-red-950/50 text-red-300 border-red-800/60'
                              }`}
                            >
                              {item.isAvailable ? 'In Stock' : 'Sold Out'}
                            </button>

                            {/* Quick Edit details toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                editingItemId === item.id
                                  ? setEditingItemId(null)
                                  : handleStartEdit(item)
                              }
                              title="Edit details"
                              className="p-1.5 text-stone-400 hover:text-amber-400 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Permanent Delete Action with In-App Confirmation (No window.confirm!) */}
                            {!isConfirmingDelete ? (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(item.id)}
                                title="Delete dish permanently"
                                className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-700 p-1 rounded-lg animate-pulse">
                                <button
                                  type="button"
                                  onClick={() => handleExecuteDelete(item.id)}
                                  className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded cursor-pointer"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-0.5 text-stone-300 hover:text-white cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Edit Form for Item Details & Photo */}
                        {editingItemId === item.id && (
                          <div className="pt-3 border-t border-stone-800/80 space-y-3 bg-[#0e1017] p-3 rounded-xl">
                            {/* Hidden edit file input */}
                            <input
                              type="file"
                              ref={editFileInputRef}
                              accept="image/*"
                              onChange={handleEditImageUpload}
                              className="hidden"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-stone-400 block mb-0.5">Dish Name</label>
                                <input
                                  type="text"
                                  value={editName || ''}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full bg-[#161824] border border-stone-800 rounded px-2 py-1 text-xs text-stone-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-stone-400 block mb-0.5">Serving Info</label>
                                <input
                                  type="text"
                                  value={editServing || ''}
                                  onChange={(e) => setEditServing(e.target.value)}
                                  className="w-full bg-[#161824] border border-stone-800 rounded px-2 py-1 text-xs text-stone-100"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-stone-400 block mb-0.5">Description</label>
                                <input
                                  type="text"
                                  value={editDescription || ''}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full bg-[#161824] border border-stone-800 rounded px-2 py-1 text-xs text-stone-100"
                                />
                              </div>
                            </div>

                            {/* Dish Photo updater for this existing item */}
                            <div className="pt-2 border-t border-stone-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#131520] p-2.5 rounded-lg border border-stone-800/60">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-stone-900 border border-stone-700 overflow-hidden shrink-0 relative">
                                  {editImage ? (
                                    <img src={editImage} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-600 text-[10px]">No img</div>
                                  )}
                                  {isProcessingEditImage && (
                                    <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center text-[8px] text-amber-400 font-bold">
                                      Saving...
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <span className="text-[11px] font-semibold text-stone-200 block">Dish Picture</span>
                                  <span className="text-[10px] text-stone-400 block">Replace with your new gallery/camera photo</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <button
                                  type="button"
                                  onClick={() => editFileInputRef.current?.click()}
                                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-750 text-amber-300 text-[11px] font-medium rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Change Photo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow"
                                >
                                  Done & Save
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

            </div>
          ) : activeTab === 'add_product' ? (
            /* TAB 2: Add New Product Form (WITH DIRECT IMAGE FILE UPLOAD) */
            <div className="max-w-xl mx-auto space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <Plus className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-stone-100">
                  Add Brand New Dish / Product
                </h4>
                <p className="text-xs text-stone-400">
                  Select image directly from your mobile gallery or camera, set price, and publish.
                </p>
              </div>

              {addProductSuccess && (
                <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>New dish added successfully to the menu!</span>
                </div>
              )}

              <form onSubmit={handleAddNewProduct} className="space-y-4 bg-[#151724] border border-stone-800 rounded-2xl p-5">
                
                {/* 1. DIRECT IMAGE UPLOAD SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-amber-400" />
                      <span>Upload Dish Picture (Mobile Gallery / Camera) *</span>
                    </label>
                    {newDishImageUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Photo Ready</span>
                      </span>
                    )}
                  </div>

                  {/* Hidden native file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />

                  {/* Interactive Upload Box & Preview */}
                  <div
                    onClick={() => !isProcessingImage && fileInputRef.current?.click()}
                    className={`group border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left ${
                      newDishImageUrl
                        ? 'border-emerald-600/70 bg-emerald-950/10'
                        : 'border-stone-700 hover:border-amber-500/80 bg-[#10121a]'
                    }`}
                  >
                    {/* Live Preview Thumbnail */}
                    <div className="w-24 h-24 rounded-lg bg-stone-900 border border-stone-800 overflow-hidden relative shrink-0">
                      {newDishImageUrl ? (
                        <img
                          src={newDishImageUrl}
                          alt="Dish Preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 gap-1">
                          <ImageIcon className="w-8 h-8" />
                          <span className="text-[9px] text-stone-500">No Photo</span>
                        </div>
                      )}

                      {isProcessingImage && (
                        <div className="absolute inset-0 bg-stone-950/85 flex flex-col items-center justify-center text-[10px] text-amber-400 font-bold p-1 text-center">
                          <Sparkles className="w-4 h-4 animate-spin mb-1 text-amber-400" />
                          <span>Optimizing...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-amber-400">
                        <Upload className="w-4 h-4" />
                        <span>
                          {newDishImageUrl ? 'Tap to change uploaded photo' : 'Choose photo from mobile gallery / camera'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-300 font-medium">
                        {imagePreviewName || (newDishImageUrl ? 'Custom uploaded picture' : 'No file selected yet')}
                      </p>
                      <p className="text-[10px] text-stone-500">
                        Supports JPG, PNG, WEBP. Your exact photo will be displayed on the website.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-stone-950 text-xs font-semibold rounded-lg border border-amber-500/40 transition-colors"
                      >
                        {newDishImageUrl ? 'Change' : 'Browse Gallery'}
                      </button>

                      {newDishImageUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewDishImageUrl('');
                            setImagePreviewName('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Alternative: Direct Image URL input */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className="text-[11px] text-stone-400 shrink-0">Or paste image link:</span>
                    <input
                      type="url"
                      placeholder="https://example.com/dish-photo.jpg"
                      value={newDishImageUrl && !newDishImageUrl.startsWith('data:') ? newDishImageUrl : ''}
                      onChange={(e) => {
                        setNewDishImageUrl(e.target.value.trim());
                        setImagePreviewName(e.target.value.trim() ? 'Web Image Link' : '');
                      }}
                      className="flex-1 bg-[#10121a] border border-stone-800 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {imageUploadError && (
                    <div className="mt-2 text-xs text-red-400 bg-red-950/40 border border-red-800/80 rounded-lg p-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{imageUploadError}</span>
                    </div>
                  )}
                </div>

                {/* 2. DISH NAME & URDU NAME */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">
                      Dish Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Brain Masala / Maghaz"
                      value={newDishName || ''}
                      onChange={(e) => setNewDishName(e.target.value)}
                      className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">
                      Urdu Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. مغز فرائی"
                      value={newDishNameUrdu || ''}
                      onChange={(e) => setNewDishNameUrdu(e.target.value)}
                      className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 3. CATEGORY & PRICE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">
                      Category *
                    </label>
                    <select
                      value={newDishCategory || 'chanay_specials'}
                      onChange={(e) => setNewDishCategory(e.target.value as MenuCategory)}
                      className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="chanay_specials">Chanay & Specials</option>
                      <option value="tandoor">Tandoor (Breads)</option>
                      <option value="fish">Special Fish</option>
                      <option value="sides">Sides</option>
                      <option value="beverages">Beverages</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-300 block mb-1">
                      Price (Rs.) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      placeholder="e.g. 450"
                      value={newDishPrice || ''}
                      onChange={(e) => setNewDishPrice(e.target.value)}
                      className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* 4. SERVING & DESCRIPTION */}
                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    Serving / Portion Details
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Serves 1-2 persons with hot gravy"
                    value={newDishServing || ''}
                    onChange={(e) => setNewDishServing(e.target.value)}
                    className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief taste profile, secret spices, or cooking method..."
                    value={newDishDescription || ''}
                    onChange={(e) => setNewDishDescription(e.target.value)}
                    className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isSpecialCheck"
                    checked={newDishIsSpecial}
                    onChange={(e) => setNewDishIsSpecial(e.target.checked)}
                    className="rounded border-stone-800 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="isSpecialCheck" className="text-xs text-stone-300 select-none cursor-pointer">
                    Highlight as Chef Special / Bestseller
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingImage}
                  className={`w-full py-3 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 mt-3 ${
                    isProcessingImage
                      ? 'bg-amber-600/50 cursor-wait'
                      : 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 cursor-pointer'
                  }`}
                >
                  {isProcessingImage ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-stone-950" />
                      <span>Optimizing Photo... Please wait</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Publish New Dish With Your Uploaded Photo</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : activeTab === 'team' ? (
            /* TAB 4: Admin Team & Authorization Management */
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-stone-100">
                  Admin Team & Authorization (ایڈمن ٹیم مینجمنٹ)
                </h4>
                <p className="text-xs text-stone-400 max-w-md mx-auto leading-relaxed">
                  Apne Google Account ya kisi b staff member ko website ka admin banayein. Har admin ke liye alag se order bell ('Order aya ha sahb') ko ON ya OFF rakh sakte hen.
                </p>
              </div>

              {teamActionNotice && (
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-xl flex items-center justify-between animate-fade-in">
                  <span>{teamActionNotice}</span>
                  <button
                    type="button"
                    onClick={() => setTeamActionNotice(null)}
                    className="text-stone-400 hover:text-stone-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Add New Admin Form */}
              <div className="bg-[#141624] border border-stone-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-800/80 pb-3">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <h5 className="text-xs font-semibold text-stone-200">
                    Authorize New Admin / Staff Member
                  </h5>
                </div>

                <form onSubmit={handleAddAdmin} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-stone-300 block mb-1">
                        Admin Name (نام) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kamran Butt"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        required
                        className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-stone-300 block mb-1">
                        Google Account Email / ID *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. kamran@gmail.com"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        required
                        className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-stone-300 block mb-1">
                        Role (عہدہ)
                      </label>
                      <select
                        value={newAdminRole}
                        onChange={(e) =>
                          setNewAdminRole(
                            e.target.value as 'owner' | 'manager' | 'dispatcher' | 'kitchen_staff'
                          )
                        }
                        className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="manager">Store Manager (سٹور مینیجر)</option>
                        <option value="owner">Co-Owner / Partner (شریک مالک)</option>
                        <option value="dispatcher">Order Dispatcher / Rider Lead</option>
                        <option value="kitchen_staff">Kitchen Lead (ہیڈ باورچی)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-stone-300 block mb-1">
                        Direct Login PIN (Optional 4 Digits)
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="e.g. 5566 (Optional)"
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value)}
                        className="w-full bg-[#10121a] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Order Bell / Voice notification toggle */}
                  <div className="p-3 bg-[#10121a] border border-stone-800/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-stone-200 block flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-amber-400" />
                        <span>Receive Order Voice Bell ('Order aya ha sahb')</span>
                      </span>
                      <span className="text-[10px] text-stone-400 block">
                        Is admin ke phone/browser par order aane par bell baje gi.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setNewAdminNotify(!newAdminNotify)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        newAdminNotify ? 'bg-amber-600' : 'bg-stone-800'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-stone-950 shadow ring-0 transition duration-200 ease-in-out ${
                          newAdminNotify ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Authorize Admin & Save to Live Firebase</span>
                  </button>
                </form>
              </div>

              {/* Current Authorized Admins List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-300 px-1">
                  <span>Authorized Admins ({adminTeam.length})</span>
                  <span className="text-[11px] text-stone-500">Live Firebase Synced</span>
                </div>

                <div className="space-y-2.5">
                  {adminTeam.map((admin) => (
                    <div
                      key={admin.id}
                      className="bg-[#141624] border border-stone-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-100 truncate">
                              {admin.name}
                            </span>
                            <span
                              className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono font-semibold ${
                                admin.role === 'owner'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : admin.role === 'manager'
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800'
                                  : admin.role === 'dispatcher'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {admin.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-400 truncate flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                            <span>{admin.email}</span>
                            {admin.pin && (
                              <span className="text-[10px] text-stone-500 font-mono">
                                (PIN: {admin.pin})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Notification toggle & Delete button */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAdminNotification(admin.id)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                            admin.receiveNotification
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-stone-900 text-stone-500 border-stone-800 hover:text-stone-300'
                          }`}
                          title="Toggle order bell for this admin"
                        >
                          {admin.receiveNotification ? (
                            <>
                              <Bell className="w-3 h-3 text-emerald-400" />
                              <span>Order Bell: ON</span>
                            </>
                          ) : (
                            <>
                              <VolumeX className="w-3 h-3" />
                              <span>Bell: MUTED</span>
                            </>
                          )}
                        </button>

                        {admin.id !== 'admin-owner-default' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="p-1.5 bg-stone-900 hover:bg-red-950 text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-800 rounded-lg transition-colors cursor-pointer"
                            title="Revoke Admin Access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'security' ? (
            /* TAB 5: Dedicated Security Settings & Dynamic Password Change */
            <div className="space-y-6 max-w-md mx-auto py-2">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-stone-100 font-serif">
                  Security & Password Settings
                </h4>
                <p className="text-xs text-stone-400">
                  Update the in-store administrator PIN/password for Butt Murgh Channay & Fish Corner.
                </p>
              </div>

              {/* Server-Side Authorization Banner */}
              <div className="bg-[#12141f] border border-emerald-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-300">Server-Side Authorization Active</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  Database writes to dishes and store settings are cryptographically guarded in Firestore rules.
                  Master Owner Google Account: <strong className="text-amber-300 font-mono">rmashraf22@gmail.com</strong>
                </p>
              </div>

              {passwordChangeMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    passwordChangeMessage.type === 'success'
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      : 'bg-red-950/60 text-red-300 border-red-800'
                  }`}
                >
                  {passwordChangeMessage.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{passwordChangeMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    Current Master Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={currentPasswordInput || ''}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    required
                    className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 4 characters)"
                    value={newPasswordInput || ''}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                    className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-300 block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPasswordInput || ''}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    required
                    className="w-full bg-[#161824] border border-stone-800 rounded-xl px-3.5 py-2.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs rounded-xl transition-colors shadow-md mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Admin Password</span>
                </button>
              </form>

              <div className="pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs">
                <span className="text-stone-500">Restore factory password?</span>
                <button
                  type="button"
                  onClick={handleResetPasswordToDefault}
                  className="text-stone-400 hover:text-amber-400 underline transition-colors cursor-pointer"
                >
                  Reset to Default (admin21)
                </button>
              </div>
            </div>
          ) : (
            /* TAB 6: DATA BACKUPS & DISASTER RECOVERY CONSOLE */
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-[#151724] border border-stone-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-stone-100 flex items-center gap-2">
                      <span>Database Backups & Disaster Recovery</span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                        Automated & On-Demand
                      </span>
                    </h4>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Export full database snapshots, save cloud restore points, and protect against data loss.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportDatabaseJson}
                    disabled={isBackingUp}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isBackingUp ? 'Exporting...' : 'Export Full JSON Backup'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateCloudSnapshot}
                    disabled={isBackingUp}
                    className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Save Cloud Snapshot</span>
                  </button>
                </div>
              </div>

              {/* Status & Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#12141f] border border-stone-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-400 block font-medium">Menu Dishes</span>
                  <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
                    {draftItems.length}
                  </span>
                  <span className="text-[10px] text-stone-500">Live in Firestore</span>
                </div>

                <div className="bg-[#12141f] border border-stone-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-400 block font-medium">Customer Orders</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                    {orders.length}
                  </span>
                  <span className="text-[10px] text-stone-500">In dispatch queue</span>
                </div>

                <div className="bg-[#12141f] border border-stone-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-400 block font-medium">Cloud Snapshots</span>
                  <span className="text-xl font-bold font-mono text-sky-400 mt-1 block">
                    {cloudBackups.length}
                  </span>
                  <span className="text-[10px] text-stone-500">Available to restore</span>
                </div>

                <div className="bg-[#12141f] border border-stone-800 rounded-xl p-3.5">
                  <span className="text-[11px] text-stone-400 block font-medium">Server Rules Security</span>
                  <span className="text-xs font-bold font-mono text-emerald-300 mt-1.5 block flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ENFORCED</span>
                  </span>
                  <span className="text-[10px] text-stone-500">RBAC + Google Verified</span>
                </div>
              </div>

              {/* Quick Actions & Restore Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restore From File Card */}
                <div className="bg-[#12141f] border border-stone-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <h5 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                      Restore Database from JSON Backup
                    </h5>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Upload a previously exported <code className="text-amber-400 font-mono">.json</code> backup to restore dishes and store settings.
                  </p>

                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleBackupFileSelect}
                      className="text-xs text-stone-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700 cursor-pointer w-full"
                    />

                    {/* Preview of selected backup file */}
                    {backupRestorePreview && (
                      <div className="p-3 bg-purple-950/40 border border-purple-800/80 rounded-xl space-y-2 text-xs">
                        <div className="font-semibold text-purple-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>Backup File Loaded: {backupRestorePreview.fileName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300 pt-1">
                          <span>Dishes: <strong>{backupRestorePreview.menuItems.length}</strong></span>
                          <span>Orders: <strong>{backupRestorePreview.orders.length}</strong></span>
                        </div>
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleExecuteRestore}
                            disabled={isRestoring}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                            <span>{isRestoring ? 'Restoring...' : 'Confirm & Restore Now'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBackupRestorePreview(null)}
                            className="px-2.5 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Orders Spreadsheet Export Card */}
                <div className="bg-[#12141f] border border-stone-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <h5 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                        Export Orders to Excel / CSV
                      </h5>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Download full spreadsheet of customer orders (Order #, Customer, Phone, Full Delivery Address, Total COD) for kitchen bookkeeping and sales accounting.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportOrdersCsv}
                    className="w-full py-2.5 px-3 bg-stone-800 hover:bg-stone-750 text-emerald-300 border border-emerald-900/60 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Orders Spreadsheet (.CSV)</span>
                  </button>
                </div>
              </div>

              {/* Cloud Snapshots Archive Table */}
              <div className="bg-[#12141f] border border-stone-800 rounded-xl overflow-hidden space-y-0">
                <div className="p-3.5 bg-stone-900/70 border-b border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-400" />
                    <h5 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                      Cloud Disaster Recovery Snapshots ({cloudBackups.length})
                    </h5>
                  </div>
                  <span className="text-[11px] text-stone-400">Stored in Firestore /backups</span>
                </div>

                {cloudBackups.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <p className="text-xs text-stone-400">
                      No cloud backup snapshots recorded yet.
                    </p>
                    <button
                      type="button"
                      onClick={handleCreateCloudSnapshot}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs rounded-lg border border-stone-700 transition-colors cursor-pointer"
                    >
                      + Create First Cloud Snapshot
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-850 max-h-60 overflow-y-auto">
                    {cloudBackups.map((snap) => (
                      <div
                        key={snap.id}
                        className="p-3 flex items-center justify-between text-xs hover:bg-stone-900/30 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-stone-200 flex items-center gap-2">
                            <span>{snap.createdAtFormatted || 'Snapshot'}</span>
                            <span className="text-[10px] font-mono text-stone-500">({snap.id})</span>
                          </div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-2">
                            <span>Author: {snap.createdBy}</span>
                            <span>•</span>
                            <span>{snap.menuCount} dishes</span>
                            <span>•</span>
                            <span>{snap.ordersCount} orders</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([snap.payloadJson], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `butt-snapshot-${snap.id}.json`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                            title="Download snapshot JSON"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`Restore live menu and settings from snapshot taken on ${snap.createdAtFormatted}?`)) return;
                              try {
                                const parsed = JSON.parse(snap.payloadJson);
                                setBackupRestorePreview({
                                  fileName: `Snapshot ${snap.createdAtFormatted}`,
                                  menuItems: parsed.data.menu_items || [],
                                  orders: parsed.data.orders || [],
                                  settings: parsed.data.settings,
                                });
                              } catch {
                                alert('Error reading snapshot JSON.');
                              }
                            }}
                            className="px-2 py-1 bg-stone-800 hover:bg-stone-750 text-amber-300 text-[11px] font-medium rounded-lg border border-stone-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Server-Side Authorization Verification Card */}
              <div className="bg-[#10121a] border border-stone-800/90 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h6 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Database Security & Server-Side Authorization Specifications
                  </h6>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-400 leading-relaxed pt-1">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Server-Side Rules:</strong> Firestore Rules enforce zero write operations without verified admin privileges.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Customer PII Isolation:</strong> Customers' phone numbers and home delivery addresses cannot be scraped by unauthenticated queries.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Owner Gate:</strong> Master Owner Google account (<code className="text-amber-300">rmashraf22@gmail.com</code>) holds top-level authorization.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Disaster Recovery:</strong> Menu and orders can be restored in seconds from cloud snapshots or local JSON files.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer (When Authenticated in Menu tab) */}
        {isAuthenticated && activeTab === 'menu' && (
          <div className="p-4 sm:p-5 bg-[#161825] border-t border-stone-800 flex items-center justify-between gap-3">
            <button
              onClick={handleResetMenu}
              type="button"
              className="px-3.5 py-2 text-xs font-semibold text-stone-400 hover:text-red-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Factory Menu</span>
            </button>

            <div className="flex items-center gap-2">
              {savedSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  <span>Changes Saved!</span>
                </span>
              )}

              <button
                onClick={handleSaveMenu}
                type="button"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
