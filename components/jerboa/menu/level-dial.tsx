'use client'

// Three.js scene objects are mutable by design. The React compiler's immutability
// rule treats them as frozen values, which does not match how a scene graph works.
/* eslint-disable react-hooks/immutability */

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  type Material,
} from 'three'
import { getLevelStatus, LEVELS, type LevelDef } from '@/lib/jerboa/levels'
import {
  buildDial,
  CORE_Y,
  DIAL_Y,
  labelTexture,
  levelLabel,
  mod,
  SECTOR_STEP,
  SPRING_C,
  SPRING_K,
  type DialState,
  type MenuBridge,
} from './dial-geometry'

const MENU_MODEL = '/3d/AstroBunny.menu.glb'
useGLTF.preload(MENU_MODEL, false, true)

const _ndc = new Vector2()
const _size = new Vector3()
const _center = new Vector3()
const _amber = new Color('#FF9100')
const _cyan = new Color('#9fe9ff')
const _plateIdle = new Color('#123044')
const _raycaster = new Raycaster()

function applyOpacity(root: Group, opacity: number) {
  root.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of mats) {
      mat.transparent = opacity < 0.999
      mat.opacity = opacity
    }
  })
}

function FitCamera() {
  const { camera, size, invalidate } = useThree()
  useLayoutEffect(() => {
    const cam = camera as PerspectiveCamera
    const compact = size.width < 820 || size.height < 520
    const fov = compact ? 42 : 35
    cam.fov = fov
    const aspect = size.width / Math.max(1, size.height)
    const tan = Math.tan((fov * Math.PI) / 360)
    const short = size.height < 480
    const topPx = 72
    const bottomPx = short ? Math.round(size.height * 0.46) : compact ? 210 : 150
    const sidePx = compact ? 8 : 320
    const usableH = Math.max(0.28, (size.height - topPx - bottomPx) / size.height)
    const usableW = Math.max(0.4, (size.width - sidePx) / size.width)
    const distH = (short ? 2.8 : 3.5) / (tan * usableH)
    const distW = (short ? 4.4 : 4.8) / (tan * aspect * usableW)
    const dist = Math.max(distH, distW, 8.5)
    const lift = compact ? 0.62 : 0.4
    cam.position.set(0, lift * dist + (compact ? 0.2 : -0.05), dist)
    cam.near = 0.1
    cam.far = dist * 6
    cam.lookAt(0, short ? -1.25 : compact ? -0.7 : -0.4, 0)
    if (short) cam.setViewOffset(size.width, size.height, 0, Math.round(bottomPx * 0.55), size.width, size.height)
    else cam.clearViewOffset()
    cam.updateProjectionMatrix()
    invalidate()
  }, [camera, size, invalidate])
  return null
}

