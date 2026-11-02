import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import {
  ceilingTextures,
  doorTextures,
  floorTextures,
  glowTexture,
  kolamTexture,
  sandstoneTextures,
  tierTextures,
  wallTextures,
} from './textures.ts'

export type TempleMaterials = ReturnType<typeof createMaterials>

function createMaterials() {
  const sand = sandstoneTextures(512)
  const wall = wallTextures()
  const floor = floorTextures()
  const door = doorTextures()
  const tier = tierTextures()
  floor.map.repeat.set(38, 38)
  floor.bump.repeat.set(38, 38)

  const stone = new THREE.MeshStandardMaterial({
    map: sand.map,
    bumpMap: sand.bump,
    bumpScale: 1.4,
    roughness: 0.84,
    metalness: 0,
    color: '#e2c3a0',
  })
  const walls = new THREE.MeshStandardMaterial({
    map: wall.map,
    bumpMap: wall.bump,
    bumpScale: 2,
    roughness: 0.92,
    color: '#a5805f',
  })
  const tiers = new THREE.MeshStandardMaterial({
    map: tier.map,
    bumpMap: tier.bump,
    bumpScale: 2.2,
    roughness: 0.88,
    color: '#e6c7a2',
  })
  const ground = new THREE.MeshStandardMaterial({
    map: floor.map,
    bumpMap: floor.bump,
    bumpScale: 1.2,
    roughness: 0.74,
    color: '#957454',
  })
  /** Antique temple-door gold: carved, slightly worn */
  const doorGold = new THREE.MeshStandardMaterial({
    map: door.map,
    bumpMap: door.bump,
    bumpScale: 3,
    metalness: 1,
    roughness: 0.3,
    color: '#ffffff',
    envMapIntensity: 1.7,
  })
  /** Polished brass for lamps, finials and studs */
  const brass = new THREE.MeshStandardMaterial({
    color: '#c9a35a',
    metalness: 1,
    roughness: 0.28,
    envMapIntensity: 1.2,
  })
  const darkBrass = new THREE.MeshStandardMaterial({ color: '#8d6a32', metalness: 1, roughness: 0.42 })
  const flame = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 2.1, 0.7), toneMapped: false })
  const ceiling = new THREE.MeshStandardMaterial({
    map: ceilingTextures(),
    roughness: 0.9,
    side: THREE.DoubleSide,
  })
  const kolam = new THREE.MeshStandardMaterial({
    map: kolamTexture(),
    transparent: true,
    roughness: 0.95,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  })
  const shadowStone = new THREE.MeshStandardMaterial({ color: '#2b1a12', roughness: 1 })
  const leaf = new THREE.MeshStandardMaterial({ color: '#4f7a2c', roughness: 0.62, side: THREE.DoubleSide })
  const marigold = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, flatShading: true })
  const jasmine = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.55,
    emissive: '#3a3226',
    flatShading: true,
  })
  const glow = glowTexture()

  /** stone, flowers and floor take only a little of the environment light, which dims as dusk falls */
  const matte = [stone, walls, tiers, ground, ceiling, kolam, leaf, marigold, jasmine]
  matte.forEach((m) => (m.envMapIntensity = 0.4))

  const textures = [sand.map, sand.bump, wall.map, wall.bump, floor.map, floor.bump, door.map, door.bump, tier.map, tier.bump, glow]
  const all = { stone, walls, tiers, ground, doorGold, brass, darkBrass, flame, ceiling, kolam, shadowStone, leaf, marigold, jasmine }
  return {
    ...all,
    matte,
    glow,
    dispose() {
      Object.values(all).forEach((m) => {
        ;(m as THREE.MeshStandardMaterial).map?.dispose()
        m.dispose()
      })
      textures.forEach((t) => t.dispose())
    },
  }
}

export function useTempleMaterials() {
  const mats = useMemo(createMaterials, [])
  useEffect(() => () => mats.dispose(), [mats])
  return mats
}
