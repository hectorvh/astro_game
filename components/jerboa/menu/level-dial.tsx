'use client'

// Three.js scene objects are mutable by design. The React compiler's immutability
// rule treats them as frozen values, which does not match how a scene graph works.
/* eslint-disable react-hooks/immutability */

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
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

const _ndc = new Vector2()
const _amber = new Color('#FF9100')
const _cyan = new Color('#9fe9ff')
const _plateIdle = new Color('#123044')
const _raycaster = new Raycaster()
const _anchor = new Vector3()
const _up = new Vector3()

// Atmosphere shell radius: the visible top edge of the planet.
const PLANET_TOP = 1.18
// Label bottom limits: below the top edge, and below the top-right button
// group (3 x 48 px + gaps, see .menu-links) when the label is under it.
const LABEL_MIN_Y = 36
const LABEL_MIN_Y_UNDER_BUTTONS = 92
const BUTTONS_SPAN = 200

/** Pins the "COMING SOON" label just above the planet's on-screen silhouette,
 *  so it follows the camera fit in every orientation and never sits on the dial. */
function ComingSoonAnchor({ bridgeRef }: { bridgeRef: RefObject<MenuBridge> }) {
  useFrame(({ camera, size }) => {
    const el = bridgeRef.current?.comingSoon
    if (!el) return
    _up.setFromMatrixColumn(camera.matrixWorld, 1).multiplyScalar(PLANET_TOP)
    _anchor.set(0, CORE_Y, 0).add(_up).project(camera)
    const x = (_anchor.x * 0.5 + 0.5) * size.width
    const underButtons = x + el.offsetWidth / 2 > size.width - BUTTONS_SPAN
    const minY = underButtons ? LABEL_MIN_Y_UNDER_BUTTONS : LABEL_MIN_Y
    const y = Math.max(minY, (-_anchor.y * 0.5 + 0.5) * size.height - 10)
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
    el.style.visibility = 'visible'
  })
  return null
}

const CANVAS_GL = { alpha: true, antialias: true, powerPreference: 'high-performance' as const }
const CANVAS_CAMERA = {
  fov: 35,
  position: [0, 4.2, 12] as [number, number, number],
  near: 0.1,
  far: 80,
}
const CANVAS_DPR: [number, number] = [1, 1.5]

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
  const [built] = useState(() => buildDial())
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
        if (!segment.labelMat || !segment.label) return
        const texture = labelTexture(levelLabel(index))
        texture.anisotropy = max
        segment.labelMat.map?.dispose()
        segment.labelMat.map = texture
        segment.labelMat.opacity = 1
        segment.label.visible = true
        segment.labelMat.needsUpdate = true
      })
      invalidate()
    })
    return () => {
      cancelled = true
    }
  }, [built, gl, invalidate])

  useFrame((_, delta) => {
    const dial = dialRef.current
    const bridge = bridgeRef.current
    if (!dial || !bridge || !built.group) return
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
      if (!segment?.label || !segment.edgeMat || !segment.plateMat || !segment.bodyMat || !segment.labelMat) {
        continue
      }
      const on = segment.index === active
      segment.label.scale.x = Math.cos((segment.index - dial.pos) * SECTOR_STEP) < -0.2 ? -1 : 1
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
      if (rect.width < 1 || rect.height < 1) return { seg: -1, core: false }
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
      const sectorPx = Math.max(170, Math.min(400, size.width * 0.42))
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
      try {
        canvas.releasePointerCapture(event.pointerId)
      } catch {
        // Already released.
      }
      if (tap) {
        dial.pos = dial.target
        dial.vel = 0
        const current = mod(Math.round(dial.sel), LEVELS.length)
        if (seg >= 0 && seg !== current) bridge.goTo(seg)
        else if (seg === current || seg === -2) bridge.launch()
        return
      }
      const flick = Math.max(-1, Math.min(1, vel * 0.1))
      bridge.release(Math.round(dial.pos + flick), vel)
    }

    const onLost = (event: Event) => {
      event.preventDefault()
      const dialState = dialRef.current
      if (dialState) dialState.dragging = false
      drag = null
      bridgeRef.current.onContextLost()
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('webglcontextlost', onLost, false)
    return () => {
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('webglcontextlost', onLost, false)
    }
  }, [built, bridgeRef, camera, dialRef, gl, size.width])

  return (
    <>
      <primitive object={built.group} />
      <mesh ref={coreRef} position={[0, CORE_Y, 0]}>
        <sphereGeometry args={[1.45, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

function bandTexture(surface: string, bands: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, 256, 128)
    ctx.fillStyle = bands
    for (let i = 0; i < 9; i++) ctx.fillRect(0, 4 + i * 14, 256, i % 2 === 0 ? 4 : 2)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function Planet({ level, dim, fadeRef }: { level: LevelDef; dim: boolean; fadeRef: RefObject<number> }) {
  const map = useMemo(
    () => bandTexture(level.planet.surface, level.planet.bands),
    [level.planet.surface, level.planet.bands],
  )
  const surface = useRef<MeshBasicMaterial>(null)
  const air = useRef<MeshBasicMaterial>(null)
  const ring = useRef<MeshBasicMaterial>(null)
  useEffect(() => () => map.dispose(), [map])
  useFrame(() => {
    const fade = fadeRef.current ?? 1
    const bright = dim ? 0.45 : 1
    if (surface.current) {
      surface.current.opacity = fade
      surface.current.color.set(dim ? '#737373' : '#ffffff')
    }
    if (air.current) {
      air.current.opacity = 0.25 * bright * fade
      air.current.color.set(level.planet.atmosphere)
    }
    if (ring.current) {
      ring.current.opacity = 0.5 * bright * fade
      ring.current.color.set(level.planet.bands)
    }
  })
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1.1, 32, 20]} />
        <meshBasicMaterial ref={surface} map={map} transparent toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.18, 24, 16]} />
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
          <ringGeometry args={[1.5, 2.1, 40]} />
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
    </group>
  )
}

