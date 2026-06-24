import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Beer, Users, ShieldAlert, DollarSign, Receipt, 
  Menu, Clock, UserCheck, Sparkles, AlertTriangle, TrendingUp, 
  PlusCircle, ArrowRight, Lock, Calendar, ClipboardList, Info, Download
} from 'lucide-react';

import { InventoryItem, StaffMember, Shift, Sale, Expense, Loss, Supplier, DeliveryRecord } from './types';
import { loadState, saveState, calculateStockValue, getLowStockCount } from './initialData';

// Component Imports
import { MetricCard } from './components/MetricCard';
import { DashboardCharts } from './components/DashboardCharts';
import { POSSystem } from './components/POSSystem';
import { InventoryManager } from './components/InventoryManager';
import { StaffScheduler } from './components/StaffScheduler';
import { LossControl } from './components/LossControl';
import { ExpensesTracker } from './components/ExpensesTracker';
import { SalesHistoryTable } from './components/SalesHistoryTable';

export default function App() {
  // Core application state
  const [state, setState] = useState(() => loadState());
  const [currentUserRole, setCurrentUserRole] = useState<'Manager' | 'Bartender'>('Manager');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showResetModal, setShowResetModal] = useState(false);

  // Real-time ticking clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Save state on any change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const { inventory, staff, shifts, sales, expenses, losses, suppliers = [], deliveries = [] } = state;

  // Auto-route on role switch
  useEffect(() => {
    if (currentUserRole === 'Bartender' && activeTab === 'dashboard') {
      setActiveTab('pos');
    } else if (currentUserRole === 'Manager' && activeTab === 'pos') {
      setActiveTab('dashboard');
    }
  }, [currentUserRole]);

  // Dynamic Financial Calculations
  const metrics = useMemo(() => {
    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalCOGS = sales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
    const totalLossValue = losses.reduce((acc, l) => acc + l.costValue, 0);
    
    // Net profit = Revenue - COGS - Expenses - Loss
    const netProfit = totalRevenue - totalCOGS - totalExpenses - totalLossValue;
    const stockValue = calculateStockValue(inventory);
    const lowStockCount = getLowStockCount(inventory);

    return {
      totalRevenue,
      netProfit,
      totalExpenses,
      totalLossValue,
      stockValue,
      lowStockCount
    };
  }, [inventory, sales, expenses, losses]);

  // STATE UPDATE HANDLERS
  
  // 1. Log a POS Sale (Deducts stock automatically)
  const handleLogSale = (newSaleData: Omit<Sale, 'id' | 'timestamp'>) => {
    const newSale: Sale = {
      ...newSaleData,
      id: `sale-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // Deduct inventory items
    const updatedInventory = inventory.map(item => {
      const soldItem = newSaleData.items.find(si => si.itemId === item.id);
      if (soldItem) {
        return {
          ...item,
          quantity: Math.max(0, item.quantity - soldItem.quantity),
          sold: (item.sold || 0) + soldItem.quantity
        };
      }
      return item;
    });

    setState(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      inventory: updatedInventory
    }));
  };

  // 2. Add New Product to Catalog
  const handleAddProduct = (newProduct: Omit<InventoryItem, 'id'>) => {
    const item: InventoryItem = {
      ...newProduct,
      id: `prod-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }));
  };

  // 3. Update Existing Product
  const handleUpdateProduct = (updatedProduct: InventoryItem) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(item => item.id === updatedProduct.id ? updatedProduct : item)
    }));
  };

  // 4. Delete Product
  const handleDeleteProduct = (id: string) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(item => item.id !== id)
    }));
  };

  // 5. Stock Arrival - S02 Delivery (Increments stock automatically)
  const handleBulkArrival = (
    arrivals: { itemId: string; quantity: number; costPrice?: number }[],
    supplierName?: string
  ) => {
    const finalSupplier = supplierName || "General Supplier";
    const updatedInventory = inventory.map(item => {
      const delivery = arrivals.find(arr => arr.itemId === item.id);
      if (delivery) {
        return {
          ...item,
          quantity: item.quantity + delivery.quantity,
          received: (item.received || 0) + delivery.quantity,
          costPrice: delivery.costPrice ?? item.costPrice
        };
      }
      return item;
    });

    // Also register an Expense under "Suppliers"
    const totalCostOfArrival = arrivals.reduce((total, arr) => {
      const item = inventory.find(i => i.id === arr.itemId);
      const cp = arr.costPrice ?? item?.costPrice ?? 0;
      return total + (arr.quantity * cp);
    }, 0);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      category: 'Suppliers',
      amount: totalCostOfArrival,
      description: `Stock Delivery Arrival (S02) from ${finalSupplier} - ${arrivals.length} beverage lines`,
      status: 'Paid'
    };

    const newDeliveryRecord: DeliveryRecord = {
      id: `del-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      supplier: finalSupplier,
      items: arrivals.map(arr => {
        const item = inventory.find(i => i.id === arr.itemId);
        return {
          itemId: arr.itemId,
          itemName: item ? item.name : 'Unknown Item',
          quantity: arr.quantity,
          costPrice: arr.costPrice ?? item?.costPrice ?? 0
        };
      }),
      totalAmount: totalCostOfArrival
    };

    setState(prev => ({
      ...prev,
      inventory: updatedInventory,
      expenses: [newExpense, ...prev.expenses],
      deliveries: [newDeliveryRecord, ...(prev.deliveries || [])]
    }));
  };

  // 5b. Bulk Log Sales (Deducts stock automatically)
  const handleBulkLogSales = (newSalesList: Omit<Sale, 'id' | 'timestamp'>[]) => {
    const updatedSales: Sale[] = [];
    let tempInventory = [...inventory];

    newSalesList.forEach((saleData, index) => {
      const newSale: Sale = {
        ...saleData,
        id: `sale-bulk-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString()
      };
      updatedSales.push(newSale);

      // Deduct stock for items in this sale
      tempInventory = tempInventory.map(item => {
        const soldItem = saleData.items.find(si => 
          si.itemId === item.id || 
          (item.sku && si.sku && si.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) ||
          si.name.trim().toLowerCase() === item.name.trim().toLowerCase()
        );
        if (soldItem) {
          return {
            ...item,
            quantity: Math.max(0, item.quantity - soldItem.quantity),
            sold: (item.sold || 0) + soldItem.quantity
          };
        }
        return item;
      });
    });

    setState(prev => ({
      ...prev,
      sales: [...updatedSales, ...prev.sales],
      inventory: tempInventory
    }));
  };

  // 5c. Bulk Import / Update Catalog (Catalog Upload)
  const handleBulkImportCatalog = (importedItems: Omit<InventoryItem, 'id'>[]) => {
    setState(prev => {
      const existingInventory = [...prev.inventory];
      importedItems.forEach(newItem => {
        const matchIndex = existingInventory.findIndex(item => 
          (newItem.sku && item.sku && newItem.sku.trim().toLowerCase() === item.sku.trim().toLowerCase()) ||
          item.name.trim().toLowerCase() === newItem.name.trim().toLowerCase()
        );

        if (matchIndex >= 0) {
          const currentItem = existingInventory[matchIndex];
          const newQty = newItem.quantity !== undefined ? newItem.quantity : currentItem.quantity;
          const newOpeningStock = newItem.openingStock !== undefined ? newItem.openingStock : currentItem.openingStock;
          const newReceived = newItem.received !== undefined ? newItem.received : currentItem.received;
          const newSold = newItem.sold !== undefined ? newItem.sold : currentItem.sold;
          const newVariance = newItem.variance !== undefined ? newItem.variance : currentItem.variance;

          existingInventory[matchIndex] = {
            ...currentItem,
            ...newItem,
            id: currentItem.id, // preserve id
            openingStock: newOpeningStock,
            received: newReceived,
            sold: newSold,
            variance: newVariance,
            quantity: newQty
          };
        } else {
          existingInventory.push({
            ...newItem,
            id: `prod-bulk-${Date.now()}-${Math.floor(Math.random() * 1000)}`
          } as InventoryItem);
        }
      });

      return {
        ...prev,
        inventory: existingInventory
      };
    });
  };

  // 6. Schedule Staff Shift
  const handleAddShift = (newShiftData: Omit<Shift, 'id' | 'totalHours' | 'payAmount'>) => {
    const member = staff.find(s => s.id === newShiftData.staffId);
    if (!member) return;

    // Calculate total hours
    const [startH, startM] = newShiftData.startTime.split(':').map(Number);
    const [endH, endM] = newShiftData.endTime.split(':').map(Number);
    
    let hours = endH - startH + (endM - startM) / 60;
    if (hours < 0) hours += 24; // Handle overnight shifts

    const pay = Number((hours * member.hourlyRate).toFixed(0));

    const newShift: Shift = {
      ...newShiftData,
      id: `shift-${Date.now()}`,
      totalHours: Number(hours.toFixed(1)),
      payAmount: pay
    };

    setState(prev => ({
      ...prev,
      shifts: [newShift, ...prev.shifts]
    }));
  };

  // 7. Update Shift Status (Scheduled -> Completed)
  // Completed shift salary automatically registered under overhead expenses!
  const handleUpdateShiftStatus = (shiftId: string, status: 'Scheduled' | 'Completed' | 'Canceled') => {
    const updatedShifts = shifts.map(sh => {
      if (sh.id === shiftId) {
        return { ...sh, status };
      }
      return sh;
    });

    const shiftObj = shifts.find(sh => sh.id === shiftId);
    let updatedExpenses = expenses;

    // Disburse payroll salary into business operating expenses immediately
    if (status === 'Completed' && shiftObj && shiftObj.status !== 'Completed') {
      const payExpense: Expense = {
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: 'Salaries',
        amount: shiftObj.payAmount,
        description: `Wage Payout: ${shiftObj.staffName} (${shiftObj.role}) Completed Shift Roster`,
        status: 'Paid'
      };
      updatedExpenses = [payExpense, ...expenses];
    }

    setState(prev => ({
      ...prev,
      shifts: updatedShifts,
      expenses: updatedExpenses
    }));
  };

  // 8. Register New Staff
  const handleAddStaff = (newStaff: Omit<StaffMember, 'id'>) => {
    const member: StaffMember = {
      ...newStaff,
      id: `staff-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      staff: [...prev.staff, member]
    }));
  };

  // 9. Log Loss Control Waste (Spillage, theft, breakage)
  const handleLogLoss = (newLossData: Omit<Loss, 'id' | 'date' | 'costValue'>) => {
    const item = inventory.find(i => i.id === newLossData.itemId);
    if (!item) return;

    const costLost = Number(newLossData.quantity * item.costPrice);

    const newLoss: Loss = {
      ...newLossData,
      id: `loss-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      costValue: costLost
    };

    // Deduct stock levels for breakage
    const updatedInventory = inventory.map(inv => {
      if (inv.id === newLossData.itemId) {
        return {
          ...inv,
          quantity: Math.max(0, inv.quantity - newLossData.quantity),
          variance: (inv.variance || 0) + newLossData.quantity
        };
      }
      return inv;
    });

    setState(prev => ({
      ...prev,
      losses: [newLoss, ...prev.losses],
      inventory: updatedInventory
    }));
  };

  // 10. Delete Loss Write-off
  const handleDeleteLoss = (id: string) => {
    const lossObj = losses.find(l => l.id === id);
    let updatedInventory = inventory;
    if (lossObj) {
      updatedInventory = inventory.map(item => {
        if (item.id === lossObj.itemId) {
          return {
            ...item,
            quantity: item.quantity + lossObj.quantity,
            variance: Math.max(0, (item.variance || 0) - lossObj.quantity)
          };
        }
        return item;
      });
    }

    setState(prev => ({
      ...prev,
      losses: prev.losses.filter(l => l.id !== id),
      inventory: updatedInventory
    }));
  };

  // 11. Add Manual Overhead Expense
  const handleAddExpense = (newExp: Omit<Expense, 'id'>) => {
    const exp: Expense = {
      ...newExp,
      id: `exp-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      expenses: [exp, ...prev.expenses]
    }));
  };

  // 12. Delete Expense Record
  const handleDeleteExpense = (id: string) => {
    setState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id)
    }));
  };

  // Quick reorder action for low-stock warnings in dashboard
  const handleQuickReorder = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    handleBulkArrival([{ itemId, quantity: 50 }]);
    alert(`Reordered 50 units of ${item.name}! Stock increased and KES ${(50 * item.costPrice).toLocaleString()} registered under Supplier Overheads.`);
  };

  // Export main Dashboard Financial Metrics to CSV
  const handleExportDashboardCSV = () => {
    const totalRevenue = metrics.totalRevenue;
    const totalCOGS = sales.reduce((acc, s) => acc + s.totalCost, 0);
    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = metrics.totalExpenses;
    const totalLossValue = metrics.totalLossValue;
    const netProfit = metrics.netProfit;
    const stockValue = metrics.stockValue;
    const lowStockCount = metrics.lowStockCount;
    const totalSalesCount = sales.length;
    const averageOrderValue = totalSalesCount > 0 ? (totalRevenue / totalSalesCount) : 0;

    const headers = ['Financial Metric', 'Value (KES or Count)', 'Description / Accounting Context'];
    const rows = [
      ['Total Revenue', totalRevenue.toString(), 'Sum of all points-of-sale customer receipts'],
      ['Cost of Goods Sold (COGS)', totalCOGS.toString(), 'Aggregated buying cost of beverages and items sold'],
      ['Gross Profit', grossProfit.toString(), 'Total Revenue minus Cost of Goods Sold'],
      ['Operating Expenses', totalExpenses.toString(), 'Overhead ledger expenses (Salaries, rent, utilities, deliveries, etc.)'],
      ['Auditable Variance (Losses)', totalLossValue.toString(), 'Deducted value due to breakages, spillages, theft, and complimentary VIPs'],
      ['Net Profit', netProfit.toString(), 'Bottom line profit: Gross Profit minus Operating Expenses minus Variance'],
      ['Asset Stock Value', stockValue.toString(), 'Current holding value of all bottle line physical assets in stock'],
      ['Low Stock Alerts Count', lowStockCount.toString(), 'Count of products whose closing levels are below reorder threshold'],
      ['Total POS Receipts Cleared', totalSalesCount.toString(), 'Number of transaction files logged on POS terminals'],
      ['Average Ticket/Receipt Value', averageOrderValue.toFixed(2), 'Nairobi Pub Ticket Size: Total revenue divided by cleared transaction count']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_overview_summary_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Factory Reset
  const handleResetSystem = () => {
    setShowResetModal(true);
  };

  const executeReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Sidebar navigation menu
  const navigationItems = [
    { id: 'dashboard', label: 'Owner Dashboard', icon: LayoutDashboard, managerOnly: true },
    { id: 'pos', label: 'Bartender POS Terminal', icon: Beer, managerOnly: false },
    { id: 'inventory', label: 'Smart Inventory', icon: ClipboardList, managerOnly: true },
    { id: 'staff', label: 'Staff Shifts & Roster', icon: Calendar, managerOnly: false },
    { id: 'losses', label: 'Variance & Loss Control', icon: ShieldAlert, managerOnly: false },
    { id: 'expenses', label: 'Overhead Expenses', icon: Receipt, managerOnly: true }
  ];

  // Filter low stock items for dashboard alert feed
  const lowStockProducts = inventory.filter(item => item.quantity <= item.minThreshold);

  return (
    <div id="pub-app-root" className="min-h-screen bg-brand-dark text-brand-light flex flex-col font-sans">
      
      {/* 1. Header / Navbar */}
      <header className="bg-brand-card/80 backdrop-blur-md border-b border-brand-card-light/60 sticky top-0 z-40 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Information */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-brand-gold flex items-center justify-center text-brand-dark font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-wider text-white font-display">AGAI TRUE PUB</h1>
              <span className="text-[10px] bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-black px-1.5 py-0.5 rounded-sm tracking-widest">
                PRO SYSTEM
              </span>
            </div>
            <p className="text-[10px] text-brand-light/50 tracking-wider mt-0.5 font-medium">
              REAL TASTE. TRUE MOMENTS. • Nairobi High-End Pub Suite
            </p>
          </div>
        </div>

        {/* Status Indicators & Clock */}
        <div className="flex flex-wrap items-center gap-4">
          
          {/* Ticking Clock */}
          <div className="flex items-center gap-2 bg-brand-dark/50 border border-brand-card-light/50 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-brand-emerald animate-pulse" />
            <span>{currentTime.toLocaleDateString()}</span>
            <span className="text-brand-light/40">|</span>
            <span className="text-brand-emerald font-semibold">{currentTime.toLocaleTimeString()}</span>
          </div>

          {/* User Mode / Role selector */}
          <div className="flex items-center gap-2 bg-brand-dark/50 border border-brand-card-light/50 p-1 rounded-lg">
            <button
              onClick={() => setCurrentUserRole('Manager')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                currentUserRole === 'Manager'
                  ? 'bg-brand-emerald text-brand-dark shadow'
                  : 'text-brand-light/60 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Manager
            </button>
            <button
              onClick={() => setCurrentUserRole('Bartender')}
              className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                currentUserRole === 'Bartender'
                  ? 'bg-brand-gold text-brand-dark shadow'
                  : 'text-brand-light/60 hover:text-white'
              }`}
            >
              <Beer className="w-3.5 h-3.5" /> Bartender POS
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Left Sidebar Menu */}
        <aside className="w-full lg:w-64 bg-brand-card/30 border-r border-brand-card-light/30 p-4 shrink-0 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-brand-light/30 uppercase tracking-widest px-3 mb-3">Navigation Menu</p>
            
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isManagerOnly = item.managerOnly;
              const isBlocked = isManagerOnly && currentUserRole !== 'Manager';

              if (isBlocked) {
                return (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-brand-light/20 cursor-not-allowed text-xs font-medium"
                    title="Manager Access Level Required"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    <Lock className="w-3 h-3 text-brand-light/20 shrink-0" />
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-card text-brand-emerald border-l-2 border-brand-emerald shadow-md'
                      : 'text-brand-light/60 hover:bg-brand-card-light/20 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Current Operator Badge */}
          <div className="mt-8 border-t border-brand-card-light/40 pt-4 px-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand-card-light flex items-center justify-center font-bold text-xs text-brand-emerald">
                {currentUserRole === 'Manager' ? 'FO' : 'JW'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {currentUserRole === 'Manager' ? 'Francis Onyi' : 'Jane Wambui'}
                </p>
                <p className="text-[10px] text-brand-light/40 font-medium">
                  {currentUserRole === 'Manager' ? 'System Administrator' : 'Head Bartender'}
                </p>
              </div>
            </div>

            {/* Factory Reset Action */}
            {currentUserRole === 'Manager' && (
              <button
                onClick={handleResetSystem}
                className="w-full py-1.5 px-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5"
                title="Wipe all data and restore factory settings"
              >
                <AlertTriangle className="w-3 h-3" /> System Reset
              </button>
            )}
          </div>
        </aside>

        {/* Main Content Workspace Panel */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          
          {/* Active View Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* HEADER LABELS FOR ACTIVE MODULES */}
              <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                  {activeTab === 'dashboard' && 'Owner Overview'}
                  {activeTab === 'pos' && 'Bartender Terminal POS'}
                  {activeTab === 'inventory' && 'Inventory Ledger'}
                  {activeTab === 'staff' && 'Shift Schedules'}
                  {activeTab === 'losses' && 'Variance Audit'}
                  {activeTab === 'expenses' && 'Business Ledger'}
                </h2>
                <p className="text-xs text-brand-light/50 mt-1">
                  {activeTab === 'dashboard' && 'Real-time financial ratios, stock aggregates, and interactive sales insight charts.'}
                  {activeTab === 'pos' && 'High-speed POS interface optimized for bartenders. Tap beverages to ring sales.'}
                  {activeTab === 'inventory' && 'Manage opening stock (S01), deliveries (S02), pricing, and run smart OCR receipt reads.'}
                  {activeTab === 'staff' && 'Schedule employee shift blocks, disburse payroll overhead, and register members.'}
                  {activeTab === 'losses' && 'Audit product breakages, spillages, theft, expired stock, and complementary VIP accounts.'}
                  {activeTab === 'expenses' && 'Log company overhead expenditures, rent, utilities, and review scanned supplier invoices.'}
                </p>
              </div>

              {/* TAB CONTENT SECTIONS */}
              
              {/* 1. OWNER FINANCIAL DASHBOARD */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Dashboard toolbar with Export Financial Overview CSV */}
                  <div id="dashboard-accounting-bar" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-card/30 border border-brand-card-light/30 p-4 rounded-xl shadow">
                    <div>
                      <h3 className="font-bold text-sm text-white font-display">Financial Summary Overview</h3>
                      <p className="text-[11px] text-brand-light/50 mt-0.5">Aggregated audit, COGS, stock holdings, and performance statistics.</p>
                    </div>
                    <button
                      id="btn-export-dashboard-csv"
                      onClick={handleExportDashboardCSV}
                      className="bg-brand-emerald hover:bg-brand-emerald/90 text-brand-dark px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 self-start sm:self-center shrink-0 active:scale-98"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Financial CSV</span>
                    </button>
                  </div>

                  {/* Metric Summary Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <MetricCard
                      id="card-revenue"
                      title="Total Revenue"
                      value={`KES ${metrics.totalRevenue.toLocaleString()}`}
                      trend="+18.5%"
                      trendType="up"
                      icon={TrendingUp}
                      subtext="vs yesterday"
                      color="emerald"
                    />
                    <MetricCard
                      id="card-profit"
                      title="Net Profit"
                      value={`KES ${metrics.netProfit.toLocaleString()}`}
                      trend="+16.3%"
                      trendType="up"
                      icon={DollarSign}
                      subtext="vs yesterday"
                      color="sky"
                    />
                    <MetricCard
                      id="card-expenses"
                      title="Expenses"
                      value={`KES ${metrics.totalExpenses.toLocaleString()}`}
                      trend="-4.2%"
                      trendType="down"
                      icon={Receipt}
                      subtext="vs yesterday"
                      color="danger"
                    />
                    <MetricCard
                      id="card-stock"
                      title="Stock Value"
                      value={`KES ${metrics.stockValue.toLocaleString()}`}
                      trend="+7.3%"
                      trendType="up"
                      icon={Beer}
                      subtext="holding value"
                      color="gold"
                    />
                    <MetricCard
                      id="card-lowstock"
                      title="Low Stock Items"
                      value={`${metrics.lowStockCount}`}
                      icon={AlertTriangle}
                      subtext="View Details"
                      color={metrics.lowStockCount > 5 ? 'danger' : 'gold'}
                      onClick={() => {
                        setActiveTab('inventory');
                      }}
                    />
                    <MetricCard
                      id="card-loss"
                      title="Variance (Loss)"
                      value={`KES ${metrics.totalLossValue.toLocaleString()}`}
                      trend="-8.7%"
                      trendType="down"
                      icon={ShieldAlert}
                      subtext="breakage/theft"
                      color="danger"
                    />
                  </div>

                  {/* High Quality Analytics Charts */}
                  <DashboardCharts 
                    sales={sales} 
                    inventory={inventory} 
                    expenses={expenses} 
                  />

                  {/* Dashboard lower split - Alerts & Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Low Stock Watch alerts panel */}
                    <div className="lg:col-span-2 bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg">
                      <div className="flex items-center justify-between mb-4 border-b border-brand-card-light pb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-brand-gold animate-bounce" />
                          <h4 className="font-bold text-white text-sm font-display">Low Stock Patrol Alerts ({lowStockProducts.length})</h4>
                        </div>
                        <span className="text-[10px] text-brand-gold font-bold uppercase tracking-wider bg-brand-gold/10 px-2 py-0.5 rounded">
                          Action Required
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                        {lowStockProducts.map(prod => (
                          <div 
                            key={prod.id}
                            className="p-3 rounded-lg bg-brand-dark/40 border border-brand-card-light/40 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-white truncate">{prod.name}</p>
                              <p className="text-[10px] text-brand-light/50 mt-0.5">
                                Current Level: <span className="font-bold text-brand-danger">{prod.quantity} {prod.unit}s</span> | Min Threshold: {prod.minThreshold}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleQuickReorder(prod.id)}
                              className="bg-brand-emerald/10 hover:bg-brand-emerald hover:text-brand-dark transition-all text-brand-emerald font-bold px-2.5 py-1.5 rounded text-[10px] tracking-wider shrink-0"
                            >
                              Restock +50
                            </button>
                          </div>
                        ))}

                        {lowStockProducts.length === 0 && (
                          <div className="col-span-full py-8 text-center text-brand-light/40 font-medium">
                            All beverage line quantities are well stocked above limits. Keep it up!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick System Information */}
                    <div className="bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-sm border-b border-brand-card-light pb-2 mb-3 font-display">Pub Performance Tips</h4>
                        <ul className="text-xs text-brand-light/70 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-brand-emerald mt-0.5 font-bold">•</span>
                            <span>Conduct spillage reviews with bartenders Jane & Moses to lower variance below 4%.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-brand-emerald mt-0.5 font-bold">•</span>
                            <span>Tusker Lager & Johnnie Black are top revenue lines. Keep threshold limits high.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-brand-emerald mt-0.5 font-bold">•</span>
                            <span>Utilize the **AI OCR Scanner** in Inventory tab to quickly scan supplier delivery bills.</span>
                          </li>
                        </ul>
                      </div>
                      <div className="mt-4 p-3 rounded-lg bg-brand-dark/30 border border-brand-card-light/30 flex items-center gap-2.5 text-[10px] text-brand-light/50">
                        <Info className="w-4 h-4 text-brand-emerald shrink-0" />
                        <span>System synchronized globally. Daily reports emailed at 02:00 AM Nairobi.</span>
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Sales Transaction History Table */}
                  <SalesHistoryTable 
                    sales={sales} 
                    inventory={inventory}
                    onBulkLogSales={handleBulkLogSales}
                  />
                </div>
              )}

              {/* 2. BARTENDER POINT OF SALE TERMINAL */}
              {activeTab === 'pos' && (
                <POSSystem 
                  inventory={inventory} 
                  currentUser={currentUserRole === 'Manager' ? 'Francis Onyi' : 'Jane Wambui'}
                  onLogSale={handleLogSale}
                />
              )}

              {/* 3. STOCK & INVENTORY MANAGER */}
              {activeTab === 'inventory' && (
                <InventoryManager 
                  inventory={inventory}
                  suppliers={suppliers}
                  deliveries={deliveries}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onBulkArrival={handleBulkArrival}
                  onBulkImportCatalog={handleBulkImportCatalog}
                />
              )}

              {/* 4. STAFF ROSTER SCHEDULER */}
              {activeTab === 'staff' && (
                <StaffScheduler 
                  staff={staff}
                  shifts={shifts}
                  onAddShift={handleAddShift}
                  onUpdateShiftStatus={handleUpdateShiftStatus}
                  onAddStaff={handleAddStaff}
                />
              )}

              {/* 5. VARIANCE & LOSS CONTROL PANEL */}
              {activeTab === 'losses' && (
                <LossControl 
                  inventory={inventory}
                  losses={losses}
                  currentUser={currentUserRole === 'Manager' ? 'Francis Onyi' : 'Jane Wambui'}
                  onLogLoss={handleLogLoss}
                  onDeleteLoss={handleDeleteLoss}
                />
              )}

              {/* 6. EXPENSES TRACKER OVERHEAD LEDGER */}
              {activeTab === 'expenses' && (
                <ExpensesTracker 
                  expenses={expenses}
                  deliveries={deliveries}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 3. Footer */}
      <footer className="bg-brand-card/30 border-t border-brand-card-light/20 p-4 mt-auto text-center text-[10px] text-brand-light/30 font-medium">
        <span>© 2026 Agai True Pub Management Suite • Powered by Kepler Camp Codes . All rights reserved.</span>
      </footer>

      {/* System Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-brand-card border border-red-500/30 rounded-xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Factory System Reset</h3>
                <p className="text-sm text-brand-light/80 leading-relaxed mb-6">
                  Are you absolutely sure you want to reset all data back to factory defaults? 
                  <strong className="block mt-2 text-white">This action will wipe all recent sales, expenses, and modifications and cannot be undone.</strong>
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 bg-brand-dark hover:bg-brand-card-light border border-brand-card-light text-white font-bold rounded-lg text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeReset}
                    className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm transition-all shadow-lg flex items-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" /> Yes, Wipe Data
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
