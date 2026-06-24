import { InventoryItem, StaffMember, Shift, Sale, Expense, Loss, Supplier, DeliveryRecord } from './types';

export const INITIAL_INVENTORY: InventoryItem[] = [
  // 1. BEER
  {
    id: 'BR001',
    sku: 'BEER-TUSKERLAGER-500ML',
    name: 'Tusker Lager - 500ml',
    category: 'Bottled Beer',
    brand: 'Tusker',
    packSize: '500ml',
    openingStock: 96,
    received: 100,
    sold: 15,
    quantity: 181,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 24,
    costPrice: 150,
    sellPrice: 250,
    supplier: 'EABL Distributors'
  },
  {
    id: 'BR002',
    sku: 'BEER-TUSKERMALT-500ML',
    name: 'Tusker Malt - 500ml',
    category: 'Bottled Beer',
    brand: 'Tusker',
    packSize: '500ml',
    openingStock: 48,
    received: 0,
    sold: 5,
    quantity: 43,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 12,
    costPrice: 160,
    sellPrice: 260,
    supplier: 'EABL Distributors'
  },
  {
    id: 'BR003',
    sku: 'BEER-WHITECAP-500ML',
    name: 'WhiteCap - 500ml',
    category: 'Bottled Beer',
    brand: 'White Cap',
    packSize: '500ml',
    openingStock: 72,
    received: 0,
    sold: 8,
    quantity: 64,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 18,
    costPrice: 160,
    sellPrice: 260,
    supplier: 'EABL Distributors'
  },
  {
    id: 'BR004',
    sku: 'BEER-GUINNESS-500ML',
    name: 'Guinness - 500ml',
    category: 'Bottled Beer',
    brand: 'Guinness',
    packSize: '500ml',
    openingStock: 72,
    received: 0,
    sold: 12,
    quantity: 60,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 18,
    costPrice: 170,
    sellPrice: 270,
    supplier: 'EABL Distributors'
  },
  {
    id: 'BR005',
    sku: 'BEER-PILSNER-500ML',
    name: 'Pilsner - 500ml',
    category: 'Bottled Beer',
    brand: 'Pilsner',
    packSize: '500ml',
    openingStock: 48,
    received: 0,
    sold: 10,
    quantity: 38,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 12,
    costPrice: 140,
    sellPrice: 220,
    supplier: 'EABL Distributors'
  },
  {
    id: 'BR006',
    sku: 'BEER-BALOZI-500ML',
    name: 'Balozi - 500ml',
    category: 'Bottled Beer',
    brand: 'Balozi',
    packSize: '500ml',
    openingStock: 48,
    received: 0,
    sold: 4,
    quantity: 44,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 12,
    costPrice: 130,
    sellPrice: 210,
    supplier: 'EABL Distributors'
  },
  {
    id: 'BR007',
    sku: 'BEER-SUMMITLAGER-500ML',
    name: 'Summit Lager - 500ml',
    category: 'Bottled Beer',
    brand: 'Summit',
    packSize: '500ml',
    openingStock: 36,
    received: 0,
    sold: 6,
    quantity: 30,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 12,
    costPrice: 130,
    sellPrice: 210,
    supplier: 'EABL Distributors'
  },

  // 2. WHISKY
  {
    id: 'WH001',
    sku: 'WHISKY-HUNTERSCHOICE-750ML',
    name: "Hunter's Choice - 750ml",
    category: 'Whisky',
    brand: "Hunter's Choice",
    packSize: '750ml',
    openingStock: 12,
    received: 0,
    sold: 4,
    quantity: 7,
    variance: -1,
    unit: 'Bottle',
    minThreshold: 4,
    costPrice: 1000,
    sellPrice: 1800,
    supplier: 'EABL Distributors'
  },
  {
    id: 'WH002',
    sku: 'WHISKY-JOHNNIEWALKERRED-750ML',
    name: 'Johnnie Walker Red - 750ml',
    category: 'Whisky',
    brand: 'Johnnie Walker',
    packSize: '750ml',
    openingStock: 8,
    received: 25,
    sold: 5,
    quantity: 28,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 3,
    costPrice: 1500,
    sellPrice: 2600,
    supplier: 'EABL Distributors'
  },
  {
    id: 'WH003',
    sku: 'WHISKY-JAMESON-750ML',
    name: 'Jameson - 750ml',
    category: 'Whisky',
    brand: 'Jameson',
    packSize: '750ml',
    openingStock: 6,
    received: 0,
    sold: 2,
    quantity: 4,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 1900,
    sellPrice: 3200,
    supplier: 'Pernod Ricard'
  },
  {
    id: 'WH004',
    sku: 'WHISKY-GRANTS-750ML',
    name: "Grant's - 750ml",
    category: 'Whisky',
    brand: "Grant's",
    packSize: '750ml',
    openingStock: 6,
    received: 0,
    sold: 1,
    quantity: 5,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 1400,
    sellPrice: 2400,
    supplier: 'Pernod Ricard'
  },
  {
    id: 'WH005',
    sku: 'WHISKY-BLACKANDWHITE-750ML',
    name: 'Black & White - 750ml',
    category: 'Whisky',
    brand: 'Black & White',
    packSize: '750ml',
    openingStock: 4,
    received: 10,
    sold: 2,
    quantity: 12,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 1200,
    sellPrice: 2100,
    supplier: 'EABL Distributors'
  },
  {
    id: 'WH006',
    sku: 'WHISKY-JACKDANIELS-750ML',
    name: "Jack Daniel's - 750ml",
    category: 'Whisky',
    brand: "Jack Daniel's",
    packSize: '750ml',
    openingStock: 3,
    received: 0,
    sold: 1,
    quantity: 2,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 1,
    costPrice: 2500,
    sellPrice: 4500,
    supplier: 'Kenya Wine Agencies'
  },

  // 3. GIN
  {
    id: 'GN001',
    sku: 'GIN-GILBEYS-750ML',
    name: "Gilbey's - 750ml",
    category: 'Gin',
    brand: "Gilbey's",
    packSize: '750ml',
    openingStock: 12,
    received: 70,
    sold: 5,
    quantity: 77,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 4,
    costPrice: 800,
    sellPrice: 1400,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'GN002',
    sku: 'GIN-GORDONS-750ML',
    name: "Gordon's - 750ml",
    category: 'Gin',
    brand: "Gordon's",
    packSize: '750ml',
    openingStock: 10,
    received: 0,
    sold: 3,
    quantity: 7,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 3,
    costPrice: 1200,
    sellPrice: 2100,
    supplier: 'Pernod Ricard'
  },
  {
    id: 'GN003',
    sku: 'GIN-CHROMEGIN-750ML',
    name: 'Chrome Gin - 750ml',
    category: 'Gin',
    brand: 'Chrome Gin',
    packSize: '750ml',
    openingStock: 8,
    received: 50,
    sold: 2,
    quantity: 56,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 3,
    costPrice: 600,
    sellPrice: 1000,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'GN004',
    sku: 'GIN-BESTGIN-750ML',
    name: 'Best Gin - 750ml',
    category: 'Gin',
    brand: 'Best Gin',
    packSize: '750ml',
    openingStock: 6,
    received: 0,
    sold: 1,
    quantity: 5,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 550,
    sellPrice: 900,
    supplier: 'Kenya Wine Agencies'
  },

  // 4. VODKA
  {
    id: 'VD001',
    sku: 'VODKA-SMIRNOFF-750ML',
    name: 'Smirnoff - 750ml',
    category: 'Vodka',
    brand: 'Smirnoff',
    packSize: '750ml',
    openingStock: 10,
    received: 20,
    sold: 3,
    quantity: 27,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 3,
    costPrice: 1000,
    sellPrice: 1800,
    supplier: 'EABL Distributors'
  },
  {
    id: 'VD002',
    sku: 'VODKA-KIBAOVODKA-750ML',
    name: 'Kibao Vodka - 750ml',
    category: 'Vodka',
    brand: 'Kibao Vodka',
    packSize: '750ml',
    openingStock: 6,
    received: 0,
    sold: 2,
    quantity: 4,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 600,
    sellPrice: 1000,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'VD003',
    sku: 'VODKA-SAFARIVODKA-750ML',
    name: 'Safari Vodka - 750ml',
    category: 'Vodka',
    brand: 'Safari Vodka',
    packSize: '750ml',
    openingStock: 4,
    received: 0,
    sold: 1,
    quantity: 3,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 550,
    sellPrice: 950,
    supplier: 'Kenya Wine Agencies'
  },

  // 5. BRANDY
  {
    id: 'BD001',
    sku: 'BRANDY-VICEROY-750ML',
    name: 'Viceroy - 750ml',
    category: 'Brandy / Cognac',
    brand: 'Viceroy',
    packSize: '750ml',
    openingStock: 8,
    received: 12,
    sold: 4,
    quantity: 16,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 3,
    costPrice: 950,
    sellPrice: 1800,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'BD002',
    sku: 'BRANDY-RICHOT-750ML',
    name: 'Richot - 750ml',
    category: 'Brandy / Cognac',
    brand: 'Richot',
    packSize: '750ml',
    openingStock: 6,
    received: 0,
    sold: 2,
    quantity: 4,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 700,
    sellPrice: 1400,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'BD003',
    sku: 'BRANDY-HENNESSY-750ML',
    name: 'Hennessy - 750ml',
    category: 'Brandy / Cognac',
    brand: 'Hennessy',
    packSize: '750ml',
    openingStock: 2,
    received: 0,
    sold: 1,
    quantity: 1,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 1,
    costPrice: 4500,
    sellPrice: 7800,
    supplier: 'Pernod Ricard'
  },

  // 6. RUM
  {
    id: 'RM001',
    sku: 'RUM-CAPTAINMORGAN-750ML',
    name: 'Captain Morgan - 750ml',
    category: 'Rum',
    brand: 'Captain Morgan',
    packSize: '750ml',
    openingStock: 5,
    received: 45,
    sold: 5,
    quantity: 45,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 1100,
    sellPrice: 1900,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'RM002',
    sku: 'RUM-BACARDI-750ML',
    name: 'Bacardi - 750ml',
    category: 'Rum',
    brand: 'Bacardi',
    packSize: '750ml',
    openingStock: 4,
    received: 0,
    sold: 1,
    quantity: 3,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 1400,
    sellPrice: 2400,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'RM003',
    sku: 'RUM-KENYACANE-750ML',
    name: 'Kenya Cane - 750ml',
    category: 'Rum',
    brand: 'Kenya Cane',
    packSize: '750ml',
    openingStock: 8,
    received: 0,
    sold: 2,
    quantity: 6,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 3,
    costPrice: 600,
    sellPrice: 1000,
    supplier: 'Kenya Wine Agencies'
  },

  // 7. WINE
  {
    id: 'WN001',
    sku: 'WINE-FOURCOUSINS-750ML',
    name: 'Four Cousins - 750ml',
    category: 'Wine',
    brand: 'Four Cousins',
    packSize: '750ml',
    openingStock: 8,
    received: 0,
    sold: 2,
    quantity: 6,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 900,
    sellPrice: 1600,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'WN002',
    sku: 'WINE-CARLOROSSI-750ML',
    name: 'Carlo Rossi - 750ml',
    category: 'Wine',
    brand: 'Carlo Rossi',
    packSize: '750ml',
    openingStock: 6,
    received: 0,
    sold: 2,
    quantity: 4,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 2,
    costPrice: 1000,
    sellPrice: 1800,
    supplier: 'Kenya Wine Agencies'
  },
  {
    id: 'WN003',
    sku: 'WINE-NEDERBURG-750ML',
    name: 'Nederburg - 750ml',
    category: 'Wine',
    brand: 'Nederburg',
    packSize: '750ml',
    openingStock: 4,
    received: 0,
    sold: 1,
    quantity: 3,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 1,
    costPrice: 1400,
    sellPrice: 2400,
    supplier: 'Kenya Wine Agencies'
  },

  // 8. MIXERS & SOFT DRINKS
  {
    id: 'MX001',
    sku: 'MIXER-COCACOLA-500ML',
    name: 'Coca-Cola - 500ml',
    category: 'Mixers / Soft Drinks',
    brand: 'Coca Cola',
    packSize: '500ml',
    openingStock: 96,
    received: 120,
    sold: 15,
    quantity: 201,
    variance: -5,
    unit: 'Bottle',
    minThreshold: 24,
    costPrice: 50,
    sellPrice: 90,
    supplier: 'Coca-Cola Beverages'
  },
  {
    id: 'MX002',
    sku: 'MIXER-SPRITE-500ML',
    name: 'Sprite - 500ml',
    category: 'Mixers / Soft Drinks',
    brand: 'Sprite',
    packSize: '500ml',
    openingStock: 72,
    received: 48,
    sold: 10,
    quantity: 110,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 18,
    costPrice: 50,
    sellPrice: 90,
    supplier: 'Coca-Cola Beverages'
  },
  {
    id: 'MX003',
    sku: 'MIXER-FANTA-500ML',
    name: 'Fanta - 500ml',
    category: 'Mixers / Soft Drinks',
    brand: 'Fanta',
    packSize: '500ml',
    openingStock: 72,
    received: 0,
    sold: 8,
    quantity: 64,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 18,
    costPrice: 50,
    sellPrice: 90,
    supplier: 'Coca-Cola Beverages'
  },
  {
    id: 'MX004',
    sku: 'MIXER-SCHWEPPASTONIC-300ML',
    name: 'Schweppes Tonic - 300ml',
    category: 'Mixers / Soft Drinks',
    brand: 'Schweppes',
    packSize: '300ml',
    openingStock: 48,
    received: 0,
    sold: 6,
    quantity: 42,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 12,
    costPrice: 50,
    sellPrice: 90,
    supplier: 'Coca-Cola Beverages'
  },
  {
    id: 'MX005',
    sku: 'WATER-DASANI-500ML',
    name: 'Dasani Water - 500ml',
    category: 'Water',
    brand: 'Dasani',
    packSize: '500ml',
    openingStock: 96,
    received: 100,
    sold: 25,
    quantity: 171,
    variance: 0,
    unit: 'Bottle',
    minThreshold: 24,
    costPrice: 25,
    sellPrice: 60,
    supplier: 'Coca-Cola Beverages'
  },

  // 9. FOOD
  {
    id: 'FD001',
    sku: 'FOOD-CHICKENWINGS-PORTION',
    name: 'Buffalo Chicken Wings',
    category: 'Food',
    brand: 'Wings',
    packSize: 'Portion',
    openingStock: 50,
    received: 0,
    sold: 10,
    quantity: 40,
    variance: 0,
    unit: 'Portion',
    minThreshold: 15,
    costPrice: 300,
    sellPrice: 650,
    supplier: 'City Butchery'
  },
  {
    id: 'FD002',
    sku: 'FOOD-PUBBURGER-PORTION',
    name: 'Gourmet Pub Burger',
    category: 'Food',
    brand: 'Burger',
    packSize: 'Portion',
    openingStock: 30,
    received: 0,
    sold: 5,
    quantity: 25,
    variance: 0,
    unit: 'Portion',
    minThreshold: 10,
    costPrice: 350,
    sellPrice: 800,
    supplier: 'City Butchery'
  }
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: 's1', name: 'Francis Onyi', role: 'Manager', contact: '+254 712 345 678', hourlyRate: 500 },
  { id: 's2', name: 'Jane Wambui', role: 'Bartender', contact: '+254 723 456 789', hourlyRate: 300 },
  { id: 's3', name: 'Moses Kiprop', role: 'Bartender', contact: '+254 734 567 890', hourlyRate: 300 },
  { id: 's4', name: 'Alice Atieno', role: 'Waiter', contact: '+254 745 678 901', hourlyRate: 200 },
  { id: 's5', name: 'David Ochieng', role: 'Security', contact: '+254 756 789 012', hourlyRate: 250 }
];

