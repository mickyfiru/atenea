export type AlertCategory = 'Seguridad' | 'Transito' | 'Comunidad' | 'Servicios';

export type UserProfile = {
  id: string;
  phoneNumber: string;
  displayName: string;
  createdAt: Date;
};

export type CommunityGroup = {
  id: string;
  name: string;
  type: 'emergency' | 'community';
  createdBy: string;
  members: string[];
  createdAt: Date;
  icon: string;
  iconColor: string;
  iconBackground: string;
  lastMessage: string;
  time: string;
  unread?: number;
};

export type Message = {
  id: string;
  groupId: string;
  userId: string;
  text: string;
  createdAt: Date;
};

export type CommunityAlert = {
  id: string;
  groupId: string;
  category: AlertCategory;
  title: string;
  description: string;
  createdAt: Date;
};
