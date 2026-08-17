'use client'

import { Model3dScreen } from './model-3d-screen'

export function Jerboa3dScreen() {
  return (
    <Model3dScreen
      modelSrc="/3d/Jerboa_Creature.glb"
      title="Jerboa"
      label="Jerboa"
      rotation={[0, Math.PI * 1.1, 0]}
    />
  )
}

export function Bird3dScreen() {
  return (
    <Model3dScreen
      modelSrc="/3d/Blue_Bird.glb"
      title="Blue Bird"
      label="the bird"
    />
  )
}
