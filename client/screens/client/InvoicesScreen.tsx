import React, { useState } from 'react';
import { View, StyleSheet, RefreshControl, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { InvoiceCardSkeleton } from '@/components/LoadingSkeleton';
import { useTheme } from '@/hooks/useTheme';
import { useInvoices } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Invoice } from '@/types';

type FilterType = 'all' | 'pending' | 'paid' | 'overdue';

export default function InvoicesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: invoices, isLoading, refetch, isRefetching } = useInvoices();

  const filteredInvoices = invoices?.filter(invoice => {
    if (filter === 'all') return true;
    return invoice.status === filter;
  }) || [];

  const onRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'card':
        return 'Carte bancaire';
      case 'wire_transfer':
        return 'Virement';
      case 'cash':
        return 'Espèces';
      case 'check':
        return 'Chèque';
      default:
        return '-';
    }
  };

  const renderInvoice = ({ item }: { item: Invoice }) => {
    const isOverdue = item.status === 'overdue';
    const isPaid = item.status === 'paid';

    return (
      <Card
        style={[styles.invoiceCard, { backgroundColor: theme.backgroundDefault }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('InvoiceDetail', { invoiceId: item.id });
        }}
      >
        <View style={styles.cardHeader}>
          <View>
            <ThemedText type="h4">{item.number}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {new Date(item.createdAt).toLocaleDateString('fr-FR')}
            </ThemedText>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.infoRow}>
          <Feather name="calendar" size={16} color={isOverdue ? theme.error : theme.textSecondary} />
          <ThemedText
            type="body"
            style={{ color: isOverdue ? theme.error : theme.textSecondary }}
          >
            Échéance: {new Date(item.dueDate).toLocaleDateString('fr-FR')}
          </ThemedText>
        </View>

        {isPaid && item.paymentMethod ? (
          <View style={styles.infoRow}>
            <Feather name="credit-card" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {getPaymentMethodLabel(item.paymentMethod)}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Montant
            </ThemedText>
            <ThemedText type="h3" style={{ color: isOverdue ? theme.error : theme.primary }}>
              {Number(item.amount || 0).toFixed(2)} €
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      {(['all', 'pending', 'paid', 'overdue'] as FilterType[]).map((f) => (
        <Pressable
          key={f}
          onPress={() => {
            Haptics.selectionAsync();
            setFilter(f);
          }}
          style={[
            styles.filterButton,
            {
              backgroundColor: filter === f ? theme.primary : theme.backgroundDefault,
            },
          ]}
        >
          <ThemedText
            type="small"
            style={{ color: filter === f ? '#FFFFFF' : theme.text, fontWeight: '600' }}
          >
            {f === 'all' ? 'Toutes' : f === 'pending' ? 'En attente' : f === 'paid' ? 'Payées' : 'En retard'}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ paddingTop: headerHeight + Spacing.xl, paddingHorizontal: Spacing.lg }}>
          {renderHeader()}
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
          <InvoiceCardSkeleton />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlashList
        data={filteredInvoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        estimatedItemSize={160}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            image={require('../../../assets/images/empty-invoices.png')}
            title="Aucune facture"
            description="Vous n'avez pas encore de facture."
          />
        }
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  invoiceCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
});
