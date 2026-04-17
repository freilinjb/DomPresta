import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DatabaseService } from './databaseService';
import { Loan } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async initialize(): Promise<void> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  static async schedulePaymentReminder(loan: Loan, paymentDate: Date): Promise<string | null> {
    try {
      // Programar recordatorio 3 días antes del pago
      const reminderDate = new Date(paymentDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      if (reminderDate <= new Date()) {
        return null; // No programar si ya pasó la fecha
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Recordatorio de Pago',
          body: `Pago pendiente para ${loan.borrowerName}: $${loan.amount.toLocaleString()}`,
          data: { loanId: loan.id, type: 'payment_reminder' },
        },
        trigger: reminderDate,
      });

      // Guardar el ID de la notificación en la configuración
      await DatabaseService.setSetting(`notification_${loan.id}_${paymentDate.getTime()}`, notificationId);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling payment reminder:', error);
      return null;
    }
  }

  static async cancelPaymentReminder(loanId: string, paymentDate: Date): Promise<void> {
    try {
      const notificationKey = `notification_${loanId}_${paymentDate.getTime()}`;
      const notificationId = await DatabaseService.getSetting(notificationKey);

      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await DatabaseService.setSetting(notificationKey, ''); // Limpiar la configuración
      }
    } catch (error) {
      console.error('Error canceling payment reminder:', error);
    }
  }

  static async scheduleLoanDueReminder(loan: Loan): Promise<string | null> {
    try {
      // Programar recordatorio cuando el préstamo esté próximo a vencer
      const reminderDate = new Date(loan.endDate);
      reminderDate.setDate(reminderDate.getDate() - 7); // 7 días antes

      if (reminderDate <= new Date()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Préstamo Próximo a Vencer',
          body: `El préstamo de ${loan.borrowerName} vence el ${loan.endDate.toLocaleDateString()}`,
          data: { loanId: loan.id, type: 'loan_due_reminder' },
        },
        trigger: reminderDate,
      });

      await DatabaseService.setSetting(`loan_due_${loan.id}`, notificationId);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling loan due reminder:', error);
      return null;
    }
  }

  static async sendImmediateNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.presentNotificationAsync({
        title,
        body,
        data: data || {},
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Método para verificar pagos pendientes y programar recordatorios
  static async checkAndSchedulePaymentReminders(): Promise<void> {
    try {
      const loans = await DatabaseService.getLoans();

      for (const loan of loans) {
        if (loan.status === 'active') {
          // Programar recordatorio de vencimiento del préstamo
          await this.scheduleLoanDueReminder(loan);

          // Programar recordatorios para pagos pendientes
          const payments = await DatabaseService.getPaymentsByLoanId(loan.id);
          const pendingPayments = payments.filter(p => p.status === 'pending');

          for (const payment of pendingPayments) {
            await this.schedulePaymentReminder(loan, payment.date);
          }
        }
      }
    } catch (error) {
      console.error('Error checking and scheduling payment reminders:', error);
    }
  }
}