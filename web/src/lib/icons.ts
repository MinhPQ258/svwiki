export const categoryIcons: Record<string, string> = {
  'Crops': '🌾',
  'Fish': '🐟',
  'Minerals': '💎',
  'Artifacts': '🏺',
  'Craftable Items': '🛠️',
  'Characters': '👥',
  'Villagers': '🧑‍🌾',
  'Weapons': '⚔️',
  'Rings': '💍',
  'Clothing': '👕',
  'Furniture': '🪑',
  'Buildings': '🏠',
  'Quests': '📜',
  'Animals': '🐄',
  'Food': '🍲',
  'Foraging': '🍄',
  'Trees': '🌲',
  'Books': '📚',
  'Locations': '🗺️',
  'Tools': '⛏️',
  'Festivals': '🎈',
  'Monsters': '👾',
};

export function getCategoryIcon(name: string | null | undefined) {
  if (!name) return '✨';
  const lowerName = name.toLowerCase();
  const key = Object.keys(categoryIcons).find(
    k => lowerName.includes(k.toLowerCase()) || k.toLowerCase().includes(lowerName)
  );
  return key ? categoryIcons[key] : '✨';
}
