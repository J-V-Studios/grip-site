import { Float, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh, Points } from "three";
import * as THREE from "three";

function AuroraOrb() {
	const mesh = useRef<Mesh>(null);
	const material = useMemo(
		() =>
			new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				uniforms: {
					uTime: { value: 0 },
					uA: { value: new THREE.Color("#89dceb") },
					uB: { value: new THREE.Color("#cba6f7") },
					uC: { value: new THREE.Color("#fab387") },
				},
				vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
				fragmentShader: /* glsl */ `
          precision highp float;
          varying vec2 vUv;
          uniform float uTime;
          uniform vec3 uA;
          uniform vec3 uB;
          uniform vec3 uC;
          void main() {
            vec2 p = vUv - 0.5;
            float d = length(p);
            float wave = sin(d * 14.0 - uTime * 1.4) * 0.5 + 0.5;
            vec3 col = mix(uA, uB, wave);
            col = mix(col, uC, smoothstep(0.15, 0.7, d + sin(uTime + vUv.x * 6.0) * 0.08));
            float alpha = smoothstep(0.55, 0.05, d) * 0.55;
            gl_FragColor = vec4(col, alpha);
          }
        `,
			}),
		[],
	);

	useFrame((_, delta) => {
		if (!mesh.current) return;
		material.uniforms.uTime.value += delta;
		mesh.current.rotation.z += delta * 0.05;
	});

	return (
		<Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.6}>
			<mesh ref={mesh} scale={3.2} material={material}>
				<planeGeometry args={[2.4, 2.4, 1, 1]} />
			</mesh>
		</Float>
	);
}

function ChillDust() {
	const points = useRef<Points>(null);
	const positions = useMemo(() => {
		const count = 180;
		const arr = new Float32Array(count * 3);
		for (let i = 0; i < count; i += 1) {
			arr[i * 3] = (Math.random() - 0.5) * 8;
			arr[i * 3 + 1] = (Math.random() - 0.5) * 5;
			arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
		}
		return arr;
	}, []);

	useFrame((_, delta) => {
		if (!points.current) return;
		points.current.rotation.y += delta * 0.04;
		points.current.rotation.x += delta * 0.015;
	});

	return (
		<points ref={points}>
			<bufferGeometry>
				<bufferAttribute attach="attributes-position" args={[positions, 3]} />
			</bufferGeometry>
			<pointsMaterial
				size={0.035}
				color="#89dceb"
				transparent
				opacity={0.65}
				depthWrite={false}
				sizeAttenuation
			/>
		</points>
	);
}

function Scene() {
	return (
		<>
			<ambientLight intensity={0.4} />
			<Stars
				radius={40}
				depth={30}
				count={900}
				factor={2.2}
				saturation={0}
				fade
				speed={0.4}
			/>
			<AuroraOrb />
			<ChillDust />
		</>
	);
}

/** Full-bleed R3F / Three.js vibe field behind the splash. */
export default function ChillField() {
	return (
		<div
			className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
			aria-hidden="true"
		>
			<Canvas
				dpr={[1, 1.5]}
				camera={{ position: [0, 0, 4.2], fov: 45 }}
				gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
				style={{ width: "100%", height: "100%", background: "transparent" }}
				onCreated={({ gl }) => {
					gl.setClearColor(0x000000, 0);
				}}
			>
				<Scene />
			</Canvas>
		</div>
	);
}
