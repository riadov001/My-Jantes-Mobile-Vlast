import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { useTheme } from '@/hooks/useTheme';
import { useInvoice } from '@/hooks/useApi';
import { Spacing } from '@/constants/theme';

export default function InvoiceDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { invoiceId } = route.params;

  const { data: invoice, isLoading } = useInvoice(invoiceId);

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'card':
        return 'Carte bancaire';
      case 'wire_transfer':
        return 'Virement bancaire';
      case 'cash':
        return 'Espèces';
      case 'check':
        return 'Chèque';
      default:
        return '-';
    }
  };

  if (isLoading || !invoice) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  const isOverdue = invoice.status === 'overdue';
  const isPaid = invoice.status === 'paid';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
      >
        <View style={styles.header}>
          <View>
            <ThemedText type="h2">{invoice.number}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Créée le {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
          <StatusBadge status={invoice.status} />
        </View>

        <Card
          style={[
            styles.amountCard,
            {
              backgroundColor: isOverdue
                ? `${theme.error}15`
                : isPaid
                ? `${theme.success}15`
                : `${theme.primary}15`,
            },
          ]}
        >
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Montant total
          </ThemedText>
          <ThemedText
            type="h1"
            style={{ color: isOverdue ? theme.error : isPaid ? theme.success : theme.primary }}
          >
            {Number(invoice.amount || 0).toFixed(2)} €
          </ThemedText>
        </Card>

        <Card style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={20} color={theme.primary} />
            <ThemedText type="h4">Échéances</ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Date d'émission
            </ThemedText>
            <ThemedText type="body">
              {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
          <View style={styles.infoRow}>
            <ThemedText type="small" style={{ color: isOverdue ? theme.error : theme.textSecondary }}>
              Date d'échéance
            </ThemedText>
            <ThemedText type="body" style={{ color: isOverdue ? theme.error : theme.text }}>
              {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
          {isPaid && invoice.paidAt ? (
            <View style={styles.infoRow}>
              <ThemedText type="small" style={{ color: theme.success }}>
                Date de paiement
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.success }}>
                {new Date(invoice.paidAt).toLocaleDateString('fr-FR')}
              </ThemedText>
            </View>
          ) : null}
        </Card>

        {isPaid && invoice.paymentMethod ? (
          <Card style={[styles.section, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.sectionHeader}>
              <Feather name="credit-card" size={20} color={theme.primary} />
              <ThemedText type="h4">Paiement</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Mode de paiement
              </ThemedText>
              <ThemedText type="body">
                {getPaymentMethodLabel(invoice.paymentMethod)}
              </ThemedText>
            </View>
          </Card>
        ) : null}

        {!isPaid ? (
          <Card style={[styles.infoCard, { backgroundColor: `${theme.warning}15` }]}>
            <View style={styles.infoCardContent}>
              <Feather name="info" size={20} color={theme.warning} />
              <View style={styles.infoCardText}>
                <ThemedText type="h4">Paiement en attente</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Contactez votre garage pour régler cette facture.
                </ThemedText>
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  amountCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  infoCard: {
    padding: Spacing.lg,
    marginTop: Spacing.md,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  infoCardText: {
    flex: 1,
    gap: Spacing.xs,
  },
});
