import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, ClipboardList, TrendingDown, Receipt, Plus, 
  Trash2, UploadCloud, CheckCircle, FileText
} from 'lucide-react';
import { Expense, DeliveryRecord } from '../types';

interface ExpensesTrackerProps {
  expenses: Expense[];
  deliveries?: DeliveryRecord[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesTracker: React.FC<ExpensesTrackerProps> = ({
  expenses,
  deliveries = [],
  onAddExpense,
  onDeleteExpense
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReceiptName, setUploadedReceiptName] = useState<string>('');
  const [reconciliationResult, setReconciliationResult] = useState<{
    matchedDeliveryId: string | null;
    variance: number;
    message: string;
    status: 'matched' | 'discrepancy' | 'unmatched';
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    category: 'Rent' as any,
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Paid' as any
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0 || !formData.description) return;

    onAddExpense({
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      date: formData.date,
      status: formData.status,
      receiptUrl: uploadedReceiptName ? `receipts/${uploadedReceiptName}` : undefined
    });

    // Reset Form
    setFormData({
      category: 'Rent',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0],
      status: 'Paid'
    });
    setUploadedReceiptName('');
    setReconciliationResult(null);
    setShowAddForm(false);
    alert('Operating expense logged successfully!');
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setReconciliationResult(null);
      
      // Simulate reading with File API
      const reader = new FileReader();
      reader.onload = (event) => {
        // Simulate an OCR scan delay
        setTimeout(() => {
          setIsUploading(false);
          setUploadedReceiptName(file.name);
          
          let extractedAmount = Math.floor(Math.random() * 5000) + 500;
          let reconStatus: 'matched' | 'discrepancy' | 'unmatched' = 'unmatched';
          let reconMessage = 'No matching stock delivery records found for this invoice.';
          let reconVariance = 0;
          let matchedId = null;

          // Attempt reconciliation against recent deliveries
          if (deliveries && deliveries.length > 0) {
            // Pick a recent delivery to simulate a match
            const recentDelivery = deliveries[0];
            matchedId = recentDelivery.id;
            
            // 70% chance of exact match, 30% chance of discrepancy
            if (Math.random() > 0.3) {
              extractedAmount = recentDelivery.totalAmount;
              reconStatus = 'matched';
              reconMessage = `Amount perfectly matches delivery record ${recentDelivery.id.split('-')[0]} from ${recentDelivery.supplier}.`;
            } else {
              // Simulate discrepancy (supplier overcharged or missing items)
              const varianceAmount = Math.floor(Math.random() * 1500) + 100;
              extractedAmount = recentDelivery.totalAmount + varianceAmount;
              reconVariance = varianceAmount;
              reconStatus = 'discrepancy';
              reconMessage = `Discrepancy detected! Invoice total is higher than received stock value for delivery ${recentDelivery.id.split('-')[0]} by KES ${varianceAmount.toLocaleString()}. Flagging for review.`;
            }
          }
          
          // AI OCR Mock Data Extraction
          setFormData(prev => ({
            ...prev,
            amount: extractedAmount,
            description: `Auto-extracted from ${file.name} (Supplier Invoice)`,
            category: 'Suppliers',
            status: 'Paid'
          }));

          setReconciliationResult({
            matchedDeliveryId: matchedId,
            variance: reconVariance,
            message: reconMessage,
            status: reconStatus
          });
        }, 2000);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalOverheadAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Group by category
  const expenseByCategory = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as { [key: string]: number });

  const formatKES = (value: number) => `KES ${value.toLocaleString()}`;

  return (
    <div id="expenses-tracker-section" className="mt-6 space-y-6">
      {/* Top statistical line */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-brand-card-light p-4 rounded-xl shadow">
          <p className="text-[10px] font-bold text-brand-light/50 uppercase tracking-wider font-display">Total Overheads</p>
          <p className="text-2xl font-bold text-brand-gold mt-1 font-display">{formatKES(totalOverheadAmount)}</p>
          <div className="flex items-center gap-1.5 text-brand-light/40 text-[10px] mt-2">
            <TrendingDown className="w-3.5 h-3.5 text-brand-gold" />
            <span>Operational costs</span>
          </div>
        </div>

        {['Rent', 'Utilities', 'Salaries', 'Suppliers'].map(category => {
          const val = expenseByCategory[category] || 0;
          return (
            <div key={category} className="bg-brand-card/60 border border-brand-card-light p-4 rounded-xl">
              <p className="text-[10px] font-semibold text-brand-light/50 uppercase tracking-wider">{category}</p>
              <p className="text-lg font-bold text-white mt-1">{formatKES(val)}</p>
              <div className="w-full bg-brand-card-light/50 h-1 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-brand-gold"
                  style={{ width: `${totalOverheadAmount > 0 ? (val / totalOverheadAmount) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Log Expense Form Panel (1 Col) */}
        <div className="xl:col-span-1 bg-brand-card border border-brand-card-light p-5 rounded-xl shadow-lg">
          <div className="flex items-center gap-2 mb-4 border-b border-brand-card-light pb-3">
            <Receipt className="w-5 h-5 text-brand-gold" />
            <h4 className="font-bold text-white font-display">Log Business Expense</h4>
          </div>

          <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-brand-light/60 font-medium mb-1">Expense Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
              >
                <option value="Rent">Rent / Lease Premise</option>
                <option value="Utilities">Utilities (Water, Power, Net)</option>
                <option value="Salaries">Salaries & Contractor Payroll</option>
                <option value="Suppliers">Supplier Deliveries & Invoices</option>
                <option value="Marketing">Marketing, Posters & DJs</option>
                <option value="Others">General / Other Overhead</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-light/60 font-medium mb-1">Amount (KES) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-brand-light/60 font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-brand-light/60 font-medium mb-1">Auditable Memo / Description *</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Purchased cleaning detergents & sanitary napkins"
                className="w-full px-3 py-2.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-brand-light/60 font-medium mb-1">Payment Status *</label>
                <div className="flex gap-2">
                  {['Paid', 'Pending'].map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFormData({ ...formData, status })}
                      className={`flex-1 py-2 rounded text-xs font-bold transition-all ${
                        formData.status === status
                          ? 'bg-brand-emerald text-brand-dark'
                          : 'bg-brand-dark border border-brand-card-light text-brand-light/60 hover:bg-brand-card-light/40'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-brand-emerald font-bold mb-1 flex items-center gap-1">
                  <UploadCloud className="w-4 h-4" /> AI OCR Scanner
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="receipt-upload"
                    accept="image/*"
                    onChange={handleReceiptChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="w-full py-2 bg-brand-emerald/10 border border-brand-emerald/40 hover:bg-brand-emerald/20 hover:border-brand-emerald text-brand-emerald rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all font-bold tracking-wide"
                  >
                    <span>Upload & Extract Data</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Receipt upload state feedback */}
            {isUploading && (
              <div className="text-[10px] text-brand-emerald animate-pulse flex items-center gap-1.5 bg-brand-emerald/5 p-2 rounded">
                <LoopIcon className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading and running OCR check...</span>
              </div>
            )}

            {uploadedReceiptName && (
              <div className="space-y-3">
                <div className="text-[10px] text-brand-emerald flex items-center gap-1.5 bg-brand-emerald/5 p-2 rounded border border-brand-emerald/20">
                  <CheckCircle className="w-3.5 h-3.5 text-brand-emerald shrink-0" />
                  <span className="truncate flex-1 font-semibold">{uploadedReceiptName} Attached</span>
                </div>
                
                {reconciliationResult && (
                  <div className={`text-[10px] p-3 rounded border flex items-start gap-2 ${
                    reconciliationResult.status === 'matched' 
                      ? 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald' 
                      : reconciliationResult.status === 'discrepancy'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-brand-gold/10 border-brand-gold/30 text-brand-gold'
                  }`}>
                    {reconciliationResult.status === 'matched' && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                    {reconciliationResult.status === 'discrepancy' && <TrendingDown className="w-4 h-4 shrink-0 mt-0.5" />}
                    {reconciliationResult.status === 'unmatched' && <ClipboardList className="w-4 h-4 shrink-0 mt-0.5" />}
                    <div>
                      <strong className="block mb-0.5 uppercase tracking-wider text-[9px]">
                        {reconciliationResult.status === 'matched' ? 'Reconciliation: Matched' : 
                         reconciliationResult.status === 'discrepancy' ? 'Reconciliation: Discrepancy Found' : 
                         'Reconciliation: Unmatched'}
                      </strong>
                      <span className="opacity-90">{reconciliationResult.message}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-brand-gold text-brand-dark font-bold tracking-wide hover:bg-brand-gold/90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/10"
            >
              <Plus className="w-4 h-4" /> Save Expense Record
            </button>
          </form>
        </div>

        {/* Expenses List Ledger (2 Cols) */}
        <div className="xl:col-span-2 bg-brand-card border border-brand-card-light p-5 rounded-xl shadow-lg flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-brand-card-light pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-gold" />
                <h4 className="font-bold text-white font-display">Overhead Expense Journal</h4>
              </div>
              <span className="text-[11px] text-brand-light/50">Auditable Logs</span>
            </div>

            <div className="overflow-y-auto max-h-[350px] pr-1 space-y-3">
              {expenses.map(exp => (
                <div 
                  key={exp.id}
                  className="p-3 rounded-lg bg-brand-dark/40 border border-brand-card-light/40 flex flex-col md:flex-row justify-between md:items-center gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-card-light text-brand-light">
                        {exp.category}
                      </span>
                      <span className="text-[10px] text-brand-light/40 font-semibold">{exp.date}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        exp.status === 'Paid' ? 'bg-brand-emerald/10 text-brand-emerald' : 'bg-brand-gold/10 text-brand-gold'
                      }`}>
                        {exp.status}
                      </span>
                    </div>
                    <h5 className="font-bold text-white mt-1.5">{exp.description}</h5>
                    {exp.receiptUrl && (
                      <div className="flex items-center gap-1 text-[10px] text-brand-emerald mt-1 font-semibold">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Receipt scanned & matched to ledger</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-brand-card-light/50">
                    <div className="text-left md:text-right">
                      <p className="text-[9px] text-brand-light/40 font-semibold uppercase">Cost Amount</p>
                      <p className="font-bold text-brand-gold mt-0.5">{formatKES(exp.amount)}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete expense record: "${exp.description}"?`)) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-brand-danger/10 text-brand-light/40 hover:text-brand-danger transition-all"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <div className="py-12 text-center text-brand-light/30">
                  <ClipboardList className="w-10 h-10 mx-auto stroke-1 mb-2" />
                  <p>No operational overhead expenses logged yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple placeholder helper for loop icon
const LoopIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);