function Core({ level, reduce }: { level: LevelDef; reduce: boolean }) {
  const fadeRef = useRef(1)
  const born = useRef(0)
  const wrap = useRef<Group>(null)
  const status = getLevelStatus(level.id)
  const levelId = level.id
  useLayoutEffect(() => {
    born.current = performance.now()
    fadeRef.current = reduce ? 1 : 0
    wrap.current?.scale.setScalar(reduce ? 1 : 0.86)
  }, [levelId, reduce])
  useFrame(() => {
    const t = reduce ? 1 : Math.min(1, (performance.now() - born.current) / 300)
    fadeRef.current = t
    wrap.current?.scale.setScalar(reduce ? 1 : 0.86 + 0.14 * t)
  })
  return (
    <group ref={wrap} position={[0, CORE_Y, 0]}>
      <Planet level={level} dim={!status.unlocked} fadeRef={fadeRef} />
    </group>
  )
}

function Reticles() {
  const geos = useMemo(
    () => [new RingGeometry(1.25, 1.32, 48), new RingGeometry(2.05, 2.12, 64)],
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
      <Reticles />
      <DialRig dialRef={dialRef} bridgeRef={bridgeRef} />
      <Core level={level} reduce={reduce} />
      <ComingSoonAnchor bridgeRef={bridgeRef} />
    </>
  )
}

export function LevelDial({
  dialRef,
  bridgeRef,
  level,
  reduce,
  frameloop,
  canvasKey,
}: {
  dialRef: RefObject<DialState>
  bridgeRef: RefObject<MenuBridge>
  level: LevelDef
  reduce: boolean
  frameloop: 'always' | 'demand'
  canvasKey: number
}) {
  return (
    <Canvas
      key={canvasKey}
      className="absolute inset-0 touch-none"
      style={{ touchAction: 'none' }}
      dpr={CANVAS_DPR}
      frameloop={frameloop}
      gl={CANVAS_GL}
      camera={CANVAS_CAMERA}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0)
      }}
    >
      <Scene dialRef={dialRef} bridgeRef={bridgeRef} level={level} reduce={reduce} />
    </Canvas>
  )
}
