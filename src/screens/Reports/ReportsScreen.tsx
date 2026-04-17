import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Loan } from '../../types';
import { DatabaseService } from '../../services/databaseService';
import { ReportService } from '../../services/reportService';
import { COLORS } from '../../constants';
import { RootStackParamList } from '../../navigation/types';

type ReportsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Reports'>;

interface ReportsScreenProps {
  navigation: ReportsScreenNavigationProp;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const loansData = await DatabaseService.getLoans();
      setLoans(loansData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los préstamos');
    }
  };

  const handleGenerateGeneralReport = async () => {
    setLoading(true);
    try {
      await ReportService.generateAllLoansReport();
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el reporte general');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLoanReport = async (loan: Loan) => {
    setLoading(true);
    try {
      await ReportService.generateLoanReport(loan);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el reporte del préstamo');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaymentHistory = async (loan: Loan) => {
    setLoading(true);
    try {
      await ReportService.generatePaymentHistoryReport(loan);
    } catch (error) {
      Alert.alert('Error', 'No se pudo generar el historial de pagos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>
        <Text style={styles.subtitle}>Generar reportes en PDF</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reportes Generales</Text>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={handleGenerateGeneralReport}
          disabled={loading}
        >
          <View style={styles.reportIcon}>
            <Text style={styles.reportIconText}>📊</Text>
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Reporte General</Text>
            <Text style={styles.reportDescription}>
              Resumen completo de todos los préstamos
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reportes por Préstamo</Text>

        {loans.length > 0 ? (
          loans.map((loan) => (
            <View key={loan.id} style={styles.loanReportContainer}>
              <View style={styles.loanHeader}>
                <Text style={styles.loanName}>{loan.borrowerName}</Text>
                <Text style={styles.loanAmount}>${loan.amount.toLocaleString()}</Text>
              </View>

              <View style={styles.loanReportButtons}>
                <TouchableOpacity
                  style={[styles.smallReportButton, styles.loanReport]}
                  onPress={() => handleGenerateLoanReport(loan)}
                  disabled={loading}
                >
                  <Text style={styles.smallReportText}>📄 Reporte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallReportButton, styles.paymentReport]}
                  onPress={() => handleGeneratePaymentHistory(loan)}
                  disabled={loading}
                >
                  <Text style={styles.smallReportText}>💰 Pagos</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noLoans}>No hay préstamos registrados</Text>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>💡 Información</Text>
        <Text style={styles.infoText}>
          Los reportes se generan en formato PDF y se pueden compartir
          directamente desde la aplicación.
        </Text>
        <Text style={styles.infoText}>
          Los reportes incluyen información detallada de préstamos,
          pagos y estadísticas financieras.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportIconText: {
    fontSize: 24,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.7,
  },
  loanReportContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  loanAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  loanReportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallReportButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  loanReport: {
    backgroundColor: COLORS.primary,
  },
  paymentReport: {
    backgroundColor: COLORS.success,
  },
  smallReportText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  noLoans: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.text,
    opacity: 0.7,
    fontStyle: 'italic',
    padding: 20,
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    opacity: 0.8,
    marginBottom: 8,
    lineHeight: 20,
  },
});