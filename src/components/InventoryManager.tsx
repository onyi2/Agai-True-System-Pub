import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, Search, Sparkles, FileText, AlertTriangle, 
  Check, ArrowUpRight, UploadCloud, RefreshCw, RefreshCw as LoopIcon,
  Phone, Mail, MapPin, Star, History, Calendar, DollarSign, 
  TrendingUp, TrendingDown, ShieldAlert, ChevronDown, ChevronUp,
  Briefcase, Info
} from 'lucide-react';
import { InventoryItem, Supplier, DeliveryRecord } from '../types';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  suppliers?: Supplier[];
  deliveries?: DeliveryRecord[];
  onAddProduct: (item: Omit<InventoryItem, 'id'>) => void;
  onUpdateProduct: (item: InventoryItem) => void;
  onDeleteProduct: (id: string) => void;
  onBulkArrival: (
    items: { itemId: string; quantity: number; costPrice?: number }[],
    supplierName?: string
  ) => void;
  onBulkImportCatalog?: (items: Omit<InventoryItem, 'id'>[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventory,
  suppliers = [],
  deliveries = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkArrival,
  onBulkImportCatalog
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'arrival' | 'ai-ocr'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Supplier Directory and Bulk Cost Suggestion States
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [arrivalCosts, setArrivalCosts] = useState<{ [itemId: string]: number }>({});
  const [onlySupplierItems, setOnlySupplierItems] = useState(true);
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);
  
  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [formData, setFormData] = useState({
    brand: '',
    packSize: '750ml',
    category: 'Gin' as any,
    openingStock: 0,
    received: 0,
    sold: 0,
    variance: 0,
    quantity: 0, // This is current active stock / Closing Stock
    unit: 'Bottle',
    minThreshold: 10,
    costPrice: 0,
    sellPrice: 0,
    supplier: ''
  });

  // Bulk arrival input state
  const [arrivalInputs, setArrivalInputs] = useState<{ [itemId: string]: number }>({});

  // Auto-select first supplier if none is selected
  useEffect(() => {
    if (!selectedSupplier && suppliers.length > 0) {
      setSelectedSupplier(suppliers[0]);
    }
  }, [suppliers, selectedSupplier]);

  // Calculate historical cost stats for an item from a specific supplier
  const getHistoricalCostForProduct = (itemId: string, supplierName?: string) => {
    const productDeliveries = deliveries
      .filter(del => !supplierName || del.supplier === supplierName)
      .flatMap(del => del.items.filter(item => item.itemId === itemId).map(item => ({
        ...item,
        date: del.date
      })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (productDeliveries.length === 0) return null;

    const latest = productDeliveries[0];
    const avg = productDeliveries.reduce((sum, item) => sum + item.costPrice, 0) / productDeliveries.length;
    const best = Math.min(...productDeliveries.map(item => item.costPrice));

    let trend: 'up' | 'down' | 'stable' | null = null;
    let percentage = 0;
    if (productDeliveries.length >= 2) {
      const prev = productDeliveries[1].costPrice;
      const curr = latest.costPrice;
      if (curr > prev) {
        trend = 'up';
        percentage = ((curr - prev) / prev) * 100;
      } else if (curr < prev) {
        trend = 'down';
        percentage = ((prev - curr) / prev) * 100;
      } else {
        trend = 'stable';
      }
    }

    return {
      latestPrice: latest.costPrice,
      latestDate: latest.date,
      avgPrice: Math.round(avg),
      bestPrice: best,
      trend,
      trendPercentage: percentage
    };
  };

  // Pre-populate custom delivery cost prices when the supplier changes
  useEffect(() => {
    const newCosts: { [itemId: string]: number } = {};
    inventory.forEach(item => {
      const history = getHistoricalCostForProduct(item.id, selectedSupplier?.name);
      newCosts[item.id] = history?.latestPrice ?? item.costPrice;
    });
    setArrivalCosts(newCosts);
  }, [selectedSupplier?.id, inventory]);

  // AI OCR States
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: upload, 1: scanning, 2: results
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResults, setOcrResults] = useState<{ name: string; quantity: number; cost: number; matchId: string }[]>([]);
  
  // Custom CSV & PDF Importer States
  const [inventoryUploadMode, setInventoryUploadMode] = useState<'ocr' | 'csv-catalog' | 'csv-arrival'>('ocr');
  const [parsedCatalogUploads, setParsedCatalogUploads] = useState<any[]>([]);
  const [parsedArrivalUploads, setParsedArrivalUploads] = useState<any[]>([]);
  const [selectedArrivalSupplierName, setSelectedArrivalSupplierName] = useState<string>('General Supplier');

  const categories = [
    'All',
    'Gin',
    'Whisky',
    'Brandy / Cognac',
    'Vodka',
    'Rum',
    'Tequila',
    'Liqueurs',
    'Bottled Beer',
    'Canned Beer / RTD',
    'Mixers / Soft Drinks',
    'Water',
    'Wine',
    'Food',
    'Others'
  ];

  // Filtered inventory
  const filteredInventory = inventory.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(searchLower) || 
                          item.supplier.toLowerCase().includes(searchLower) ||
                          (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
                          item.id.toLowerCase().includes(searchLower);
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand) return;
    
    const fullName = formData.packSize ? `${formData.brand} - ${formData.packSize}` : formData.brand;
    const closingStock = Number(formData.openingStock) + Number(formData.received) - Number(formData.sold) - Number(formData.variance);

    onAddProduct({
      name: fullName,
      brand: formData.brand,
      packSize: formData.packSize || 'Units',
      category: formData.category,
      openingStock: Number(formData.openingStock),
      received: Number(formData.received),
      sold: Number(formData.sold),
      variance: Number(formData.variance),
      quantity: Math.max(0, closingStock),
      unit: formData.unit,
      minThreshold: Number(formData.minThreshold),
      costPrice: Number(formData.costPrice),
      sellPrice: Number(formData.sellPrice),
      supplier: formData.supplier || 'General Supplier'
    });

    // Reset Form
    setFormData({
      brand: '',
      packSize: '750ml',
      category: 'Gin',
      openingStock: 0,
      received: 0,
      sold: 0,
      variance: 0,
      quantity: 0,
      unit: 'Bottle',
      minThreshold: 10,
      costPrice: 0,
      sellPrice: 0,
      supplier: ''
    });
    setShowAddForm(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateProduct(editingItem);
    setEditingItem(null);
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem({ ...item });
  };

  const handleBulkArrivalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) {
      alert('Please select a supplier first.');
      return;
    }
    
    const arrivals = Object.entries(arrivalInputs)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({
        itemId: id,
        quantity: Number(qty),
        costPrice: arrivalCosts[id] ?? inventory.find(item => item.id === id)?.costPrice ?? 0
      }));

    if (arrivals.length === 0) {
      alert('Please enter at least one quantity to log delivery.');
      return;
    }

    onBulkArrival(arrivals, selectedSupplier.name);
    setArrivalInputs({});
    alert(`Delivery logged successfully! Added stock counts for ${arrivals.length} line items from ${selectedSupplier.name} and generated Supplier overhead expense of KES ${arrivals.reduce((total, arr) => total + (arr.quantity * arr.costPrice), 0).toLocaleString()}.`);
  };

  const handleArrivalInputChange = (itemId: string, value: string) => {
    const num = Number(value);
    setArrivalInputs(prev => ({
      ...prev,
      [itemId]: num >= 0 ? num : 0
    }));
  };

  const handleArrivalCostChange = (itemId: string, value: string) => {
    const num = Number(value);
    setArrivalCosts(prev => ({
      ...prev,
      [itemId]: num >= 0 ? num : 0
    }));
  };

  // Split CSV accounting for quotes
  const parseInventoryCSVRow = (text: string) => {
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

  const handleInventoryFileChange = (file: File) => {
    setSelectedFile(file);
    // Auto-detect upload format
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      // default to stock-arrival, can be toggled by user in UI
      setInventoryUploadMode('csv-arrival');
    } else {
      setInventoryUploadMode('ocr');
    }
  };

  // Simulate AI OCR
  const runSimulatedOCR = () => {
    if (!selectedFile) {
      alert('Please upload an invoice/receipt image or PDF first!');
      return;
    }
    setIsScanning(true);
    setScanStep(1);

    // Dynamic scanning milestones
    setTimeout(() => setScanStep(1.2), 1000);
    setTimeout(() => setScanStep(1.5), 2000);
    setTimeout(() => setScanStep(1.8), 3000);

    setTimeout(() => {
      setIsScanning(false);
      
      if (inventoryUploadMode === 'ocr') {
        const reader = new FileReader();
        reader.onload = () => {
          setScanStep(2);
          // Generate realistic extracted values matching active catalog items
          const results = [
            { name: 'Tusker Lager', quantity: 120, cost: 150, matchId: '2' },
            { name: 'Johnnie Walker Black', quantity: 12, cost: 2200, matchId: '1' },
            { name: 'White Cap Lager', quantity: 60, cost: 160, matchId: '6' },
            { name: 'Gilbey\'s Gin', quantity: 24, cost: 800, matchId: '3' }
          ].map(item => {
            // Double-check real matching item IDs if available
            const matchingCatalog = inventory.find(inv => inv.name.toLowerCase().includes(item.name.toLowerCase()));
            return {
              ...item,
              matchId: matchingCatalog ? matchingCatalog.id : item.matchId
            };
          });
          setOcrResults(results);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // Read CSV
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          if (inventoryUploadMode === 'csv-catalog') {
            parseCatalogCSV(text);
          } else {
            parseArrivalCSV(text);
          }
          setScanStep(2);
        };
        reader.readAsText(selectedFile);
      }
    }, 4000);
  };

  const parseCatalogCSV = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV file is empty or has only headers!');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
      
      const idxName = headers.findIndex(h => h.includes('name') || h.includes('brand') || h.includes('beverage') || h.includes('title'));
      const idxCategory = headers.findIndex(h => h.includes('cat') || h.includes('group') || h.includes('type'));
      const idxCost = headers.findIndex(h => h.includes('cost') || h.includes('buy') || h.includes('wholesale'));
      const idxSell = headers.findIndex(h => h.includes('sell') || h.includes('retail') || h.includes('price'));
      const idxThreshold = headers.findIndex(h => h.includes('threshold') || h.includes('min') || h.includes('reorder'));
      const idxSupplier = headers.findIndex(h => h.includes('supplier') || h.includes('vendor'));
      const idxSku = headers.findIndex(h => h.includes('sku') || h.includes('code') || h.includes('barcode'));
      const idxQty = headers.findIndex(h => h.includes('qty') || h.includes('stock') || h.includes('quantity') || h.includes('count') || h.includes('opening'));

      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseInventoryCSVRow(lines[i]);
        if (row.length === 0) continue;

        const name = idxName >= 0 && row[idxName] ? row[idxName].trim() : '';
        if (!name) continue;

        const categoryRaw = idxCategory >= 0 && row[idxCategory] ? row[idxCategory].trim() : 'Gin';
        const cost = idxCost >= 0 && row[idxCost] ? parseFloat(row[idxCost].replace(/[^0-9.]/g, '')) || 150 : 150;
        const sell = idxSell >= 0 && row[idxSell] ? parseFloat(row[idxSell].replace(/[^0-9.]/g, '')) || 250 : 250;
        const threshold = idxThreshold >= 0 && row[idxThreshold] ? parseInt(row[idxThreshold].replace(/[^0-9]/g, ''), 10) || 10 : 10;
        const supplier = idxSupplier >= 0 && row[idxSupplier] ? row[idxSupplier].trim() : 'General Supplier';
        const sku = idxSku >= 0 && row[idxSku] ? row[idxSku].trim() : `SKU-${Date.now()}-${i}`;
        const qty = idxQty >= 0 && row[idxQty] ? parseInt(row[idxQty].replace(/[^0-9]/g, ''), 10) || 0 : 0;

        let category: any = 'Gin';
        const cLower = categoryRaw.toLowerCase();
        if (cLower.includes('whisky') || cLower.includes('whiskey')) category = 'Whisky';
        else if (cLower.includes('brandy') || cLower.includes('cognac')) category = 'Brandy / Cognac';
        else if (cLower.includes('vodka')) category = 'Vodka';
        else if (cLower.includes('rum')) category = 'Rum';
        else if (cLower.includes('tequila')) category = 'Tequila';
        else if (cLower.includes('liqueur')) category = 'Liqueurs';
        else if (cLower.includes('bottle') && cLower.includes('beer')) category = 'Bottled Beer';
        else if (cLower.includes('can') || cLower.includes('rtd')) category = 'Canned Beer / RTD';
        else if (cLower.includes('mixer') || cLower.includes('soft') || cLower.includes('cola') || cLower.includes('soda')) category = 'Mixers / Soft Drinks';
        else if (cLower.includes('water')) category = 'Water';
        else if (cLower.includes('wine')) category = 'Wine';
        else if (cLower.includes('food')) category = 'Food';
        else if (cLower.includes('other')) category = 'Others';

        const existing = inventory.find(item => 
          item.name.toLowerCase() === name.toLowerCase() || 
          (item.sku && sku && item.sku.toLowerCase() === sku.toLowerCase())
        );

        parsed.push({
          name,
          category,
          costPrice: cost,
          sellPrice: sell,
          minThreshold: threshold,
          supplier,
          sku,
          quantity: qty,
          openingStock: qty,
          received: 0,
          sold: 0,
          variance: 0,
          unit: 'Bottle',
          isMatched: !!existing,
          matchId: existing?.id || null
        });
      }
      setParsedCatalogUploads(parsed);
    } catch (err) {
      console.error(err);
      alert('Error parsing catalog CSV files.');
    }
  };

  const parseArrivalCSV = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length <= 1) {
        alert('CSV file is empty or has only headers!');
        return;
      }

      const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
      const idxId = headers.findIndex(h => h.includes('id') || h.includes('code') || h.includes('sku') || h.includes('item'));
      const idxQty = headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('count') || h.includes('received'));
      const idxCost = headers.findIndex(h => h.includes('cost') || h.includes('price') || h.includes('buy'));

      const parsed: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const row = parseInventoryCSVRow(lines[i]);
        if (row.length === 0 || !row[0]) continue;

        const lookup = row[idxId >= 0 ? idxId : 0].trim();
        const qty = idxQty >= 0 && row[idxQty] ? parseInt(row[idxQty].replace(/[^0-9]/g, ''), 10) || 0 : 0;
        const costRaw = idxCost >= 0 && row[idxCost] ? parseFloat(row[idxCost].replace(/[^0-9.]/g, '')) || null : null;

        const existing = inventory.find(item => 
          item.id.toLowerCase() === lookup.toLowerCase() ||
          item.name.toLowerCase() === lookup.toLowerCase() ||
          (item.sku && item.sku.toLowerCase() === lookup.toLowerCase())
        );

        parsed.push({
          lookup,
          quantity: qty,
          costPrice: costRaw ?? existing?.costPrice ?? 150,
          name: existing ? existing.name : `Unmatched Name: "${lookup}"`,
          matchId: existing ? existing.id : null,
          isMatched: !!existing
        });
      }
      setParsedArrivalUploads(parsed);
    } catch (err) {
      console.error(err);
      alert('Error parsing arrival CSV.');
    }
  };

  const triggerCatalogImportSave = () => {
    if (parsedCatalogUploads.length === 0) return;
    if (onBulkImportCatalog) {
      onBulkImportCatalog(parsedCatalogUploads);
      alert(`Successfully imported ${parsedCatalogUploads.length} product lines into the bar catalog!`);
    } else {
      alert('Catalog import handler is unavailable.');
    }
    setParsedCatalogUploads([]);
    setSelectedFile(null);
    setScanStep(0);
    setActiveTab('list');
  };

  const triggerArrivalImportSave = () => {
    const validArrivals = parsedArrivalUploads
      .filter(item => item.isMatched && item.quantity > 0)
      .map(item => ({
        itemId: item.matchId,
        quantity: item.quantity,
        costPrice: item.costPrice
      }));

    if (validArrivals.length === 0) {
      alert('No valid matching products found to import. Make sure rows match existing product IDs, names, or SKUs.');
      return;
    }

    onBulkArrival(validArrivals, selectedArrivalSupplierName);
    alert(`Successfully registered S02 delivery receipt with ${validArrivals.length} items from ${selectedArrivalSupplierName}!`);
    setParsedArrivalUploads([]);
    setSelectedFile(null);
    setScanStep(0);
    setActiveTab('list');
  };

  const approveOCRArrival = () => {
    const arrivals = ocrResults.map(item => ({
      itemId: item.matchId,
      quantity: item.quantity,
      costPrice: item.cost
    }));
    
    onBulkArrival(arrivals, selectedArrivalSupplierName);
    alert(`AI-Extracted stock arrival from ${selectedArrivalSupplierName} has been successfully approved & logged to inventory!`);
    // Reset OCR
    setSelectedFile(null);
    setScanStep(0);
    setOcrResults([]);
    setActiveTab('list');
  };

  return (
    <div id="inventory-section" className="mt-6">
      {/* Sub tabs */}
      <div className="flex border-b border-brand-card-light pb-0.5 gap-6 mb-6">
        {[
          { id: 'list', label: 'Stock List & Control' },
          { id: 'arrival', label: 'Manual Stock Arrival (S02)' },
          { id: 'ai-ocr', label: 'Smart Stock Uploader (CSV / OCR)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-brand-emerald text-brand-emerald font-bold'
                : 'border-transparent text-brand-light/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' && (
        <div className="flex flex-col gap-4">
          {/* Action header */}
          <div className="bg-brand-card border border-brand-card-light p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto flex-1">
              {/* Search bar */}
              <div className="relative flex-1 md:max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/40">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search products or suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-brand-dark/50 border border-brand-card-light focus:border-brand-emerald focus:outline-none text-brand-light text-sm"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-brand-dark/50 border border-brand-card-light focus:border-brand-emerald focus:outline-none text-brand-light text-xs"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat} Products</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="bg-brand-emerald hover:bg-brand-emerald/90 text-brand-dark font-bold px-4 py-2 rounded-lg text-xs tracking-wider flex items-center gap-2 shadow-[0_0_12px_rgba(0,212,165,0.2)]"
            >
              <Plus className="w-4 h-4" /> Add New Item
            </button>
          </div>

          {/* Add Item Modal Form */}
          <AnimatePresence>
            {showAddForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-brand-card border border-brand-card-light rounded-xl p-6 w-full max-w-lg shadow-2xl"
                >
                  <h4 className="text-lg font-bold text-white mb-4 font-display">Create New Product</h4>
                  <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Brand Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.brand}
                          onChange={e => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="e.g. Gilbey's"
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Pack Size *</label>
                        <select
                          value={formData.packSize}
                          onChange={e => setFormData({ ...formData, packSize: e.target.value })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        >
                          <option value="250ml">250ml</option>
                          <option value="350ml">350ml</option>
                          <option value="500ml">500ml</option>
                          <option value="750ml">750ml</option>
                          <option value="1L">1L</option>
                          <option value="330ml Can">330ml Can</option>
                          <option value="500ml Bottle">500ml Bottle</option>
                          <option value="Portion">Portion (Food)</option>
                          <option value="Units">Units (Other)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Category *</label>
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        >
                          {categories.slice(1).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Unit Type *</label>
                        <input
                          type="text"
                          required
                          value={formData.unit}
                          onChange={e => setFormData({ ...formData, unit: e.target.value })}
                          placeholder="e.g. Bottle, Can, Portion"
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-brand-dark/40 border border-brand-card-light/40 p-3 rounded-lg">
                      <p className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider mb-2">Inventory Levels</p>
                      <div className="grid grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <label className="block text-brand-light/50 mb-1">Opening (S01)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formData.openingStock}
                            onChange={e => setFormData({ ...formData, openingStock: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-brand-light/50 mb-1">Received (S02)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formData.received}
                            onChange={e => setFormData({ ...formData, received: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-brand-light/50 mb-1">Sold (POS)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formData.sold}
                            onChange={e => setFormData({ ...formData, sold: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-brand-light/50 mb-1">Variance (Waste)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={formData.variance}
                            onChange={e => setFormData({ ...formData, variance: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold text-center"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-brand-light/40 mt-2 text-right">
                        Calculated Closing Stock: <span className="font-bold text-white">{Number(formData.openingStock) + Number(formData.received) - Number(formData.sold) - Number(formData.variance)}</span> units
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Reorder Level (Min Threshold) *</label>
                      <input
                        type="number"
                        required
                        value={formData.minThreshold}
                        onChange={e => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Cost Price (KES) *</label>
                        <input
                          type="number"
                          required
                          value={formData.costPrice}
                          onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Sell Price (KES) *</label>
                        <input
                          type="number"
                          required
                          value={formData.sellPrice}
                          onChange={e => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Supplier Name</label>
                      <input
                        type="text"
                        value={formData.supplier}
                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="e.g. Kenya Breweries Ltd"
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-card-light">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 rounded bg-brand-card-light hover:bg-brand-card-light/80 text-brand-light"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-brand-emerald text-brand-dark font-bold hover:bg-brand-emerald/90"
                      >
                        Create Product
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Edit Item Modal Form */}
          <AnimatePresence>
            {editingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/80 backdrop-blur-sm p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-brand-card border border-brand-card-light rounded-xl p-6 w-full max-w-lg shadow-2xl"
                >
                  <h4 className="text-lg font-bold text-white mb-4 font-display">Edit Product</h4>
                  <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Brand Name *</label>
                        <input
                          type="text"
                          required
                          value={editingItem.brand || ''}
                          onChange={e => {
                            const brand = e.target.value;
                            setEditingItem({ 
                              ...editingItem, 
                              brand,
                              name: editingItem.packSize ? `${brand} - ${editingItem.packSize}` : brand 
                            });
                          }}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Pack Size *</label>
                        <select
                          value={editingItem.packSize || '750ml'}
                          onChange={e => {
                            const packSize = e.target.value;
                            setEditingItem({ 
                              ...editingItem, 
                              packSize,
                              name: editingItem.brand ? `${editingItem.brand} - ${packSize}` : packSize 
                            });
                          }}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        >
                          <option value="250ml">250ml</option>
                          <option value="350ml">350ml</option>
                          <option value="500ml">500ml</option>
                          <option value="750ml">750ml</option>
                          <option value="1L">1L</option>
                          <option value="330ml Can">330ml Can</option>
                          <option value="500ml Bottle">500ml Bottle</option>
                          <option value="Portion">Portion (Food)</option>
                          <option value="Units">Units (Other)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Category *</label>
                        <select
                          value={editingItem.category}
                          onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        >
                          {categories.slice(1).map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Unit Type *</label>
                        <input
                          type="text"
                          required
                          value={editingItem.unit}
                          onChange={e => setEditingItem({ ...editingItem, unit: e.target.value })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-semibold"
                        />
                      </div>
                    </div>

                    <div className="bg-brand-dark/40 border border-brand-card-light/40 p-3 rounded-lg">
                      <p className="text-[10px] font-bold text-brand-emerald uppercase tracking-wider mb-2">Inventory Levels</p>
                      <div className="grid grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <label className="block text-brand-light/50 mb-1">Opening (S01)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={editingItem.openingStock || 0}
                            onChange={e => {
                              const s01 = Number(e.target.value);
                              const s02 = editingItem.received || 0;
                              const pos = editingItem.sold || 0;
                              const varLoss = editingItem.variance || 0;
                              setEditingItem({
                                ...editingItem,
                                openingStock: s01,
                                quantity: Math.max(0, s01 + s02 - pos - varLoss)
                              });
                            }}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-brand-light/50 mb-1">Received (S02)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={editingItem.received || 0}
                            onChange={e => {
                              const s01 = editingItem.openingStock || 0;
                              const s02 = Number(e.target.value);
                              const pos = editingItem.sold || 0;
                              const varLoss = editingItem.variance || 0;
                              setEditingItem({
                                ...editingItem,
                                received: s02,
                                quantity: Math.max(0, s01 + s02 - pos - varLoss)
                              });
                            }}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-brand-light/50 mb-1">Sold (POS)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={editingItem.sold || 0}
                            onChange={e => {
                              const s01 = editingItem.openingStock || 0;
                              const s02 = editingItem.received || 0;
                              const pos = Number(e.target.value);
                              const varLoss = editingItem.variance || 0;
                              setEditingItem({
                                ...editingItem,
                                sold: pos,
                                quantity: Math.max(0, s01 + s02 - pos - varLoss)
                              });
                            }}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-bold text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-brand-light/50 mb-1">Variance (Waste)</label>
                          <input
                            type="number"
                            min="0"
                            required
                            value={editingItem.variance || 0}
                            onChange={e => {
                              const s01 = editingItem.openingStock || 0;
                              const s02 = editingItem.received || 0;
                              const pos = editingItem.sold || 0;
                              const varLoss = Number(e.target.value);
                              setEditingItem({
                                ...editingItem,
                                variance: varLoss,
                                quantity: Math.max(0, s01 + s02 - pos - varLoss)
                              });
                            }}
                            className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white font-bold text-center"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-brand-light/40 mt-2 text-right">
                        Calculated Closing Stock: <span className="font-bold text-white">{editingItem.quantity}</span> units
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Reorder Level (Min Threshold) *</label>
                      <input
                        type="number"
                        required
                        value={editingItem.minThreshold}
                        onChange={e => setEditingItem({ ...editingItem, minThreshold: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Cost Price (KES) *</label>
                        <input
                          type="number"
                          required
                          value={editingItem.costPrice}
                          onChange={e => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-brand-light/60 font-medium mb-1">Sell Price (KES) *</label>
                        <input
                          type="number"
                          required
                          value={editingItem.sellPrice}
                          onChange={e => setEditingItem({ ...editingItem, sellPrice: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-brand-light/60 font-medium mb-1">Supplier Name</label>
                      <input
                        type="text"
                        value={editingItem.supplier}
                        onChange={e => setEditingItem({ ...editingItem, supplier: e.target.value })}
                        className="w-full px-3 py-2 rounded bg-brand-dark border border-brand-card-light focus:border-brand-emerald focus:outline-none text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-brand-card-light">
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 rounded bg-brand-card-light hover:bg-brand-card-light/80 text-brand-light"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded bg-brand-emerald text-brand-dark font-bold hover:bg-brand-emerald/90"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Product list Table */}
          <div className="bg-brand-card border border-brand-card-light rounded-xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-brand-card-light bg-brand-card-light/40 text-brand-light/60 font-semibold tracking-wider uppercase text-[10px]">
                    <th className="p-3">Product / Brand</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">Opening (S01)</th>
                    <th className="p-3 text-center text-brand-emerald">Received (S02)</th>
                    <th className="p-3 text-center text-brand-gold">Sold (POS)</th>
                    <th className="p-3 text-center text-brand-danger">Variance</th>
                    <th className="p-3 text-center font-bold">Closing Stock</th>
                    <th className="p-3 text-right">Buying (KES)</th>
                    <th className="p-3 text-right">Selling (KES)</th>
                    <th className="p-3 text-right text-brand-emerald">Profit (KES)</th>
                    <th className="p-3 text-center">Reorder Lvl</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-card-light/50">
                  {filteredInventory.map(item => {
                    const isLow = item.quantity <= item.minThreshold;
                    const isOut = item.quantity === 0;
                    const margin = item.sellPrice - item.costPrice;
                    const marginPercent = item.sellPrice > 0 ? ((margin / item.sellPrice) * 100).toFixed(0) : '0';

                    return (
                      <tr key={item.id} className="hover:bg-brand-card-light/20 transition-all">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-brand-emerald/20 text-brand-emerald px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight border border-brand-emerald/30">{item.id}</span>
                            <div className="font-semibold text-white">{item.brand || item.name}</div>
                          </div>
                          <div className="text-[10px] text-brand-light/50 flex flex-wrap items-center gap-1.5 mt-0.5">
                            {item.sku && <span className="text-brand-gold/80 font-mono text-[9px] bg-brand-dark/40 px-1 py-0.25 rounded border border-brand-gold/15">{item.sku}</span>}
                            <span className="bg-brand-dark/50 px-1 py-0.25 rounded text-brand-light/80 font-mono text-[9px]">{item.packSize || 'Units'}</span>
                            <span>• {item.supplier || 'General'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-dark/40 text-brand-light/70 border border-brand-card-light/50 whitespace-nowrap">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-medium text-brand-light/60">
                          {item.openingStock ?? item.quantity}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-brand-emerald/80">
                          +{item.received ?? 0}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-brand-gold/80">
                          -{item.sold ?? 0}
                        </td>
                        <td className="p-3 text-center font-mono font-semibold text-brand-danger/80">
                          {item.variance ?? 0}
                        </td>
                        <td className="p-3 text-center font-semibold">
                          <span className={`px-2 py-0.5 rounded-sm font-bold ${
                            isOut 
                              ? 'bg-brand-danger/15 text-brand-danger border border-brand-danger/35' 
                              : isLow 
                                ? 'bg-brand-gold/15 text-brand-gold border border-brand-gold/35 animate-pulse' 
                                : 'bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/35'
                          }`}>
                            {item.quantity} {item.unit || 'pcs'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono text-brand-light/70">
                          {item.costPrice.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono font-semibold text-brand-gold">
                          {item.sellPrice.toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <span className="font-bold text-brand-emerald font-mono">
                            {margin.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-brand-light/40 block">
                            ({marginPercent}%)
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-brand-light/50 font-semibold">
                          {item.minThreshold}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => startEdit(item)}
                              className="p-1 rounded hover:bg-brand-emerald/10 text-brand-light hover:text-brand-emerald transition-all"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if(confirm(`Are you sure you want to delete ${item.name}?`)) {
                                  onDeleteProduct(item.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-brand-danger/10 text-brand-light/60 hover:text-brand-danger transition-all"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredInventory.length === 0 && (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-brand-light/40 font-medium">
                        No inventory matches found. Try adjusting filters or search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual Stock Arrival Sub Tab */}
      {activeTab === 'arrival' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 1. LEFT SIDEBAR: Searchable Supplier Directory */}
            <div id="supplier-directory-card" className="lg:col-span-4 bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg space-y-4">
              <div className="border-b border-brand-card-light pb-3">
                <h4 className="font-bold text-white flex items-center gap-2 font-display">
                  <Briefcase className="w-4 h-4 text-brand-emerald" />
                  Supplier Directory
                </h4>
                <p className="text-xs text-brand-light/50 mt-0.5">Select a distributor to filter catalog products and audit buying prices.</p>
              </div>

              {/* Search Suppliers */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-light/40">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search supplier names or locations..."
                  value={supplierSearchQuery}
                  onChange={(e) => setSupplierSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-brand-dark/50 border border-brand-card-light focus:border-brand-emerald focus:outline-none text-brand-light text-xs"
                />
              </div>

              {/* Suppliers List */}
              <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1">
                {suppliers.filter(sup => 
                  sup.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                  sup.location.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                ).map(sup => {
                  const isSelected = selectedSupplier?.id === sup.id;
                  return (
                    <button
                      key={sup.id}
                      type="button"
                      onClick={() => {
                        setSelectedSupplier(sup);
                        setArrivalInputs({});
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'bg-brand-emerald/10 border-brand-emerald/40 shadow-sm'
                          : 'bg-brand-dark/20 border-brand-card-light/40 hover:bg-brand-card-light/15 hover:border-brand-card-light/80'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className={`font-bold text-xs ${isSelected ? 'text-brand-emerald' : 'text-white'}`}>{sup.name}</p>
                        <div className="flex items-center gap-0.5 text-brand-gold">
                          <Star className="w-3 h-3 fill-brand-gold" />
                          <span className="text-[10px] font-bold">{sup.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-brand-light/40 mt-1 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 shrink-0" /> {sup.location}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sup.categories.slice(0, 3).map((cat, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-card-light/50 text-brand-light/60">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
                {suppliers.filter(sup => 
                  sup.name.toLowerCase().includes(supplierSearchQuery.toLowerCase()) ||
                  sup.location.toLowerCase().includes(supplierSearchQuery.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-xs text-brand-light/40 py-6">No suppliers match your search.</p>
                )}
              </div>

              {/* Active Supplier Details Card */}
              {selectedSupplier && (
                <div className="p-4 rounded-xl bg-brand-dark/50 border border-brand-card-light/50 space-y-3">
                  <div className="flex justify-between items-center border-b border-brand-card-light/40 pb-2">
                    <p className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest">Active Partner</p>
                    <span className="text-[9px] px-2 py-0.5 rounded bg-brand-card-light text-brand-light/80 font-semibold border border-brand-card-light">
                      {selectedSupplier.paymentTerms}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-brand-light/80">
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-brand-emerald shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-white">{selectedSupplier.contactPerson}</p>
                        <p className="text-[10px] text-brand-light/50">{selectedSupplier.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-3.5 h-3.5 text-brand-emerald shrink-0 mt-0.5" />
                      <p className="break-all font-mono text-[10px]">{selectedSupplier.email}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-emerald shrink-0 mt-0.5" />
                      <p>{selectedSupplier.location}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. RIGHT PANEL: Bulk Arrival Invoice Form */}
            <div id="bulk-arrival-invoice-card" className="lg:col-span-8 bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-brand-card-light pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white font-display">Log Incoming Bulk Deliveries (S02)</h4>
                    {selectedSupplier && (
                      <span className="text-[11px] bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 px-2 py-0.5 rounded font-black tracking-wider uppercase">
                        {selectedSupplier.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-light/50 mt-0.5">Adjust delivery counts and select reorder cost price suggested by records.</p>
                </div>
                
                {selectedSupplier && (
                  <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                    <input
                      type="checkbox"
                      checked={onlySupplierItems}
                      onChange={(e) => setOnlySupplierItems(e.target.checked)}
                      className="rounded border-brand-card-light text-brand-emerald bg-brand-dark focus:ring-brand-emerald focus:ring-offset-brand-dark"
                    />
                    <span className="text-brand-light/80 font-semibold">Only show products from {selectedSupplier.name}</span>
                  </label>
                )}
              </div>

              <form onSubmit={handleBulkArrivalSubmit} className="space-y-4">
                <div className="max-h-[380px] overflow-y-auto pr-2 divide-y divide-brand-card-light/20 space-y-2">
                  {inventory.filter(item => {
                    if (!selectedSupplier) return true;
                    if (onlySupplierItems) {
                      return item.supplier === selectedSupplier.name;
                    }
                    return true;
                  }).map(item => {
                    const history = getHistoricalCostForProduct(item.id, selectedSupplier?.name);
                    const currentCost = arrivalCosts[item.id] ?? item.costPrice;
                    const hasQty = (arrivalInputs[item.id] || 0) > 0;

                    return (
                      <div key={item.id} className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs transition-all ${hasQty ? 'bg-brand-emerald/5 px-2 rounded-lg border border-brand-emerald/10' : ''}`}>
                        {/* Item metadata */}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] bg-brand-dark/60 text-brand-light/70 px-1.5 py-0.5 rounded border border-brand-card-light/40">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-brand-light/50">
                              Current Stock: <span className={`font-bold ${item.quantity <= item.minThreshold ? 'text-brand-danger' : 'text-brand-emerald'}`}>{item.quantity}</span> {item.unit}s
                            </span>
                            <span className="text-[10px] text-brand-light/40">
                              Standard Catalog Cost: KES {item.costPrice}
                            </span>
                          </div>
                          
                          {/* Historical price suggestions */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] text-brand-light/40 flex items-center gap-1">
                              <History className="w-3 h-3 text-brand-emerald" /> Suggested buying price:
                            </span>

                            {history ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setArrivalCosts(prev => ({ ...prev, [item.id]: history.latestPrice }))}
                                  className={`px-2 py-0.5 rounded text-[10px] transition-all font-semibold flex items-center gap-1 border ${
                                    currentCost === history.latestPrice
                                      ? 'bg-brand-emerald text-brand-dark border-brand-emerald'
                                      : 'bg-brand-dark/60 text-brand-light/70 border-brand-card-light/50 hover:text-white hover:border-brand-light'
                                  }`}
                                  title={`Ordered on ${history.latestDate}`}
                                >
                                  Last: KES {history.latestPrice}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setArrivalCosts(prev => ({ ...prev, [item.id]: history.avgPrice }))}
                                  className={`px-2 py-0.5 rounded text-[10px] transition-all font-semibold flex items-center gap-1 border ${
                                    currentCost === history.avgPrice
                                      ? 'bg-brand-emerald text-brand-dark border-brand-emerald'
                                      : 'bg-brand-dark/60 text-brand-light/70 border-brand-card-light/50 hover:text-white hover:border-brand-light'
                                  }`}
                                >
                                  Avg: KES {history.avgPrice}
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => setArrivalCosts(prev => ({ ...prev, [item.id]: history.bestPrice }))}
                                  className={`px-2 py-0.5 rounded text-[10px] transition-all font-semibold flex items-center gap-1 border ${
                                    currentCost === history.bestPrice
                                      ? 'bg-brand-emerald text-brand-dark border-brand-emerald'
                                      : 'bg-brand-dark/60 text-brand-light/70 border-brand-card-light/50 hover:text-white hover:border-brand-light'
                                  }`}
                                >
                                  Best: KES {history.bestPrice}
                                </button>

                                {history.trend && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold uppercase tracking-wider ${
                                    history.trend === 'up'
                                      ? 'bg-brand-danger/10 text-brand-danger'
                                      : history.trend === 'down'
                                      ? 'bg-brand-emerald/10 text-brand-emerald'
                                      : 'bg-brand-card-light text-brand-light/60'
                                  }`}>
                                    {history.trend === 'up' ? <TrendingUp className="w-2.5 h-2.5" /> : history.trend === 'down' ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                                    {history.trend === 'up' ? `▲ +${history.trendPercentage.toFixed(1)}%` : history.trend === 'down' ? `▼ -${history.trendPercentage.toFixed(1)}%` : 'Stable'}
                                  </span>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setArrivalCosts(prev => ({ ...prev, [item.id]: item.costPrice }))}
                                className="text-[10px] px-2 py-0.5 bg-brand-dark/60 text-brand-light/50 rounded border border-brand-card-light/40 hover:text-white"
                              >
                                Standard: KES {item.costPrice}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Cost & Qty entries */}
                        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                          {/* Unit cost override */}
                          <div className="flex flex-col gap-0.5 w-24">
                            <span className="text-[9px] text-brand-light/40 uppercase font-bold tracking-wide">Unit Cost (KES)</span>
                            <input
                              type="number"
                              min="1"
                              value={currentCost}
                              onChange={e => handleArrivalCostChange(item.id, e.target.value)}
                              className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light font-mono font-semibold text-white focus:border-brand-emerald focus:outline-none"
                            />
                          </div>

                          {/* Received amount */}
                          <div className="flex flex-col gap-0.5 w-20">
                            <span className="text-[9px] text-brand-light/40 uppercase font-bold tracking-wide">Add Qty</span>
                            <input
                              type="number"
                              min="0"
                              value={arrivalInputs[item.id] || ''}
                              onChange={e => handleArrivalInputChange(item.id, e.target.value)}
                              placeholder="0"
                              className="w-full px-2 py-1.5 rounded bg-brand-dark border border-brand-card-light text-center font-bold text-white focus:border-brand-emerald focus:outline-none"
                            />
                          </div>
                          <span className="text-brand-light/40 text-[10px] w-12 self-end mb-2 truncate font-medium">{item.unit}s</span>
                        </div>
                      </div>
                    );
                  })}
                  {inventory.filter(item => {
                    if (!selectedSupplier) return true;
                    if (onlySupplierItems) {
                      return item.supplier === selectedSupplier.name;
                    }
                    return true;
                  }).length === 0 && (
                    <div className="py-12 text-center text-brand-light/40 font-semibold italic">
                      No matching products are assigned to this supplier. Toggle the filter above to select items manually from other catalogs.
                    </div>
                  )}
                </div>

                {/* Submit and checkout summary */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-brand-card-light bg-brand-dark/20 p-4 rounded-xl">
                  <div className="text-left text-xs text-brand-light/80 space-y-1">
                    <p>Total beverage lines selected: <span className="font-bold text-white">{Object.values(arrivalInputs).filter(qty => Number(qty) > 0).length} items</span></p>
                    <p className="text-xs">
                      Estimated Invoice Total: <span className="font-black text-brand-emerald text-base font-mono">KES {
                        Object.entries(arrivalInputs)
                          .reduce((sum, [id, qty]) => {
                            const cost = arrivalCosts[id] ?? inventory.find(item => item.id === id)?.costPrice ?? 0;
                            return sum + (Number(qty) * cost);
                          }, 0).toLocaleString()
                      }</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setArrivalInputs({});
                      }}
                      className="px-4 py-2.5 bg-brand-card-light text-white font-semibold rounded-lg text-xs hover:bg-brand-card-light/80"
                    >
                      Reset Counts
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-emerald text-brand-dark font-extrabold px-6 py-2.5 rounded-xl text-xs tracking-wider hover:bg-brand-emerald/95 shadow-lg shadow-brand-emerald/20 transition-all flex items-center gap-1.5"
                    >
                      <ArrowUpRight className="w-4 h-4" /> Log Deliveries & Update Stock
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* 3. HISTORICAL DELIVERIES ARCHIVE */}
          <div className="bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-brand-card-light pb-3">
              <div>
                <h4 className="font-bold text-white flex items-center gap-2 font-display">
                  <History className="w-4 h-4 text-brand-gold animate-pulse" />
                  Supplier S02 Delivery logs & audit trace
                </h4>
                <p className="text-xs text-brand-light/50 mt-0.5">Explore historic inventory batch receptions, invoice totals, and prices paid.</p>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {deliveries.length === 0 ? (
                <div className="py-8 text-center text-brand-light/40 text-xs italic">
                  No previous bulk delivery receipts found. Reordering stock will populate logs.
                </div>
              ) : (
                deliveries.map(del => {
                  const isExpanded = expandedDeliveryId === del.id;
                  return (
                    <div key={del.id} className="border border-brand-card-light/40 rounded-lg overflow-hidden bg-brand-dark/20 text-xs">
                      {/* Accordion Trigger */}
                      <button
                        type="button"
                        onClick={() => setExpandedDeliveryId(isExpanded ? null : del.id)}
                        className="w-full p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-brand-card-light/10 text-left transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="w-8 h-8 rounded bg-brand-card-light/80 flex items-center justify-center font-bold text-brand-gold text-[10px]">
                            S02
                          </div>
                          <div>
                            <p className="font-bold text-white">{del.supplier}</p>
                            <p className="text-[10px] text-brand-light/50 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-emerald" /> Recorded: {del.date} | Invoice: #{del.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6">
                          <div className="text-right">
                            <p className="text-[9px] text-brand-light/40 font-bold uppercase">Total Batch cost</p>
                            <p className="text-sm font-bold text-brand-emerald font-mono">KES {del.totalAmount.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2 text-brand-light/60">
                            <span className="text-[10px] font-semibold">{del.items.length} product lines</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>

                      {/* Accordion details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-brand-card-light/30 bg-brand-dark/40"
                          >
                            <div className="p-4 space-y-2">
                              <div className="grid grid-cols-4 pb-2 border-b border-brand-card-light/20 font-bold text-brand-light/50 text-[9px] uppercase tracking-wider">
                                <span className="col-span-2">Beverage Line</span>
                                <span className="text-center">Batch Quantity</span>
                                <span className="text-right">Unit Price Paid</span>
                              </div>
                              <div className="divide-y divide-brand-card-light/10">
                                {del.items.map((it, idx) => (
                                  <div key={idx} className="grid grid-cols-4 py-2 text-[11px] items-center">
                                    <span className="col-span-2 font-bold text-white">{it.itemName}</span>
                                    <span className="text-center text-brand-light font-bold">+{it.quantity} units</span>
                                    <span className="text-right font-mono text-brand-emerald font-semibold">KES {it.costPrice.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Smart Stock Uploader Sub Tab (Supporting CSV, PDF, and Image uploads) */}
      {activeTab === 'ai-ocr' && (
        <div className="bg-brand-card border border-brand-card-light rounded-xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-brand-card-light pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-emerald animate-pulse" />
                <h4 className="font-bold text-white font-display">Smart Stock Uploader & AI Scanner</h4>
              </div>
              <p className="text-xs text-brand-light/50 mt-1">
                Bulk upload inventory files. Choose to import new catalog definitions, record supplier deliveries, or run OCR invoice scans.
              </p>
            </div>

            {/* Mode selection buttons */}
            <div className="flex bg-brand-dark rounded-xl border border-brand-card-light p-1 text-xs font-bold w-full md:w-auto self-stretch md:self-center">
              <button
                type="button"
                onClick={() => {
                  setInventoryUploadMode('ocr');
                  setSelectedFile(null);
                  setScanStep(0);
                  setOcrResults([]);
                  setParsedCatalogUploads([]);
                  setParsedArrivalUploads([]);
                }}
                className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap text-center ${inventoryUploadMode === 'ocr' ? 'bg-brand-emerald text-brand-dark' : 'text-brand-light/60 hover:text-white'}`}
              >
                AI OCR Invoice
              </button>
              <button
                type="button"
                onClick={() => {
                  setInventoryUploadMode('csv-catalog');
                  setSelectedFile(null);
                  setScanStep(0);
                  setOcrResults([]);
                  setParsedCatalogUploads([]);
                  setParsedArrivalUploads([]);
                }}
                className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap text-center ${inventoryUploadMode === 'csv-catalog' ? 'bg-brand-emerald text-brand-dark' : 'text-brand-light/60 hover:text-white'}`}
              >
                CSV Catalog Import
              </button>
              <button
                type="button"
                onClick={() => {
                  setInventoryUploadMode('csv-arrival');
                  setSelectedFile(null);
                  setScanStep(0);
                  setOcrResults([]);
                  setParsedCatalogUploads([]);
                  setParsedArrivalUploads([]);
                }}
                className={`flex-1 md:flex-initial px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap text-center ${inventoryUploadMode === 'csv-arrival' ? 'bg-brand-emerald text-brand-dark' : 'text-brand-light/60 hover:text-white'}`}
              >
                CSV Stock Arrival (S02)
              </button>
            </div>
          </div>

          {scanStep === 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Upload Zone */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-brand-card-light rounded-xl hover:border-brand-emerald/50 transition-all bg-brand-dark/20 relative">
                <UploadCloud className="w-12 h-12 text-brand-emerald/60 mb-3" />
                <p className="text-sm font-semibold text-white text-center">
                  {inventoryUploadMode === 'ocr' 
                    ? 'Drag and drop supplier delivery note / invoice image' 
                    : `Drag and drop inventory CSV template file`}
                </p>
                <p className="text-xs text-brand-light/40 text-center mt-1">
                  {inventoryUploadMode === 'ocr'
                    ? 'Supports PDF, PNG, JPG, or HEIC (Max 10MB)'
                    : 'Supports standardized CSV files (Max 5MB)'}
                </p>
                
                <div className="relative mt-5">
                  <input
                    type="file"
                    id="inventory-bulk-selector"
                    className="hidden"
                    accept={inventoryUploadMode === 'ocr' ? 'image/*,application/pdf' : '.csv'}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleInventoryFileChange(file);
                    }}
                  />
                  <label
                    htmlFor="inventory-bulk-selector"
                    className="px-4 py-2 bg-brand-card-light text-white rounded-lg text-xs font-semibold tracking-wide hover:bg-brand-card-light/90 cursor-pointer shadow border border-brand-card-light"
                  >
                    Browse Local Files
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 bg-brand-card-light/50 px-4 py-3 rounded-lg border border-brand-card-light max-w-sm w-full">
                    <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-brand-light/40">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      onClick={runSimulatedOCR}
                      className="w-full sm:w-auto bg-brand-emerald text-brand-dark font-extrabold px-3 py-1.5 rounded text-[10px] tracking-wider hover:bg-brand-emerald/90 uppercase shadow shrink-0 active:scale-98"
                    >
                      Process & Parse
                    </button>
                  </div>
                )}
              </div>

              {/* Template Guidance */}
              <div className="bg-brand-dark/30 rounded-xl p-4 border border-brand-card-light/20 flex flex-col justify-between space-y-4 text-xs text-brand-light/70">
                <div>
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider text-brand-gold mb-2">
                    {inventoryUploadMode === 'ocr' && 'Invoice OCR Guide'}
                    {inventoryUploadMode === 'csv-catalog' && 'Catalog CSV Guide'}
                    {inventoryUploadMode === 'csv-arrival' && 'Stock Arrival CSV Guide'}
                  </h5>
                  
                  {inventoryUploadMode === 'ocr' && (
                    <div className="space-y-2">
                      <p>Take a clear, flat photo of your paper delivery note or upload the supplier PDF invoice directly.</p>
                      <p>Our smart layout parser correlates beverage descriptions, matches unit cost prices, and computes bulk cases for rapid stocking.</p>
                    </div>
                  )}

                  {inventoryUploadMode === 'csv-catalog' && (
                    <div className="space-y-3">
                      <p>Bulk add new items or update existing pricing, threshold levels, and categories.</p>
                      <p>Required columns in CSV headers:</p>
                      <pre className="p-2.5 bg-brand-dark/90 text-brand-emerald rounded text-[9px] font-mono select-all overflow-x-auto whitespace-pre">
                        Name,Category,Cost Price,Sell Price,Min Threshold,Supplier
                      </pre>
                      <p className="text-[9px] text-brand-light/40">If a product name already exists, the catalog detail will be updated.</p>
                    </div>
                  )}

                  {inventoryUploadMode === 'csv-arrival' && (
                    <div className="space-y-3">
                      <p>Quickly log bulk stock counts from a standard purchase order receipt sheet.</p>
                      <p>Required columns in CSV headers:</p>
                      <pre className="p-2.5 bg-brand-dark/90 text-brand-emerald rounded text-[9px] font-mono select-all overflow-x-auto whitespace-pre">
                        Item ID,Quantity,Cost Price
                      </pre>
                      <p className="text-[9px] text-brand-light/40">We will attempt to match IDs, names, or SKUs directly to update physical stock counts.</p>
                    </div>
                  )}
                </div>

                <div className="p-2.5 bg-brand-emerald/5 border border-brand-emerald/10 rounded flex items-start gap-2 text-[10px]">
                  <Info className="w-4 h-4 text-brand-emerald shrink-0 mt-0.5" />
                  <span>Verify that CSV files are comma-separated and values are in pure numeric digits.</span>
                </div>
              </div>
            </div>
          )}

          {scanStep === 1 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <LoopIcon className="w-16 h-16 text-brand-emerald animate-spin" />
                <Sparkles className="w-6 h-6 text-brand-gold absolute animate-bounce" />
              </div>
              <h5 className="font-bold text-white text-sm mt-4">Analyzing Document Layout...</h5>
              <p className="text-xs text-brand-light/50 mt-1 max-w-xs text-center">
                Reading lines, OCR tabular scanning, correlating item matches with your local inventory definitions...
              </p>

              {/* Progress Bar simulation */}
              <div className="w-full max-w-md bg-brand-card-light/60 h-1.5 rounded-full overflow-hidden mt-6">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 4, ease: 'easeInOut' }}
                  className="bg-brand-emerald h-full shadow-[0_0_10px_rgba(0,212,165,0.5)]"
                />
              </div>
            </div>
          )}

          {scanStep === 2 && (
            <div className="space-y-4">
              {/* Header and Discard */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-emerald/10 border border-brand-emerald/20 p-4 rounded-xl">
                <div>
                  <h5 className="font-bold text-white text-xs">Extraction Completed!</h5>
                  <p className="text-[10px] text-brand-light/60 mt-0.5">
                    {inventoryUploadMode === 'ocr' && `Extracted ${ocrResults.length} matching items from receipt.`}
                    {inventoryUploadMode === 'csv-catalog' && `Extracted ${parsedCatalogUploads.length} catalog definitions from CSV.`}
                    {inventoryUploadMode === 'csv-arrival' && `Extracted ${parsedArrivalUploads.length} stock arrival items from CSV.`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setScanStep(0);
                    setOcrResults([]);
                    setParsedCatalogUploads([]);
                    setParsedArrivalUploads([]);
                  }}
                  className="text-xs text-brand-light hover:underline text-left"
                >
                  Clear & Re-Upload
                </button>
              </div>

              {/* Supplier Selection for Deliveries / OCR */}
              {(inventoryUploadMode === 'ocr' || inventoryUploadMode === 'csv-arrival') && (
                <div className="bg-brand-dark/20 border border-brand-card-light/50 p-4 rounded-lg text-xs space-y-2">
                  <span className="font-bold text-white uppercase tracking-wider text-[10px] text-brand-gold block">Logistics Supplier Metadata</span>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <span className="text-brand-light/60 shrink-0">Source Supplier:</span>
                    <select
                      value={selectedArrivalSupplierName}
                      onChange={e => setSelectedArrivalSupplierName(e.target.value)}
                      className="bg-brand-dark border border-brand-card-light rounded text-xs text-white px-3 py-1.5 font-semibold focus:outline-none focus:border-brand-emerald"
                    >
                      <option value="General Supplier">General Supplier</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.name}>{sup.name}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-brand-light/30">Select vendor to associate and log purchase order invoice.</span>
                  </div>
                </div>
              )}

              {/* REVIEW GRID: MODE 1 (OCR Extraction review) */}
              {inventoryUploadMode === 'ocr' && ocrResults.length > 0 && (
                <div className="bg-brand-dark/40 border border-brand-card-light rounded-xl overflow-hidden text-xs">
                  <div className="grid grid-cols-4 p-3 bg-brand-card-light/40 font-semibold text-brand-light/70 uppercase tracking-wider text-[10px]">
                    <span className="col-span-2">Extracted Item Name</span>
                    <span className="text-right">Unit Price (KES)</span>
                    <span className="text-right">Extracted Qty</span>
                  </div>
                  <div className="divide-y divide-brand-card-light/30">
                    {ocrResults.map((res, i) => (
                      <div key={i} className="grid grid-cols-4 p-3 items-center">
                        <div className="col-span-2">
                          <p className="font-bold text-white">{res.name}</p>
                          <p className="text-[10px] text-brand-emerald font-medium flex items-center gap-1 mt-0.5">
                            <Check className="w-3 h-3" /> Auto-matched with active inventory ID
                          </p>
                        </div>
                        <span className="text-right font-medium text-brand-light/70">
                          <input
                            type="number"
                            value={res.cost}
                            onChange={e => {
                              const updated = [...ocrResults];
                              updated[i].cost = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setOcrResults(updated);
                            }}
                            className="bg-brand-dark text-center border border-brand-card-light rounded w-16 p-1 text-white font-mono text-xs font-bold"
                          />
                        </span>
                        <span className="text-right font-bold text-brand-emerald">
                          <input
                            type="number"
                            value={res.quantity}
                            onChange={e => {
                              const updated = [...ocrResults];
                              updated[i].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                              setOcrResults(updated);
                            }}
                            className="bg-brand-dark text-center border border-brand-card-light rounded w-16 p-1 text-brand-emerald font-mono text-xs font-bold"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REVIEW GRID: MODE 2 (Catalog CSV Importer review) */}
              {inventoryUploadMode === 'csv-catalog' && parsedCatalogUploads.length > 0 && (
                <div className="bg-brand-dark/40 border border-brand-card-light rounded-xl overflow-hidden text-xs max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-brand-card-light/40 text-brand-light/70 font-semibold uppercase tracking-wider text-[10px] border-b border-brand-card-light">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Cost Price (KES)</th>
                        <th className="p-3 text-right">Sell Price (KES)</th>
                        <th className="p-3 text-right">Min Stock</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-card-light/20">
                      {parsedCatalogUploads.map((res, i) => (
                        <tr key={i} className="hover:bg-brand-card-light/5 text-[11px]">
                          <td className="p-3">
                            <input
                              type="text"
                              value={res.name}
                              onChange={e => {
                                const updated = [...parsedCatalogUploads];
                                updated[i].name = e.target.value;
                                setParsedCatalogUploads(updated);
                              }}
                              className="bg-brand-dark border border-brand-card-light rounded text-[11px] text-white p-1 w-full font-bold"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={res.category}
                              onChange={e => {
                                const updated = [...parsedCatalogUploads];
                                updated[i].category = e.target.value as any;
                                setParsedCatalogUploads(updated);
                              }}
                              className="bg-brand-dark border border-brand-card-light rounded text-[10px] text-white p-1"
                            >
                              {categories.filter(c => c !== 'All').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={res.costPrice}
                              onChange={e => {
                                const updated = [...parsedCatalogUploads];
                                updated[i].costPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                setParsedCatalogUploads(updated);
                              }}
                              className="bg-brand-dark text-right border border-brand-card-light rounded w-16 p-1 text-white font-mono"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={res.sellPrice}
                              onChange={e => {
                                const updated = [...parsedCatalogUploads];
                                updated[i].sellPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                setParsedCatalogUploads(updated);
                              }}
                              className="bg-brand-dark text-right border border-brand-card-light rounded w-16 p-1 text-brand-emerald font-mono font-bold"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={res.minThreshold}
                              onChange={e => {
                                const updated = [...parsedCatalogUploads];
                                updated[i].minThreshold = Math.max(1, parseInt(e.target.value, 10) || 1);
                                setParsedCatalogUploads(updated);
                              }}
                              className="bg-brand-dark text-center border border-brand-card-light rounded w-12 p-1 text-brand-gold font-mono"
                            />
                          </td>
                          <td className="p-3 text-center">
                            {res.isMatched ? (
                              <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                Update Exist
                              </span>
                            ) : (
                              <span className="bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20 px-2 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap">
                                Create New
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REVIEW GRID: MODE 3 (Stock Arrival CSV review) */}
              {inventoryUploadMode === 'csv-arrival' && parsedArrivalUploads.length > 0 && (
                <div className="bg-brand-dark/40 border border-brand-card-light rounded-xl overflow-hidden text-xs max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-brand-card-light/40 text-brand-light/70 font-semibold uppercase tracking-wider text-[10px] border-b border-brand-card-light">
                        <th className="p-3">Identifier Lookup</th>
                        <th className="p-3">Matched Bar Product</th>
                        <th className="p-3 text-right">Cost Price (KES)</th>
                        <th className="p-3 text-right">Arrived Qty</th>
                        <th className="p-3 text-center">Match State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-card-light/20">
                      {parsedArrivalUploads.map((res, i) => (
                        <tr key={i} className="hover:bg-brand-card-light/5 text-[11px]">
                          <td className="p-3 font-mono font-bold text-brand-gold">{res.lookup}</td>
                          <td className="p-3">
                            {res.isMatched ? (
                              <span className="text-white font-bold">{res.name}</span>
                            ) : (
                              <select
                                onChange={e => {
                                  const val = e.target.value;
                                  const selectedItem = inventory.find(inv => inv.id === val);
                                  const updated = [...parsedArrivalUploads];
                                  if (selectedItem) {
                                    updated[i].matchId = selectedItem.id;
                                    updated[i].name = selectedItem.name;
                                    updated[i].costPrice = selectedItem.costPrice;
                                    updated[i].isMatched = true;
                                  } else {
                                    updated[i].matchId = null;
                                    updated[i].name = `Unmatched Name: "${res.lookup}"`;
                                    updated[i].isMatched = false;
                                  }
                                  setParsedArrivalUploads(updated);
                                }}
                                className="bg-brand-dark border border-brand-card-light rounded text-[11px] text-white p-1"
                              >
                                <option value="">-- Click to manually link beverage --</option>
                                {inventory.map(inv => (
                                  <option key={inv.id} value={inv.id}>{inv.name}</option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={res.costPrice}
                              onChange={e => {
                                const updated = [...parsedArrivalUploads];
                                updated[i].costPrice = Math.max(0, parseFloat(e.target.value) || 0);
                                setParsedArrivalUploads(updated);
                              }}
                              className="bg-brand-dark text-right border border-brand-card-light rounded w-16 p-1 text-white font-mono"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={res.quantity}
                              onChange={e => {
                                const updated = [...parsedArrivalUploads];
                                updated[i].quantity = Math.max(1, parseInt(e.target.value, 10) || 1);
                                setParsedArrivalUploads(updated);
                              }}
                              className="bg-brand-dark text-center border border-brand-card-light rounded w-16 p-1 text-brand-emerald font-mono font-bold"
                            />
                          </td>
                          <td className="p-3 text-center">
                            {res.isMatched ? (
                              <span className="bg-brand-emerald/15 text-brand-emerald px-2 py-0.5 rounded text-[9px] font-bold">
                                Matched
                              </span>
                            ) : (
                              <span className="bg-brand-danger/15 text-brand-danger px-2 py-0.5 rounded text-[9px] font-bold">
                                Unresolved
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-brand-card-light">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setScanStep(0);
                    setOcrResults([]);
                    setParsedCatalogUploads([]);
                    setParsedArrivalUploads([]);
                  }}
                  className="px-4 py-2 bg-brand-card-light text-brand-light font-bold rounded-lg text-xs hover:bg-brand-card-light/85"
                >
                  Discard Results
                </button>
                
                {inventoryUploadMode === 'ocr' && (
                  <button
                    onClick={approveOCRArrival}
                    className="px-5 py-2.5 bg-brand-emerald text-brand-dark font-extrabold rounded-lg text-xs tracking-wide hover:bg-brand-emerald/90 flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,165,0.2)]"
                  >
                    <ArrowUpRight className="w-4 h-4" /> Approve Stock Addition
                  </button>
                )}

                {inventoryUploadMode === 'csv-catalog' && (
                  <button
                    onClick={triggerCatalogImportSave}
                    className="px-5 py-2.5 bg-brand-emerald text-brand-dark font-extrabold rounded-lg text-xs tracking-wide hover:bg-brand-emerald/90 flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,165,0.2)]"
                  >
                    <ArrowUpRight className="w-4 h-4" /> Save catalog entries ({parsedCatalogUploads.length})
                  </button>
                )}

                {inventoryUploadMode === 'csv-arrival' && (
                  <button
                    onClick={triggerArrivalImportSave}
                    className="px-5 py-2.5 bg-brand-emerald text-brand-dark font-extrabold rounded-lg text-xs tracking-wide hover:bg-brand-emerald/90 flex items-center gap-2 shadow-[0_0_15px_rgba(0,212,165,0.2)]"
                  >
                    <ArrowUpRight className="w-4 h-4" /> Log Supplier Delivery Note
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