function DialRig({
  dialRef,
  bridgeRef,
}: {
  dialRef: RefObject<DialState>
  bridgeRef: RefObject<MenuBridge>
}) {
  const built = useMemo(() => buildDial(), [])
  const groupRef = useRef<Group>(null)
  const coreRef = useRef<Mesh>(null)
  const { camera, gl, size, invalidate } = useThree()

  useEffect(() => () => built.dispose(), [built])

  useEffect(() => {
    if (bridgeRef.current) bridgeRef.current.poke = invalidate
  }, [bridgeRef, invalidate])

  useEffect(() => {
    let cancelled = false
    const fonts = document.fonts
    const ready = fonts?.load
      ? Promise.race([
          fonts.load("700 150px 'Chakra Petch'"),
          new Promise((resolve) => window.setTimeout(resolve, 2500)),
        ])
      : Promise.resolve()
    void ready.then(() => {
      if (cancelled) return
      const max = gl.capabilities.getMaxAnisotropy()
      built.segments.forEach((segment, index) => {
        const texture = labelTexture(levelLabel(index))
        texture.anisotropy = max
        segment.labelMat.map = texture
        segment.labelMat.opacity = 1
        segment.label.visible = true
        segment.labelMat.needsUpdate = true
      })
    })
    return () => {
      cancelled = true
    }
  }, [built, gl])

  useFrame((_, delta) => {
    const dial = dialRef.current
    const bridge = bridgeRef.current
    if (!dial || !bridge) return
    const dt = Math.min(0.05, delta)
    if (!dial.dragging) {
      if (bridge.reduce) {
        dial.pos = dial.target
        dial.vel = 0
      } else {
        dial.vel += ((dial.target - dial.pos) * SPRING_K - dial.vel * SPRING_C) * dt
        dial.pos += dial.vel * dt
        if (Math.abs(dial.target - dial.pos) < 0.0005 && Math.abs(dial.vel) < 0.001) {
          dial.pos = dial.target
          dial.vel = 0
        }
      }
    }
    const active = mod(Math.round(dial.pos), LEVELS.length)
    built.group.rotation.y = -dial.pos * SECTOR_STEP
    const moving =
      dial.dragging ||
      Math.abs(dial.target - dial.pos) > 0.0005 ||
      Math.abs(dial.vel) > 0.001
    if (moving) bridge.poke()
    for (const segment of built.segments) {
      const on = segment.index === active
      segment.edgeMat.color.copy(on ? _amber : _cyan)
      segment.edgeMat.opacity = on ? 0.95 : segment.locked ? 0.18 : 0.38
      segment.plateMat.color.copy(on ? _amber : _plateIdle)
      segment.plateMat.opacity = on ? 0.72 : 0.1
      segment.bodyMat.opacity = segment.locked ? 0.2 : 0.4
      segment.labelMat.opacity = on ? 1 : 0.45
    }
  })

  useEffect(() => {
    const canvas = gl.domElement
    canvas.style.touchAction = 'none'
    let drag: {
      id: number
      x: number
      t: number
      moved: number
      vel: number
      lastRounded: number
      seg: number
    } | null = null

    const hitWith = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      _ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      _raycaster.setFromCamera(_ndc, camera)
      const sector = _raycaster.intersectObjects(built.bodies, false)[0]
      const core = coreRef.current
        ? _raycaster.intersectObject(coreRef.current, false)[0]
        : undefined
      if (sector && (!core || sector.distance <= core.distance)) {
        return { seg: Number(sector.object.userData.index), core: false }
      }
      return { seg: -1, core: !!core }
    }

    const onDown = (event: PointerEvent) => {
      const bridge = bridgeRef.current
      const dial = dialRef.current
      if (!bridge || !dial || bridge.overlay) return
      if (event.pointerType === 'touch') event.preventDefault()
      try {
        canvas.setPointerCapture(event.pointerId)
      } catch {
        // The pointer can already be gone.
      }
      bridge.setInput(event.pointerType === 'touch' ? 'touch' : 'kb')
      const picked = hitWith(event)
      dial.dragging = true
      dial.vel = 0
      bridge.poke()
      drag = {
        id: event.pointerId,
        x: event.clientX,
        t: performance.now(),
        moved: 0,
        vel: 0,
        lastRounded: Math.round(dial.pos),
        seg: picked.core ? -2 : picked.seg,
      }
    }

    const onMove = (event: PointerEvent) => {
      const dial = dialRef.current
      const bridge = bridgeRef.current
      if (!drag || !dial || !bridge || event.pointerId !== drag.id) return
      if (event.pointerType === 'touch') event.preventDefault()
      const now = performance.now()
      const dx = event.clientX - drag.x
      const dt = Math.max(0.016, (now - drag.t) / 1000)
      drag.moved += Math.abs(dx)
      const sectorPx = Math.max(80, size.width * 0.25)
      const dPos = -dx / sectorPx
      dial.pos += dPos
      drag.vel = dPos / dt
      drag.x = event.clientX
      drag.t = now
      const rounded = Math.round(dial.pos)
      if (rounded !== drag.lastRounded) {
        drag.lastRounded = rounded
        bridge.preview(rounded)
      }
      bridge.poke()
    }

    const onUp = (event: PointerEvent) => {
      const dial = dialRef.current
      const bridge = bridgeRef.current
      if (!drag || !dial || !bridge || event.pointerId !== drag.id) return
      const tap = drag.moved < 8
      const seg = drag.seg
      const vel = drag.vel
      dial.dragging = false
      drag = null
      if (tap) {
        dial.pos = dial.target
        dial.vel = 0
        const current = mod(Math.round(dial.sel), LEVELS.length)
        if (seg >= 0 && seg !== current) bridge.goTo(seg)
        else if (seg === current || seg === -2) bridge.launch()
        return
      }
      const flick = Math.max(-2, Math.min(2, vel * 0.18))
      bridge.release(Math.round(dial.pos + flick), vel)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
  }, [built, bridgeRef, camera, dialRef, gl, size.width])

  return (
    <>
      <primitive ref={groupRef} object={built.group} />
      <mesh ref={coreRef} position={[0, CORE_Y, 0]}>
        <sphereGeometry args={[1.45, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

function bandTexture(surface: string, bands: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, 512, 256)
    ctx.fillStyle = bands
    for (let i = 0; i < 9; i++) ctx.fillRect(0, 8 + i * 28, 512, i % 2 === 0 ? 8 : 4)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function Planet({ level, dim, fadeRef }: { level: LevelDef; dim: boolean; fadeRef: RefObject<number> }) {
  const map = useMemo(() => bandTexture(level.planet.surface, level.planet.bands), [level])
  const surface = useRef<MeshBasicMaterial>(null)
  const air = useRef<MeshBasicMaterial>(null)
  const ring = useRef<MeshBasicMaterial>(null)
  useEffect(() => () => map.dispose(), [map])
  useFrame(() => {
    const fade = fadeRef.current ?? 1
    const bright = dim ? 0.45 : 1
    if (surface.current) surface.current.opacity = fade
    if (air.current) air.current.opacity = 0.25 * bright * fade
    if (ring.current) ring.current.opacity = 0.5 * bright * fade
  })
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.1, 48, 32]} />
        <meshBasicMaterial
          ref={surface}
          map={map}
          color={dim ? '#737373' : '#ffffff'}
          transparent
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.18, 40, 24]} />
        <meshBasicMaterial
          ref={air}
          color={level.planet.atmosphere}
          transparent
          opacity={0.25}
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {level.planet.ring ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.1, 64]} />
          <meshBasicMaterial
            ref={ring}
            color={level.planet.bands}
            transparent
            opacity={0.5}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      {dim ? (
        <Html center position={[0, 1.65, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <span className="hud-tag" style={{ color: 'var(--hud-ink)', whiteSpace: 'nowrap' }}>
            COMING SOON
          </span>
        </Html>
      ) : null}
    </group>
  )
}

