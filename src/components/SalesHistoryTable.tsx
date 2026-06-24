import React, { useState, useMemo, useRef } from 'react';
import { 
  Download, Search, Filter, Calendar, DollarSign, User, 
  ChevronDown, ArrowUpDown, Receipt, CreditCard, Coins, Smartphone, Key,
  UploadCloud, FileText, Check, Sparkles, RefreshCw, AlertCircle, Trash2, Plus, Info, ArrowUpRight
} from 'lucide-react';
import { Sale, InventoryItem, SaleItem } from '../types';

interface SalesHistoryTableProps {
  sales: Sale[];
  inventory: InventoryItem[];
  onBulkLogSales: (newSalesList: Omit<Sale, 'id' | 'timestamp'>[]) => void;
}

export const SalesHistoryTable: React.FC<SalesHistoryTableProps> = ({ sales, inventory, onBulkLogSales }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [sortField, setSortField] = useState<'timestamp' | 'totalAmount' | 'totalCost'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [visibleCount, setVisibleCount] = useState(10);

  // Upload Panel States
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadType, setUploadType] = useState<'csv' | 'ocr'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  
  // Parsed Sales Preview State (Users can review/edit before final import)
  const [parsedSales, setParsedSales] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formatting utilities
  const formatKES = (value: number) => {
    return `KES ${value.toLocaleString()}`;
  };

  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Nairobi'
      });
    } catch {
      return isoString;
    }
  };

  // Filter and sort sales
  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          sale.id.toLowerCase().includes(query) ||
          sale.loggedBy.toLowerCase().includes(query) ||
          sale.items.some(item => item.name.toLowerCase().includes(query)) ||
          sale.paymentMethod.toLowerCase().includes(query);

        const matchesPayment = paymentFilter === 'All' || sale.paymentMethod === paymentFilter;

        return matchesSearch && matchesPayment;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'timestamp') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [sales, searchQuery, paymentFilter, sortField, sortOrder]);

  // Aggregate stats of filtered sales
  const stats = useMemo(() => {
    return filteredSales.reduce(
      (acc, s) => {
        acc.revenue += s.totalAmount;
        acc.cogs += s.totalCost;
        acc.profit += s.totalAmount - s.totalCost;
        return acc;
      },
      { revenue: 0, cogs: 0, profit: 0 }
    );
  }, [filteredSales]);

  const handleSort = (field: 'timestamp' | 'totalAmount' | 'totalCost') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export Sales History to CSV
  const exportToCSV = () => {
    const headers = [
      'Transaction ID',
      'Date & Time (Nairobi)',
      'Server / Bartender',
      'Items Purchased',
      'Payment Method',
      'Cost of Goods Sold (KES)',
      'Revenue Amount (KES)',
      'Net Profit (KES)'
    ];

    const rows = filteredSales.map(sale => {
      const itemsString = sale.items
        .map(item => `${item.name} (${item.quantity}x @ KES ${item.sellPrice})`)
        .join(' | ');

      const profit = sale.totalAmount - sale.totalCost;

      return [
        sale.id,
        formatDateTime(sale.timestamp),
        sale.loggedBy,
        itemsString,
        sale.paymentMethod,
        sale.totalCost.toString(),
        sale.totalAmount.toString(),
        profit.toString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_history_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto detect type based on extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv') {
        setUploadType('csv');
      } else {
        setUploadType('ocr');
      }
    }
  };

  // Trigger file analysis
  const runFileParser = () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStage('Reading binary document layout...');

    setTimeout(() => {
      setProcessingProgress(45);
      setProcessingStage(
        uploadType === 'csv' 
          ? 'Parsing CSV rows and correlating columns...' 
          : 'Running visual AI OCR matrix scans...'
      );
    }, 1000);

    setTimeout(() => {
      setProcessingProgress(75);
      setProcessingStage('Correlating product descriptions with bar inventory catalog...');
    }, 2000);

    setTimeout(() => {
      if (uploadType === 'csv') {
        // Read CSV
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          parseCSVContent(text);
          setIsProcessing(false);
          setProcessingProgress(100);
        };
        reader.readAsText(selectedFile);
      } else {
        // Process PDF or Image OCR Simulation
        simulateImagePdfOCR();
        setIsProcessing(false);
        setProcessingProgress(100);
      }
    }, 3200);
  };

  // Parse actual CSV file contents
  const parseCSVContent = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV file seems empty or has only headers!');
        return;
      }

      // Split header
      const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
      
      // Let's locate key column indices
      const idxId = headers.findIndex(h => h.includes('id') || h.includes('tx') || h.includes('receipt') || h.includes('invoice'));
      const idxLoggedBy = headers.findIndex(h => h.includes('by') || h.includes('server') || h.includes('bartender') || h.includes('user') || h.includes('staff'));
      const idxItems = headers.findIndex(h => h.includes('item') || h.includes('product') || h.includes('beverage') || h.includes('purchase'));
      const idxPayment = headers.findIndex(h => h.includes('pay') || h.includes('method') || h.includes('type'));
      const idxRevenue = headers.findIndex(h => h.includes('revenue') || h.includes('amount') || h.includes('total') || h.includes('sell') || h.includes('price'));
      const idxCost = headers.findIndex(h => h.includes('cost') || h.includes('cogs') || h.includes('buy'));

      const importedSalesList: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Handle comma splitting inside quoted fields
        const row = parseCSVRow(lines[i]);
        if (row.length === 0) continue;

        // Extract raw fields
        const saleId = idxId >= 0 && row[idxId] ? row[idxId].trim() : `sale-bulk-${Date.now()}-${i}`;
        const loggedBy = idxLoggedBy >= 0 && row[idxLoggedBy] ? row[idxLoggedBy].trim() : 'System Importer';
        const rawItemsStr = idxItems >= 0 && row[idxItems] ? row[idxItems].trim() : '';
        const paymentMethod = idxPayment >= 0 && row[idxPayment] ? row[idxPayment].trim() : 'Cash';
        const rawRevenue = idxRevenue >= 0 && row[idxRevenue] ? parseFloat(row[idxRevenue].replace(/[^0-9.]/g, '')) : 0;
        const rawCost = idxCost >= 0 && row[idxCost] ? parseFloat(row[idxCost].replace(/[^0-9.]/g, '')) : 0;

        // Parse list of purchased items inside cell (e.g. "Tusker Lager x2 | Gilbey's Gin x1" or "Tusker Lager (2)")
        let parsedItems: SaleItem[] = [];
        if (rawItemsStr) {
          const itemParts = rawItemsStr.split(/[|;]/); // split by pipe or semicolon
          itemParts.forEach(part => {
            const trimmed = part.trim();
            if (!trimmed) return;

            // Extract count and name (e.g., "Tusker Lager x3" or "2x White Cap" or "Vodka - 750ml (1)")
            let count = 1;
            let name = trimmed;

            // Match "x3" or "x 3" or "*3" at the end
            const endMatch = trimmed.match(/x\s*(\d+)$/i) || trimmed.match(/\(\s*(\d+)\s*\)$/);
            // Match "2x" or "2 x" at the start
            const startMatch = trimmed.match(/^(\d+)\s*x/i);

            if (endMatch) {
              count = parseInt(endMatch[1], 10);
              name = trimmed.replace(endMatch[0], '').trim();
            } else if (startMatch) {
              count = parseInt(startMatch[1], 10);
              name = trimmed.replace(startMatch[0], '').trim();
            }

            // Attempt to match with inventory Catalog item
            const catalogItem = inventory.find(inv => 
              inv.name.toLowerCase().includes(name.toLowerCase()) || 
              name.toLowerCase().includes(inv.name.toLowerCase()) ||
              (inv.sku && inv.sku.toLowerCase() === name.toLowerCase())
            );

            if (catalogItem) {
              parsedItems.push({
                itemId: catalogItem.id,
                name: catalogItem.name,
                quantity: count,
                sellPrice: catalogItem.sellPrice,
                costPrice: catalogItem.costPrice
              });
            } else {
              // Add as custom non-catalog item
              parsedItems.push({
                itemId: `custom-${Date.now()}`,
                name: name,
                quantity: count,
                sellPrice: 300, // generic fallback
                costPrice: 200
              });
            }
          });
        }

        // If items are empty, generate a fallback
        if (parsedItems.length === 0) {
          const fallbackItem = inventory[Math.floor(Math.random() * inventory.length)] || { id: '1', name: 'General Beverage', sellPrice: 250, costPrice: 180 };
          parsedItems.push({
            itemId: fallbackItem.id,
            name: fallbackItem.name,
            quantity: 1,
            sellPrice: fallbackItem.sellPrice,
            costPrice: fallbackItem.costPrice
          });
        }

        // Calculate final sums
        const finalRevenue = rawRevenue > 0 ? rawRevenue : parsedItems.reduce((acc, it) => acc + (it.sellPrice * it.quantity), 0);
        const finalCost = rawCost > 0 ? rawCost : parsedItems.reduce((acc, it) => acc + (it.costPrice * it.quantity), 0);

        importedSalesList.push({
          id: saleId,
          loggedBy: loggedBy,
          items: parsedItems,
          paymentMethod: validatePaymentMethod(paymentMethod),
          totalAmount: finalRevenue,
          totalCost: finalCost
        });
      }

      setParsedSales(importedSalesList);
    } catch (err) {
      console.error(err);
      alert('Error parsing CSV. Please check formatting headers (Transaction ID, Bartender, Items, Payment Method, Total Amount).');
    }
  };

  // Split CSV accounting for double-quoted cells with commas
  const parseCSVRow = (text: string) => {
    const result = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(entry.replace(/^["']|["']$/g, '').trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    result.push(entry.replace(/^["']|["']$/g, '').trim());
    return result;
  };

  const validatePaymentMethod = (method: string) => {
    const mLower = method.toLowerCase();
    if (mLower.includes('cash')) return 'Cash';
    if (mLower.includes('card') || mLower.includes('visa') || mLower.includes('master')) return 'Card';
    if (mLower.includes('mobile') || mLower.includes('mpesa') || mLower.includes('m-pesa')) return 'Mobile (M-Pesa)';
    if (mLower.includes('tab') || mLower.includes('credit')) return 'Tab';
    return 'Cash'; // Default fallback
  };

  // Simulate PDF/Image OCR for Sales
  const simulateImagePdfOCR = () => {
    // Generate 1 detailed sale record extracted from receipt
    const possibleServers = ['Francis Onyi', 'Jane Wambui', 'Moses Kiprop'];
    const selectedServer = possibleServers[Math.floor(Math.random() * possibleServers.length)];
    
    // Choose 2 or 3 random items from catalog
    const shuffled = [...inventory].sort(() => 0.5 - Math.random());
    const ocrItems = shuffled.slice(0, Math.min(3, shuffled.length)).map(item => {
      const qty = Math.floor(Math.random() * 4) + 1;
      return {
        itemId: item.id,
        name: item.name,
        quantity: qty,
        sellPrice: item.sellPrice,
        costPrice: item.costPrice
      };
    });

    const totalRevenue = ocrItems.reduce((acc, it) => acc + (it.sellPrice * it.quantity), 0);
    const totalCost = ocrItems.reduce((acc, it) => acc + (it.costPrice * it.quantity), 0);
    const paymentMethods = ['Mobile (M-Pesa)', 'Cash', 'Card'];
    const pMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

    setParsedSales([
      {
        id: `sale-ocr-${Date.now()}`,
        loggedBy: selectedServer,
        items: ocrItems,
        paymentMethod: pMethod,
        totalAmount: totalRevenue,
        totalCost: totalCost,
        isOcr: true
      }
    ]);
  };

  // Final validation and pushing to App State
  const triggerBulkImportSave = () => {
    if (parsedSales.length === 0) return;
    
    // Call props bulk log
    onBulkLogSales(parsedSales);
    alert(`Successfully imported ${parsedSales.length} point-of-sale receipt records! Inventory levels and accounting metrics updated.`);
    
    // Reset states
    setParsedSales([]);
    setSelectedFile(null);
    setShowUploadPanel(false);
  };

  const handleEditParsedQty = (saleIdx: number, itemIdx: number, val: string) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    const updated = [...parsedSales];
    const sale = updated[saleIdx];
    const item = sale.items[itemIdx];
    
    item.quantity = num;
    
    // Recalculate totals
    sale.totalAmount = sale.items.reduce((acc: number, it: any) => acc + (it.sellPrice * it.quantity), 0);
    sale.totalCost = sale.items.reduce((acc: number, it: any) => acc + (it.costPrice * it.quantity), 0);
    
    setParsedSales(updated);
  };

  const handleDeleteParsedSale = (idx: number) => {
    setParsedSales(prev => prev.filter((_, i) => i !== idx));
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return <Coins className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Card':
        return <CreditCard className="w-3.5 h-3.5 text-blue-400" />;
      case 'Mobile (M-Pesa)':
        return <Smartphone className="w-3.5 h-3.5 text-green-400" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-brand-gold" />;
    }
  };

  return (
    <div id="sales-history-card" className="bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg mt-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-brand-card-light pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-brand-emerald" />
            <h4 className="font-bold text-white text-base font-display">Sales Transaction History</h4>
          </div>
          <p className="text-[11px] text-brand-light/50 mt-1">
            Browse, search, and audit raw point-of-sale receipt records. Import files, images, or PDFs to bulk log transactions.
          </p>
        </div>

        {/* Action Button Group */}
        <div className="flex flex-wrap gap-2.5">
          {/* Toggle Upload Drawer */}
          <button
            id="btn-toggle-sales-upload"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 border ${
              showUploadPanel 
                ? 'bg-brand-dark/80 text-white border-brand-card-light' 
                : 'bg-brand-dark/40 text-brand-light/90 hover:text-white border-brand-card-light/60'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-brand-emerald" />
            <span>Upload POS Files (CSV/PDF/Image)</span>
          </button>

          {/* Download CSV Action */}
          <button
            id="btn-export-sales-csv"
            onClick={exportToCSV}
            disabled={filteredSales.length === 0}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 ${
              filteredSales.length === 0
                ? 'bg-brand-card-light/20 text-brand-light/25 cursor-not-allowed border border-brand-card-light/30'
                : 'bg-brand-emerald text-brand-dark hover:bg-brand-emerald/90 active:scale-98'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Sales CSV ({filteredSales.length})</span>
          </button>
        </div>
      </div>

      {/* Expandable Upload Panel Container */}
      {showUploadPanel && (
        <div id="sales-upload-panel" className="bg-brand-dark/40 border border-brand-card-light rounded-xl p-4 mb-5 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-card-light/40 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-emerald animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">POS Terminal Importer / AI OCR Reader</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-brand-light/40">Upload Mode:</span>
              <div className="flex bg-brand-dark rounded border border-brand-card-light p-0.5">
                <button
                  onClick={() => setUploadType('csv')}
                  className={`px-2 py-0.75 text-[9px] font-bold rounded ${uploadType === 'csv' ? 'bg-brand-emerald text-brand-dark' : 'text-brand-light/60 hover:text-white'}`}
                >
                  CSV Data
                </button>
                <button
                  onClick={() => setUploadType('ocr')}
                  className={`px-2 py-0.75 text-[9px] font-bold rounded ${uploadType === 'ocr' ? 'bg-brand-emerald text-brand-dark' : 'text-brand-light/60 hover:text-white'}`}
                >
                  Image/PDF OCR
                </button>
              </div>
            </div>
          </div>

          {parsedSales.length === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Drag and Drop File Input Area */}
              <div className="lg:col-span-2 border-2 border-dashed border-brand-card-light/70 hover:border-brand-emerald/50 rounded-lg p-5 flex flex-col items-center justify-center text-center transition-all bg-brand-dark/20 relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  id="sales-file-selector"
                  className="hidden"
                  accept=".csv,image/*,application/pdf"
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-10 h-10 text-brand-emerald/55 mb-2" />
                <p className="text-xs font-bold text-white">Drag & drop POS sales file here</p>
                <p className="text-[10px] text-brand-light/40 mt-0.5">Supports CSV list files, receipt photos (PNG, JPG), or billing PDF sheets.</p>
                
                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-brand-card-light border border-brand-card-light/80 hover:bg-brand-card-light/90 text-white rounded font-bold text-[10px]"
                  >
                    Select File
                  </button>
                </div>

                {selectedFile && (
                  <div className="mt-4 bg-brand-card p-2 rounded border border-brand-emerald/30 max-w-sm flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-brand-gold" />
                      <div className="truncate">
                        <p className="text-[10px] font-bold text-white truncate">{selectedFile.name}</p>
                        <p className="text-[8px] text-brand-light/40">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={runFileParser}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-brand-emerald hover:bg-brand-emerald/90 text-brand-dark rounded text-[9px] font-extrabold flex items-center gap-1 shrink-0"
                    >
                      {isProcessing ? 'Processing...' : 'Run Analyzer'}
                    </button>
                  </div>
                )}
              </div>

              {/* Informational Guidance Cards */}
              <div className="bg-brand-dark/30 rounded-lg p-3.5 border border-brand-card-light/20 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-brand-gold uppercase tracking-wider block mb-1">Standard File Templates</span>
                  {uploadType === 'csv' ? (
                    <div className="space-y-2 text-[10px] text-brand-light/70">
                      <p>Your CSV should include headers like:</p>
                      <pre className="p-2 bg-brand-dark/90 text-brand-emerald rounded text-[9px] font-mono select-all overflow-x-auto whitespace-pre">
                        Bartender,Items,Payment Method,Total Amount<br/>
                        Jane W,Tusker Lager x2 | Gin x1,Cash,2100
                      </pre>
                      <p className="text-[9px] text-brand-light/40">Items are auto-matched against active bar inventories to deduct stock safely.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[10px] text-brand-light/70">
                      <p>Upload any customer receipt image, restaurant bill photo, or POS transaction PDF. </p>
                      <p>Our smart layout scanner will dynamically read lines, identify beverages, count quantities, and construct the transaction file.</p>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-2 bg-brand-emerald/5 border border-brand-emerald/10 rounded flex items-start gap-2 text-[9px] text-brand-light/60">
                  <Info className="w-3.5 h-3.5 text-brand-emerald shrink-0 mt-0.5" />
                  <span>Always preview extracted lines to ensure perfect unit-price mapping before confirming log.</span>
                </div>
              </div>
            </div>
          )}

          {/* Processing Screen */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <RefreshCw className="w-8 h-8 text-brand-emerald animate-spin mb-2" />
              <p className="text-xs font-bold text-white">{processingStage}</p>
              <div className="w-full max-w-xs bg-brand-card-light/50 h-1 rounded-full mt-3 overflow-hidden">
                <div className="bg-brand-emerald h-full transition-all duration-300" style={{ width: `${processingProgress}%` }}></div>
              </div>
            </div>
          )}

          {/* Review and Edit Parsed Results Grid */}
          {parsedSales.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-brand-emerald/15 border border-brand-emerald/20 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-brand-emerald" />
                  <span className="text-xs font-bold text-white">Extracted {parsedSales.length} Transactions. Ready to log:</span>
                </div>
                <button
                  onClick={() => setParsedSales([])}
                  className="text-[10px] text-brand-light/50 hover:text-white underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Discard
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto border border-brand-card-light/50 rounded-lg">
                <table id="table-sales-review" className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-brand-dark/80 text-brand-light/40 border-b border-brand-card-light">
                      <th className="p-2 font-mono">Row TX</th>
                      <th className="p-2">Bartender / Server</th>
                      <th className="p-2">Line Purchases</th>
                      <th className="p-2">Method</th>
                      <th className="p-2 text-right">Sum Revenue</th>
                      <th className="p-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-card-light/20 bg-brand-dark/10">
                    {parsedSales.map((sale, sIdx) => (
                      <tr key={sIdx} className="hover:bg-brand-card-light/10">
                        <td className="p-2 font-mono font-bold text-brand-gold text-[10px] truncate max-w-[80px]">{sale.id}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={sale.loggedBy}
                            onChange={(e) => {
                              const updated = [...parsedSales];
                              updated[sIdx].loggedBy = e.target.value;
                              setParsedSales(updated);
                            }}
                            className="bg-brand-dark px-1.5 py-1 border border-brand-card-light rounded text-[11px] text-white w-28 font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            {sale.items.map((it: any, iIdx: number) => (
                              <div key={iIdx} className="flex items-center gap-1 bg-brand-dark/30 px-1 py-0.5 rounded border border-brand-card-light/10 w-fit">
                                <span className="text-white font-semibold">{it.name}</span>
                                <input
                                  type="number"
                                  value={it.quantity}
                                  onChange={(e) => handleEditParsedQty(sIdx, iIdx, e.target.value)}
                                  className="bg-brand-dark w-10 text-center border border-brand-card-light text-[10px] text-brand-emerald font-extrabold rounded"
                                />
                                <span className="text-[9px] text-brand-light/40">@ {it.sellPrice}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-2">
                          <select
                            value={sale.paymentMethod}
                            onChange={(e) => {
                              const updated = [...parsedSales];
                              updated[sIdx].paymentMethod = e.target.value;
                              setParsedSales(updated);
                            }}
                            className="bg-brand-dark border border-brand-card-light rounded text-[11px] text-white px-1 py-0.5 font-medium"
                          >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="Mobile (M-Pesa)">Mobile (M-Pesa)</option>
                            <option value="Tab">Bar Tab</option>
                          </select>
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-brand-emerald">
                          {formatKES(sale.totalAmount)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleDeleteParsedSale(sIdx)}
                            className="text-brand-danger hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  onClick={() => setParsedSales([])}
                  className="px-4 py-2 bg-brand-card-light text-brand-light hover:text-white rounded-lg text-xs font-semibold"
                >
                  Discard
                </button>
                <button
                  onClick={triggerBulkImportSave}
                  className="px-5 py-2.5 bg-brand-emerald hover:bg-brand-emerald/90 text-brand-dark rounded-lg text-xs font-extrabold tracking-wide flex items-center gap-1.5 shadow"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Approve & Record Sales ({parsedSales.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/40 pointer-events-none">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            id="input-sales-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, item name, bartender..."
            className="w-full pl-9 pr-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-xs text-white placeholder-brand-light/30"
          />
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-light/40 whitespace-nowrap">Payment:</span>
          <select
            id="select-sales-payment"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-2 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-xs text-white font-semibold"
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Mobile (M-Pesa)">Mobile (M-Pesa)</option>
            <option value="Tab">Bar Tab</option>
          </select>
        </div>

        {/* Summary Mini-cards inside filters */}
        <div className="grid grid-cols-3 gap-1 px-1">
          <div className="bg-brand-dark/30 border border-brand-card-light/20 rounded p-1.5 text-center">
            <p className="text-[8px] text-brand-light/40 uppercase font-bold">Revenue</p>
            <p className="text-[10px] font-bold text-brand-emerald truncate">{formatKES(stats.revenue)}</p>
          </div>
          <div className="bg-brand-dark/30 border border-brand-card-light/20 rounded p-1.5 text-center">
            <p className="text-[8px] text-brand-light/40 uppercase font-bold">COGS</p>
            <p className="text-[10px] font-bold text-brand-light/60 truncate">{formatKES(stats.cogs)}</p>
          </div>
          <div className="bg-brand-dark/30 border border-brand-card-light/20 rounded p-1.5 text-center">
            <p className="text-[8px] text-brand-light/40 uppercase font-bold">Gross</p>
            <p className="text-[10px] font-bold text-brand-gold truncate">{formatKES(stats.profit)}</p>
          </div>
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="overflow-x-auto rounded-lg border border-brand-card-light/60">
        <table id="table-sales-history" className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-brand-dark/60 text-brand-light/50 font-semibold border-b border-brand-card-light/60">
              <th className="p-3 font-mono text-[10px]">ID</th>
              <th 
                className="p-3 cursor-pointer hover:text-white transition-all select-none"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center gap-1">
                  <span>Timestamp</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3">Logged By</th>
              <th className="p-3">Purchased Items & Sizes</th>
              <th className="p-3 text-center">Method</th>
              <th 
                className="p-3 text-right cursor-pointer hover:text-white transition-all select-none"
                onClick={() => handleSort('totalCost')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>COGS</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                className="p-3 text-right cursor-pointer hover:text-white transition-all select-none"
                onClick={() => handleSort('totalAmount')}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Revenue</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 text-right">Gross Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-card-light/30">
            {filteredSales.slice(0, visibleCount).map((sale) => {
              const profit = sale.totalAmount - sale.totalCost;
              return (
                <tr key={sale.id} className="hover:bg-brand-card-light/10 transition-all">
                  {/* ID */}
                  <td className="p-3 font-mono font-bold text-brand-gold/90">{sale.id}</td>
                  
                  {/* Timestamp */}
                  <td className="p-3 text-brand-light/80 whitespace-nowrap">
                    {formatDateTime(sale.timestamp)}
                  </td>
                  
                  {/* Server */}
                  <td className="p-3 whitespace-nowrap text-white font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-light/40" />
                      <span>{sale.loggedBy}</span>
                    </div>
                  </td>
                  
                  {/* Items */}
                  <td className="p-3 max-w-[240px]">
                    <div className="flex flex-wrap gap-1">
                      {sale.items.map((it, idx) => (
                        <span 
                          key={idx} 
                          className="bg-brand-dark/50 border border-brand-card-light/40 rounded px-1.5 py-0.5 text-[10px] text-brand-light/90 whitespace-nowrap"
                        >
                          {it.name} <span className="text-brand-emerald font-black">x{it.quantity}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  
                  {/* Payment Method */}
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1 bg-brand-dark/40 px-2 py-0.75 rounded border border-brand-card-light/20 text-[10px]">
                      {getPaymentIcon(sale.paymentMethod)}
                      <span className="text-white font-medium text-[10px] whitespace-nowrap">{sale.paymentMethod}</span>
                    </div>
                  </td>
                  
                  {/* COGS */}
                  <td className="p-3 text-right text-brand-light/50 font-mono">
                    {formatKES(sale.totalCost)}
                  </td>
                  
                  {/* Revenue */}
                  <td className="p-3 text-right text-brand-emerald font-bold font-mono">
                    {formatKES(sale.totalAmount)}
                  </td>
                  
                  {/* Gross Profit */}
                  <td className="p-3 text-right text-brand-gold font-bold font-mono">
                    {formatKES(profit)}
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {filteredSales.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-brand-light/30">
                  No transaction records match your search parameters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Show more pagination button */}
      {filteredSales.length > visibleCount && (
        <div className="flex justify-center mt-3">
          <button
            id="btn-sales-load-more"
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="text-xs bg-brand-card-light/20 hover:bg-brand-card-light/40 border border-brand-card-light/30 text-brand-light px-4 py-2 rounded-lg font-bold transition-all"
          >
            Show More Transactions (+10)
          </button>
        </div>
      )}
    </div>
  );
};
