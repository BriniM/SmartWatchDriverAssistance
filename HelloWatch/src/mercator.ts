import type {LatLng} from './types';

export const TILE_SIZE = 256;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 19;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function lngToWorldX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

export function latToWorldY(lat: number, zoom: number): number {
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return y * TILE_SIZE * 2 ** zoom;
}

export function worldXToLng(x: number, zoom: number): number {
  return (x / (TILE_SIZE * 2 ** zoom)) * 360 - 180;
}

export function worldYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE_SIZE * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export function tileUrl(zoom: number, x: number, y: number): string {
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export function fitBounds(
  points: LatLng[],
  width: number,
  height: number,
  padding: number,
  maxZoom = 16,
): {center: LatLng; zoom: number} | null {
  if (points.length === 0) {
    return null;
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  const center: LatLng = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
  };
  const availableWidth = Math.max(width - padding * 2, 1);
  const availableHeight = Math.max(height - padding * 2, 1);
  const topZoom = Math.min(maxZoom, MAX_ZOOM);

  for (let zoom = topZoom; zoom >= MIN_ZOOM; zoom--) {
    const spanX = lngToWorldX(maxLng, zoom) - lngToWorldX(minLng, zoom);
    const spanY = latToWorldY(minLat, zoom) - latToWorldY(maxLat, zoom);
    if (spanX <= availableWidth && spanY <= availableHeight) {
      return {center, zoom};
    }
  }

  return {center, zoom: MIN_ZOOM};
}
