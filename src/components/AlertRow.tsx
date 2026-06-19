import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { CommunityAlert, CommunityGroup, UserLocation } from '../types/domain';
import { getAlertCategoryTone } from '../utils/alerts';
import { formatRelativeTime } from '../utils/dates';
import { formatDistance, getAlertDistanceKm } from '../utils/distance';

type AlertRowProps = {
  alert: CommunityAlert;
  group?: CommunityGroup;
  userLocation?: UserLocation;
};

export function AlertRow({ alert, group, userLocation }: AlertRowProps) {
  const tone = getAlertCategoryTone(alert.category);
  const distanceLabel = formatDistance(getAlertDistanceKm(alert, userLocation));
  const placeLabel = distanceLabel || [alert.district, alert.city].filter(Boolean).join(', ');

  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: tone.backgroundColor }]}>
        <Ionicons name={tone.icon} size={24} color={tone.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.topLine}>
          <Text style={[styles.category, { color: tone.color }]}>{alert.category}</Text>
          <Text style={styles.time}>{formatRelativeTime(alert.createdAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {alert.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {alert.description || 'Sin descripcion'}
        </Text>
        <Text style={styles.group} numberOfLines={1}>
          {group?.name ?? alert.groupId}
          {placeLabel ? ` · ${placeLabel}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: {
    flex: 1,
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 13,
    fontWeight: '900',
  },
  time: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  description: {
    color: '#667793',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginTop: 4,
  },
  group: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
});
