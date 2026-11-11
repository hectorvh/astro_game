import {
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
  Shape,
  SRGBColorSpace,
} from 'three'
import { getLevelStatus, LEVELS } from '@/lib/jerboa/levels'

export const LEVEL_COUNT = LEVELS.length
export const SECTOR_STEP = (Math.PI * 2) / LEVEL_COUNT
export const R_IN = 3
export const R_OUT = 4.3
export const SECTOR_GAP = 0.035
export const DIAL_Y = -1.05
export const CORE_Y = 0.45
export const SPRING_K = 60
export const SPRING_C = 2 * Math.sqrt(SPRING_K)

export type DialState = {
  pos: number
  vel: number
  target: number
  dragging: boolean
  sel: number
}

export function createDial(): DialState {
  return { pos: 0, vel: 0, target: 0, dragging: false, sel: 0 }
}

export function mod(value: number, length: number): number {
  return ((value % length) + length) % length
}

export function levelUnlocked(index: number): boolean {
  const level = LEVELS[mod(index, LEVEL_COUNT)]
  return getLevelStatus(level.id).unlocked
}

export type MenuBridge = {
  overlay: boolean
  reduce: boolean
  launch: () => void
  goTo: (index: number) => void
  preview: (rounded: number) => void
  release: (dest: number, vel: number) => void
  setInput: (mode: 'touch' | 'kb' | 'pad') => void
  poke: () => void
  onContextLost: () => void
}

function sectorShape(r0: number, r1: number, a0: number, a1: number): Shape {
  const shape = new Shape()
  shape.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0))
  shape.absarc(0, 0, r1, a0, a1, false)
  shape.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1))
  shape.absarc(0, 0, r0, a1, a0, true)
  shape.closePath()
  return shape
}

function labelArc(scale: number): BufferGeometry {
  const mid = (R_IN + R_OUT) / 2 + 0.02
  const half = (1.95 * scale) / mid
  const r0 = mid - 0.38 * scale
  const r1 = mid + 0.38 * scale
  const steps = 48
  const y0 = 0.235
  const lift = 0.06 * scale
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= steps; i++) {
    const u = i / steps
    const phi = -half + 2 * half * u
    pos.push(r1 * Math.sin(phi), y0, r1 * Math.cos(phi))
    uv.push(u, 0)
    pos.push(r0 * Math.sin(phi), y0 + lift, r0 * Math.cos(phi))
    uv.push(u, 1)
    if (i < steps) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  geometry.setIndex(idx)
  geometry.computeVertexNormals()
  return geometry
}

function lockTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)
  ctx.clearRect(0, 0, 128, 128)
  ctx.strokeStyle = '#E6EDF3'
  ctx.lineWidth = 8
  ctx.lineJoin = 'round'
  ctx.strokeRect(36, 58, 56, 44)
  ctx.beginPath()
  ctx.arc(64, 56, 18, Math.PI, 0)
  ctx.stroke()
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export type DialSegment = {
  index: number
  locked: boolean
  body: Mesh
  bodyMat: MeshBasicMaterial
  edges: LineSegments
  edgeMat: LineBasicMaterial
  plate: Mesh
  plateMat: MeshBasicMaterial
  label: Mesh
  labelMat: MeshBasicMaterial
}

export type BuiltDial = {
  group: Group
  segments: DialSegment[]
  bodies: Mesh[]
  dispose: () => void
}

