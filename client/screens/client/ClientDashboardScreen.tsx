import React from 'react';
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
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { StatCardSkeleton } from '@/components/LoadingSkeleton';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useQuotes, useInvoices, useReservations, useNotifications } from '@/hooks/useApi';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Quote, Invoice } from '@/types';

export default function ClientDashboardScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();

  const { data: quotes, isLoading: quotesLoading, refetch: refetchQuotes } = useQuotes();
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useInvoices();
  const { data: reservations, refetch: refetchReservations } = useReservations();
  const { data: notifications } = useNotifications();

  const isLoading = quotesLoading || invoicesLoading;

  const pendingQuotes = quotes?.filter(q => q.status === 'pending').length || 0;
  const approvedQuotes = quotes?.filter(q => q.status === 'approved').length || 0;
  const unpaidInvoices = invoices?.filter(i => i.status === 'pending' || i.status === 'overdue').length || 0;
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length || 0;
  const upcomingReservations = reservations?.filter(r => r.status === 'pending' || r.status === 'confirmed').length || 0;
  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  const recentQuotes = quotes?.slice(0, 3) || [];
  const recentInvoices = invoices?.slice(0, 3) || [];

  const onRefresh = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchQuotes(), refetchInvoices(), refetchReservations()]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    switch (item.type) {
      case 'greeting':
        return (
          <View style={styles.greetingSection}>
            <ThemedText type="h2">
              Bonjour, {user?.username || 'Client'}
            </ThemedText>
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              Bienvenue sur votre espace MyJantes
            </ThemedText>
          </View>
        );
      case 'stats':
        if (isLoading) {
          return (
            <View style={styles.statsGrid}>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </View>
          );
        }
        return (
          <View style={styles.statsGrid}>
            <StatCard
              icon="file-text"
              label="Devis en attente"
              value={pendingQuotes}
              color={theme.statusPending}
              onPress={() => navigation.navigate('QuotesTab')}
            />
            <StatCard
              icon="credit-card"
              label="Factures à payer"
              value={unpaidInvoices}
              color={overdueInvoices > 0 ? theme.error : theme.primary}
              onPress={() => navigation.navigate('InvoicesTab')}
            />
          </View>
        );
      case 'quickActions':
        return (
          <View style={styles.section}>
            <ThemedText type="h4" style={styles.sectionTitle}>
              Actions rapides
            </ThemedText>
            <View style={styles.actionsGrid}>
              <QuickActionButton
                icon="calendar"
                label="Réserver"
                onPress={() => navigation.navigate('ReservationsTab')}
              />
              <QuickActionButton
                icon="file-text"
                label="Mes devis"
                onPress={() => navigation.navigate('QuotesTab')}
              />
              <QuickActionButton
                icon="credit-card"
                label="Mes factures"
                onPress={() => navigation.navigate('InvoicesTab')}
              />
              <QuickActionButton
                icon="bell"
                label="Notifications"
                badge={unreadNotifications}
                onPress={() => navigation.navigate('ProfileTab')}
              />
            </View>
          </View>
        );
      case 'recentQuotes':
        if (recentQuotes.length === 0) return null;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">Derniers devis</ThemedText>
              <Pressable onPress={() => navigation.navigate('QuotesTab')}>
                <ThemedText type="link" style={{ color: theme.primary }}>
                  Voir tout
                </ThemedText>
              </Pressable>
            </View>
            {recentQuotes.map((quote: Quote) => (
              <QuotePreviewCard key={quote.id} quote={quote} />
            ))}
          </View>
        );
      case 'recentInvoices':
        if (recentInvoices.length === 0) return null;
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h4">Dernières factures</ThemedText>
              <Pressable onPress={() => navigation.navigate('InvoicesTab')}>
                <ThemedText type="link" style={{ color: theme.primary }}>
                  Voir tout
                </ThemedText>
              </Pressable>
            </View>
            {recentInvoices.map((invoice: Invoice) => (
              <InvoicePreviewCard key={invoice.id} invoice={invoice} />
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  const data = [
    { type: 'greeting', id: 'greeting' },
    { type: 'stats', id: 'stats' },
    { type: 'quickActions', id: 'quickActions' },
    { type: 'recentQuotes', id: 'recentQuotes' },
    { type: 'recentInvoices', id: 'recentInvoices' },
  ];

  return (
    <ThemedView style={styles.container}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={200}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      />
    </ThemedView>
  );
}

function QuickActionButton({
  icon,
  label,
  badge,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${theme.primary}15` }]}>
        <Feather name={icon} size={22} color={theme.primary} />
        {badge && badge > 0 ? (
          <View style={[styles.badge, { backgroundColor: theme.error }]}>
            <ThemedText style={styles.badgeText}>{badge > 9 ? '9+' : badge}</ThemedText>
          </View>
        ) : null}
      </View>
      <ThemedText type="small" style={{ textAlign: 'center' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function QuotePreviewCard({ quote }: { quote: Quote }) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <Card
      style={[styles.previewCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => navigation.navigate('QuoteDetail', { quoteId: quote.id })}
    >
      <View style={styles.previewHeader}>
        <ThemedText type="h4">{quote.reference}</ThemedText>
        <StatusBadge status={quote.status} size="small" />
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {quote.vehicleBrand} {quote.vehicleModel}
      </ThemedText>
      <ThemedText type="body" style={[styles.amount, { color: theme.primary }]}>
        {Number(quote.totalTTC || 0).toFixed(2)} €
      </ThemedText>
    </Card>
  );
}

function InvoicePreviewCard({ invoice }: { invoice: Invoice }) {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <Card
      style={[styles.previewCard, { backgroundColor: theme.backgroundDefault }]}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
    >
      <View style={styles.previewHeader}>
        <ThemedText type="h4">{invoice.number}</ThemedText>
        <StatusBadge status={invoice.status} size="small" />
      </View>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
      </ThemedText>
      <ThemedText type="body" style={[styles.amount, { color: theme.primary }]}>
        {Number(invoice.amount || 0).toFixed(2)} €
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  greetingSection: {
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionButton: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  previewCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  amount: {
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
});
