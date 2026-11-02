import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import { journey } from '../../lib/journey.ts'
import { rng } from './textures.ts'

const vertex = /* glsl */ `
  attribute float aSeed;
  uniform vec3 uCam;
  uniform vec3 uBox;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    vec3 p = position * uBox;
    p += vec3(sin(uTime * 0.09 + aSeed * 6.28) * 0.7, uTime * (0.03 + aSeed * 0.05), cos(uTime * 0.07 + aSeed * 4.0) * 0.7);
    vec3 origin = uCam - uBox * 0.5;
    p = mod(p - origin, uBox) + origin;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float depth = max(0.2, -mv.z);
    gl_PointSize = clamp((0.012 + aSeed * 0.014) * uScale / depth, 1.0, 7.0);
    float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 30.0);
    // fade near the edges of the travelling volume and very close to the lens
    vec3 rel = (p - uCam) / (uBox * 0.5);
    float edge = 1.0 - smoothstep(0.7, 1.0, max(abs(rel.x), max(abs(rel.y), abs(rel.z))));
    vAlpha = twinkle * edge * smoothstep(0.3, 1.2, depth);
    gl_Position = projectionMatrix * mv;
  }
`
const fragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-d * d * 5.0) * vAlpha * uOpacity;
    gl_FragColor = vec4(vec3(1.0, 0.82, 0.5) * a, a);
  }
`

/** Fine motes of gold dust hanging in the warm air around the camera */
export function GoldDust({ count }: { count: number }) {
  const { size, camera } = useThree()
  const geo = useMemo(() => {
    const r = rng(77)
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(count * 3)
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      p[i * 3] = r()
      p[i * 3 + 1] = r()
      p[i * 3 + 2] = r()
      s[i] = r()
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1))
    return g
  }, [count])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uCam: { value: new THREE.Vector3() },
          uBox: { value: new THREE.Vector3(10, 6, 12) },
          uTime: { value: 0 },
          uScale: { value: 500 },
          uOpacity: { value: 0.9 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  useLayoutEffect(
    () => () => {
      geo.dispose()
      mat.dispose()
    },
    [geo, mat],
  )
  useFrame((state) => {
    const cam = camera as THREE.PerspectiveCamera
    mat.uniforms.uCam.value.copy(cam.position)
    if (!journey.reducedMotion) mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uScale.value = (size.height * state.viewport.dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2))
    mat.uniforms.uOpacity.value = 0.75 + journey.light * 0.8
  })
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={6} />
}