export const INITIAL_SHIFTS: Shift[] = [
  { id: 'sh1', staffId: 's2', staffName: 'Jane Wambui', role: 'Bartender', date: '2026-06-23', startTime: '12:00', endTime: '18:00', totalHours: 6, payAmount: 1800, status: 'Completed' },
  { id: 'sh2', staffId: 's3', staffName: 'Moses Kiprop', role: 'Bartender', date: '2026-06-23', startTime: '18:00', endTime: '02:00', totalHours: 8, payAmount: 2400, status: 'Scheduled' },
  { id: 'sh3', staffId: 's4', staffName: 'Alice Atieno', role: 'Waiter', date: '2026-06-23', startTime: '16:00', endTime: '22:00', totalHours: 6, payAmount: 1200, status: 'Scheduled' },
  { id: 'sh4', staffId: 's5', staffName: 'David Ochieng', role: 'Security', date: '2026-06-23', startTime: '18:00', endTime: '02:00', totalHours: 8, payAmount: 2000, status: 'Scheduled' },
  { id: 'sh5', staffId: 's1', staffName: 'Francis Onyi', role: 'Manager', date: '2026-06-23', startTime: '09:00', endTime: '17:00', totalHours: 8, payAmount: 4000, status: 'Completed' }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale1',
    timestamp: '2026-06-23T11:30:00Z',
    items: [
      { itemId: 'BR001', name: 'Tusker Lager', quantity: 4, sellPrice: 250, costPrice: 150 },
      { itemId: 'MX001', name: 'Coca-Cola', quantity: 2, sellPrice: 90, costPrice: 50 }
    ],
    totalAmount: 1180,
    totalCost: 700,
    paymentMethod: 'Cash',
    loggedBy: 'Jane Wambui'
  },
  {
    id: 'sale2',
    timestamp: '2026-06-23T12:15:00Z',
    items: [
      { itemId: 'WH002', name: 'Johnnie Walker Red', quantity: 3, sellPrice: 2600, costPrice: 1500 },
      { itemId: 'FD001', name: 'Buffalo Chicken Wings', quantity: 2, sellPrice: 650, costPrice: 300 }
    ],
    totalAmount: 9100,
    totalCost: 5100,
    paymentMethod: 'Mobile (M-Pesa)',
    loggedBy: 'Jane Wambui'
  },
  {
    id: 'sale3',
    timestamp: '2026-06-23T13:45:00Z',
    items: [
      { itemId: 'GN001', name: "Gilbey's", quantity: 2, sellPrice: 1400, costPrice: 800 },
      { itemId: 'MX004', name: 'Schweppes Tonic', quantity: 4, sellPrice: 90, costPrice: 50 },
      { itemId: 'FD002', name: 'Gourmet Pub Burger', quantity: 2, sellPrice: 800, costPrice: 350 }
    ],
    totalAmount: 4760,
    totalCost: 2500,
    paymentMethod: 'Card',
    loggedBy: 'Jane Wambui'
  },
  {
    id: 'sale4',
    timestamp: '2026-06-23T15:20:00Z',
    items: [
      { itemId: 'RM001', name: 'Captain Morgan', quantity: 2, sellPrice: 1900, costPrice: 1100 },
      { itemId: 'BR001', name: 'Tusker Lager', quantity: 6, sellPrice: 250, costPrice: 150 },
      { itemId: 'FD001', name: 'Buffalo Chicken Wings', quantity: 1, sellPrice: 650, costPrice: 300 }
    ],
    totalAmount: 5950,
    totalCost: 3400,
    paymentMethod: 'Mobile (M-Pesa)',
    loggedBy: 'Moses Kiprop'
  },
  {
    id: 'sale5',
    timestamp: '2026-06-23T09:00:00Z',
    items: [
      { itemId: 'MX002', name: 'Sprite', quantity: 1, sellPrice: 90, costPrice: 50 },
      { itemId: 'FD002', name: 'Gourmet Pub Burger', quantity: 2, sellPrice: 800, costPrice: 350 },
      { itemId: 'BR001', name: 'Tusker Lager', quantity: 2, sellPrice: 250, costPrice: 150 }
    ],
    totalAmount: 2190,
    totalCost: 1100,
    paymentMethod: 'Cash',
    loggedBy: 'Francis Onyi'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp1', date: '2026-06-22', category: 'Rent', amount: 3000, description: 'Daily prorated business premises lease fee', status: 'Paid' },
  { id: 'exp2', date: '2026-06-23', category: 'Utilities', amount: 1500, description: 'Water and electricity split usage', status: 'Paid' },
  { id: 'exp3', date: '2026-06-23', category: 'Marketing', amount: 730, description: 'Sponsor flyers printing & event social promo', status: 'Paid' },
  { id: 'exp4', date: '2026-06-23', category: 'Others', amount: 1000, description: 'Bar sanitary and cleaning supplies', status: 'Paid' }
];

