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
    category: 'Seguridad | Transito | Comunidad | Servicios',
    title: 'string',
    description: 'string',
    createdAt: 'timestamp',
  },
} as const;

export const ALERT_CATEGORIES = ['Seguridad', 'Transito', 'Comunidad', 'Servicios'] as const;
