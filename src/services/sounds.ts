import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio, type AVPlaybackStatus } from 'expo-av';

import { AlertCategory } from '../types/domain';

export type AlertSoundPreferences = Record<AlertCategory, boolean>;

const STORAGE_KEY = '@atenea/alert-sound-preferences';
const RECENTLY_HANDLED_MS = 8000;

export const DEFAULT_ALERT_SOUND_PREFERENCES: AlertSoundPreferences = {
  Seguridad: true,
  'Tr\u00e1nsito': true,
  Comunidad: true,
  Servicios: true,
};

const ALERT_SOUND_SOURCES: Record<AlertCategory, number> = {
  Seguridad: require('../../assets/sounds/security.wav') as number,
  'Tr\u00e1nsito': require('../../assets/sounds/traffic.wav') as number,
  Comunidad: require('../../assets/sounds/community.wav') as number,
  Servicios: require('../../assets/sounds/services.wav') as number,
};

const recentlyHandledAlertIds = new Set<string>();

export function markAlertSoundHandled(alertId: string) {
  recentlyHandledAlertIds.add(alertId);

  setTimeout(() => {
    recentlyHandledAlertIds.delete(alertId);
  }, RECENTLY_HANDLED_MS);
}

export function wasAlertSoundHandled(alertId: string) {
  return recentlyHandledAlertIds.has(alertId);
}

export async function loadAlertSoundPreferences(): Promise<AlertSoundPreferences> {
  try {
    const storedPreferences = await AsyncStorage.getItem(STORAGE_KEY);

    if (!storedPreferences) {
      return DEFAULT_ALERT_SOUND_PREFERENCES;
    }

    return {
      ...DEFAULT_ALERT_SOUND_PREFERENCES,
      ...(JSON.parse(storedPreferences) as Partial<AlertSoundPreferences>),
    };
  } catch (error) {
    console.warn('No se pudieron cargar las preferencias de sonido.', error);
    return DEFAULT_ALERT_SOUND_PREFERENCES;
  }
}

export async function saveAlertSoundPreferences(preferences: AlertSoundPreferences) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...DEFAULT_ALERT_SOUND_PREFERENCES,
      ...preferences,
    }),
  );
}

export async function setAlertSoundEnabled(category: AlertCategory, enabled: boolean) {
  const currentPreferences = await loadAlertSoundPreferences();
  const nextPreferences = {
    ...currentPreferences,
    [category]: enabled,
  };

  await saveAlertSoundPreferences(nextPreferences);

  return nextPreferences;
}

export async function playAlertSound(soundType: AlertCategory) {
  const preferences = await loadAlertSoundPreferences();

  if (!preferences[soundType]) {
    return;
  }

  const soundSource = ALERT_SOUND_SOURCES[soundType];

  if (!soundSource) {
    return;
  }

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      staysActiveInBackground: false,
    });

    const { sound } = await Audio.Sound.createAsync(soundSource, {
      shouldPlay: true,
      volume: 0.9,
    });
    let disposed = false;

    const dispose = async () => {
      if (disposed) {
        return;
      }

      disposed = true;
      sound.setOnPlaybackStatusUpdate(null);

      try {
        await sound.unloadAsync();
      } catch (error) {
        console.warn('No se pudo liberar el sonido de alerta.', error);
      }
    };

    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        void dispose();
      }
    });

    setTimeout(() => {
      void dispose();
    }, 4000);
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de alerta.', error);
  }
}
