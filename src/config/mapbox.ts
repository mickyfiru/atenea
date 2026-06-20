export const mapboxConfig = {
  accessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '',
  defaultZoom: 13,
  nearbyRadiusKm: 10,
} as const;