export const INITIAL_LOSSES: Loss[] = [
  { id: 'loss1', date: '2026-06-22', itemId: 'WH002', itemName: 'Johnnie Walker Red', type: 'Breakage', quantity: 1, costValue: 1500, notes: 'Accidental drop behind counter during cleaning', loggedBy: 'Moses Kiprop' },
  { id: 'loss2', date: '2026-06-23', itemId: 'BR001', itemName: 'Tusker Lager', type: 'Spillage', quantity: 5, costValue: 750, notes: 'Defective tap line overflow / customer knockover', loggedBy: 'Jane Wambui' },
  { id: 'loss3', date: '2026-06-23', itemId: 'MX004', itemName: 'Schweppes Tonic', type: 'Complimentary', quantity: 2, costValue: 100, notes: 'Complimentary drink given to resident DJ', loggedBy: 'Francis Onyi' },
  { id: 'loss4', date: '2026-06-23', itemId: 'MX001', itemName: 'Coca-Cola', type: 'Theft', quantity: 5, costValue: 250, notes: 'Discrepancy at stock count / unlogged takeaway', loggedBy: 'Francis Onyi' }
];

// Helper to calculate stock value dynamically
export function calculateStockValue(inventory: InventoryItem[]): number {
  return inventory.reduce((total, item) => total + (item.quantity * item.costPrice), 0);
}

