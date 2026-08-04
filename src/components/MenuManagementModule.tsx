import React, { useState } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  CheckCircle, 
  XCircle, 
  UtensilsCrossed,
  Lock,
  ShieldAlert,
  Image as ImageIcon,
  Upload,
  Sparkles
} from 'lucide-react';
import { MenuItem, Category, Role } from '../types';

interface MenuManagementModuleProps {
  menuItems: MenuItem[];
  currentUserRole: Role;
  onToggleSoldOut: (itemId: string, isSoldOut: boolean) => void;
  onSaveMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
}

const CATEGORIES: Category[] = ['Ulam', 'Rice', 'Drinks', 'Snacks', 'Specials'];

const PRESET_DISH_IMAGES = [
  { name: 'Adobo / Stew', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sinigang / Soup', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Spicy / Bicol Express', url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80' },
  { name: 'Veggies / Pinakbet', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80' },
  { name: 'Kare-Kare / Meat', url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80' },
  { name: 'Steamed White Rice', url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80' },
  { name: 'Cold Drink / Juice', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Dessert / Halo-Halo', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80' },
];

export const MenuManagementModule: React.FC<MenuManagementModuleProps> = ({
  menuItems,
  currentUserRole,
  onToggleSoldOut,
  onSaveMenuItem,
  onDeleteMenuItem,
}) => {
  const isOwner = currentUserRole === 'ADMIN';

  const [selectedCategory, setSelectedCategory] = useState<Category | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Ulam');
  const [formPrice, setFormPrice] = useState<number>(70);
  const [formAllowHalf, setFormAllowHalf] = useState<boolean>(true);
  const [formHalfPrice, setFormHalfPrice] = useState<number>(35);
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    if (!isOwner) {
      alert('Access Denied: Only store owners can add or edit menu items.');
      return;
    }
    setEditingItem(null);
    setFormName('');
    setFormCategory('Ulam');
    setFormPrice(70);
    setFormAllowHalf(true);
    setFormHalfPrice(35);
    setFormDesc('');
    setFormImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    if (!isOwner) {
      alert('Access Denied: Only store owners can edit dish items and prices.');
      return;
    }
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormAllowHalf(item.allowHalfOrder);
    setFormHalfPrice(item.halfPrice || Math.round(item.price / 2));
    setFormDesc(item.description || '');
    setFormImage(item.image || '');
    setIsModalOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 600;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setFormImage(compressedDataUrl);
          } else {
            setFormImage(event.target?.result as string);
          }
        };
        img.onerror = () => {
          if (event.target?.result) {
            setFormImage(event.target.result as string);
          }
        };
        if (event.target?.result) {
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;

    if (!formName.trim()) {
      alert('Please enter a valid dish name.');
      return;
    }

    const newItem: MenuItem = {
      id: editingItem ? editingItem.id : 'm-' + Date.now(),
      name: formName.trim(),
      category: formCategory,
      price: formPrice,
      allowHalfOrder: formAllowHalf,
      halfPrice: formAllowHalf ? formHalfPrice : undefined,
      isSoldOut: editingItem ? editingItem.isSoldOut : false,
      description: formDesc.trim() || undefined,
      image: formImage.trim() || undefined,
    };

    onSaveMenuItem(newItem);
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Employee Restricted Notice Banner */}
      {!isOwner && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 flex items-start space-x-3 text-amber-900 shadow-airmee">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-extrabold text-amber-900">
              Employee Read-Only View: Owner Permissions Required
            </h4>
            <p className="text-amber-800 font-medium">
              You are currently logged in as an Employee Cashier. Menu editing (adding dishes, modifying prices, or deleting items) is strictly restricted to the Store Owner.
            </p>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="bg-orange-50 text-orange-600 border border-orange-200/60 text-[11px] font-extrabold px-3.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
            Inventory & Dishes
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-600" />
            Daily Menu Digitization & Stock Control
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage carinderia rotating daily recipes, portion half-prices, and instant sold-out badges
          </p>
        </div>

        {isOwner ? (
          <button
            onClick={handleOpenAdd}
            className="w-full md:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-full text-xs flex items-center justify-center space-x-2 shadow-airmee-orange transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish Item</span>
          </button>
        ) : (
          <div className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-slate-500 font-bold rounded-full text-xs flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Owner Only Action</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl shadow-airmee border border-slate-200/80 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search dishes to inspect stock or prices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/70 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 font-medium"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange'
                  : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              All ({menuItems.length})
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white border-orange-600 shadow-airmee-orange'
                    : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-white rounded-3xl border p-5 shadow-airmee transition-all flex flex-col justify-between ${
              item.isSoldOut ? 'border-red-200/80 bg-red-50/10' : 'border-slate-200/80 hover:border-orange-500/80'
            }`}
          >
            <div className="space-y-4">
              {/* Dish Image */}
              <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                    <UtensilsCrossed className="w-8 h-8 opacity-40" />
                  </div>
                )}

                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 border border-slate-200/60 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  {item.category}
                </span>

                {/* Real-time Sold Out Toggle Overlay Badge */}
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => {
                    if (!isOwner) {
                      alert('Only the store owner can toggle stock / sold-out status.');
                      return;
                    }
                    onToggleSoldOut(item.id, !item.isSoldOut);
                  }}
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-extrabold flex items-center space-x-1 transition-all shadow-xs ${
                    item.isSoldOut
                      ? 'bg-red-600 text-white'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  } ${!isOwner ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {item.isSoldOut ? (
                    <>
                      <XCircle className="w-3 h-3" />
                      <span>SOLD OUT</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 text-white" />
                      <span>In Stock</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">{item.name}</h3>
                {item.description && (
                  <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>

              <div className="flex items-center space-x-4 pt-1 text-xs font-bold text-slate-900">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Full Price</span>
                  <span className="text-lg font-black text-slate-900">₱{item.price.toFixed(2)}</span>
                </div>

                {item.allowHalfOrder && (
                  <div className="border-l border-slate-200/80 pl-4">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Half Portion</span>
                    <span className="text-lg font-black text-orange-600">₱{(item.halfPrice || item.price / 2).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              {isOwner ? (
                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-4 py-2 bg-slate-50 hover:bg-orange-50 text-slate-800 hover:text-orange-600 border border-slate-200/80 rounded-full text-xs font-extrabold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                        onDeleteMenuItem(item.id);
                      }
                    }}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-full text-xs font-extrabold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-orange-600" />
                  Owner edit restricted
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && isOwner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveForm}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4 border border-[#E8E2DD]"
          >
            <h3 className="font-bold text-base text-[#2D241E] border-b border-[#E8E2DD] pb-2">
              {editingItem ? 'Edit Dish Item' : 'Add New Dish Item'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">
                  Dish Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pork Sinigang na Baboy"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D241E] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D241E] mb-1">
                    Base Price (₱) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setFormPrice(val);
                      setFormHalfPrice(Math.round(val / 2));
                    }}
                    className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none font-bold"
                  />
                </div>
              </div>

              {/* Half-Order Portion Scaling Switch */}
              <div className="bg-[#FCFAF7] border border-[#E8E2DD] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D241E]">
                    Allow Half-Order Portion Scaling?
                  </span>
                  <input
                    type="checkbox"
                    checked={formAllowHalf}
                    onChange={(e) => setFormAllowHalf(e.target.checked)}
                    className="w-4 h-4 text-[#E65100] rounded focus:ring-[#E65100] cursor-pointer"
                  />
                </div>

                {formAllowHalf && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#756D67] mb-1">
                      Half Portion Price (₱)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formHalfPrice}
                      onChange={(e) => setFormHalfPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none font-bold text-[#E65100]"
                    />
                  </div>
                )}
              </div>

              {/* Dish Image Management */}
              <div className="bg-[#FCFAF7] border border-[#E8E2DD] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D241E] flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#E65100]" />
                    <span>Dish Photo / Display Image</span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {formImage && (
                      <button
                        type="button"
                        onClick={() => setFormImage('')}
                        className="bg-white border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg text-[11px] font-bold text-red-600 transition cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    )}
                    <label className="cursor-pointer bg-white border border-[#E8E2DD] hover:bg-orange-50 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#E65100] flex items-center gap-1 shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* Image Preview Box */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-[#E8E2DD] shrink-0 relative flex items-center justify-center">
                    {formImage ? (
                      <img
                        src={formImage}
                        alt="Dish Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <input
                      type="text"
                      placeholder="Paste Image URL (https://...)"
                      value={formImage}
                      onChange={(e) => setFormImage(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E8E2DD] rounded-lg focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                    />

                    {/* Quick Preset Pickers */}
                    <div>
                      <span className="text-[10px] text-[#756D67] font-bold block mb-1">Quick Filipino Dish Preset Photos:</span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_DISH_IMAGES.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormImage(preset.url)}
                            className="text-[10px] bg-white border border-[#E8E2DD] hover:border-[#E65100] text-[#2D241E] px-2 py-0.5 rounded transition cursor-pointer font-medium"
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D241E] mb-1">
                  Description / Ingredients (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tender pork stewed in sour tamarind broth..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E8E2DD] rounded-xl focus:ring-2 focus:ring-[#E65100] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E8E2DD]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#756D67] hover:bg-[#FCFAF7] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#E65100] hover:bg-[#BF360C] text-white rounded-xl shadow-2xs cursor-pointer"
              >
                Save Dish
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
