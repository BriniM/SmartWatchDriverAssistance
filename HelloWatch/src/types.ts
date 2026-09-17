export type LatLng = {
  latitude: number;
  longitude: number;
};

export type Coords = LatLng & {
  accuracy: number | null;
};

export type Position = Coords & {
  precise: boolean;
  speed: number | null;
};

export type SavedLocation = {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  precise: boolean;
  createdAt: number;
  label: string;
};