// Get count of low stock items
export function getLowStockCount(inventory: InventoryItem[]): number {
  return inventory.filter(item => item.quantity <= item.minThreshold).length;
}

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: 'EABL Distributors', contactPerson: 'Otieno Kamau', phone: '+254 700 112 233', email: 'orders@eabl-distributors.co.ke', location: 'Ruaraka, Nairobi', rating: 5, paymentTerms: 'Cash on Delivery', categories: ['Whisky', 'Bottled Beer', 'Canned Beer / RTD', 'Gin', 'Vodka'] },
  { id: 'sup2', name: 'Kenya Wine Agencies', contactPerson: 'Wanjiku Mwangi', phone: '+254 711 223 344', email: 'sales@kwal.co.ke', location: 'Industrial Area, Nairobi', rating: 4, paymentTerms: 'Net 15', categories: ['Brandy / Cognac', 'Vodka', 'Rum', 'Tequila', 'Wine'] },
  { id: 'sup3', name: 'Pernod Ricard', contactPerson: 'Kiprono Bett', phone: '+254 722 334 455', email: 'orders.ke@pernod-ricard.com', location: 'Westlands, Nairobi', rating: 5, paymentTerms: 'Cash on Delivery', categories: ['Whisky', 'Gin', 'Brandy / Cognac', 'Vodka', 'Wine'] },
  { id: 'sup4', name: 'Coca-Cola Beverages', contactPerson: 'Juma Omwamba', phone: '+254 733 445 566', email: 'ccba-orders@cocacola.co.ke', location: 'Embakasi, Nairobi', rating: 5, paymentTerms: 'Cash on Delivery', categories: ['Mixers / Soft Drinks', 'Water'] },
  { id: 'sup5', name: 'Crown Beverages', contactPerson: 'Amina Yusuf', phone: '+254 744 556 677', email: 'info@crownbeverages.co.ke', location: 'Limuru, Kiambu', rating: 4, paymentTerms: 'Net 30', categories: ['Water'] },
  { id: 'sup6', name: 'Heineken East Africa', contactPerson: 'Mark de Vries', phone: '+254 755 667 788', email: 'heineken.orders@heineken.com', location: 'Kilimani, Nairobi', rating: 4, paymentTerms: 'Cash on Delivery', categories: ['Bottled Beer'] },
  { id: 'sup7', name: 'Red Bull Kenya', contactPerson: 'Brenda Njeri', phone: '+254 766 778 899', email: 'brenda.njeri@redbull.com', location: 'Spring Valley, Nairobi', rating: 5, paymentTerms: 'Cash on Delivery', categories: ['Mixers / Soft Drinks'] },
  { id: 'sup8', name: 'City Butchery', contactPerson: 'Njoroge Ndegwa', phone: '+254 777 889 900', email: 'orders@citybutchery.co.ke', location: 'City Market, Nairobi', rating: 4, paymentTerms: 'Cash on Delivery', categories: ['Food'] }
];

