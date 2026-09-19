export type SpecimenKind =
  | 'reed'
  | 'leaf'
  | 'umbel'
  | 'vine'
  | 'beetle'
  | 'fly'
  | 'mussel'
  | 'spike'
  | 'cattail';

export interface Species {
  name: string;
  common: string;
  kind: SpecimenKind;
  hue: number;
  peak: number;
  listed?: boolean;
  lookalike?: string;
}

export type SpeciesKey =
  | 'phragmites'
  | 'knotweed'
  | 'garlic'
  | 'parsnip'
  | 'dsv'
  | 'eab'
  | 'zebra'
  | 'hogweed'
  | 'loosestrife'
  | 'slf'
  | 'cattail';

export const SP: Record<string, Species> = {
  phragmites: { name: 'Phragmites australis', common: 'Common reed', kind: 'reed', hue: 150, peak: 8 },
  knotweed: { name: 'Reynoutria japonica', common: 'Japanese knotweed', kind: 'leaf', hue: 95, peak: 8 },
  garlic: { name: 'Alliaria petiolata', common: 'Garlic mustard', kind: 'leaf', hue: 125, peak: 5 },
  parsnip: { name: 'Pastinaca sativa', common: 'Wild parsnip', kind: 'umbel', hue: 70, peak: 7 },
  dsv: { name: 'Vincetoxicum rossicum', common: 'Dog-strangling vine', kind: 'vine', hue: 105, peak: 7 },
  eab: { name: 'Agrilus planipennis', common: 'Emerald ash borer', kind: 'beetle', hue: 165, peak: 7 },
  zebra: { name: 'Dreissena polymorpha', common: 'Zebra mussel', kind: 'mussel', hue: 205, peak: 8 },
  hogweed: { name: 'Heracleum mantegazzianum', common: 'Giant hogweed', kind: 'umbel', hue: 88, peak: 7 },
  loosestrife: { name: 'Lythrum salicaria', common: 'Purple loosestrife', kind: 'spike', hue: 135, peak: 7 },
  slf: { name: 'Lycorma delicatula', common: 'Spotted lanternfly', kind: 'fly', hue: 22, peak: 8 },
  cattail: { name: 'Typha latifolia', common: 'Broad-leaved cattail', kind: 'cattail', hue: 42, peak: 7, listed: false, lookalike: 'phragmites' }
};
