import { useEffect, useMemo, useState } from "react";
import {
  addAccount,
  addOnboardingRequest,
  addTransaction,
  addTransactions,
  deleteAccount,
  deleteTransaction,
  getAccountingState,
  updateAccount,
  updateBusiness,
  updateOnboardingRequest,
  updateTransaction
} from "./services/db";

const moneyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD"
});

const today = () => new Date().toISOString().slice(0, 10);

const emptyAccount = {
  id: null,
  code: "",
  name: "",
  type: "Expense",
  gstCode: "GST Paid",
  reportGroup: "Administration",
  active: true
};

const emptyTransaction = {
  id: null,
  date: today(),
  contact: "",
  description: "",
  accountCode: "5090",
  debit: "",
  credit: "",
  gstAmount: "",
  source: "supplier invoice",
  status: "Needs review",
  proofUrl: ""
};

const emptyRegistration = {
  businessName: "",
  contactName: "",
  email: "",
  plan: "Quarterly GST",
  paymentStatus: "Pending",
  notes: ""
};

function formatMoney(value) {
  return moneyFormatter.format(Number(value || 0));
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseCurrency(value) {
  const numeric = String(value ?? "").replace(/[^0-9.-]/g, "");
  return Number(numeric || 0);
}

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

function guessAccountCode(description, chartOfAccounts) {
  const text = description.toLowerCase();
  const matches = [
    ["salary", "5040"],
    ["payroll", "5040"],
    ["fuel", "5070"],
    ["repair", "5080"],
    ["material", "5090"],
    ["supply", "5090"],
    ["parking", "5100"],
    ["postage", "5110"],
    ["print", "5120"],
    ["rent", "5130"],
    ["training", "5140"],
    ["subscription", "5150"],
    ["internet", "5160"],
    ["phone", "5160"],
    ["travel", "5170"],
    ["hosting", "5180"],
    ["toll", "5190"],
    ["account", "5000"],
    ["computer", "5020"],
    ["insurance", "5060"],
    ["sales", "4000"],
    ["income", "4000"]
  ];

  return matches.find(([keyword]) => text.includes(keyword))?.[1] || chartOfAccounts[0]?.code || "";
}

function createTransactionFromRow(row, chartOfAccounts) {
  const [date, contact, description, amount, gstAmount, accountCode] = row;
  const numericAmount = parseCurrency(amount);
  const finalDescription = description || contact || "Imported supplier invoice";

  return {
    date: date || today(),
    contact: contact || "Imported supplier",
    description: finalDescription,
    accountCode: accountCode || guessAccountCode(finalDescription, chartOfAccounts),
    debit: numericAmount >= 0 ? numericAmount : 0,
    credit: numericAmount < 0 ? Math.abs(numericAmount) : 0,
    gstAmount: gstAmount ? parseCurrency(gstAmount) : Math.round((Math.abs(numericAmount) / 11) * 100) / 100,
    source: "file import",
    status: "Needs review",
    proofUrl: ""
  };
}

function inferEmailInvoice(emailText, chartOfAccounts) {
  const amountMatch = emailText.match(/(?:total|amount due|invoice amount)\D{0,12}(\$?\d[\d,]*(?:\.\d{2})?)/i);
  const dateMatch = emailText.match(/(?:date|invoice date)\D{0,12}(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i);
  const supplierMatch = emailText.match(/(?:from|supplier|vendor)\D{0,12}([A-Za-z0-9 &.'-]{3,50})/i);
  const description = emailText.split(/\r?\n/).find((line) => line.trim().length > 10)?.trim() || "Email invoice";
  const amount = parseCurrency(amountMatch?.[1] || 0);

  return {
    date: dateMatch?.[1] || today(),
    contact: supplierMatch?.[1]?.trim() || "Email supplier",
    description,
    accountCode: guessAccountCode(description, chartOfAccounts),
    debit: amount,
    credit: 0,
    gstAmount: Math.round((amount / 11) * 100) / 100,
    source: "AI email read",
    status: "Needs review",
    proofUrl: ""
  };
}

function Panel({ children, className = "" }) {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, note }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function App() {
  const [state, setState] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [registrationForm, setRegistrationForm] = useState(emptyRegistration);
  const [emailText, setEmailText] = useState("");

  async function refreshState() {
    setState(await getAccountingState());
  }

  useEffect(() => {
    refreshState();
  }, []);

  const reports = useMemo(() => {
    if (!state) {
      return null;
    }

    const accountByCode = new Map(state.chartOfAccounts.map((account) => [account.code, account]));
    const approved = state.transactions.filter((transaction) => transaction.status === "Approved");
    const income = approved
      .filter((transaction) => accountByCode.get(transaction.accountCode)?.type === "Income")
      .reduce((total, transaction) => total + Number(transaction.credit || 0) - Number(transaction.debit || 0), 0);
    const expenses = approved
      .filter((transaction) => accountByCode.get(transaction.accountCode)?.type === "Expense")
      .reduce((total, transaction) => total + Number(transaction.debit || 0) - Number(transaction.credit || 0), 0);
    const gstCollected = approved
      .filter((transaction) => accountByCode.get(transaction.accountCode)?.gstCode === "GST Collected")
      .reduce((total, transaction) => total + Number(transaction.gstAmount || 0), 0);
    const gstPaid = approved
      .filter((transaction) => accountByCode.get(transaction.accountCode)?.gstCode === "GST Paid")
      .reduce((total, transaction) => total + Number(transaction.gstAmount || 0), 0);
    const salaries = approved
      .filter((transaction) => ["5040", "5140"].includes(transaction.accountCode))
      .reduce((total, transaction) => total + Number(transaction.debit || 0), 0);
    const deductions = approved
      .filter((transaction) => transaction.accountCode === "2200")
      .reduce((total, transaction) => total + Number(transaction.credit || 0), 0);
    const superAmount = approved
      .filter((transaction) => transaction.accountCode === "2300")
      .reduce((total, transaction) => total + Number(transaction.credit || 0), 0);
    const trialBalance = state.chartOfAccounts.map((account) => {
      const rows = approved.filter((transaction) => transaction.accountCode === account.code);
      return {
        ...account,
        debit: rows.reduce((total, transaction) => total + Number(transaction.debit || 0), 0),
        credit: rows.reduce((total, transaction) => total + Number(transaction.credit || 0), 0)
      };
    });

    return {
      income,
      expenses,
      profit: income - expenses,
      gstCollected,
      gstPaid,
      gstNet: gstCollected - gstPaid,
      salaries,
      deductions,
      superAmount,
      trialBalance
    };
  }, [state]);

  if (!state || !reports) {
    return <div className="loading-screen">Loading SME Accounts...</div>;
  }

  async function handleBusinessSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await updateBusiness(state.business.id, Object.fromEntries(formData.entries()));
    await refreshState();
  }

  async function handleRegistrationSubmit(event) {
    event.preventDefault();
    await addOnboardingRequest({
      ...registrationForm,
      status: "Pending review",
      requestedAt: today()
    });
    setRegistrationForm(emptyRegistration);
    await refreshState();
    setActiveView("admin");
  }

  async function handleAccountSubmit(event) {
    event.preventDefault();
    const payload = {
      code: accountForm.code,
      name: accountForm.name,
      type: accountForm.type,
      gstCode: accountForm.gstCode,
      reportGroup: accountForm.reportGroup,
      active: accountForm.active
    };

    if (accountForm.id) {
      await updateAccount(accountForm.id, payload);
    } else {
      await addAccount(payload);
    }

    setAccountForm(emptyAccount);
    await refreshState();
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();
    const payload = {
      ...transactionForm,
      debit: parseCurrency(transactionForm.debit),
      credit: parseCurrency(transactionForm.credit),
      gstAmount: parseCurrency(transactionForm.gstAmount)
    };

    if (transactionForm.id) {
      await updateTransaction(transactionForm.id, payload);
    } else {
      await addTransaction(payload);
    }

    setTransactionForm(emptyTransaction);
    await refreshState();
  }

  async function handleProofUpload(event) {
    const proofUrl = await readFileAsDataUrl(event.target.files?.[0]);
    setTransactionForm((current) => ({ ...current, proofUrl }));
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const rows = parseCsv(text);
    const dataRows = rows[0]?.some((cell) => /date|amount|description/i.test(cell)) ? rows.slice(1) : rows;
    await addTransactions(dataRows.map((row) => createTransactionFromRow(row, state.chartOfAccounts)));
    await refreshState();
  }

  async function handleEmailExtract() {
    if (!emailText.trim()) {
      return;
    }

    await addTransaction(inferEmailInvoice(emailText, state.chartOfAccounts));
    setEmailText("");
    await refreshState();
  }

  const pendingInvoices = state.transactions.filter((transaction) => transaction.status !== "Approved").length;
  const pendingOnboarding = state.onboarding.filter((item) => item.status !== "Approved").length;

  return (
    <div className="app-shell">
      <header className="hero">
        <nav className="top-nav" aria-label="Main navigation">
          <button onClick={() => setActiveView("dashboard")}>Dashboard</button>
          <button onClick={() => setActiveView("invoices")}>Invoices</button>
          <button onClick={() => setActiveView("accounts")}>Chart</button>
          <button onClick={() => setActiveView("reports")}>Reports</button>
          <button onClick={() => setActiveView("setup")}>Accountant setup</button>
          <button onClick={() => setActiveView("admin")}>System admin</button>
        </nav>
        <div className="hero-grid">
          <div>
            <p className="eyebrow">PWA accounting package</p>
            <h1>SME Accounts</h1>
            <p className="hero-copy">
              Simple bookkeeping for small business: supplier invoice capture, chart of accounts setup, GST,
              payroll summary, trial balance, and management reporting in one offline-ready web app.
            </p>
          </div>
          <form className="registration-card" onSubmit={handleRegistrationSubmit}>
            <h2>Register a business</h2>
            <input
              placeholder="Business name"
              value={registrationForm.businessName}
              onChange={(event) => setRegistrationForm({ ...registrationForm, businessName: event.target.value })}
              required
            />
            <input
              placeholder="Contact name"
              value={registrationForm.contactName}
              onChange={(event) => setRegistrationForm({ ...registrationForm, contactName: event.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registrationForm.email}
              onChange={(event) => setRegistrationForm({ ...registrationForm, email: event.target.value })}
              required
            />
            <select
              value={registrationForm.plan}
              onChange={(event) => setRegistrationForm({ ...registrationForm, plan: event.target.value })}
            >
              <option>Quarterly GST</option>
              <option>Essentials</option>
              <option>Accountant managed</option>
            </select>
            <textarea
              rows="3"
              placeholder="Payment reference or setup notes"
              value={registrationForm.notes}
              onChange={(event) => setRegistrationForm({ ...registrationForm, notes: event.target.value })}
            />
            <button className="primary-button" type="submit">Submit registration</button>
          </form>
        </div>
      </header>

      <main className="workspace">
        <section className="summary-grid">
          <StatCard label="Quarter profit" value={formatMoney(reports.profit)} note="Approved income less expenses" />
          <StatCard label="GST net payable" value={formatMoney(reports.gstNet)} note="Collected less credits" />
          <StatCard label="Invoices to review" value={pendingInvoices} note="Imported, emailed, or uploaded" />
          <StatCard label="Onboarding queue" value={pendingOnboarding} note="System admin review" />
        </section>

        {activeView === "dashboard" ? (
          <section className="page-grid">
            <Panel>
              <SectionHeading eyebrow="Income statement" title="Trading snapshot" />
              <div className="statement-list">
                <span>Income</span><strong>{formatMoney(reports.income)}</strong>
                <span>Expenses</span><strong>{formatMoney(reports.expenses)}</strong>
                <span>Net profit</span><strong>{formatMoney(reports.profit)}</strong>
              </div>
            </Panel>
            <Panel>
              <SectionHeading eyebrow="GST" title="Quarterly BAS preview" />
              <div className="statement-list">
                <span>GST collected</span><strong>{formatMoney(reports.gstCollected)}</strong>
                <span>GST credits</span><strong>{formatMoney(reports.gstPaid)}</strong>
                <span>Net GST</span><strong>{formatMoney(reports.gstNet)}</strong>
              </div>
            </Panel>
            <Panel className="wide-panel">
              <SectionHeading eyebrow="Workflow" title="Recent transactions" />
              <TransactionTable
                accounts={state.chartOfAccounts}
                transactions={state.transactions.slice(-8).reverse()}
                onEdit={setTransactionForm}
                onDelete={async (id) => {
                  await deleteTransaction(id);
                  await refreshState();
                }}
              />
            </Panel>
          </section>
        ) : null}

        {activeView === "invoices" ? (
          <section className="page-grid">
            <Panel>
              <SectionHeading eyebrow="Supplier invoices" title="Upload, scan, or key an invoice" />
              <form className="form-grid" onSubmit={handleTransactionSubmit}>
                <input type="date" value={transactionForm.date} onChange={(event) => setTransactionForm({ ...transactionForm, date: event.target.value })} />
                <input placeholder="Supplier or customer" value={transactionForm.contact} onChange={(event) => setTransactionForm({ ...transactionForm, contact: event.target.value })} required />
                <input placeholder="Description" value={transactionForm.description} onChange={(event) => setTransactionForm({ ...transactionForm, description: event.target.value })} required />
                <select value={transactionForm.accountCode} onChange={(event) => setTransactionForm({ ...transactionForm, accountCode: event.target.value })}>
                  {state.chartOfAccounts.filter((account) => account.active).map((account) => (
                    <option key={account.code} value={account.code}>{account.code} - {account.name}</option>
                  ))}
                </select>
                <input placeholder="Debit" value={transactionForm.debit} onChange={(event) => setTransactionForm({ ...transactionForm, debit: event.target.value })} />
                <input placeholder="Credit" value={transactionForm.credit} onChange={(event) => setTransactionForm({ ...transactionForm, credit: event.target.value })} />
                <input placeholder="GST amount" value={transactionForm.gstAmount} onChange={(event) => setTransactionForm({ ...transactionForm, gstAmount: event.target.value })} />
                <select value={transactionForm.status} onChange={(event) => setTransactionForm({ ...transactionForm, status: event.target.value })}>
                  <option>Needs review</option>
                  <option>Approved</option>
                </select>
                <label className="file-field">
                  <span>Attach invoice photo or scan</span>
                  <input type="file" accept="image/*,.pdf" onChange={handleProofUpload} />
                </label>
                <button className="primary-button" type="submit">{transactionForm.id ? "Save transaction" : "Add invoice"}</button>
              </form>
            </Panel>
            <Panel>
              <SectionHeading eyebrow="Imports" title="Email and file capture" />
              <label className="file-field">
                <span>Import Excel-exported CSV</span>
                <input type="file" accept=".csv,text/csv" onChange={handleImportFile} />
              </label>
              <textarea
                rows="8"
                placeholder="Paste supplier invoice email text here. The AI-assisted prototype will infer supplier, total, GST, and account allocation."
                value={emailText}
                onChange={(event) => setEmailText(event.target.value)}
              />
              <button className="secondary-button" type="button" onClick={handleEmailExtract}>Read email invoice</button>
            </Panel>
            <Panel className="wide-panel">
              <SectionHeading eyebrow="Review" title="Invoice allocation queue" />
              <TransactionTable
                accounts={state.chartOfAccounts}
                transactions={state.transactions}
                onEdit={(transaction) => {
                  setTransactionForm(transaction);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onDelete={async (id) => {
                  await deleteTransaction(id);
                  await refreshState();
                }}
                onApprove={async (transaction) => {
                  await updateTransaction(transaction.id, { status: "Approved" });
                  await refreshState();
                }}
              />
            </Panel>
          </section>
        ) : null}

        {activeView === "accounts" ? (
          <section className="page-grid">
            <Panel>
              <SectionHeading eyebrow="Chart setup" title={accountForm.id ? "Modify account" : "Add account"} />
              <form className="form-grid" onSubmit={handleAccountSubmit}>
                <input placeholder="Code" value={accountForm.code} onChange={(event) => setAccountForm({ ...accountForm, code: event.target.value })} required />
                <input placeholder="Account name" value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} required />
                <select value={accountForm.type} onChange={(event) => setAccountForm({ ...accountForm, type: event.target.value })}>
                  <option>Asset</option>
                  <option>Liability</option>
                  <option>Equity</option>
                  <option>Income</option>
                  <option>Expense</option>
                </select>
                <select value={accountForm.gstCode} onChange={(event) => setAccountForm({ ...accountForm, gstCode: event.target.value })}>
                  <option>GST Paid</option>
                  <option>GST Collected</option>
                  <option>GST Free</option>
                  <option>Input Taxed</option>
                </select>
                <input placeholder="Report group" value={accountForm.reportGroup} onChange={(event) => setAccountForm({ ...accountForm, reportGroup: event.target.value })} />
                <label className="check-row">
                  <input type="checkbox" checked={accountForm.active} onChange={(event) => setAccountForm({ ...accountForm, active: event.target.checked })} />
                  Active account
                </label>
                <button className="primary-button" type="submit">{accountForm.id ? "Save account" : "Add account"}</button>
              </form>
            </Panel>
            <Panel>
              <SectionHeading eyebrow="Controls" title="Generic account fields" />
              <p className="muted">
                Each account stores code, type, GST treatment, reporting group, and active status so the structure can fit
                different industries without changing the app code.
              </p>
            </Panel>
            <Panel className="wide-panel">
              <SectionHeading eyebrow="Ledger" title="Chart of accounts" />
              <div className="account-list">
                {state.chartOfAccounts.map((account) => (
                  <article key={account.id} className="account-row">
                    <strong>{account.code}</strong>
                    <span>{account.name}</span>
                    <span>{account.type}</span>
                    <span>{account.gstCode}</span>
                    <span>{account.reportGroup}</span>
                    <div className="row-actions">
                      <button className="secondary-button small-button" onClick={() => setAccountForm(account)}>Edit</button>
                      <button className="secondary-button small-button danger-button" onClick={async () => {
                        await deleteAccount(account.id);
                        await refreshState();
                      }}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeView === "reports" ? (
          <section className="page-grid">
            <Panel>
              <SectionHeading eyebrow="Quarterly GST" title="BAS summary" />
              <div className="statement-list">
                <span>Sales GST</span><strong>{formatMoney(reports.gstCollected)}</strong>
                <span>Purchase GST</span><strong>{formatMoney(reports.gstPaid)}</strong>
                <span>Net GST payable</span><strong>{formatMoney(reports.gstNet)}</strong>
              </div>
            </Panel>
            <Panel>
              <SectionHeading eyebrow="Payroll" title="Salaries, deductions, super" />
              <div className="statement-list">
                <span>Salaries</span><strong>{formatMoney(reports.salaries)}</strong>
                <span>PAYG deductions</span><strong>{formatMoney(reports.deductions)}</strong>
                <span>Super payable</span><strong>{formatMoney(reports.superAmount)}</strong>
              </div>
            </Panel>
            <Panel className="wide-panel">
              <SectionHeading eyebrow="Trial balance" title="Debit and credit check" />
              <div className="trial-table">
                {reports.trialBalance.map((account) => (
                  <div key={account.code} className="trial-row">
                    <span>{account.code}</span>
                    <span>{account.name}</span>
                    <strong>{formatMoney(account.debit)}</strong>
                    <strong>{formatMoney(account.credit)}</strong>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        ) : null}

        {activeView === "setup" ? (
          <Panel>
            <SectionHeading eyebrow="Accountant application page" title="Business, bank, and email setup" />
            <form className="settings-form" onSubmit={handleBusinessSubmit}>
              {Object.entries(state.business).filter(([key]) => key !== "id").map(([key, value]) => (
                <label key={key} className="field">
                  <span>{key.replace(/([A-Z])/g, " $1")}</span>
                  <input name={key} defaultValue={String(value)} />
                </label>
              ))}
              <button className="primary-button" type="submit">Save setup</button>
            </form>
          </Panel>
        ) : null}

        {activeView === "admin" ? (
          <Panel>
            <SectionHeading eyebrow="System admin" title="Customer onboarding and payments" />
            <div className="admin-list">
              {state.onboarding.map((request) => (
                <article key={request.id} className="admin-row">
                  <div>
                    <strong>{request.businessName}</strong>
                    <p>{request.contactName} · {request.email} · {request.plan}</p>
                    <small>{request.notes}</small>
                  </div>
                  <select value={request.status} onChange={async (event) => {
                    await updateOnboardingRequest(request.id, { status: event.target.value });
                    await refreshState();
                  }}>
                    <option>Pending review</option>
                    <option>Approved</option>
                    <option>Rejected</option>
                  </select>
                  <select value={request.paymentStatus} onChange={async (event) => {
                    await updateOnboardingRequest(request.id, { paymentStatus: event.target.value });
                    await refreshState();
                  }}>
                    <option>Pending</option>
                    <option>Paid</option>
                    <option>Failed</option>
                    <option>Refunded</option>
                  </select>
                </article>
              ))}
            </div>
          </Panel>
        ) : null}
      </main>
    </div>
  );
}

function TransactionTable({ accounts, transactions, onEdit, onDelete, onApprove }) {
  const accountName = (code) => accounts.find((account) => account.code === code)?.name || "Unallocated";

  return (
    <div className="transaction-table">
      <div className="transaction-row table-head">
        <span>Date</span>
        <span>Contact</span>
        <span>Account</span>
        <span>Debit</span>
        <span>Credit</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {transactions.map((transaction) => (
        <div className="transaction-row" key={transaction.id}>
          <span>{transaction.date}</span>
          <span>
            <strong>{transaction.contact}</strong>
            <small>{transaction.description}</small>
          </span>
          <span>{transaction.accountCode} {accountName(transaction.accountCode)}</span>
          <strong>{formatMoney(transaction.debit)}</strong>
          <strong>{formatMoney(transaction.credit)}</strong>
          <span className={`status ${transaction.status === "Approved" ? "approved" : ""}`}>{transaction.status}</span>
          <span className="row-actions">
            {onApprove && transaction.status !== "Approved" ? (
              <button className="secondary-button small-button" onClick={() => onApprove(transaction)}>Approve</button>
            ) : null}
            <button className="secondary-button small-button" onClick={() => onEdit(transaction)}>Edit</button>
            <button className="secondary-button small-button danger-button" onClick={() => onDelete(transaction.id)}>Delete</button>
          </span>
        </div>
      ))}
    </div>
  );
}