export const INITIAL_DELIVERIES: DeliveryRecord[] = [
  {
    id: 'del1',
    date: '2026-05-10',
    supplier: 'EABL Distributors',
    items: [
      { itemId: 'WH002', itemName: 'Johnnie Walker Red - 750ml', quantity: 15, costPrice: 1500 },
      { itemId: 'BR001', itemName: 'Tusker Lager - 500ml', quantity: 100, costPrice: 150 },
      { itemId: 'VD001', itemName: 'Smirnoff - 750ml', quantity: 20, costPrice: 1000 }
    ],
    totalAmount: 57500
  },
  {
    id: 'del2',
    date: '2026-06-01',
    supplier: 'EABL Distributors',
    items: [
      { itemId: 'WH002', itemName: 'Johnnie Walker Red - 750ml', quantity: 10, costPrice: 1500 },
      { itemId: 'BR001', itemName: 'Tusker Lager - 500ml', quantity: 150, costPrice: 150 },
      { itemId: 'WH005', itemName: 'Black & White - 750ml', quantity: 10, costPrice: 1200 }
    ],
    totalAmount: 49500
  },
  {
    id: 'del3',
    date: '2026-05-18',
    supplier: 'Kenya Wine Agencies',
    items: [
      { itemId: 'GN001', itemName: "Gilbey's - 750ml", quantity: 30, costPrice: 800 },
      { itemId: 'RM001', itemName: 'Captain Morgan - 750ml', quantity: 20, costPrice: 1100 },
      { itemId: 'BD001', itemName: 'Viceroy - 750ml', quantity: 12, costPrice: 950 }
    ],
    totalAmount: 57400
  },
  {
    id: 'del4',
    date: '2026-06-12',
    supplier: 'Kenya Wine Agencies',
    items: [
      { itemId: 'GN001', itemName: "Gilbey's - 750ml", quantity: 40, costPrice: 800 },
      { itemId: 'RM001', itemName: 'Captain Morgan - 750ml', quantity: 25, costPrice: 1100 },
      { itemId: 'GN003', itemName: 'Chrome Gin - 750ml', quantity: 50, costPrice: 600 }
    ],
    totalAmount: 89500
  },
  {
    id: 'del5',
    date: '2026-06-05',
    supplier: 'Coca-Cola Beverages',
    items: [
      { itemId: 'MX001', itemName: 'Coca-Cola - 500ml', quantity: 120, costPrice: 50 },
      { itemId: 'MX002', itemName: 'Sprite - 500ml', quantity: 48, costPrice: 50 },
      { itemId: 'MX005', itemName: 'Dasani Water - 500ml', quantity: 100, costPrice: 25 }
    ],
    totalAmount: 10900
  }
];

