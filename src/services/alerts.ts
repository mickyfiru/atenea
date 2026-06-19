import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { AlertCategory, CommunityAlert } from '../types/domain';
import {
  assertAuthenticatedUser,
  assertExistingGroup,
  assertGroupMember,
  assertNonEmptyText,
  assertValidAlertCategory,
  assertValidCoordinates,
} from '../utils/validation';
import { auth, db } from './firebase';
import { getGroupById } from './groups';
import { getUserLocation } from './location';
import { markAlertSoundHandled, playAlertSound } from './sounds';

export const ALERT_CATEGORIES: AlertCategory[] = [
  'Seguridad',
  'Tr\u00e1nsito',
  'Comunidad',
  'Servicios',
];

type FirestoreAlert = {
  groupId: string;
  userId?: string;
  category: AlertCategory;
  title: string;
  description: string;
  soundType?: AlertCategory;
  latitude?: number | null;
  longitude?: number | null;
  city?: string;
  district?: string;
  createdBy?: string;
  createdAt?: Timestamp;
};

type CreateAlertInput = {
  groupId: string;
  userId: string;
  category: AlertCategory;
  title: string;
  description: string;
};

function assertFirestore() {
  if (!db) {
    throw new Error('Firestore no esta configurado.');
  }

  return db;
}

function snapshotToAlert(snapshot: QueryDocumentSnapshot<DocumentData>): CommunityAlert {
  const data = snapshot.data() as FirestoreAlert;

  return {
    id: snapshot.id,
    groupId: data.groupId,
    userId: data.userId,
    category: data.category,
    title: data.title,
    description: data.description,
    soundType: data.soundType ?? data.category,
    createdBy: data.createdBy ?? data.userId,
    latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
    longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
    city: data.city ?? '',
    district: data.district ?? '',
    createdAt: data.createdAt?.toDate() ?? new Date(),
  };
}

export async function createAlert(input: CreateAlertInput) {
  const firestore = assertFirestore();
  const title = input.title.trim();
  const description = input.description.trim();
  assertAuthenticatedUser(auth?.currentUser, input.userId);
  assertValidAlertCategory(input.category);

  if (!input.groupId) {
    throw new Error('Selecciona un grupo para la alerta.');
  }

  assertNonEmptyText(title, 'Ingresa un titulo para la alerta.');

  const group = await getGroupById(input.groupId);
  assertExistingGroup(group);
  assertGroupMember(group, input.userId);

  const location = await getUserLocation(input.userId);
  if (location.locationEnabled) {
    assertValidCoordinates(location.latitude, location.longitude);
  }

  const locationPayload = location.locationEnabled
    ? {
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        city: location.city,
        district: location.district,
      }
    : {
        latitude: null,
        longitude: null,
        city: '',
        district: '',
      };

  const alertRef = await addDoc(collection(firestore, 'alerts'), {
    groupId: input.groupId,
    userId: input.userId,
    createdBy: input.userId,
    category: input.category,
    title,
    description,
    soundType: input.category,
    ...locationPayload,
    createdAt: serverTimestamp(),
  });

  markAlertSoundHandled(alertRef.id);
  await playAlertSound(input.category);

  return alertRef.id;
}

export function subscribeAlertsForGroups(
  groupIds: string[],
  onAlerts: (alerts: CommunityAlert[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const firestore = assertFirestore();
  const uniqueGroupIds = [...new Set(groupIds)].filter(Boolean);

  if (!uniqueGroupIds.length) {
    onAlerts([]);
    return () => undefined;
  }

  const chunks: string[][] = [];

  for (let index = 0; index < uniqueGroupIds.length; index += 10) {
    chunks.push(uniqueGroupIds.slice(index, index + 10));
  }

  const alertBuckets = new Map<number, CommunityAlert[]>();
  const flush = () => {
    const alerts = Array.from(alertBuckets.values())
      .flat()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    onAlerts(alerts);
  };

  const unsubscribes = chunks.map((chunk, index) => {
    const alertsQuery = query(collection(firestore, 'alerts'), where('groupId', 'in', chunk));

    return onSnapshot(
      alertsQuery,
      (snapshot) => {
        alertBuckets.set(index, snapshot.docs.map(snapshotToAlert));
        flush();
      },
      onError,
    );
  });

  return () => {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}
