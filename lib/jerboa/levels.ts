export type LevelDef = {
  id: 1 | 2 | 3 | 4
  code: '01' | '02' | '03' | '04'
  key: string
  title: string
  character: string
  spatialFocus: string
  unlocked: boolean
  planet: { surface: string; bands: string; atmosphere: string; ring: boolean }
  model?: string
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    code: '01',
    key: 'STATION_EVACUATION',
    title: 'Station Evacuation',
    character: 'Astro Bunny',
    spatialFocus: 'Containment, support and path motion',
    unlocked: true,
    planet: { surface: '#E09952', bands: '#8C4A26', atmosphere: '#FFB86B', ring: true },
  },
  {
    id: 2,
    code: '02',
    key: 'THE_LOST_JUNGLE',
    title: 'The Lost Jungle',
    character: 'Prof. Kalu Monkey',
    spatialFocus: 'Relative heights and vertical support',
    unlocked: false,
    planet: { surface: '#45A870', bands: '#1A544F', atmosphere: '#8CFFB8', ring: false },
  },
  {
    id: 3,
    code: '03',
    key: 'THE_ICE_DUNES',
    title: 'The Ice Dunes',
    character: 'Cmdr. Barnaby Dog',
    spatialFocus: 'Projective axes: left / right and front / back',
    unlocked: false,
    planet: { surface: '#EDC987', bands: '#B8804D', atmosphere: '#FFDB99', ring: false },
  },
  {
    id: 4,
    code: '04',
    key: 'THE_DEEP_OCEAN',
    title: 'The Deep Ocean',
    character: 'Dr. Shelby Turtle',
    spatialFocus: 'Distance relations: near and far',
    unlocked: false,
    planet: { surface: '#387ADB', bands: '#142E6E', atmosphere: '#80CCFF', ring: true },
  },
]

export type LevelStatus = { unlocked: boolean; completed: boolean }

// Static until the backend stores progress. Swap the body, not the callers.
export function getLevelStatus(id: LevelDef['id']): LevelStatus {
  const level = LEVELS.find((entry) => entry.id === id)
  return { unlocked: level?.unlocked ?? false, completed: false }
}
