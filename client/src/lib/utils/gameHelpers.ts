
export function getImagePath(city: string): string {
  const cleanCity = city.replace(/\s+/g, '_');
  return `/images/${cleanCity}.png`;
}