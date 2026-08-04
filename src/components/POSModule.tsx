import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  UserCheck, 
  Zap, 
  Utensils, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { MenuItem, CartItem, Category, SelectedModifier } from '../types';

interface POSModuleProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem, isHalfOrder: boolean, modifiers?: SelectedModifier[]) => void;
  onUpdateCartItemQuantity: (cartItemId: string, newQty: number) => void;
  onRemoveCartItem: (cartItemId: string) => void;
  onClearCart: () => void;
  isSeniorOrPwd: boolean;
  onToggleSeniorPwd: (enabled: boolean, idNumber?: string, customerName?: string) => void;
  seniorPwdId: string;
  seniorPwdName: string;
  onOpenCheckout: () => void;
}

const CATEGORIES: Category[] = ['Ulam', 'Rice', 'Drinks', 'Snacks', 'Specials'];

export const POSModule: React.FC<POSModuleProps> = ({
  menuItems,
  cart,
  onAddToCart,
  onUpdateCartItemQuantity,
  onRemoveCartItem,
  onClearCart,
  isSeniorOrPwd,
  onToggleSeniorPwd,
  seniorPwdId,
  seniorPwdName,
  onOpenCheckout,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSeniorModal, setShowSeniorModal] = useState<boolean>(false);
  const [tempId, setTempId] = useState<string>(seniorPwdId || '');
  const [tempName, setTempName] = useState<string>(seniorPwdName || '');

  // Half-order toggle mode active state per dish card
  const [halfOrderStates, setHalfOrderStates] = useState<Record<string, boolean>>({});

  const toggleHalfOrderState = (itemId: string) => {
    setHalfOrderStates((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  // Compute cart math
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  // Philippine Statutory SC/PWD discount calculation
  const discountDetails = useMemo(() => {
    if (!isSeniorOrPwd || cartSubtotal === 0) {
      return {
        vatExemptAmount: 0,
        discountAmount: 0,
        finalTotal: cartSubtotal,
      };
    }

    const netSales = cartSubtotal / 1.12;
    const vatExemptAmount = cartSubtotal - netSales;
    const discountAmount = netSales * 0.20;
    const finalTotal = Math.max(0, netSales - discountAmount);

    return {
      vatExemptAmount,
      discountAmount,
      finalTotal,
    };
  }, [cartSubtotal, isSeniorOrPwd]);

  const handleApplySeniorModal = () => {
    if (!tempId.trim()) {
      alert('Please enter a valid Senior Citizen or PWD ID Number for statutory compliance.');
      return;
    }
    onToggleSeniorPwd(true, tempId.trim(), tempName.trim());
    setShowSeniorModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: HIGH-SPEED QUICK-KEYS MENU (7-8 Cols on LG) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* Top Bar: Search & Category Tabs Card */}
          <div className="bg-white rounded-3xl p-5 shadow-airmee border border-slate-100 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes (e.g. Adobo, Rice)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-slate-900 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Peak-Hour High-Speed Indicator */}
              <div className="flex items-center space-x-2 text-xs font-bold text-orange-600 bg-orange-50/80 border border-orange-100 px-4 py-2 rounded-full w-full sm:w-auto justify-center">
                <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                <span>Quick-Keys POS Active</span>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none pt-1">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-airmee'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                All Dishes ({menuItems.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = menuItems.filter((m) => m.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-airmee-orange'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

          </div>

          {/* Quick-Keys Dishes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMenuItems.map((dish) => {
              const isHalf = halfOrderStates[dish.id] || false;
              const effectivePrice = isHalf && dish.halfPrice ? dish.halfPrice : dish.price;

              return (
                <div
                  key={dish.id}
                  className={`relative flex flex-col justify-between bg-white rounded-3xl p-4 border transition-all shadow-airmee hover:shadow-airmee-hover ${
                    dish.isSoldOut
                      ? 'border-slate-200 bg-slate-50/60 opacity-60'
                      : 'border-slate-100 hover:border-orange-200'
                  }`}
                >
                  {/* Sold Out Badge */}
                  {dish.isSoldOut && (
                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] rounded-3xl z-10 flex items-center justify-center p-3">
                      <span className="bg-slate-900 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-full shadow-airmee tracking-widest">
                        Sold Out
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Dish Image Thumbnail */}
                    {dish.image && (
                      <div className="w-full h-28 rounded-2xl overflow-hidden mb-3 bg-slate-100 border border-slate-100">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Category Label & Price */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                        {dish.category}
                      </span>
                      <span className="text-base font-black text-orange-600">
                        ₱{effectivePrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Dish Name */}
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.25rem]">
                      {dish.name}
                    </h4>

                    {/* Description preview */}
                    {dish.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1 font-medium">
                        {dish.description}
                      </p>
                    )}
                  </div>

                  {/* Half-Order Portion Switch & Add Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    {/* Portion switch toggle if dish allows half order */}
                    {dish.allowHalfOrder && (
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-full p-1 text-[10px]">
                        <span className="text-slate-400 font-bold pl-2">Portion:</span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isHalf) toggleHalfOrderState(dish.id);
                            }}
                            className={`px-2.5 py-1 rounded-full font-bold transition text-[10px] cursor-pointer ${
                              !isHalf ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Full
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isHalf) toggleHalfOrderState(dish.id);
                            }}
                            className={`px-2.5 py-1 rounded-full font-bold transition text-[10px] cursor-pointer ${
                              isHalf ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Half
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Add Button */}
                    <button
                      disabled={dish.isSoldOut}
                      onClick={() => onAddToCart(dish, isHalf)}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-extrabold rounded-full text-xs flex items-center justify-center space-x-1.5 transition shadow-airmee-orange cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Add to Order</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE ORDER CART & CHECKOUT PANEL (4-5 Cols on LG) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="bg-white rounded-3xl shadow-airmee border border-slate-100 flex flex-col h-full sticky top-20 overflow-hidden">
            
            {/* Cart Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Current Order</h3>
                  <span className="text-[11px] font-bold text-slate-400 block">Counter Order Ticket</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="bg-orange-50 text-orange-600 border border-orange-100 font-extrabold text-xs px-3 py-1 rounded-full">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
                {cart.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition rounded-full hover:bg-red-50 cursor-pointer"
                    title="Clear Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[380px] space-y-4 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 mx-auto flex items-center justify-center text-slate-300">
                    <Utensils className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">Order ticket is empty</p>
                    <p className="text-xs text-slate-400 mt-0.5">Select menu items on the left to add to order</p>
                  </div>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartItemId} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {item.menuItem.name}
                        </span>
                        {item.isHalfOrder && (
                          <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                            Half Portion
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        ₱{item.unitPrice.toFixed(2)} each
                      </div>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center border border-slate-200/80 rounded-full bg-slate-50 p-0.5">
                        <button
                          onClick={() => onUpdateCartItemQuantity(item.cartItemId, item.quantity - 1)}
                          className="w-6 h-6 rounded-full hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3 stroke-[3]" />
                        </button>
                        <span className="px-2 text-xs font-black text-slate-900 min-w-[1.25rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateCartItemQuantity(item.cartItemId, item.quantity + 1)}
                          className="w-6 h-6 rounded-full hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>

                      <div className="text-right min-w-[3.5rem]">
                        <div className="font-black text-slate-900 text-sm">
                          ₱{item.totalPrice.toFixed(2)}
                        </div>
                        <button
                          onClick={() => onRemoveCartItem(item.cartItemId)}
                          className="text-[10px] text-slate-400 hover:text-red-600 font-bold transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Statutory Discount Toggle (Senior Citizen / PWD 20% + 12% VAT) */}
            <div className="p-4 bg-orange-50/60 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-extrabold text-slate-900">
                    Senior / PWD Discount (20% + VAT Exempt)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isSeniorOrPwd}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setShowSeniorModal(true);
                    } else {
                      onToggleSeniorPwd(false);
                    }
                  }}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
              </div>

              {isSeniorOrPwd && (
                <div className="text-[11px] bg-white border border-orange-100 rounded-2xl p-2.5 text-slate-900 flex items-center justify-between shadow-2xs">
                  <div>
                    <span className="font-bold text-orange-600">ID:</span>{' '}
                    <span className="font-semibold">{seniorPwdId || 'Not specified'}</span>
                    {seniorPwdName && (
                      <span className="text-slate-400 ml-1">({seniorPwdName})</span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSeniorModal(true)}
                    className="text-orange-600 font-bold hover:underline cursor-pointer"
                  >
                    Edit ID
                  </button>
                </div>
              )}
            </div>

            {/* Cart Summary & Math */}
            <div className="p-5 bg-slate-900 text-white space-y-4">
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-white">₱{cartSubtotal.toFixed(2)}</span>
                </div>

                {isSeniorOrPwd && (
                  <>
                    <div className="flex justify-between text-amber-300">
                      <span>Less 12% VAT Exemption</span>
                      <span>-₱{discountDetails.vatExemptAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>Less 20% Statutory Discount</span>
                      <span>-₱{discountDetails.discountAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-sm font-black text-white uppercase tracking-wider">Total Bill</span>
                  <span className="text-2xl font-black text-orange-400">
                    ₱{discountDetails.finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Checkout Action Button */}
              <button
                disabled={cart.length === 0}
                onClick={onOpenCheckout}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:scale-[0.99] disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-2xl text-base shadow-airmee-orange transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>PROCEED TO PAYMENT</span>
                <ChevronRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Senior Citizen / PWD ID Verification Modal */}
      {showSeniorModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center space-x-2.5 text-orange-600">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Senior Citizen / PWD Verification
                </h3>
                <p className="text-xs text-slate-400">RA 9994 / RA 10754 Statutory Discount</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              In compliance with Philippine Statutory Law, Senior Citizens and Persons with Disability receive 20% discount and 12% VAT exemption on personal food purchases.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ID Number (Mandatory) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SC-MKN-2026-8812"
                  value={tempId}
                  onChange={(e) => setTempId(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:outline-none focus:bg-white text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Cardholder Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardo Dalisay"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:ring-2 focus:ring-orange-500 focus:outline-none focus:bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowSeniorModal(false);
                  if (!seniorPwdId) onToggleSeniorPwd(false);
                }}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplySeniorModal}
                className="px-6 py-2.5 text-xs font-black bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-airmee-orange transition cursor-pointer"
              >
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
