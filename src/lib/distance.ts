export type Coordinates = { latitude: number; longitude: number };

export function isValidCoordinates(value: Coordinates): boolean {
  return Number.isFinite(value.latitude)
    && Number.isFinite(value.longitude)
    && value.latitude >= -90
    && value.latitude <= 90
    && value.longitude >= -180
    && value.longitude <= 180;
}

const radians = (degrees: number) => degrees * Math.PI / 180;

export function distanceKilometers(origin: Coordinates, destination: Coordinates): number {
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) {
    throw new RangeError('Invalid coordinates');
  }
  const radius = 6371;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(origin.latitude))
    * Math.cos(radians(destination.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getApproximateDistance(
  origin?: Coordinates,
  destination?: Coordinates,
): number | null {
  if (!origin || !destination || !isValidCoordinates(origin) || !isValidCoordinates(destination)) return null;
  return distanceKilometers(origin, destination);
}

export function formatDistanceThai(kilometers: number): string {
  return kilometers < 1
    ? `ประมาณ ${Math.round(kilometers * 1000)} เมตร`
    : `ประมาณ ${kilometers.toFixed(1)} กม.`;
}
