export const seedBusiness = {
  legalName: "Harbour Road Electrical Pty Ltd",
  tradingName: "Harbour Road Electrical",
  abn: "12 345 678 901",
  gstRegistered: true,
  gstBasis: "cash",
  gstFrequency: "quarterly",
  currency: "AUD",
  financialYearEnd: "30 Jun",
  bankName: "Business Everyday",
  bsb: "062-000",
  accountNumber: "1234 5678",
  invoiceMailbox: "info@flintzoo.com",
  mailboxProvider: "Microsoft 365",
  accountantName: "Priya Accountant",
  accountantEmail: "info@flintzoo.com",
  primaryDomain: "flintzoo.com",
  hostingProvider: "Hostinger"
};

export const seedOnboarding = [
  {
    businessName: "Harbour Road Electrical Pty Ltd",
    contactName: "Alex Chen",
    email: "info@flintzoo.com",
    plan: "Essentials",
    status: "Approved",
    paymentStatus: "Paid",
    requestedAt: "2026-05-05",
    notes: "Pilot customer cleared for accountant setup."
  },
  {
    businessName: "Garden Studio Co",
    contactName: "Maya Singh",
    email: "info@flintzoo.com",
    plan: "Quarterly GST",
    status: "Pending review",
    paymentStatus: "Pending",
    requestedAt: "2026-05-18",
    notes: "Awaiting payment confirmation."
  }
];

export const seedChartOfAccounts = [
  { code: "1000", name: "Business Bank Account", type: "Asset", gstCode: "GST Free", reportGroup: "Current Assets", active: true },
  { code: "1100", name: "Accounts Receivable", type: "Asset", gstCode: "GST Free", reportGroup: "Current Assets", active: true },
  { code: "1200", name: "GST Paid", type: "Asset", gstCode: "GST Paid", reportGroup: "Tax", active: true },
  { code: "2000", name: "Accounts Payable", type: "Liability", gstCode: "GST Free", reportGroup: "Current Liabilities", active: true },
  { code: "2100", name: "GST Collected", type: "Liability", gstCode: "GST Collected", reportGroup: "Tax", active: true },
  { code: "2200", name: "PAYG Withholding Payable", type: "Liability", gstCode: "GST Free", reportGroup: "Payroll", active: true },
  { code: "2300", name: "Superannuation Payable", type: "Liability", gstCode: "GST Free", reportGroup: "Payroll", active: true },
  { code: "3000", name: "Owner Equity", type: "Equity", gstCode: "GST Free", reportGroup: "Equity", active: true },
  { code: "4000", name: "Sales Income", type: "Income", gstCode: "GST Collected", reportGroup: "Trading Income", active: true },
  { code: "4100", name: "Other Income", type: "Income", gstCode: "GST Collected", reportGroup: "Trading Income", active: true },
  { code: "5000", name: "Accountancy", type: "Expense", gstCode: "GST Paid", reportGroup: "Administration", active: true },
  { code: "5010", name: "Capital expenses", type: "Expense", gstCode: "GST Paid", reportGroup: "Capital", active: true },
  { code: "5020", name: "Computer", type: "Expense", gstCode: "GST Paid", reportGroup: "Operations", active: true },
  { code: "5030", name: "Depreciation", type: "Expense", gstCode: "GST Free", reportGroup: "Non-cash", active: true },
  { code: "5040", name: "Directors fees & Salaries", type: "Expense", gstCode: "GST Free", reportGroup: "Payroll", active: true },
  { code: "5050", name: "Filing Fees", type: "Expense", gstCode: "GST Free", reportGroup: "Administration", active: true },
  { code: "5060", name: "Insurance", type: "Expense", gstCode: "GST Free", reportGroup: "Administration", active: true },
  { code: "5070", name: "M/V car fuel & oil", type: "Expense", gstCode: "GST Paid", reportGroup: "Motor Vehicle", active: true },
  { code: "5080", name: "M/V Repairs", type: "Expense", gstCode: "GST Paid", reportGroup: "Motor Vehicle", active: true },
  { code: "5090", name: "Material & Supplies", type: "Expense", gstCode: "GST Paid", reportGroup: "Cost of Sales", active: true },
  { code: "5100", name: "Parking", type: "Expense", gstCode: "GST Paid", reportGroup: "Motor Vehicle", active: true },
  { code: "5110", name: "Postage", type: "Expense", gstCode: "GST Paid", reportGroup: "Administration", active: true },
  { code: "5120", name: "Printing & Stat", type: "Expense", gstCode: "GST Paid", reportGroup: "Administration", active: true },
  { code: "5130", name: "Rent", type: "Expense", gstCode: "GST Paid", reportGroup: "Occupancy", active: true },
  { code: "5140", name: "Staff Training", type: "Expense", gstCode: "GST Paid", reportGroup: "Payroll", active: true },
  { code: "5150", name: "Subscriptions", type: "Expense", gstCode: "GST Paid", reportGroup: "Administration", active: true },
  { code: "5160", name: "Tel & internet", type: "Expense", gstCode: "GST Paid", reportGroup: "Operations", active: true },
  { code: "5170", name: "Travel & Accomodation", type: "Expense", gstCode: "GST Paid", reportGroup: "Travel", active: true },
  { code: "5180", name: "Web Hosting", type: "Expense", gstCode: "GST Paid", reportGroup: "Operations", active: true },
  { code: "5190", name: "Toll", type: "Expense", gstCode: "GST Paid", reportGroup: "Motor Vehicle", active: true }
];

export const seedTransactions = [
  {
    date: "2026-04-02",
    contact: "Bright Wholesale",
    description: "Materials for job INV-0841",
    accountCode: "5090",
    debit: 825,
    credit: 0,
    gstAmount: 75,
    source: "supplier invoice",
    status: "Approved",
    proofUrl: ""
  },
  {
    date: "2026-04-05",
    contact: "Client receipt",
    description: "Electrical installation income",
    accountCode: "4000",
    debit: 0,
    credit: 3300,
    gstAmount: 300,
    source: "sales invoice",
    status: "Approved",
    proofUrl: ""
  },
  {
    date: "2026-04-12",
    contact: "CloudSoft",
    description: "Web Hosting monthly service",
    accountCode: "5180",
    debit: 132,
    credit: 0,
    gstAmount: 12,
    source: "email invoice",
    status: "Needs review",
    proofUrl: ""
  },
  {
    date: "2026-04-25",
    contact: "Payroll",
    description: "Director salary",
    accountCode: "5040",
    debit: 2400,
    credit: 0,
    gstAmount: 0,
    source: "pay run",
    status: "Approved",
    proofUrl: ""
  },
  {
    date: "2026-04-25",
    contact: "ATO",
    description: "PAYG withholding",
    accountCode: "2200",
    debit: 0,
    credit: 520,
    gstAmount: 0,
    source: "pay run",
    status: "Approved",
    proofUrl: ""
  },
  {
    date: "2026-04-25",
    contact: "Super Fund",
    description: "Super guarantee accrual",
    accountCode: "2300",
    debit: 0,
    credit: 276,
    gstAmount: 0,
    source: "pay run",
    status: "Approved",
    proofUrl: ""
  }
];
