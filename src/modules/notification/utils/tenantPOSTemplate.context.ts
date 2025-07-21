
// import { POSSessionSummary } from '@modules/pos/types/pos.dto';
// import { transactionService } from '@modules/transactions/services/transaction.service';

// export async function buildTenantPOSSummaryContext(session: POSSessionSummary) {
//   const transactions = await transactionService.getTransactionsBySessionId(session.sessionId);

//   const totalSales = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
//   const paymentBreakdown = transactions.reduce((map, t) => {
//     map[t.paymentMethod] = (map[t.paymentMethod] || 0) + t.totalAmount;
//     return map;
//   }, {} as Record<string, number>);

//   return {
//     sessionCode: session.sessionId,
//     openedBy: session.openedBy,
//     closedBy: session.,
//     openingBalance: session.openingBalance,
//     closingBalance: session.closingBalance,
//     totalSales,
//     totalTransactions: transactions.length,
//     paymentBreakdown,
//     closedAt: session.closedAt?.toLocaleString(),
//   };
// }
