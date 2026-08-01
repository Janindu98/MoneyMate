export const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  LKR: 'Rs.'
};

export function formatCurrency(amount, currencyCode = 'LKR') {
  const symbol = currencySymbols[currencyCode] || 'Rs.';
  const formatted = Math.abs(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return `${amount < 0 ? '-' : ''}${symbol} ${formatted}`;
}

// Calculate card balance dynamically based on ledger history:
// Inflows: Income, Deposit, or Online/Account cash transfer (if destination)
// Outflows: Expense, Withdrawal, online payment, or Online/Account cash transfer (if source)
export function calculateAccountBalances(accounts, transactions) {
  return accounts.map(acc => {
    let balance = 0;

    transactions.forEach(tx => {
      // Source account balance adjustments
      if (tx.bankId === acc.id) {
        const type = tx.type;
        if (type === 'Income' || type === 'Deposit' || type === 'Refund') {
          balance += tx.amount;
        } else if (type === 'Expense' || type === 'Withdrawal' || type === 'online payment' || type === 'Online Payment' || type === 'Online/Account cash transfer' || type === 'Bill & Payment') {
          balance -= tx.amount;
        }
      }

      // Target account balance adjustments (for Online/Account cash transfers)
      if (tx.type === 'Online/Account cash transfer' && tx.targetBankId === acc.id) {
        balance += tx.amount;
      }
    });

    return {
      ...acc,
      balance
    };
  });
}
