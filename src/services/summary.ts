import { type Unsubscribe } from 'firebase/firestore';

import { ALERT_CATEGORIES, subscribeAlertsForGroups } from './alerts';
import { AlertCategory, CommunityAlert, CommunityGroup, UserLocation } from '../types/domain';

export type SummaryCategoryKey = 'security' | 'traffic' | 'community' | 'services';

export type SummaryEvent = {
  id: string;
  category: AlertCategory;
  title: string;
  description: string;
  groupId: string;
  groupName: string;
  city: string;
  district: string;
  createdAt: Date;
};

export type CategorySummary = {
  key: SummaryCategoryKey;
  category: AlertCategory;
  events: SummaryEvent[];
  eventCount: number;
  nearbyCount: number;
  updatedAt?: Date;
  latestGroupName?: string;
};

export type GeneratedSummary = Record<SummaryCategoryKey, SummaryEvent[]>;

const CATEGORY_KEYS: Record<AlertCategory, SummaryCategoryKey> = {
  Seguridad: 'security',
  'Tr\u00e1nsito': 'traffic',
  Comunidad: 'community',
  Servicios: 'services',
};

export function generateSummary(): GeneratedSummary {
  // Future integration point:
  // - OpenAI: turn recent alerts into natural-language community digests.
  // - Gemini: enrich summaries with multimodal or location context when available.
  // - DeepSeek: produce low-cost categorization or triage drafts before review.
  return {
    security: [],
    traffic: [],
    community: [],
    services: [],
  };
}

export function buildCategorySummaries(
  alerts: CommunityAlert[],
  groups: CommunityGroup[],
  userLocation?: UserLocation,
): CategorySummary[] {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const sortedAlerts = [...alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return ALERT_CATEGORIES.map((category) => {
    const categoryAlerts = sortedAlerts.filter((alert) => alert.category === category);
    const events = categoryAlerts.slice(0, 3).map((alert) => ({
      id: alert.id,
      category: alert.category,
      title: alert.title,
      description: alert.description,
      groupId: alert.groupId,
      groupName: groupsById.get(alert.groupId)?.name ?? alert.groupId,
      city: alert.city,
      district: alert.district,
      createdAt: alert.createdAt,
    }));
    const nearbyCount = categoryAlerts.filter((alert) =>
      isAlertInUserSector(alert, userLocation),
    ).length;

    return {
      key: CATEGORY_KEYS[category],
      category,
      events,
      eventCount: categoryAlerts.length,
      nearbyCount,
      updatedAt: categoryAlerts[0]?.createdAt,
      latestGroupName: events[0]?.groupName,
    };
  });
}

function normalizeSector(value?: string) {
  return value?.trim().toLowerCase() ?? '';
}

export function isAlertInUserSector(alert: CommunityAlert, userLocation?: UserLocation) {
  if (!userLocation?.locationEnabled) {
    return false;
  }

  const userDistrict = normalizeSector(userLocation.district);
  const userCity = normalizeSector(userLocation.city);
  const alertDistrict = normalizeSector(alert.district);
  const alertCity = normalizeSector(alert.city);

  if (userDistrict && alertDistrict) {
    return userDistrict === alertDistrict;
  }

  if (userCity && alertCity) {
    return userCity === alertCity;
  }

  return false;
}

export function subscribeSummaryForGroups(
  groupIds: string[],
  groups: CommunityGroup[],
  userLocation: UserLocation | undefined,
  onSummary: (summaries: CategorySummary[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeAlertsForGroups(
    groupIds,
    (alerts) => onSummary(buildCategorySummaries(alerts, groups, userLocation)),
    onError,
  );
}
