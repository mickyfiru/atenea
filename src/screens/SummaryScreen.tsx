import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFilter, CategoryFilterValue } from '../components/CategoryFilter';
import { SummaryCard } from '../components/SummaryCard';
import { colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { RootScreenProps } from '../navigation/types';
import { subscribeUserGroups } from '../services/groups';
import { subscribeUserLocation } from '../services/location';
import { CategorySummary, subscribeSummaryForGroups } from '../services/summary';
import { CommunityGroup, UserLocation } from '../types/domain';
import { formatRelativeTime } from '../utils/dates';

export function SummaryScreen({ navigation }: RootScreenProps<'Summary'>) {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation>();
  const [summaries, setSummaries] = useState<CategorySummary[]>([]);
  const [filter, setFilter] = useState<CategoryFilterValue>('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }

    return subscribeUserGroups(
      user.uid,
      (nextGroups) => {
        setGroups(nextGroups);
        setLoading(false);
      },
      (groupsError) => {
        setError(groupsError.message);
        setLoading(false);
      },
    );
  }, [user]);

  useEffect(() => {
    if (!user) {
      setUserLocation(undefined);
      return undefined;
    }

    return subscribeUserLocation(
      user.uid,
      setUserLocation,
      (locationError) => setError(locationError.message),
    );
  }, [user]);

  useEffect(() => {
    if (!groups.length) {
      setSummaries([]);
      return undefined;
    }

    return subscribeSummaryForGroups(
      groups.map((group) => group.id),
      groups,
      userLocation,
      (nextSummaries) => {
        setSummaries(nextSummaries);
        setError('');
      },
      (summaryError) => setError(summaryError.message),
    );
  }, [groups, userLocation]);

  const visibleSummaries = useMemo(
    () =>
      filter === 'Todas'
        ? summaries
        : summaries.filter((summary) => summary.category === filter),
    [filter, summaries],
  );

  const lastUpdated = useMemo(() => {
    const timestamps = summaries
      .map((summary) => summary.updatedAt?.getTime())
      .filter((timestamp): timestamp is number => Boolean(timestamp));

    if (!timestamps.length) {
      return 'Sin actividad reciente';
    }

    return `Actualizado ${formatRelativeTime(new Date(Math.max(...timestamps)))}`;
  }, [summaries]);

  const nearbyAlertCount = useMemo(
    () => summaries.reduce((total, summary) => total + summary.distanceCounts.under10Km, 0),
    [summaries],
  );

  const distanceCounts = useMemo(
    () => ({
      under1Km: summaries.reduce((total, summary) => total + summary.distanceCounts.under1Km, 0),
      under5Km: summaries.reduce((total, summary) => total + summary.distanceCounts.under5Km, 0),
      under10Km: summaries.reduce((total, summary) => total + summary.distanceCounts.under10Km, 0),
    }),
    [summaries],
  );

  const locationActive = Boolean(userLocation?.locationEnabled);

  const sectorLabel = useMemo(() => {
    if (!userLocation?.locationEnabled) {
      return 'Ubicacion desactivada';
    }

    return [userLocation.district, userLocation.city].filter(Boolean).join(', ') || 'Mi sector';
  }, [userLocation]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Resumen de mi sector</Text>
          <Text style={styles.subtitle}>{lastUpdated} · {sectorLabel}</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{nearbyAlertCount} cerca</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!locationActive ? (
          <Text style={styles.locationHint}>Activa tu ubicación para ver alertas cercanas</Text>
        ) : null}

        <View style={styles.distanceGrid}>
          <View style={styles.distanceCard}>
            <Text style={styles.distanceValue}>{distanceCounts.under1Km}</Text>
            <Text style={styles.distanceLabel}>menos de 1 km</Text>
          </View>
          <View style={styles.distanceCard}>
            <Text style={styles.distanceValue}>{distanceCounts.under5Km}</Text>
            <Text style={styles.distanceLabel}>menos de 5 km</Text>
          </View>
          <View style={styles.distanceCard}>
            <Text style={styles.distanceValue}>{distanceCounts.under10Km}</Text>
            <Text style={styles.distanceLabel}>menos de 10 km</Text>
          </View>
        </View>

        <CategoryFilter value={filter} onChange={setFilter} />

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.helperText}>Preparando resumen...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && !visibleSummaries.length ? (
          <Text style={styles.empty}>No hay alertas para resumir todavia.</Text>
        ) : null}

        {visibleSummaries.map((summary) => (
          <SummaryCard key={summary.category} summary={summary} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  livePill: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  liveDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  liveText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  loading: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
  },
  helperText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  empty: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '700',
    padding: 22,
    textAlign: 'center',
  },
  locationHint: {
    backgroundColor: colors.warningSoft,
    borderRadius: 16,
    color: colors.warning,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  distanceGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  distanceCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  distanceValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  distanceLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
});
