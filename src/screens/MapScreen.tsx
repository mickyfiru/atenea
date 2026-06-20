import { Ionicons } from '@expo/vector-icons';
import Mapbox, {
  Camera,
  MapView,
  MarkerView,
  type Camera as MapboxCamera,
} from '@rnmapbox/maps';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryFilter, CategoryFilterValue } from '../components/CategoryFilter';
import { colors } from '../constants/theme';
import { mapboxConfig } from '../config/mapbox';
import { useAuth } from '../context/AuthContext';
import { RootScreenProps } from '../navigation/types';
import { subscribeAlertsForGroups } from '../services/alerts';
import { subscribeUserGroups } from '../services/groups';
import { subscribeUserLocation } from '../services/location';
import { CommunityAlert, CommunityGroup, UserLocation } from '../types/domain';
import { getAlertCategoryTone } from '../utils/alerts';
import { formatRelativeTime } from '../utils/dates';
import { formatDistance, getAlertDistanceKm, isAlertWithinKm } from '../utils/distance';

type Coordinate = [number, number];

export function MapScreen({ navigation }: RootScreenProps<'Map'>) {
  const { user } = useAuth();
  const cameraRef = useRef<MapboxCamera>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [alerts, setAlerts] = useState<CommunityAlert[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation>();
  const [selectedAlert, setSelectedAlert] = useState<CommunityAlert>();
  const [filter, setFilter] = useState<CategoryFilterValue>('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (mapboxConfig.accessToken) {
      void Mapbox.setAccessToken(mapboxConfig.accessToken);
    }
  }, []);

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
      setAlerts([]);
      return undefined;
    }

    return subscribeAlertsForGroups(
      groups.map((group) => group.id),
      (nextAlerts) => {
        setAlerts(nextAlerts);
        setError('');
      },
      (alertsError) => setError(alertsError.message),
    );
  }, [groups]);

  const userCoordinate = useMemo(() => getUserCoordinate(userLocation), [userLocation]);
  const mapAlerts = useMemo(
    () =>
      alerts
        .filter((alert) => getAlertCoordinate(alert))
        .filter((alert) => filter === 'Todas' || alert.category === filter)
        .filter((alert) =>
          userLocation?.locationEnabled
            ? isAlertWithinKm(alert, userLocation, mapboxConfig.nearbyRadiusKm)
            : true,
        ),
    [alerts, filter, userLocation],
  );

  const centerCoordinate = userCoordinate ?? getAlertCoordinate(mapAlerts[0]) ?? [-70.6693, -33.4489];
  const selectedDistance = selectedAlert
    ? formatDistance(getAlertDistanceKm(selectedAlert, userLocation))
    : '';

  function centerOnUser() {
    if (!userCoordinate) {
      setError('Activa tu ubicacion para centrar el mapa.');
      return;
    }

    cameraRef.current?.setCamera({
      centerCoordinate: userCoordinate,
      zoomLevel: 15,
      animationDuration: 600,
    });
  }

  if (!mapboxConfig.accessToken) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.messageState}>
          <Ionicons name="map-outline" size={38} color={colors.primary} />
          <Text style={styles.messageTitle}>Configura Mapbox</Text>
          <Text style={styles.messageText}>
            Agrega EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN en tus variables de entorno para ver el mapa.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <Header onBack={() => navigation.goBack()} />

      <View style={styles.filterWrap}>
        <CategoryFilter value={filter} onChange={setFilter} />
      </View>

      <View style={styles.mapWrap}>
        <MapView style={styles.map} styleURL={Mapbox.StyleURL.Light}>
          <Camera
            ref={cameraRef}
            centerCoordinate={centerCoordinate}
            zoomLevel={mapboxConfig.defaultZoom}
          />

          {userCoordinate ? (
            <MarkerView coordinate={userCoordinate}>
              <View style={styles.userMarker}>
                <View style={styles.userMarkerDot} />
              </View>
            </MarkerView>
          ) : null}

          {mapAlerts.map((alert) => {
            const coordinate = getAlertCoordinate(alert);

            if (!coordinate) {
              return null;
            }

            const tone = getAlertCategoryTone(alert.category);

            return (
              <MarkerView key={alert.id} coordinate={coordinate}>
                <Pressable
                  onPress={() => setSelectedAlert(alert)}
                  style={[styles.alertMarker, { backgroundColor: tone.color }]}
                >
                  <Ionicons name={tone.icon} size={19} color={colors.background} />
                </Pressable>
              </MarkerView>
            );
          })}
        </MapView>

        <Pressable onPress={centerOnUser} style={styles.locationButton}>
          <Ionicons name="navigate-outline" size={20} color={colors.primary} />
          <Text style={styles.locationButtonText}>Ir a mi ubicacion</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!userLocation?.locationEnabled ? (
          <Text style={styles.locationHint}>Activa tu ubicacion para ver alertas cercanas.</Text>
        ) : null}

        {selectedAlert ? (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailCategory}>{selectedAlert.category}</Text>
              <Pressable onPress={() => setSelectedAlert(undefined)}>
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.detailTitle}>{selectedAlert.title}</Text>
            <Text style={styles.detailDescription}>
              {selectedAlert.description || 'Sin descripcion'}
            </Text>
            <Text style={styles.detailMeta}>
              {selectedDistance ? `${selectedDistance} · ` : ''}
              {formatRelativeTime(selectedAlert.createdAt)}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={26} color={colors.primary} />
      </Pressable>
      <View style={styles.headerText}>
        <Text style={styles.title}>Mapa de alertas</Text>
        <Text style={styles.subtitle}>Alertas cercanas por categoria</Text>
      </View>
    </View>
  );
}

function getUserCoordinate(userLocation?: UserLocation): Coordinate | undefined {
  if (
    !userLocation?.locationEnabled ||
    typeof userLocation.latitude !== 'number' ||
    typeof userLocation.longitude !== 'number'
  ) {
    return undefined;
  }

  return [userLocation.longitude, userLocation.latitude];
}

function getAlertCoordinate(alert?: CommunityAlert): Coordinate | undefined {
  if (
    !alert ||
    typeof alert.latitude !== 'number' ||
    typeof alert.longitude !== 'number'
  ) {
    return undefined;
  }

  return [alert.longitude, alert.latitude];
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
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
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  filterWrap: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    alignItems: 'center',
    backgroundColor: '#BFD5FF',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  userMarkerDot: {
    backgroundColor: colors.primary,
    borderColor: colors.background,
    borderRadius: 8,
    borderWidth: 3,
    height: 18,
    width: 18,
  },
  alertMarker: {
    alignItems: 'center',
    borderColor: colors.background,
    borderRadius: 22,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  locationButton: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  locationButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'absolute',
    top: 16,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  error: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 16,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
    left: 16,
    padding: 12,
    position: 'absolute',
    right: 16,
    top: 78,
  },
  locationHint: {
    backgroundColor: colors.warningSoft,
    borderRadius: 16,
    color: colors.warning,
    fontSize: 13,
    fontWeight: '800',
    left: 16,
    padding: 12,
    position: 'absolute',
    right: 16,
    top: 78,
  },
  detailCard: {
    backgroundColor: colors.background,
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    bottom: 18,
    left: 16,
    padding: 18,
    position: 'absolute',
    right: 16,
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCategory: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  detailTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  detailDescription: {
    color: '#667793',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 6,
  },
  detailMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  messageState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  messageTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 16,
  },
  messageText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
});
