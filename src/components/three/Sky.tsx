import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { journey } from '../../lib/journey.ts'

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform vec3 uSunDir;
  uniform float uDusk;
  uniform float uTime;
  varying vec3 vDir;

  vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    // golden hour → lamp-lit twilight
    vec3 hor = mix(lin(vec3(1.0, 0.66, 0.36)), lin(vec3(0.86, 0.4, 0.3)), uDusk);
    vec3 mid = mix(lin(vec3(0.84, 0.42, 0.34)), lin(vec3(0.36, 0.15, 0.24)), uDusk);
    vec3 zen = mix(lin(vec3(0.3, 0.13, 0.2)), lin(vec3(0.06, 0.04, 0.1)), uDusk);
    vec3 col = mix(hor, mid, smoothstep(0.0, 0.2, h));
    col = mix(col, zen, smoothstep(0.12, 0.55, h));
    col = mix(col, hor * 0.55, smoothstep(0.0, -0.12, h));

    vec3 sunDir = normalize(uSunDir);
    float sd = max(dot(d, sunDir), 0.0);
    float sunUp = 1.0 - smoothstep(0.45, 0.95, uDusk);
    col += lin(vec3(1.0, 0.6, 0.3)) * pow(sd, 5.0) * (0.55 - 0.3 * uDusk);
    col += lin(vec3(1.0, 0.78, 0.5)) * pow(sd, 48.0) * 0.9 * sunUp;
    col += vec3(3.0, 2.3, 1.5) * smoothstep(0.99935, 0.9997, sd) * sunUp;

    // long, low streaks of cloud catching the last light
    vec2 uv = d.xz / max(h + 0.08, 0.04);
    float c = fbm(uv * vec2(0.35, 1.2) + vec2(uTime * 0.006, 0.0));
    float band = smoothstep(0.015, 0.09, h) * (1.0 - smoothstep(0.22, 0.45, h));
    float cl = smoothstep(0.52, 0.82, c) * band;
    vec3 cloud = mix(lin(vec3(1.0, 0.66, 0.46)), lin(vec3(0.62, 0.3, 0.34)), uDusk) * (0.75 + pow(sd, 2.0) * 1.1);
    col = mix(col, cloud, cl * 0.65);

    // first stars of the evening
    vec3 g = floor(d * 360.0);
    float s = hash(g.xy + g.z * 3.1);
    float star = step(0.9975, s) * smoothstep(0.12, 0.55, h) * smoothstep(0.55, 0.95, uDusk);
    star *= 0.6 + 0.4 * sin(uTime * 2.0 + s * 100.0);
    col += vec3(star) * 0.9;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

/** Hand-written sunset sky with drifting clouds and stars that appear as dusk falls */
export function Sky() {
  const mesh = useRef<THREE.Mesh>(null)
  const { scene } = useThree()
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: {
          uSunDir: { value: new THREE.Vector3(0.32, 0.075, -1) },
          uDusk: { value: 0 },
          uTime: { value: 0 },
        },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
    [],
  )
  const fogA = useMemo(() => new THREE.Color('#d98a58'), [])
  const fogB = useMemo(() => new THREE.Color('#5a2b30'), [])

  useLayoutEffect(() => {
    scene.fog = new THREE.FogExp2('#d98a58', 0.011)
    return () => {
      scene.fog = null
      mat.dispose()
    }
  }, [scene, mat])

  useFrame((state) => {
    const dusk = journey.dusk
    mat.uniforms.uDusk.value = dusk
    mat.uniforms.uTime.value = journey.reducedMotion ? 0 : state.clock.elapsedTime
    // the sun slips below the horizon as the story moves into evening
    mat.uniforms.uSunDir.value.set(0.32, 0.075 - dusk * 0.11, -1)
    if (mesh.current) mesh.current.position.copy(state.camera.position)
    if (scene.fog) {
      ;(scene.fog as THREE.FogExp2).color.copy(fogA).lerp(fogB, dusk)
      ;(scene.fog as THREE.FogExp2).density = 0.011 + dusk * 0.005
    }
  })

  return (
    <mesh ref={mesh} material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[180, 48, 24]} />
    </mesh>
  )
}

export const SUN_DIRECTION = new THREE.Vector3(0.32, 0.075, -1).normalize()
