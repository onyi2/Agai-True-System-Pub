import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Search, Plus, Minus, Trash2, CheckCircle, Smartphone, CreditCard, DollarSign, Award } from 'lucide-react';
import { InventoryItem, Sale, SaleItem } from '../types';

interface POSSystemProps {
  inventory: InventoryItem[];
  currentUser: string;
  onLogSale: (sale: Omit<Sale, 'id' | 'timestamp'>) => void;
}

export const POSSystem: React.FC<POSSystemProps> = ({ inventory, currentUser, onLogSale }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<{ item: InventoryItem; quantity: number }[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile (M-Pesa)' | 'Tab'>('Cash');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [lastSaleAmount, setLastSaleAmount] = useState<number>(0);

  const categories = ['All', 'Beer', 'Spirits', 'Wine', 'Soft Drinks', 'Food'];

  // Filter inventory
  const filteredItems = inventory.filter(item => {
    let matchesCategory = false;
    if (selectedCategory === 'All') {
      matchesCategory = true;
    } else if (selectedCategory === 'Beer') {
      matchesCategory = item.category === 'Bottled Beer' || item.category === 'Canned Beer / RTD';
    } else if (selectedCategory === 'Spirits') {
      matchesCategory = ['Whisky', 'Gin', 'Vodka', 'Brandy / Cognac', 'Rum', 'Tequila', 'Liqueurs'].includes(item.category);
    } else if (selectedCategory === 'Wine') {
      matchesCategory = item.category === 'Wine';
    } else if (selectedCategory === 'Soft Drinks') {
      matchesCategory = item.category === 'Mixers / Soft Drinks' || item.category === 'Water';
    } else if (selectedCategory === 'Food') {
      matchesCategory = item.category === 'Food';
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchLower) ||
                          item.id.toLowerCase().includes(searchLower) ||
                          (item.sku && item.sku.toLowerCase().includes(searchLower));

    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: InventoryItem) => {
    // Check stock limit
    const existing = cart.find(c => c.item.id === item.id);
    const currentQtyInCart = existing ? existing.quantity : 0;
    
    if (currentQtyInCart >= item.quantity) {
      alert(`Cannot add more. Only ${item.quantity} units of ${item.name} available in stock.`);
      return;
    }

    if (existing) {
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (itemId: string, delta: number) => {
    const existing = cart.find(c => c.item.id === itemId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(c => c.item.id !== itemId));
      return;
    }

    // Check stock
    if (delta > 0 && newQty > existing.item.quantity) {
      alert(`Cannot add more. Only ${existing.item.quantity} units available.`);
      return;
    }

    setCart(cart.map(c => c.item.id === itemId ? { ...c, quantity: newQty } : c));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.item.id !== itemId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((total, c) => total + (c.item.sellPrice * c.quantity), 0);
  const discountValue = (subtotal * discountPercent) / 100;
  const total = subtotal - discountValue;
  const totalCost = cart.reduce((total, c) => total + (c.item.costPrice * c.quantity), 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const saleItems: SaleItem[] = cart.map(c => ({
      itemId: c.item.id,
      name: c.item.name,
      quantity: c.quantity,
      sellPrice: c.item.sellPrice,
      costPrice: c.item.costPrice
    }));

    // Trigger action to log the sale and deduct stock
    onLogSale({
      items: saleItems,
      totalAmount: total,
      totalCost: totalCost,
      paymentMethod,
      loggedBy: currentUser
    });

    setLastSaleAmount(total);
    setShowSuccess(true);
    clearCart();
    setDiscountPercent(0);

    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  return (
    <div id="pos-terminal" className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      {/* Products Selection Panel (2 Cols) */}
      <div className="xl:col-span-2 flex flex-col gap-4">
        {/* Search & Category Filter Header */}
        <div className="bg-brand-card border border-brand-card-light p-4 rounded-xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/40">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search beverages or food..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-brand-dark/50 border border-brand-card-light focus:border-brand-emerald focus:outline-none text-brand-light text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  selectedCategory === cat
                    ? 'bg-brand-emerald text-brand-dark shadow-[0_0_12px_rgba(0,212,165,0.25)]'
                    : 'bg-brand-card-light text-brand-light/70 hover:bg-brand-card-light/90 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 h-[550px] overflow-y-auto pr-1">
          {filteredItems.map(item => {
            const isLow = item.quantity <= item.minThreshold;
            const isOut = item.quantity === 0;
            const itemInCart = cart.find(c => c.item.id === item.id);
            const cartQty = itemInCart ? itemInCart.quantity : 0;
            const remainingQty = item.quantity - cartQty;

            return (
              <motion.div
                key={item.id}
                whileTap={!isOut ? { scale: 0.97 } : {}}
                onClick={() => !isOut && addToCart(item)}
                className={`p-3 rounded-xl border flex flex-col justify-between h-36 relative transition-all duration-300 ${
                  isOut
                    ? 'bg-brand-card/30 border-red-500/10 cursor-not-allowed opacity-50'
                    : 'bg-brand-card hover:bg-brand-card-light cursor-pointer border-brand-card-light'
                }`}
              >
                {/* Quantity in Cart indicator */}
                {cartQty > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-emerald text-brand-dark text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
                    {cartQty}
                  </span>
                )}

                <div>
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-brand-light/40">
                      {item.category}
                    </span>
                    {isOut ? (
                      <span className="bg-brand-danger/20 text-brand-danger text-[9px] font-bold px-1 rounded">
                        OUT
                      </span>
                    ) : isLow ? (
                      <span className="bg-brand-gold/10 text-brand-gold text-[9px] font-bold px-1 rounded">
                        LOW
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 text-[9px] px-1.5 rounded font-mono font-bold">{item.id}</span>
                  </div>
                  <h5 className="font-bold text-xs mt-1.5 line-clamp-2 text-white font-display">
                    {item.name}
                  </h5>
                </div>

                <div className="flex justify-between items-end mt-2">
                  <div>
                    <p className="text-[10px] text-brand-light/40">Price</p>
                    <p className="text-xs font-bold text-brand-gold">
                      KES {item.sellPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-brand-light/40">Stock</p>
                    <p className={`text-[11px] font-semibold ${isOut ? 'text-brand-danger' : isLow ? 'text-brand-gold' : 'text-brand-emerald'}`}>
                      {remainingQty} {item.unit}s
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-12 text-center text-brand-light/50 bg-brand-card/20 rounded-xl border border-dashed border-brand-card-light">
              No products found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Cart & Checkout Side Panel */}
      <div className="bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg flex flex-col justify-between h-[610px]">
        <div>
          <div className="flex justify-between items-center border-b border-brand-card-light pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand-emerald" />
              <h4 className="font-bold text-white font-display">Active Order</h4>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-brand-danger hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="h-[240px] overflow-y-auto pr-1 flex flex-col gap-2">
            <AnimatePresence>
              {cart.map(({ item, quantity }) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-brand-dark/40 border border-brand-card-light/40 text-sm"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-xs text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-brand-gold">
                      KES {item.sellPrice.toLocaleString()} / {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartQuantity(item.id, -1)}
                      className="p-1 rounded bg-brand-card-light text-brand-light hover:bg-brand-emerald hover:text-brand-dark transition-all"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-xs w-6 text-center text-white">{quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, 1)}
                      className="p-1 rounded bg-brand-card-light text-brand-light hover:bg-brand-emerald hover:text-brand-dark transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 rounded bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white transition-all ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-brand-light/30 gap-2">
                <ShoppingCart className="w-10 h-10 stroke-1" />
                <p className="text-xs">Cart is empty. Tap items on left.</p>
              </div>
            )}
          </div>
        </div>

        {/* Calculation & Payment Segment */}
        <div>
          {/* Preset Discounts */}
          <div className="mb-4">
            <p className="text-xs text-brand-light/60 font-medium mb-1.5">Apply Quick Discount</p>
            <div className="grid grid-cols-4 gap-1">
              {[0, 5, 10, 15].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDiscountPercent(p)}
                  className={`py-1 rounded text-xs font-semibold ${
                    discountPercent === p
                      ? 'bg-brand-gold text-brand-dark'
                      : 'bg-brand-card-light text-brand-light/70 hover:bg-brand-card-light/90'
                  }`}
                >
                  {p === 0 ? 'None' : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mb-4">
            <p className="text-xs text-brand-light/60 font-medium mb-1.5">Select Payment Mode</p>
            <div className="grid grid-cols-4 gap-1">
              {[
                { name: 'Cash', icon: DollarSign },
                { name: 'Card', icon: CreditCard },
                { name: 'Mobile (M-Pesa)', icon: Smartphone },
                { name: 'Tab', icon: Award }
              ].map(pay => {
                const Icon = pay.icon;
                const isSelected = paymentMethod === pay.name;
                return (
                  <button
                    key={pay.name}
                    type="button"
                    onClick={() => setPaymentMethod(pay.name as any)}
                    className={`py-2 rounded flex flex-col items-center gap-1 font-semibold transition-all ${
                      isSelected
                        ? 'bg-brand-emerald text-brand-dark shadow-[0_0_10px_rgba(0,212,165,0.15)]'
                        : 'bg-brand-card-light text-brand-light/70 hover:bg-brand-card-light/90'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[9px] truncate w-full px-0.5 text-center">{pay.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border-t border-brand-card-light pt-3 flex flex-col gap-1.5 text-xs mb-4">
            <div className="flex justify-between text-brand-light/60">
              <span>Subtotal:</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-brand-gold font-medium">
                <span>Discount ({discountPercent}%):</span>
                <span>- KES {discountValue.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-brand-light/60">
              <span>Payment Mode:</span>
              <span className="font-semibold text-brand-light">{paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold text-white border-t border-dashed border-brand-card-light pt-2">
              <span>Total Payable:</span>
              <span className="text-brand-emerald">KES {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Log Sale Submission */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              cart.length === 0
                ? 'bg-brand-card-light text-brand-light/30 cursor-not-allowed border border-brand-card-light'
                : 'bg-brand-emerald text-brand-dark hover:bg-brand-emerald/90 active:scale-98 shadow-[0_4px_15px_rgba(0,212,165,0.25)]'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Log POS Sale
          </button>
        </div>
      </div>

      {/* Success Notification Overlays */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#081C24] border border-brand-emerald p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm"
          >
            <CheckCircle className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">Sale Logged Successfully!</p>
              <p className="text-xs text-brand-light/60 mt-0.5">
                Processed sale of <span className="font-semibold text-brand-emerald">KES {lastSaleAmount.toLocaleString()}</span>. Stock levels updated in real-time.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
