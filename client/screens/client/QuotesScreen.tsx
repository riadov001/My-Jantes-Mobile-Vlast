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
import { QuoteCardSkeleton } from '@/components/LoadingSkeleton';
import { useTheme } from '@/hooks/useTheme';
import { useQuotes } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Quote } from '@/types';

type FilterType = 'all' | 'pending' | 'approved' | 'rejected';

export default function QuotesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');

  const { data: quotes, isLoading, refetch, isRefetching } = useQuotes();

  const filteredQuotes = quotes?.filter(quote => {
    if (filter === 'all') return true;
    return quote.status === filter;
  }) || [];

  const onRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
  };

  const renderQuote = ({ item }: { item: Quote }) => (
    <Card
      style={[styles.quoteCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('QuoteDetail', { quoteId: item.id });
      }}
    >
      <View style={styles.cardHeader}>
        <View>
          <ThemedText type="h4">{item.reference}</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
          </ThemedText>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.vehicleInfo}>
        <Feather name="truck" size={16} color={theme.textSecondary} />
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          {item.vehicleBrand} {item.vehicleModel}
        </ThemedText>
      </View>

      {item.vehiclePlate ? (
        <View style={styles.vehicleInfo}>
          <Feather name="hash" size={16} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {item.vehiclePlate}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <View>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Total TTC
          </ThemedText>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {Number(item.totalTTC || 0).toFixed(2)} €
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={24} color={theme.textSecondary} />
      </View>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.filterContainer}>
      {(['all', 'pending', 'approved', 'rejected'] as FilterType[]).map((f) => (
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
            {f === 'all' ? 'Tous' : f === 'pending' ? 'En attente' : f === 'approved' ? 'Approuvés' : 'Refusés'}
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
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
          <QuoteCardSkeleton />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlashList
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item.id}
        estimatedItemSize={180}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            image={require('../../../assets/images/empty-quotes.png')}
            title="Aucun devis"
            description="Vous n'avez pas encore de devis. Contactez votre garage pour en créer un."
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
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  quoteCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  vehicleInfo: {
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