function cloneModel(source: Group): Group {
  const cloned = source.clone(true)
  cloned.traverse((obj) => {
    const mesh = obj as Mesh
    if (!mesh.isMesh) return
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((mat) => mat.clone())
      : mesh.material.clone()
  })
  return cloned
}

function LevelModel({
  fadeRef,
  spin,
}: {
  fadeRef: RefObject<number>
  spin: boolean
}) {
  const { scene } = useGLTF(MENU_MODEL, false, true)
  const cloned = useMemo(() => cloneModel(scene), [scene])
  const spinRef = useRef<Group>(null)
  const fitRef = useRef<Group>(null)

  useLayoutEffect(() => {
    const fit = fitRef.current
    if (!fit) return
    const holder = new Group()
    holder.add(cloned)
    holder.updateWorldMatrix(true, true)
    const box = new Box3().setFromObject(holder)
    const s = 2 / (box.getSize(_size).y || 1)
    const center = box.getCenter(_center)
    fit.scale.setScalar(s)
    fit.position.set(-center.x * s, -center.y * s, -center.z * s)
    fit.add(cloned)
    return () => {
      fit.remove(cloned)
    }
  }, [cloned])

  useEffect(
    () => () => {
      cloned.traverse((obj) => {
        const mesh = obj as Mesh
        if (!mesh.isMesh) return
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((mat: Material) => mat.dispose())
      })
    },
    [cloned],
  )

  useFrame((_, dt) => {
    const root = spinRef.current
    if (!root) return
    if (spin) root.rotation.y += 0.25 * dt
    applyOpacity(root, fadeRef.current ?? 1)
  })

  return (
    <group ref={spinRef}>
      <group ref={fitRef} />
    </group>
  )
}

