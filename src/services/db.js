import Dexie from "dexie";
import {
  seedBusiness,
  seedChartOfAccounts,
  seedOnboarding,
  seedTransactions
} from "../data/seed";

export const db = new Dexie("smeAccounts");

db.version(1).stores({
  business: "++id,legalName,abn",
  chartOfAccounts: "++id,&code,name,type,gstCode,active",
  transactions: "++id,date,accountCode,status,source",
  onboarding: "++id,businessName,email,status,paymentStatus,requestedAt"
});

let initPromise;

export async function initializeDb() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const businessCount = await db.business.count();

    if (businessCount === 0) {
      await db.transaction(
        "rw",
        db.business,
        db.chartOfAccounts,
        db.transactions,
        db.onboarding,
        async () => {
          await db.business.add(seedBusiness);
          await db.chartOfAccounts.bulkAdd(seedChartOfAccounts);
          await db.transactions.bulkAdd(seedTransactions);
          await db.onboarding.bulkAdd(seedOnboarding);
        }
      );
    }
  })();

  return initPromise;
}

export async function getAccountingState() {
  await initializeDb();

  const [business, chartOfAccounts, transactions, onboarding] = await Promise.all([
    db.business.toCollection().first(),
    db.chartOfAccounts.orderBy("code").toArray(),
    db.transactions.orderBy("date").toArray(),
    db.onboarding.orderBy("requestedAt").reverse().toArray()
  ]);

  return {
    business,
    chartOfAccounts,
    transactions,
    onboarding
  };
}

export async function updateBusiness(id, changes) {
  return db.business.update(id, changes);
}

export async function addAccount(account) {
  return db.chartOfAccounts.add(account);
}

export async function updateAccount(id, changes) {
  return db.chartOfAccounts.update(id, changes);
}

export async function deleteAccount(id) {
  return db.chartOfAccounts.delete(id);
}

export async function addTransaction(transaction) {
  return db.transactions.add(transaction);
}

export async function addTransactions(transactions) {
  if (transactions.length === 0) {
    return [];
  }

  return db.transactions.bulkAdd(transactions);
}

export async function updateTransaction(id, changes) {
  return db.transactions.update(id, changes);
}

export async function deleteTransaction(id) {
  return db.transactions.delete(id);
}

export async function addOnboardingRequest(request) {
  return db.onboarding.add(request);
}

export async function updateOnboardingRequest(id, changes) {
  return db.onboarding.update(id, changes);
}