export function buildDial(): BuiltDial {
  const a0 = -Math.PI / 2 - SECTOR_STEP / 2 + SECTOR_GAP
  const a1 = -Math.PI / 2 + SECTOR_STEP / 2 - SECTOR_GAP
  const segGeo = new ExtrudeGeometry(sectorShape(R_IN, R_OUT, a0, a1), {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
    curveSegments: 16,
  })
  segGeo.rotateX(-Math.PI / 2)
  const edgesGeo = new EdgesGeometry(segGeo, 30)
  const plateGeo = new ExtrudeGeometry(
    sectorShape(R_IN + 0.14, R_OUT - 0.14, a0 + SECTOR_GAP * 1.4, a1 - SECTOR_GAP * 1.4),
    { depth: 0.025, bevelEnabled: false, curveSegments: 16 },
  )
  plateGeo.rotateX(-Math.PI / 2)
  const labelGeo = labelArc(0.9)
  const lockGeo = new PlaneGeometry(0.42, 0.42)
  const lockMap = lockTexture()
  const lockMat = new MeshBasicMaterial({
    map: lockMap,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  })

  const group = new Group()
  group.position.y = DIAL_Y
  const segments: DialSegment[] = []
  const bodies: Mesh[] = []
  const tickGeos: BufferGeometry[] = []
  const tickMats: MeshBasicMaterial[] = []

  for (let i = 0; i < LEVEL_COUNT; i++) {
    const status = getLevelStatus(LEVELS[i].id)
    const pivot = new Group()
    pivot.rotation.y = i * SECTOR_STEP
    const bodyMat = new MeshBasicMaterial({
      color: '#0a1c2c',
      transparent: true,
      opacity: status.unlocked ? 0.4 : 0.22,
      toneMapped: false,
    })
    const body = new Mesh(segGeo, bodyMat)
    body.userData.index = i
    const edgeMat = new LineBasicMaterial({
      color: '#9fe9ff',
      transparent: true,
      opacity: status.unlocked ? 0.4 : 0.2,
      depthWrite: false,
      toneMapped: false,
    })
    const edges = new LineSegments(edgesGeo, edgeMat)
    edges.raycast = () => undefined
    const plateMat = new MeshBasicMaterial({
      color: '#123044',
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      toneMapped: false,
    })
    const plate = new Mesh(plateGeo, plateMat)
    plate.position.y = 0.2
    plate.raycast = () => undefined
    const labelMat = new MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      opacity: 0,
      toneMapped: false,
      side: DoubleSide,
    })
    const label = new Mesh(labelGeo, labelMat)
    label.raycast = () => undefined
    label.visible = false
    pivot.add(body, edges, plate, label)
    if (!status.unlocked) {
      const lock = new Mesh(lockGeo, lockMat)
      lock.position.set(0, 0.52, R_IN + 0.38)
      lock.scale.setScalar(1.35)
      lock.raycast = () => undefined
      pivot.add(lock)
    }
    group.add(pivot)
    bodies.push(body)
    segments.push({
      index: i,
      locked: !status.unlocked,
      body,
      bodyMat,
      edges,
      edgeMat,
      plate,
      plateMat,
      label,
      labelMat,
    })
  }

  const ticks = new Group()
  group.add(ticks)
  const dummy = new Object3D()
  const minor = new MeshBasicMaterial({
    color: '#8fa3b8',
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    toneMapped: false,
  })
  const major = new MeshBasicMaterial({
    color: '#e6edf3',
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    toneMapped: false,
  })
  const accent = new MeshBasicMaterial({
    color: '#ff9100',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    toneMapped: false,
  })
  tickMats.push(minor, major, accent, lockMat)

  const addRing = (
    radius: number,
    count: number,
    length: number,
    width: number,
    material: MeshBasicMaterial,
    include: (index: number) => boolean,
    inward: boolean,
  ) => {
    const picked: number[] = []
    for (let i = 0; i < count; i++) if (include(i)) picked.push(i)
    const geo = new PlaneGeometry(width, length)
    tickGeos.push(geo)
    const mesh = new InstancedMesh(geo, material, picked.length)
    mesh.raycast = () => undefined
    const matrix = new Matrix4()
    picked.forEach((i, k) => {
      const angle = (i / count) * Math.PI * 2
      const rr = radius + (inward ? -length / 2 : length / 2)
      dummy.position.set(rr * Math.cos(angle), 0.1, rr * Math.sin(angle))
      dummy.rotation.set(-Math.PI / 2, 0, -angle + Math.PI / 2)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      matrix.copy(dummy.matrix)
      mesh.setMatrixAt(k, matrix)
    })
    ticks.add(mesh)
  }

  addRing(R_OUT + 0.12, 60, 0.1, 0.014, minor, (i) => i % 5 !== 0, false)
  addRing(R_OUT + 0.12, 60, 0.24, 0.028, major, (i) => i % 5 === 0 && i % 15 !== 0, false)
  addRing(R_OUT + 0.12, 60, 0.3, 0.04, accent, (i) => i % 15 === 0, false)
  addRing(R_IN - 0.1, 120, 0.06, 0.01, minor, (i) => i % 10 !== 0, true)
  addRing(R_IN - 0.1, 120, 0.14, 0.018, major, (i) => i % 10 === 0, true)

  return {
    group,
    segments,
    bodies,
    dispose: () => {
      segGeo.dispose()
      edgesGeo.dispose()
      plateGeo.dispose()
      labelGeo.dispose()
      lockGeo.dispose()
      lockMap.dispose()
      tickGeos.forEach((geo) => geo.dispose())
      tickMats.forEach((mat) => mat.dispose())
      for (const segment of segments) {
        segment.bodyMat.dispose()
        segment.edgeMat.dispose()
        segment.plateMat.dispose()
        segment.labelMat.map?.dispose()
        segment.labelMat.dispose()
      }
    },
  }
}

export function labelTexture(text: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return new CanvasTexture(canvas)
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  let size = 150
  const font = (px: number) => `700 ${px}px 'Chakra Petch', 'Arial Narrow', sans-serif`
  ctx.font = font(size)
  while (size > 78 && ctx.measureText(text).width > 1120) {
    size -= 4
    ctx.font = font(size)
  }
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(8, size * 0.08)
  ctx.strokeStyle = 'rgba(8,12,18,.85)'
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export function levelLabel(index: number): string {
  const level = LEVELS[index]
  return `${level.code}  ${level.title.toUpperCase()}`
}
