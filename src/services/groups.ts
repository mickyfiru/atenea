import { Ionicons } from '@expo/vector-icons';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';

import { colors } from '../constants/theme';
import { CommunityGroup } from '../types/domain';
import { formatRelativeTime } from '../utils/dates';
import { assertAuthenticatedUser, assertNonEmptyText } from '../utils/validation';
import { auth, db } from './firebase';

const DEFAULT_GROUPS = [
  {
    id: 'default-police',
    name: 'Policia',
    icon: 'shield-checkmark-outline',
    iconColor: colors.primary,
    iconBackground: colors.primarySoft,
    lastMessage: 'Canal predeterminado de seguridad',
  },
  {
    id: 'default-firefighters',
    name: 'Bomberos',
    icon: 'flame-outline',
    iconColor: colors.danger,
    iconBackground: colors.dangerSoft,
    lastMessage: 'Canal predeterminado de emergencia',
  },
  {
    id: 'default-ambulance',
    name: 'Ambulancia',
    icon: 'pulse-outline',
    iconColor: colors.success,
    iconBackground: colors.successSoft,
    lastMessage: 'Canal predeterminado de salud',
  },
] as const;

type FirestoreGroup = {
  name: string;
  type: 'emergency' | 'community';
  createdBy: string;
  members: string[];
  createdAt?: Timestamp;
  lastMessage?: string;
  lastMessageAt?: Timestamp;
};

function assertFirestore() {
  if (!db) {
    throw new Error('Firestore no esta configurado.');
  }

  return db;
}

function groupStyle(group: Pick<CommunityGroup, 'id' | 'type'> & { name: string }) {
  if (group.id === 'default-police') {
    return {
      icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
      iconColor: colors.primary,
      iconBackground: colors.primarySoft,
    };
  }

  if (group.id === 'default-firefighters') {
    return {
      icon: 'flame-outline' as keyof typeof Ionicons.glyphMap,
      iconColor: colors.danger,
      iconBackground: colors.dangerSoft,
    };
  }

  if (group.id === 'default-ambulance') {
    return {
      icon: 'pulse-outline' as keyof typeof Ionicons.glyphMap,
      iconColor: colors.success,
      iconBackground: colors.successSoft,
    };
  }

  return {
    icon: group.name.toLowerCase().includes('famil') ? 'people-outline' : 'chatbubbles-outline',
    iconColor: colors.primary,
    iconBackground: colors.soft,
  };
}

function snapshotToGroup(snapshot: QueryDocumentSnapshot<DocumentData>): CommunityGroup {
  const data = snapshot.data() as FirestoreGroup;
  const lastMessageAt = data.lastMessageAt?.toDate();
  const style = groupStyle({
    id: snapshot.id,
    name: data.name,
    type: data.type,
  });

  return {
    id: snapshot.id,
    name: data.name,
    type: data.type,
    createdBy: data.createdBy,
    members: data.members ?? [],
    createdAt: data.createdAt?.toDate() ?? new Date(),
    lastMessage: data.lastMessage || 'Sin mensajes todavia',
    lastMessageAt,
    time: formatRelativeTime(lastMessageAt),
    icon: style.icon,
    iconColor: style.iconColor,
    iconBackground: style.iconBackground,
  };
}

export async function ensureDefaultGroupsForUser(userId: string) {
  const firestore = assertFirestore();
  assertAuthenticatedUser(auth?.currentUser, userId);

  await Promise.all(
    DEFAULT_GROUPS.map(async (group) => {
      const groupRef = doc(firestore, 'groups', group.id);
      const snapshot = await getDoc(groupRef);

      if (snapshot.exists()) {
        await updateDoc(groupRef, {
          members: arrayUnion(userId),
        });
        return;
      }

      await setDoc(
        groupRef,
        {
          id: group.id,
          name: group.name,
          type: 'emergency',
          createdBy: userId,
          members: arrayUnion(userId),
          createdAt: serverTimestamp(),
          lastMessage: group.lastMessage,
          lastMessageAt: serverTimestamp(),
        },
      );
    }),
  );
}

export function subscribeUserGroups(
  userId: string,
  onGroups: (groups: CommunityGroup[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const firestore = assertFirestore();
  const groupsQuery = query(
    collection(firestore, 'groups'),
    where('members', 'array-contains', userId),
  );

  return onSnapshot(
    groupsQuery,
    (snapshot) => {
      const groups = snapshot.docs
        .map(snapshotToGroup)
        .sort(
          (a, b) =>
            (b.lastMessageAt?.getTime() ?? b.createdAt.getTime()) -
            (a.lastMessageAt?.getTime() ?? a.createdAt.getTime()),
        );

      onGroups(groups);
    },
    onError,
  );
}

export async function createGroup(userId: string, name: string) {
  const firestore = assertFirestore();
  const trimmedName = name.trim();
  assertAuthenticatedUser(auth?.currentUser, userId);
  assertNonEmptyText(trimmedName, 'Ingresa un nombre para el grupo.');

  const groupRef = doc(collection(firestore, 'groups'));

  await setDoc(groupRef, {
    id: groupRef.id,
    name: trimmedName,
    type: 'community',
    createdBy: userId,
    members: [userId],
    createdAt: serverTimestamp(),
    lastMessage: 'Grupo creado',
    lastMessageAt: serverTimestamp(),
  });

  return groupRef.id;
}

export async function joinGroupByCode(userId: string, code: string) {
  const firestore = assertFirestore();
  const groupId = code.trim();
  assertAuthenticatedUser(auth?.currentUser, userId);

  if (!groupId) {
    throw new Error('Ingresa un codigo de invitacion.');
  }

  const groupRef = doc(firestore, 'groups', groupId);

  try {
    await updateDoc(groupRef, {
      members: arrayUnion(userId),
    });
  } catch {
    throw new Error('No encontramos un grupo con ese codigo.');
  }

  return groupId;
}

export async function getGroupById(groupId: string) {
  const firestore = assertFirestore();
  const snapshot = await getDoc(doc(firestore, 'groups', groupId));

  if (!snapshot.exists()) {
    return undefined;
  }

  return snapshotToGroup(snapshot as QueryDocumentSnapshot<DocumentData>);
}