// Local Storage helpers
export function loadState() {
  try {
    const inventory = localStorage.getItem('agai_pub_inventory');
    const staff = localStorage.getItem('agai_pub_staff');
    const shifts = localStorage.getItem('agai_pub_shifts');
    const sales = localStorage.getItem('agai_pub_sales');
    const expenses = localStorage.getItem('agai_pub_expenses');
    const losses = localStorage.getItem('agai_pub_losses');
    const suppliers = localStorage.getItem('agai_pub_suppliers');
    const deliveries = localStorage.getItem('agai_pub_deliveries');

    return {
      inventory: inventory ? JSON.parse(inventory) : INITIAL_INVENTORY,
      staff: staff ? JSON.parse(staff) : INITIAL_STAFF,
      shifts: shifts ? JSON.parse(shifts) : INITIAL_SHIFTS,
      sales: sales ? JSON.parse(sales) : INITIAL_SALES,
      expenses: expenses ? JSON.parse(expenses) : INITIAL_EXPENSES,
      losses: losses ? JSON.parse(losses) : INITIAL_LOSSES,
      suppliers: suppliers ? JSON.parse(suppliers) : INITIAL_SUPPLIERS,
      deliveries: deliveries ? JSON.parse(deliveries) : INITIAL_DELIVERIES,
    };
  } catch (e) {
    console.error('Error loading state from local storage:', e);
    return {
      inventory: INITIAL_INVENTORY,
      staff: INITIAL_STAFF,
      shifts: INITIAL_SHIFTS,
      sales: INITIAL_SALES,
      expenses: INITIAL_EXPENSES,
      losses: INITIAL_LOSSES,
      suppliers: INITIAL_SUPPLIERS,
      deliveries: INITIAL_DELIVERIES,
    };
  }
}

export function saveState(state: {
  inventory: InventoryItem[];
  staff: StaffMember[];
  shifts: Shift[];
  sales: Sale[];
  expenses: Expense[];
  losses: Loss[];
  suppliers: Supplier[];
  deliveries: DeliveryRecord[];
}) {
  try {
    localStorage.setItem('agai_pub_inventory', JSON.stringify(state.inventory));
    localStorage.setItem('agai_pub_staff', JSON.stringify(state.staff));
    localStorage.setItem('agai_pub_shifts', JSON.stringify(state.shifts));
    localStorage.setItem('agai_pub_sales', JSON.stringify(state.sales));
    localStorage.setItem('agai_pub_expenses', JSON.stringify(state.expenses));
    localStorage.setItem('agai_pub_losses', JSON.stringify(state.losses));
    localStorage.setItem('agai_pub_suppliers', JSON.stringify(state.suppliers));
    localStorage.setItem('agai_pub_deliveries', JSON.stringify(state.deliveries));
  } catch (e) {
    console.error('Error saving state to local storage:', e);
  }
}
