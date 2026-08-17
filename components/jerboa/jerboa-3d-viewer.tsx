'use client'

import { Suspense, useLayoutEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Center, Clone, OrbitControls, useGLTF, useProgress } from '@react-three/drei'
import { Box3, Group, Vector3 } from 'three'

const MODEL_SRC = '/3d/Jerboa_Creature.glb'
const CAMERA_POSITION = new Vector3(0.5, 0.2, 1.0)
const CAMERA_FOV = 40

function viewHeightAtCamera() {
  const distance = CAMERA_POSITION.length()
  return 2 * Math.tan((CAMERA_FOV * Math.PI) / 360) * distance
}

function JerboaModel() {
  const { scene } = useGLTF(MODEL_SRC)
  const group = useRef<Group>(null)

  useLayoutEffect(() => {
    const root = group.current
    if (!root) return

    root.scale.setScalar(1)
    root.updateWorldMatrix(true, true)
    const height = new Box3().setFromObject(root).getSize(new Vector3()).y
    if (height <= 0) return

    root.scale.setScalar((viewHeightAtCamera() / height) * 0.9)
  }, [scene])

  return (
    <group ref={group}>
      <Center>
        <Clone object={scene} rotation={[0, Math.PI*1.1, 0]} />
      </Center>
    </group>
  )
}

export function Jerboa3dLoading() {
  const { active, progress } = useProgress()
  if (!active) return null
  return (
    <p className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 text-center text-lg font-bold text-purple text-shadow-soft">
      Loading Jerboa… {Math.round(progress)}%
    </p>
  )
}

export function Jerboa3dViewer() {
  return (
    <div className="relative h-full w-full">
      <Jerboa3dLoading />
      <Canvas
        className="h-full w-full touch-none"
        camera={{
          position: CAMERA_POSITION.toArray(),
          fov: CAMERA_FOV,
        }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.85} />
        <hemisphereLight args={['#fff4e0', '#8a6a4a', 0.7]} />
        <directionalLight position={[4, 8, 5]} intensity={1.35} />
        <directionalLight position={[-4, 2, -3]} intensity={0.35} />
        <Suspense fallback={null}>
          <JerboaModel />
        </Suspense>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          minDistance={1.4}
          maxDistance={9}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 1.55}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_SRC)
