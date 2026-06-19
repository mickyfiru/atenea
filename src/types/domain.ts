export type AlertCategory = 'Seguridad' | 'Tr\u00e1nsito' | 'Comunidad' | 'Servicios';

export type UserProfile = {
  id: string;
  phoneNumber: string;
  displayName: string;
  createdAt: Date;
  locationEnabled: boolean;
  latitude?: number;
  longitude?: number;
  city: string;
  district: string;
  updatedAt?: Date;
};

export type UserLocation = {
  locationEnabled: boolean;
  latitude?: number;
  longitude?: number;
  city: string;
  district: string;
  updatedAt?: Date;
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
  lastMessageAt?: Date;
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
  userId?: string;
  category: AlertCategory;
  title: string;
  description: string;
  soundType: AlertCategory;
  latitude?: number;
  longitude?: number;
  city: string;
  district: string;
  createdAt: Date;
};