function CoreFallback({ reduce }: { reduce: boolean }) {
  const ref = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh || reduce) return
    const scale = 1 + Math.sin(clock.elapsedTime * 3) * 0.06
    mesh.scale.setScalar(scale)
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.9, 1]} />
      <meshBasicMaterial color="#00E5FF" wireframe toneMapped={false} />
    </mesh>
  )
}

function Core({
  level,
  reduce,
}: {
  level: LevelDef
  reduce: boolean
}) {
  const fadeRef = useRef(reduce ? 1 : 0)
  const born = useRef(0)
  const wrap = useRef<Group>(null)
  const status = getLevelStatus(level.id)
  const showModel = !!level.model && status.unlocked
  useLayoutEffect(() => {
    born.current = performance.now()
    fadeRef.current = reduce ? 1 : 0
    wrap.current?.scale.setScalar(reduce ? 1 : 0.86)
  }, [level.id, reduce])
  useFrame(() => {
    const t = reduce ? 1 : Math.min(1, (performance.now() - born.current) / 300)
    fadeRef.current = t
    wrap.current?.scale.setScalar(reduce ? 1 : 0.86 + 0.14 * t)
  })
  return (
    <group ref={wrap} position={[0, CORE_Y, 0]}>
      <Suspense fallback={<CoreFallback reduce={reduce} />}>
        {showModel ? (
          <LevelModel fadeRef={fadeRef} spin={!reduce} />
        ) : (
          <Planet level={level} dim={!status.unlocked} fadeRef={fadeRef} />
        )}
      </Suspense>
    </group>
  )
}

function Reticles() {
  const geos = useMemo(
    () => [new RingGeometry(1.25, 1.32, 80), new RingGeometry(2.05, 2.12, 96)],
    [],
  )
  useEffect(() => () => geos.forEach((geo) => geo.dispose()), [geos])
  return (
    <group position={[0, DIAL_Y + 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {geos.map((geo, index) => (
        <mesh key={index} geometry={geo}>
          <meshBasicMaterial
            color="#00E5FF"
            transparent
            opacity={index === 0 ? 0.28 : 0.16}
            side={DoubleSide}
            depthWrite={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function Scene({
  dialRef,
  bridgeRef,
  level,
  reduce,
}: {
  dialRef: RefObject<DialState>
  bridgeRef: RefObject<MenuBridge>
  level: LevelDef
  reduce: boolean
}) {
  return (
    <>
      <FitCamera />
      <ambientLight intensity={0.55} />
      <pointLight position={[2.2, 3.1, 3.4]} color="#d8fbff" intensity={46} distance={18} decay={2} />
      <pointLight position={[-3.1, 1.6, -2.4]} color="#ff9100" intensity={28} distance={16} decay={2} />
      <Reticles />
      <DialRig dialRef={dialRef} bridgeRef={bridgeRef} />
      <Core key={level.id} level={level} reduce={reduce} />
    </>
  )
}

export function LevelDial({
  dialRef,
  bridgeRef,
  level,
  reduce,
  frameloop,
}: {
  dialRef: RefObject<DialState>
  bridgeRef: RefObject<MenuBridge>
  level: LevelDef
  reduce: boolean
  frameloop: 'always' | 'demand' | 'never'
}) {
  return (
    <Canvas
      className="absolute inset-0 touch-none"
      style={{ touchAction: 'none' }}
      dpr={[1, 2]}
      frameloop={frameloop}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 35, position: [0, 4.2, 12], near: 0.1, far: 80 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <Scene dialRef={dialRef} bridgeRef={bridgeRef} level={level} reduce={reduce} />
    </Canvas>
  )
}
