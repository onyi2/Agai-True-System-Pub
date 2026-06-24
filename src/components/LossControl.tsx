import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Trash2, TrendingDown, ClipboardList, CheckCircle, 
  ArrowRight, Sparkles, HelpCircle, FileDown, Plus
} from 'lucide-react';
import { InventoryItem, Loss } from '../types';

interface LossControlProps {
  inventory: InventoryItem[];
  losses: Loss[];
  currentUser: string;
  onLogLoss: (loss: Omit<Loss, 'id' | 'date' | 'costValue'>) => void;
  onDeleteLoss: (id: string) => void;
}

export const LossControl: React.FC<LossControlProps> = ({
  inventory,
  losses,
  currentUser,
  onLogLoss,
  onDeleteLoss
}) => {
  const [showLogForm, setShowLogForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    itemId: '',
    type: 'Breakage' as any,
    quantity: 1,
    notes: ''
  });

  const handleLossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId || formData.quantity <= 0) return;

    const matchedItem = inventory.find(item => item.id === formData.itemId);
    if (!matchedItem) return;

    if (formData.quantity > matchedItem.quantity) {
      alert(`Warning: You cannot log a loss of ${formData.quantity} units because you only have ${matchedItem.quantity} units of ${matchedItem.name} left in stock.`);
      return;
    }

    onLogLoss({
      itemId: formData.itemId,
      itemName: matchedItem.name,
      type: formData.type,
      quantity: Number(formData.quantity),
      notes: formData.notes || 'No comments.',
      loggedBy: currentUser
    });

    // Reset Form
    setFormData({
      itemId: '',
      type: 'Breakage',
      quantity: 1,
      notes: ''
    });
    setShowLogForm(false);
    alert('Loss recorded successfully! Stock subtracted and Variance updated.');
  };

  const totalLossValue = losses.reduce((acc, l) => acc + l.costValue, 0);

  // Filter types for stats
  const lossByType = losses.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + l.costValue;
    return acc;
  }, {} as { [key: string]: number });

  const formatKES = (value: number) => `KES ${value.toLocaleString()}`;

  return (
    <div id="loss-control-section" className="mt-6 space-y-6">
      {/* Aggregated Loss Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-brand-card-light p-4 rounded-xl shadow">
          <p className="text-[10px] font-bold text-brand-light/50 uppercase tracking-wider font-display">Total Variance Loss</p>
          <p className="text-2xl font-bold text-brand-danger mt-1 font-display">{formatKES(totalLossValue)}</p>
          <div className="flex items-center gap-1.5 text-brand-light/40 text-[10px] mt-2">
            <ShieldAlert className="w-3.5 h-3.5 text-brand-danger" />
            <span>Audited loss write-off</span>
          </div>
        </div>

        {['Breakage', 'Spillage', 'Theft', 'Complimentary'].map(type => {
          const val = lossByType[type] || 0;
          return (
            <div key={type} className="bg-brand-card/60 border border-brand-card-light p-4 rounded-xl">
              <p className="text-[10px] font-semibold text-brand-light/50 uppercase tracking-wider">{type} Losses</p>
              <p className="text-lg font-bold text-white mt-1">{formatKES(val)}</p>
              <div className="w-full bg-brand-card-light/50 h-1 rounded-full mt-3 overflow-hidden">
                <div 
                  className={`h-full ${type === 'Complimentary' ? 'bg-brand-emerald' : 'bg-brand-danger'}`}
                  style={{ width: `${totalLossValue > 0 ? (val / totalLossValue) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Panel split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Loss Logger Form (1 Col) */}
        <div className="xl:col-span-1 bg-brand-card border border-brand-card-light p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 border-b border-brand-card-light pb-3">
            <ShieldAlert className="w-5 h-5 text-brand-danger" />
            <h4 className="font-bold text-white font-display">Record Breakage & Waste</h4>
          </div>

          <form onSubmit={handleLossSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-brand-light/60 font-medium mb-1">Select Damaged/Lost Item *</label>
              <select
                required
                value={formData.itemId}
                onChange={e => setFormData({ ...formData, itemId: e.target.value })}
                className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
              >
                <option value="">-- Choose Inventory Item --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit}s remaining)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-light/60 font-medium mb-1">Loss Category *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                >
                  <option value="Breakage">Breakage (Drop)</option>
                  <option value="Spillage">Spillage (Draft/Line)</option>
                  <option value="Theft">Theft / Discrepancy</option>
                  <option value="Complimentary">Complimentary / VIP</option>
                  <option value="Expired">Expired Stock</option>
                </select>
              </div>
              <div>
                <label className="block text-brand-light/60 font-medium mb-1">Quantity Lost *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-center text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-brand-light/60 font-medium mb-1">Audit Explanatory Notes / Incident Reason *</label>
              <textarea
                required
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Describe how the loss occurred (e.g., 'Draft system line wash' or 'Broken bottle behind back bar cupboard')"
                className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-brand-light"
              />
            </div>

            <div className="border-t border-brand-card-light pt-3">
              <p className="text-[10px] text-brand-light/40 italic mb-3">
                * Note: Registering a loss will immediately decrement available stock. The loss cost (cost price) will be accounted in Variance and deducted from Net Profit computations.
              </p>
              
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-danger text-white font-bold tracking-wide hover:bg-brand-danger/90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-danger/10"
              >
                <ShieldAlert className="w-4 h-4" /> Log Waste & Deduct Stock
              </button>
            </div>
          </form>
        </div>

        {/* Losses Log Records (2 Cols) */}
        <div className="xl:col-span-2 bg-brand-card border border-brand-card-light p-5 rounded-xl shadow-lg flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-brand-card-light pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-gold" />
                <h4 className="font-bold text-white font-display">Variance Audit Records</h4>
              </div>
              <span className="text-[11px] text-brand-light/50">Historic Log</span>
            </div>

            <div className="overflow-y-auto max-h-[350px] pr-1 space-y-3">
              {losses.map(loss => {
                const isComp = loss.type === 'Complimentary';
                return (
                  <div 
                    key={loss.id}
                    className="p-3 rounded-lg bg-brand-dark/40 border border-brand-card-light/40 flex flex-col md:flex-row justify-between md:items-center gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isComp ? 'bg-brand-emerald/15 text-brand-emerald' : 'bg-brand-danger/15 text-brand-danger'
                        }`}>
                          {loss.type}
                        </span>
                        <span className="text-[10px] text-brand-light/40 font-semibold">{loss.date}</span>
                        <span className="text-[10px] text-brand-light/40">• Logged by: {loss.loggedBy}</span>
                      </div>
                      <h5 className="font-bold text-white mt-1.5">{loss.itemName}</h5>
                      <p className="text-brand-light/60 mt-0.5 text-[11px] leading-relaxed italic">
                        "{loss.notes}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-brand-card-light/50">
                      <div className="text-left md:text-right">
                        <p className="text-[9px] text-brand-light/40 font-semibold uppercase">Loss Value</p>
                        <p className="font-bold text-brand-danger mt-0.5">{formatKES(loss.costValue)}</p>
                        <p className="text-[10px] text-brand-light/50 mt-0.5">({loss.quantity} items)</p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Delete loss write-off log for ${loss.itemName}? Note: This is an audit action.`)) {
                            onDeleteLoss(loss.id);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-brand-danger/10 text-brand-light/40 hover:text-brand-danger transition-all"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {losses.length === 0 && (
                <div className="py-12 text-center text-brand-light/30">
                  <ClipboardList className="w-10 h-10 mx-auto stroke-1 mb-2" />
                  <p>No variance write-offs or breakages logged yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
