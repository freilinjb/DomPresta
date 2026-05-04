import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { BlurView } from 'expo-blur';

const C = {
  brand: '#1a0533',
  brandVibrant: '#6d28d9',
  surface: '#ffffff',
  text: '#0f0a1e',
  textMuted: '#9591a8',
  border: 'rgba(109,40,217,0.08)',
  success: '#059669',
  successBg: '#ecfdf5',
};

interface ReceiptModalProps {
  visible: boolean;
  receipt: any;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ visible, receipt, onClose }) => {
  if (!receipt) return null;

  const handleShare = async () => {
    try {
      const html = generateReceiptHTML(receipt);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir recibo',
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir el recibo');
    }
  };

  const handlePrint = async () => {
    try {
      const html = generateReceiptHTML(receipt);
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Error', 'No se pudo imprimir el recibo');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject}>
        <View style={styles.modalContainer}>
          <View style={styles.receiptCard}>
            <LinearGradient
              colors={[C.brand, C.brandVibrant]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.header}
            >
              <View style={styles.headerContent}>
                <View style={styles.iconCircle}>
                  <Ionicons name="receipt-outline" size={32} color={C.brandVibrant} />
                </View>
                <Text style={styles.headerTitle}>Comprobante de Pago</Text>
                <Text style={styles.receiptNumber}>Recibo #{receipt.receiptNumber?.slice(-8)}</Text>
              </View>
            </LinearGradient>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Compañía */}
              <View style={styles.companySection}>
                <Text style={styles.companyName}>{receipt.company?.name || 'DomPresta'}</Text>
                {receipt.company?.address && (
                  <Text style={styles.companyInfo}>{receipt.company.address}</Text>
                )}
                {receipt.company?.phone && (
                  <Text style={styles.companyInfo}>Tel: {receipt.company.phone}</Text>
                )}
                {receipt.company?.email && (
                  <Text style={styles.companyInfo}>Email: {receipt.company.email}</Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Cliente */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cliente</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color={C.textMuted} />
                  <Text style={styles.infoText}>{receipt.client?.name}</Text>
                </View>
                {receipt.client?.document && (
                  <View style={styles.infoRow}>
                    <Ionicons name="card-outline" size={16} color={C.textMuted} />
                    <Text style={styles.infoText}>Doc: {receipt.client.document}</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Préstamo */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Préstamo</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="document-text-outline" size={16} color={C.textMuted} />
                  <Text style={styles.infoText}>ID: {receipt.loan?.id?.slice(-8)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={16} color={C.textMuted} />
                  <Text style={styles.infoText}>Monto original: {receipt.loan?.amount}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="trending-down-outline" size={16} color={C.textMuted} />
                  <Text style={styles.infoText}>Saldo pendiente: {receipt.loan?.remainingBalance}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Pago */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Detalle del Pago</Text>
                <View style={styles.paymentAmountBox}>
                  <Text style={styles.paymentAmountLabel}>Monto pagado</Text>
                  <Text style={styles.paymentAmount}>{receipt.payment?.amount}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
                  <Text style={styles.infoText}>Fecha: {receipt.payment?.date}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="wallet-outline" size={16} color={C.textMuted} />
                  <Text style={styles.infoText}>Método: {receipt.payment?.method}</Text>
                </View>
                {receipt.payment?.reference && (
                  <View style={styles.infoRow}>
                    <Ionicons name="receipt-outline" size={16} color={C.textMuted} />
                    <Text style={styles.infoText}>Referencia: {receipt.payment.reference}</Text>
                  </View>
                )}
                {receipt.payment?.notes && (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Notas:</Text>
                    <Text style={styles.notesText}>{receipt.payment.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Fecha de emisión: {receipt.generatedAt}</Text>
                <Text style={styles.thankYou}>¡Gracias por su pago!</Text>
              </View>
            </ScrollView>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={C.textMuted} />
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
                <Ionicons name="print-outline" size={20} color="#fff" />
                <Text style={styles.printButtonText}>Imprimir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="#fff" />
                <Text style={styles.shareButtonText}>Compartir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const generateReceiptHTML = (receipt: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Comprobante de Pago</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: #fff;
          color: #0f0a1e;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #1a0533 0%, #6d28d9 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 10px;
          font-size: 28px;
        }
        .receipt-number {
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .company {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .company-info {
          font-size: 12px;
          color: #666;
          margin: 2px 0;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 2px solid #6d28d9;
          display: inline-block;
        }
        .row {
          display: flex;
          margin-bottom: 10px;
          padding: 5px 0;
        }
        .row-label {
          width: 120px;
          font-weight: 600;
          color: #666;
        }
        .row-value {
          flex: 1;
          color: #333;
        }
        .payment-amount {
          background: #ecfdf5;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 15px 0;
        }
        .amount-value {
          font-size: 32px;
          font-weight: bold;
          color: #059669;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          text-align: center;
          border-top: 1px solid #f0f0f0;
          font-size: 12px;
          color: #999;
        }
        .thank-you {
          font-size: 16px;
          font-weight: bold;
          color: #6d28d9;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>Comprobante de Pago</h1>
          <div class="receipt-number">Recibo #${receipt.receiptNumber?.slice(-8)}</div>
        </div>
        <div class="content">
          <div class="company">
            <div class="company-name">${receipt.company?.name || 'DomPresta'}</div>
            ${receipt.company?.address ? `<div class="company-info">${receipt.company.address}</div>` : ''}
            ${receipt.company?.phone ? `<div class="company-info">Tel: ${receipt.company.phone}</div>` : ''}
            ${receipt.company?.email ? `<div class="company-info">Email: ${receipt.company.email}</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Cliente</div>
            <div class="row">
              <div class="row-label">Nombre:</div>
              <div class="row-value">${receipt.client?.name || 'N/A'}</div>
            </div>
            ${receipt.client?.document ? `
            <div class="row">
              <div class="row-label">Documento:</div>
              <div class="row-value">${receipt.client.document}</div>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Préstamo</div>
            <div class="row">
              <div class="row-label">ID Préstamo:</div>
              <div class="row-value">${receipt.loan?.id?.slice(-8) || 'N/A'}</div>
            </div>
            <div class="row">
              <div class="row-label">Monto original:</div>
              <div class="row-value">${receipt.loan?.amount || 'N/A'}</div>
            </div>
            <div class="row">
              <div class="row-label">Saldo pendiente:</div>
              <div class="row-value">${receipt.loan?.remainingBalance || 'N/A'}</div>
            </div>
          </div>

          <div class="payment-amount">
            <div>Monto pagado</div>
            <div class="amount-value">${receipt.payment?.amount || 'N/A'}</div>
          </div>

          <div class="section">
            <div class="section-title">Detalle del Pago</div>
            <div class="row">
              <div class="row-label">Fecha de pago:</div>
              <div class="row-value">${receipt.payment?.date || 'N/A'}</div>
            </div>
            <div class="row">
              <div class="row-label">Método de pago:</div>
              <div class="row-value">${receipt.payment?.method || 'N/A'}</div>
            </div>
            ${receipt.payment?.reference ? `
            <div class="row">
              <div class="row-label">Referencia:</div>
              <div class="row-value">${receipt.payment.reference}</div>
            </div>
            ` : ''}
            ${receipt.payment?.notes ? `
            <div class="row">
              <div class="row-label">Notas:</div>
              <div class="row-value">${receipt.payment.notes}</div>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <div>Fecha de emisión: ${receipt.generatedAt}</div>
            <div class="thank-you">¡Gracias por su pago!</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  receiptCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  receiptNumber: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 20,
  },
  companySection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 11,
    color: C.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: C.text,
  },
  paymentAmountBox: {
    backgroundColor: C.successBg,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentAmountLabel: {
    fontSize: 12,
    color: C.success,
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: C.success,
  },
  notesBox: {
    backgroundColor: '#f8f7fc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: C.text,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerText: {
    fontSize: 10,
    color: C.textMuted,
    marginBottom: 8,
  },
  thankYou: {
    fontSize: 14,
    fontWeight: '700',
    color: C.brandVibrant,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f8',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textMuted,
  },
  printButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.brand,
  },
  printButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.brandVibrant,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});