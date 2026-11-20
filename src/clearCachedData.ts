import { clearComplaintReports } from './complaintStore';
import { clearCustomers } from './customerStore';
import { clearEmployees } from './employeeStore';
import { clearFinanceTransactions } from './financeStore';
import { clearInvoices } from './paymentStore';
import { clearVisits } from './visitStore';

export function clearCachedData(): void {
  clearComplaintReports();
  clearCustomers();
  clearEmployees();
  clearFinanceTransactions();
  clearInvoices();
  clearVisits();
}
