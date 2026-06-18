export const FIRESTORE_COLLECTIONS = {
  users: {
    id: 'string',
    phoneNumber: 'string',
    displayName: 'string',
    createdAt: 'timestamp',
  },
  groups: {
    id: 'string',
    name: 'string',
    type: 'emergency | community',
    createdBy: 'string',
    members: 'string[]',
    createdAt: 'timestamp',
    lastMessage: 'string',
    lastMessageAt: 'timestamp',
  },
  messages: {
    id: 'string',
    groupId: 'string',
    userId: 'string',
    text: 'string',
    createdAt: 'timestamp',
  },
  alerts: {
    id: 'string',
    groupId: 'string',
    userId: 'string',
    category: 'Seguridad | Tr\u00e1nsito | Comunidad | Servicios',
    title: 'string',
    description: 'string',
    soundType: 'Seguridad | Tr\u00e1nsito | Comunidad | Servicios',
    createdAt: 'timestamp',
  },
} as const;

export const ALERT_CATEGORIES = ['Seguridad', 'Tr\u00e1nsito', 'Comunidad', 'Servicios'] as const;
