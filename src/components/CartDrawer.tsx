import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Phone,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  AlertCircle,
  User,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, BUSINESS_INFO, CustomerOrder } from '../data/menuData';

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onOrderSubmitted?: (order: CustomerOrder) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSubmitted,
}) => {
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway' | 'dinein'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    address?: string;
    general?: string;
  }>({});
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);

  const subtotal = cart.reduce((acc, curr) => acc + curr.item.price * curr.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? (subtotal >= BUSINESS_INFO.freeDeliveryThreshold ? 0 : BUSINESS_INFO.standardDeliveryFee) : 0;
  const totalAmount = subtotal + deliveryFee;

  // Helper to construct absolute URL for WhatsApp image preview
  const getFullImageUrl = (imagePath: string): string => {
    if (!imagePath) return '';
    if (imagePath.startsWith('data:')) {
      // Don't append origin to base64 Data URLs; omit from query string to keep WhatsApp URL within character limits
      return '';
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Format pre-filled WhatsApp message with text details + each item's image link, and save to Firestore
  const handleWhatsAppCheckout = async () => {
    if (cart.length === 0 || isSubmittingOrder) return;

    // Validate Required Inputs: Name, Contact Phone, and Address (for delivery)
    const errors: { name?: string; phone?: string; address?: string; general?: string } = {};
    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanAddress = deliveryAddress.trim();

    if (!cleanName) {
      errors.name = 'براہ کرم اپنا نام درج کریں (Please enter your name)';
    }

    if (!cleanPhone) {
      errors.phone = 'براہ کرم اپنا فون یا واٹس ایپ نمبر درج کریں (Please enter phone number)';
    } else if (cleanPhone.replace(/\D/g, '').length < 10) {
      errors.phone = 'درست موبائل نمبر درج کریں (کم از کم 10-11 ہندسے، مثلاً 03211234567)';
    }

    if (orderType === 'delivery' && !cleanAddress) {
      errors.address = 'براہ کرم مکمل ڈلیوری پتہ درج کریں (مکان/دکان #، گلی، علاقہ لاہور)';
    }

    // Block order submission if any required field is missing
    if (Object.keys(errors).length > 0) {
      errors.general = '⚠️ براہ کرم فون نمبر اور مکمل پتہ لازمی درج کریں، خالی فیلڈز کے ساتھ آرڈر نہیں ہو سکتا۔';
      setFormErrors(errors);
      return;
    }

    // Clear previous errors
    setFormErrors({});
    setIsSubmittingOrder(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `BMC-${randomSuffix}`;
    const orderId = `order-${Date.now()}`;
    const timestamp = Date.now();
    const formattedTime =
      new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) +
      ', ' +
      new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

    // Google Maps link automatically built from the customer's delivery address
    const finalMapUrl = cleanAddress
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanAddress + ', Lahore')}`
      : 'https://maps.app.goo.gl/VfQMKDwHrkbs5PPq6';

    const orderRecord: CustomerOrder = {
      id: orderId,
      orderNumber,
      customerName: cleanName,
      customerPhone: cleanPhone,
      deliveryAddress:
        cleanAddress ||
        (orderType === 'takeaway'
          ? 'Counter Pickup (Badami Bagh)'
          : orderType === 'dinein'
          ? 'Dine-in at Counter'
          : 'Badami Bagh Area, Lahore'),
      specialInstructions: specialInstructions.trim(),
      orderType,
      items: cart.map((c) => ({
        dishId: c.item.id,
        name: c.item.name,
        ...(c.item.nameUrdu ? { nameUrdu: c.item.nameUrdu } : {}),
        quantity: c.quantity,
        price: c.item.price,
        image: c.item.image && !c.item.image.startsWith('data:') ? c.item.image : '',
      })),
      subtotal,
      deliveryFee,
      totalAmount,
      status: 'pending',
      createdAt: timestamp,
      formattedTime,
      viewedByAdmin: false,
      customerGpsMapUrl: finalMapUrl,
    };

    // Save order to Firestore orders collection so admin instantly gets real-time notification & chime
    try {
      await setDoc(doc(db, 'orders', orderId), orderRecord);
    } catch (err) {
      console.warn('Firestore orders sync notice:', err);
    }

    if (onOrderSubmitted) {
      onOrderSubmitted(orderRecord);
    }

    setPlacedOrder(orderRecord);
    setIsSubmittingOrder(false);

    let message = `🌟 *NEW ORDER - ${BUSINESS_INFO.name.toUpperCase()}* 🌟\n`;
    message += `📋 *ORDER ID:* #${orderNumber}\n`;
    message += `📍 *Branch:* ${BUSINESS_INFO.address}\n`;
    message += `📞 *Hotline:* ${BUSINESS_INFO.phone}\n`;
    message += `----------------------------------------\n`;
    message += `*Order Method:* ${orderType.toUpperCase()}\n`;
    message += `👤 *Customer Name:* ${cleanName}\n`;
    message += `📞 *Phone / WhatsApp:* ${cleanPhone}\n`;
    if (orderType === 'delivery') {
      message += `🏠 *Delivery Address:* ${cleanAddress}\n`;
      message += `🗺️ *Customer Google Maps Pin:*\n${finalMapUrl}\n`;
    }
    message += `----------------------------------------\n`;
    message += `*ORDERED ITEMS:*\n\n`;

    cart.forEach((c, index) => {
      const itemTotal = c.item.price * c.quantity;
      const imageUrl = getFullImageUrl(c.item.image);
      message += `${index + 1}. *${c.quantity}x ${c.item.name}*\n`;
      message += `   • Rate: Rs. ${c.item.price} | Item Total: Rs. ${itemTotal.toLocaleString()}\n`;
      if (imageUrl) {
        message += `   • Dish Photo: ${imageUrl}\n`;
      }
      message += `\n`;
    });

    if (specialInstructions.trim()) {
      message += `*Special Instructions:* ${specialInstructions.trim()}\n\n`;
    }

    message += `----------------------------------------\n`;
    message += `*Subtotal:* Rs. ${subtotal.toLocaleString()}\n`;
    if (orderType === 'delivery') {
      message += `*Delivery Fee:* ${deliveryFee === 0 ? 'FREE (Special Offer)' : `Rs. ${deliveryFee}`}\n`;
    }
    message += `*TOTAL AMOUNT (COD):* Rs. ${totalAmount.toLocaleString()}\n`;
    message += `----------------------------------------\n`;
    message += `_Sent via Butt Murgh Channay & Fish Corner Web Express (Order #${orderNumber})_`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Container */}
      <div className="relative w-full max-w-md bg-[#11131a] text-stone-100 h-full flex flex-col shadow-2xl border-l border-stone-800 z-10 overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between bg-[#141722]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-stone-100">
              Your Food Basket
            </h2>
            <span className="text-xs text-stone-400 font-mono">
              ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)
            </span>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          
          {/* Order Confirmed Screen */}
          {placedOrder ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold block">
                  Kitchen Notification Live
                </span>
                <h3 className="text-xl font-serif font-bold text-stone-100 mt-1">
                  Order #{placedOrder.orderNumber} Placed!
                </h3>
                <p className="text-xs text-stone-300 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  WhatsApp window open ho gayi hai aur restaurant admin panel par live notification chime ke sath bhej di gayi hai.
                </p>
              </div>

              {/* Order Receipt Card */}
              <div className="bg-[#151822] border border-stone-800 rounded-xl p-4 text-left text-xs space-y-2.5">
                <div className="flex justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400">Order Method</span>
                  <span className="font-semibold text-stone-200 uppercase">{placedOrder.orderType}</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400">Customer Name</span>
                  <span className="font-medium text-stone-200">{placedOrder.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400">Items Ordered</span>
                  <span className="text-stone-200 font-medium">
                    {placedOrder.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-stone-800 pb-2">
                  <span className="text-stone-400">Total Payable (COD)</span>
                  <span className="font-mono font-bold text-amber-400">Rs. {placedOrder.totalAmount.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-stone-400 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Placed at {placedOrder.formattedTime}</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const encoded = encodeURIComponent(`Assalam-o-Alaikum, I am checking my Order #${placedOrder.orderNumber}`);
                    window.open(`https://wa.me/${BUSINESS_INFO.whatsappRaw}?text=${encoded}`, '_blank');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-stone-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <MessageCircle className="w-4 h-4 fill-stone-950" />
                  <span>Reopen WhatsApp Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPlacedOrder(null);
                    onClearCart();
                    onClose();
                  }}
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-200 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Done / Close Basket
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-stone-200">
                Your basket is empty
              </h3>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                Explore our authentic Lahori Murgh Channay or Crispy Fish dishes to get started!
              </p>
              <button
                onClick={onClose}
                type="button"
                className="mt-4 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 text-xs font-bold rounded-xl"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            <>
              {/* Order Type Toggle */}
              <div>
                <label className="text-xs font-medium text-stone-300 block mb-2">
                  Order Method
                </label>
                <div className="grid grid-cols-3 gap-2 bg-[#171924] p-1 rounded-xl border border-stone-800">
                  <button
                    type="button"
                    onClick={() => setOrderType('delivery')}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      orderType === 'delivery'
                        ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('takeaway')}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      orderType === 'takeaway'
                        ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Takeaway
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('dinein')}
                    className={`py-2 text-xs font-medium rounded-lg transition-all ${
                      orderType === 'dinein'
                        ? 'bg-amber-600 text-stone-950 font-bold shadow-sm'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Dine-in
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-400 pb-1">
                  <span>Selected Dishes</span>
                  <button
                    onClick={onClearCart}
                    type="button"
                    className="text-stone-500 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {cart.map(({ item, quantity }, idx) => (
                  <div
                    key={item.id || `cart-${item.name}-${idx}`}
                    className="bg-[#151822] border border-stone-800/90 rounded-xl p-3 flex items-center gap-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 rounded-lg object-cover bg-stone-900 border border-stone-800 shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-stone-100 truncate">
                        {item.name}
                      </h4>
                      <div className="text-xs font-bold text-amber-400 font-mono tabular-nums mt-0.5">
                        Rs. {item.price * quantity}
                        <span className="text-[10px] text-stone-500 font-normal ml-1">
                          (Rs. {item.price} each)
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-[#0e1017] border border-stone-800 rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        type="button"
                        aria-label="Decrease quantity"
                        className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-mono text-xs font-bold text-stone-200 tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        type="button"
                        aria-label="Increase quantity"
                        className="p-1 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      type="button"
                      aria-label="Remove item"
                      className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Free Delivery Promo Meter */}
              {orderType === 'delivery' && (
                <div className="bg-[#171926] border border-stone-800 rounded-xl p-3 text-xs">
                  {subtotal >= BUSINESS_INFO.freeDeliveryThreshold ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Congratulations! You unlocked FREE Delivery.</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-stone-300">
                        <span>Add Rs. {BUSINESS_INFO.freeDeliveryThreshold - subtotal} more for FREE Delivery</span>
                        <span className="font-mono text-amber-400">{Math.round((subtotal / BUSINESS_INFO.freeDeliveryThreshold) * 100)}%</span>
                      </div>
                      <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (subtotal / BUSINESS_INFO.freeDeliveryThreshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Contact & Delivery Address Form */}
              <div className="space-y-3 pt-3 border-t border-stone-800">
                <div className="flex items-center justify-between pb-1">
                  <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-amber-400" />
                    <span>Customer Details (گاہک کی معلومات)</span>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold">* لازمی فیلڈز</span>
                </div>

                {/* Name & Phone */}
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">
                      Your Name (آپ کا نام) <span className="text-red-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Haji Tanveer / Ali Usman"
                      value={customerName || ''}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined, general: undefined }));
                      }}
                      className={`w-full bg-[#161822] border rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none transition-colors ${
                        formErrors.name
                          ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500/40'
                          : 'border-stone-800 focus:border-amber-500'
                      }`}
                    />
                    {formErrors.name && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{formErrors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">
                      Contact / WhatsApp Mobile Number (فون یا واٹس ایپ نمبر) <span className="text-red-400 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0321 1234567"
                      value={customerPhone || ''}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: undefined, general: undefined }));
                      }}
                      className={`w-full bg-[#161822] border rounded-xl px-3.5 py-2.5 text-xs text-stone-100 font-mono placeholder-stone-500 focus:outline-none transition-colors ${
                        formErrors.phone
                          ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500/40'
                          : 'border-stone-800 focus:border-amber-500'
                      }`}
                    />
                    {formErrors.phone && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{formErrors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Address (Required for Home Delivery) */}
                {orderType === 'delivery' && (
                  <div>
                    <label className="text-[11px] font-medium text-stone-300 block mb-1">
                      Complete Delivery Address (مکمل پتہ: مکان / دکان #، گلی، علاقہ لاہور) <span className="text-red-400 font-bold">*</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="مثال: مکان نمبر 12، گلی نمبر 4، صادق پورہ، نزد جامع مسجد، بادامی باغ لاہور"
                      value={deliveryAddress || ''}
                      onChange={(e) => {
                        setDeliveryAddress(e.target.value);
                        if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: undefined, general: undefined }));
                      }}
                      className={`w-full bg-[#161822] border rounded-xl px-3.5 py-2.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none transition-colors resize-none ${
                        formErrors.address
                          ? 'border-red-500 bg-red-950/20 ring-1 ring-red-500/40'
                          : 'border-stone-800 focus:border-amber-500'
                      }`}
                    />
                    {formErrors.address && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{formErrors.address}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Special Instructions (Optional) */}
                <div>
                  <label className="text-[11px] font-medium text-stone-400 block mb-1">
                    Special Cooking Note (اختیاری: کوئی خاص ہدایت، مثلاً مرچ کم، روغنی نان گرم)
                  </label>
                  <input
                    type="text"
                    placeholder="Extra tarka roghan, mild spice, hot naan..."
                    value={specialInstructions || ''}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full bg-[#161822] border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          )}

        </div>

        {/* Drawer Footer / Checkout Trigger */}
        {cart.length > 0 && !placedOrder && (
          <div className="p-4 sm:p-5 border-t border-stone-800 bg-[#141722] space-y-3">
            
            {/* Bill Summary */}
            <div className="space-y-1.5 text-xs text-stone-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {orderType === 'delivery' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-mono tabular-nums">
                    {deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : `Rs. ${deliveryFee}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-100 pt-2 border-t border-stone-800">
                <span>Total Amount (COD)</span>
                <span className="text-amber-400 font-mono tabular-nums">
                  Rs. {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Validation Error Banner */}
            {formErrors.general && (
              <div className="p-3 bg-red-950/95 border border-red-500/80 rounded-xl text-xs text-red-200 flex items-start gap-2 shadow-lg animate-pulse">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{formErrors.general}</span>
              </div>
            )}

            {/* Instant WhatsApp Checkout Button */}
            <button
              onClick={handleWhatsAppCheckout}
              disabled={isSubmittingOrder}
              type="button"
              className={`w-full py-3.5 text-stone-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSubmittingOrder
                  ? 'bg-emerald-600/60 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-emerald-950/50 cursor-pointer'
              }`}
            >
              <MessageCircle className="w-5 h-5 text-stone-950 fill-stone-950" />
              <span>
                {isSubmittingOrder
                  ? 'Notifying Kitchen & Opening WhatsApp...'
                  : 'Send Order on WhatsApp (0321 1115672)'}
              </span>
            </button>

            {/* Direct Phone Call Alternative */}
            <div className="text-center">
              <a
                href={`tel:${BUSINESS_INFO.phone.replace(/\s+/g, '')}`}
                className="text-[11px] text-stone-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span>Prefer to call? Speak directly with counter</span>
              </a>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
