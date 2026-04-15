"use client";

/**
 * HorizonCanvas — Three.js starfield + nebula + market-volatility mountain silhouettes.
 * Scroll-driven camera flight. Must be imported with next/dynamic { ssr: false }.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface HorizonCanvasProps {
  /** CSS hex accent colour (e.g. "#ff3c3c") — tints the nebula */
  accentColor?: string;
  /** Section narrative labels overlaid on scroll (unused in canvas, for external use) */
  sections?: string[];
  className?: string;
}

export default function HorizonCanvas({
  accentColor = "#ff3c3c",
  className = "",
}: HorizonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 2000 : 5000;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.00018);

    // ── Camera ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 20, 200);

    // ── Renderer ───────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isMobile,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.7;

    // ── Post-processing (dynamic import to stay tree-shakeable) ────────────
    let composer: import("three/examples/jsm/postprocessing/EffectComposer.js").EffectComposer | null = null;

    // Inline async setup — doesn't block render loop
    Promise.all([
      import("three/examples/jsm/postprocessing/EffectComposer.js"),
      import("three/examples/jsm/postprocessing/RenderPass.js"),
      import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
    ]).then(([{ EffectComposer }, { RenderPass }, { UnrealBloomPass }]) => {
      if (!renderer.domElement) return;
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        isMobile ? 0.5 : 0.9,
        0.4,
        0.82
      );
      composer.addPass(bloom);
    });

    // ── Helpers ────────────────────────────────────────────────────────────
    const hexToColor = (hex: string) => new THREE.Color(hex);

    // ── Stars ──────────────────────────────────────────────────────────────
    const starLayers: THREE.Points[] = [];
    for (let layer = 0; layer < 3; layer++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(starCount * 3);
      const col = new Float32Array(starCount * 3);
      const sz = new Float32Array(starCount);

      for (let j = 0; j < starCount; j++) {
        const r = 200 + Math.random() * 800;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        pos[j * 3] = r * Math.sin(phi) * Math.cos(theta);
        pos[j * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        pos[j * 3 + 2] = r * Math.cos(phi);

        const c = new THREE.Color();
        const t = Math.random();
        if (t < 0.65) c.setHSL(0, 0, 0.8 + Math.random() * 0.2);
        else if (t < 0.85) c.setHSL(0.05, 0.6, 0.85); // warm
        else c.setHSL(0.58, 0.5, 0.85); // cool blue

        col[j * 3] = c.r;
        col[j * 3 + 1] = c.g;
        col[j * 3 + 2] = c.b;
        sz[j] = Math.random() * 1.8 + 0.3;
      }

      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("size", new THREE.BufferAttribute(sz, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, depth: { value: layer } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          uniform float depth;
          void main() {
            vColor = color;
            vec3 p = position;
            float angle = time * 0.03 * (1.0 - depth * 0.3);
            float c = cos(angle), s = sin(angle);
            p.xy = vec2(c*p.x - s*p.y, s*p.x + c*p.y);
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = size * (280.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float a = 1.0 - smoothstep(0.0, 0.5, d);
            gl_FragColor = vec4(vColor, a);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
      });

      const points = new THREE.Points(geo, mat);
      scene.add(points);
      starLayers.push(points);
    }

    // ── Nebula ─────────────────────────────────────────────────────────────
    const nebulaGeo = new THREE.PlaneGeometry(6000, 3000, 80, 80);
    const accent = hexToColor(accentColor);
    const nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: accent },
        color2: { value: new THREE.Color(0x0a0a1a) },
        opacity: { value: 0.25 },
      },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += sin(p.x * 0.008 + time) * cos(p.y * 0.008 + time) * 15.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        uniform float time;
        varying vec2 vUv;
        void main() {
          float mix1 = sin(vUv.x * 8.0 + time * 0.4) * cos(vUv.y * 8.0 + time * 0.3);
          vec3 col = mix(color2, color1, clamp(mix1 * 0.5 + 0.35, 0.0, 1.0));
          float a = opacity * (1.0 - length(vUv - 0.5) * 2.2);
          gl_FragColor = vec4(col, max(a, 0.0));
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    nebula.position.z = -900;
    scene.add(nebula);

    // ── Market-volatility mountain silhouettes ─────────────────────────────
    const mountainLayers: THREE.Mesh[] = [];
    const mtLayers = [
      { z: -40,  h: 55,  color: 0x0e0e10, op: 1.0 },
      { z: -90,  h: 75,  color: 0x111116, op: 0.85 },
      { z: -150, h: 95,  color: 0x0d1020, op: 0.65 },
      { z: -220, h: 115, color: 0x0a0e28, op: 0.45 },
    ];

    mtLayers.forEach((layer) => {
      const pts: THREE.Vector2[] = [];
      const segs = 80;
      // Market-like jagged silhouette — mix multiple sine frequencies
      for (let i = 0; i <= segs; i++) {
        const x = (i / segs - 0.5) * 1200;
        const t = i / segs;
        const y =
          Math.sin(t * 6.28 * 2) * layer.h * 0.5 +
          Math.sin(t * 6.28 * 5 + 1.2) * layer.h * 0.3 +
          Math.sin(t * 6.28 * 11 + 2.4) * layer.h * 0.15 +
          Math.random() * layer.h * 0.08 -
          80;
        pts.push(new THREE.Vector2(x, y));
      }
      pts.push(new THREE.Vector2(6000, -400));
      pts.push(new THREE.Vector2(-6000, -400));

      const shape = new THREE.Shape(pts);
      const geo = new THREE.ShapeGeometry(shape);
      const mat = new THREE.MeshBasicMaterial({
        color: layer.color,
        transparent: true,
        opacity: layer.op,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = layer.z;
      mesh.position.y = layer.z * 0.4;
      mesh.userData = { baseZ: layer.z, baseY: layer.z * 0.4 };
      scene.add(mesh);
      mountainLayers.push(mesh);
    });

    // ── Atmosphere glow ────────────────────────────────────────────────────
    const atmGeo = new THREE.SphereGeometry(550, 32, 32);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float time;
        void main() {
          float i = pow(0.7 - dot(vNormal, vec3(0,0,1)), 2.0);
          vec3 atm = vec3(0.8, 0.2, 0.1) * i * (sin(time * 1.5) * 0.08 + 0.92);
          gl_FragColor = vec4(atm, i * 0.18);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // ── Smooth camera state ────────────────────────────────────────────────
    const smoothCam = { x: 0, y: 20, z: 200 };
    const targetCam = { x: 0, y: 20, z: 200 };

    // Camera positions for scroll sections
    const camPositions = [
      { x: 0, y: 20,  z: 200 },   // 0% — looking at horizon
      { x: 0, y: 35,  z: 40  },   // 50% — moving through
      { x: 0, y: 55,  z: -400 },  // 100% — deep space
    ];

    // ── Scroll handler ─────────────────────────────────────────────────────
    const handleScroll = () => {
      const progress = Math.min(
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight),
        1
      );
      const seg = progress * (camPositions.length - 1);
      const idx = Math.floor(seg);
      const t = seg - idx;
      const cur = camPositions[Math.min(idx, camPositions.length - 1)];
      const nxt = camPositions[Math.min(idx + 1, camPositions.length - 1)];

      targetCam.x = cur.x + (nxt.x - cur.x) * t;
      targetCam.y = cur.y + (nxt.y - cur.y) * t;
      targetCam.z = cur.z + (nxt.z - cur.z) * t;

      // Parallax mountains
      mountainLayers.forEach((m, i) => {
        const speed = 1 + i * 0.8;
        m.position.y = m.userData.baseY + window.scrollY * speed * 0.15;
      });
      nebula.position.y = window.scrollY * 0.06;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // ── Animation loop ─────────────────────────────────────────────────────
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      // Star rotation
      starLayers.forEach((s) => {
        if ((s.material as THREE.ShaderMaterial).uniforms) {
          (s.material as THREE.ShaderMaterial).uniforms.time.value = time;
        }
      });
      (nebulaMat as THREE.ShaderMaterial).uniforms.time.value = time * 0.5;
      (atmMat as THREE.ShaderMaterial).uniforms.time.value = time;

      // Smooth camera easing
      const k = 0.04;
      smoothCam.x += (targetCam.x - smoothCam.x) * k;
      smoothCam.y += (targetCam.y - smoothCam.y) * k;
      smoothCam.z += (targetCam.z - smoothCam.z) * k;

      camera.position.x = smoothCam.x + Math.sin(time * 0.08) * 1.5;
      camera.position.y = smoothCam.y + Math.cos(time * 0.12) * 0.8;
      camera.position.z = smoothCam.z;
      camera.lookAt(0, 8, -500);

      // Mountain micro-sway
      mountainLayers.forEach((m, i) => {
        m.position.x = Math.sin(time * 0.07 + i) * (1 + i * 0.4);
      });

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (composer) composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      starLayers.forEach((s) => {
        s.geometry.dispose();
        (s.material as THREE.Material).dispose();
      });
      mountainLayers.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      nebulaGeo.dispose();
      nebulaMat.dispose();
      atmGeo.dispose();
      atmMat.dispose();
      renderer.dispose();
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 h-full w-full ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
