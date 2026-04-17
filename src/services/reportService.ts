import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Loan, Payment } from '../types';
import { DatabaseService } from './databaseService';

export class ReportService {
  static async generateLoanReport(loan: Loan): Promise<void> {
    try {
      const html = this.generateLoanReportHTML(loan);

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Reporte de Préstamo - ${loan.borrowerName}`,
      });
    } catch (error) {
      console.error('Error generating loan report:', error);
      throw error;
    }
  }

  static async generateAllLoansReport(): Promise<void> {
    try {
      const loans = await DatabaseService.getLoans();
      const html = this.generateAllLoansReportHTML(loans);

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Reporte General de Préstamos',
      });
    } catch (error) {
      console.error('Error generating all loans report:', error);
      throw error;
    }
  }

  static async generatePaymentHistoryReport(loan: Loan): Promise<void> {
    try {
      const payments = await DatabaseService.getPaymentsByLoanId(loan.id);
      const html = this.generatePaymentHistoryHTML(loan, payments);

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Historial de Pagos - ${loan.borrowerName}`,
      });
    } catch (error) {
      console.error('Error generating payment history report:', error);
      throw error;
    }
  }

  private static generateLoanReportHTML(loan: Loan): string {
    const totalPaid = loan.payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = loan.amount - totalPaid;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Préstamo</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007AFF;
              margin-bottom: 10px;
            }
            .info-section {
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            .value {
              color: #333;
            }
            .status-active {
              color: #34C759;
              font-weight: bold;
            }
            .status-overdue {
              color: #FF3B30;
              font-weight: bold;
            }
            .status-paid {
              color: #007AFF;
              font-weight: bold;
            }
            .payments-section {
              margin-top: 30px;
            }
            .payments-title {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #007AFF;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #333;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DomPresta</div>
            <div>Reporte de Préstamo</div>
          </div>

          <div class="info-section">
            <div class="info-row">
              <span class="label">Prestatario:</span>
              <span class="value">${loan.borrowerName}</span>
            </div>
            <div class="info-row">
              <span class="label">Monto del Préstamo:</span>
              <span class="value">$${loan.amount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Tasa de Interés:</span>
              <span class="value">${loan.interestRate}%</span>
            </div>
            <div class="info-row">
              <span class="label">Plazo:</span>
              <span class="value">${loan.term} meses</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha de Inicio:</span>
              <span class="value">${loan.startDate.toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Fecha de Fin:</span>
              <span class="value">${loan.endDate.toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Estado:</span>
              <span class="value status-${loan.status}">${this.getStatusText(loan.status)}</span>
            </div>
            <div class="info-row">
              <span class="label">Total Pagado:</span>
              <span class="value">$${totalPaid.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Saldo Restante:</span>
              <span class="value">$${remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          <div class="payments-section">
            <div class="payments-title">Historial de Pagos</div>
            ${loan.payments.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${loan.payments.map(payment => `
                    <tr>
                      <td>${payment.date.toLocaleDateString()}</td>
                      <td>$${payment.amount.toLocaleString()}</td>
                      <td>${this.getPaymentStatusText(payment.status)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : '<p>No hay pagos registrados.</p>'}
          </div>

          <div class="footer">
            <p>Reporte generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p>
            <p>DomPresta - Sistema de Gestión de Préstamos</p>
          </div>
        </body>
      </html>
    `;
  }

  private static generateAllLoansReportHTML(loans: Loan[]): string {
    const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const paidLoans = loans.filter(loan => loan.status === 'paid');
    const overdueLoans = loans.filter(loan => loan.status === 'overdue');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte General de Préstamos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007AFF;
              margin-bottom: 10px;
            }
            .summary-section {
              display: flex;
              justify-content: space-around;
              margin-bottom: 30px;
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-number {
              font-size: 24px;
              font-weight: bold;
              color: #007AFF;
            }
            .summary-label {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #007AFF;
              color: white;
              font-weight: bold;
            }
            .status-active {
              color: #34C759;
              font-weight: bold;
            }
            .status-overdue {
              color: #FF3B30;
              font-weight: bold;
            }
            .status-paid {
              color: #007AFF;
              font-weight: bold;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DomPresta</div>
            <div>Reporte General de Préstamos</div>
          </div>

          <div class="summary-section">
            <div class="summary-item">
              <div class="summary-number">${loans.length}</div>
              <div class="summary-label">Total Préstamos</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${activeLoans.length}</div>
              <div class="summary-label">Préstamos Activos</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">${paidLoans.length}</div>
              <div class="summary-label">Préstamos Pagados</div>
            </div>
            <div class="summary-item">
              <div class="summary-number">$${totalAmount.toLocaleString()}</div>
              <div class="summary-label">Monto Total</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Prestatario</th>
                <th>Monto</th>
                <th>Tasa</th>
                <th>Plazo</th>
                <th>Estado</th>
                <th>Fecha Inicio</th>
              </tr>
            </thead>
            <tbody>
              ${loans.map(loan => `
                <tr>
                  <td>${loan.borrowerName}</td>
                  <td>$${loan.amount.toLocaleString()}</td>
                  <td>${loan.interestRate}%</td>
                  <td>${loan.term} meses</td>
                  <td class="status-${loan.status}">${this.getStatusText(loan.status)}</td>
                  <td>${loan.startDate.toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Reporte generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p>
            <p>DomPresta - Sistema de Gestión de Préstamos</p>
          </div>
        </body>
      </html>
    `;
  }

  private static generatePaymentHistoryHTML(loan: Loan, payments: Payment[]): string {
    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Historial de Pagos</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #007AFF;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007AFF;
              margin-bottom: 10px;
            }
            .loan-info {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .label {
              font-weight: bold;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #007AFF;
              color: white;
              font-weight: bold;
            }
            .status-paid {
              color: #34C759;
              font-weight: bold;
            }
            .status-pending {
              color: #FF9500;
              font-weight: bold;
            }
            .status-overdue {
              color: #FF3B30;
              font-weight: bold;
            }
            .summary {
              background-color: #e3f2fd;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DomPresta</div>
            <div>Historial de Pagos</div>
          </div>

          <div class="loan-info">
            <div class="info-row">
              <span class="label">Prestatario:</span>
              <span>${loan.borrowerName}</span>
            </div>
            <div class="info-row">
              <span class="label">Monto del Préstamo:</span>
              <span>$${loan.amount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="label">Tasa de Interés:</span>
              <span>${loan.interestRate}%</span>
            </div>
          </div>

          ${payments.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                  <tr>
                    <td>${payment.date.toLocaleDateString()}</td>
                    <td>$${payment.amount.toLocaleString()}</td>
                    <td class="status-${payment.status}">${this.getPaymentStatusText(payment.status)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary">
              <strong>Total Pagado: $${totalPaid.toLocaleString()}</strong>
            </div>
          ` : '<p>No hay pagos registrados para este préstamo.</p>'}

          <div class="footer">
            <p>Reporte generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}</p>
            <p>DomPresta - Sistema de Gestión de Préstamos</p>
          </div>
        </body>
      </html>
    `;
  }

  private static getStatusText(status: string): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'paid': return 'Pagado';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  }

  private static getPaymentStatusText(status: string): string {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  }
}