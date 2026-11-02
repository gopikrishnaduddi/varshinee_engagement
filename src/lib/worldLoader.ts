import { hasWebGL } from './support.ts'

/** Begin fetching the heavy 3D bundle the moment the page starts, in parallel with React */
export const webglAvailable = hasWebGL()

export const worldModule = webglAvailable ? import('../components/three/World.tsx') : null
