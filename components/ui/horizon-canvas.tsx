"use client";

/**
 * HorizonCanvas — Three.js starfield + nebula + market-volatility mountain silhouettes.
 * Scroll-driven camera flight. Must be imported with next/dynamic { ssr: false }.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface HorizonCanvasProps {
  /** CSS hex accent colour (e.g. "#ff3c3c") — tints the nebula */
  accentColor?: string;
  /** Section narrative labels overlaid on scroll (unused in canvas, for external use) */
  sections?: string[];
  className?: string;
}

export default function HorizonCanvas({
  accentColor = "#6366F1",
  className = "",
}: HorizonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 2000 : 5000;

    const BG = 0x070710;

    // ── Scene ──────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.FogExp2(BG, 0.00018);

    // ── Camera ─────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(0, 18, 280);

    // ── Renderer ───────────────────────────────────────────────────────────
    // Opaque buffer + site-matched clear avoids alpha compositing glitches (white flashes on scroll, esp. Safari).
    // Bloom / EffectComposer removed — UnrealBloomPass routinely blows out highlights and flickers with fixed full-viewport canvases.
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: !isMobile,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
    renderer.setClearColor(BG, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isMobile ? 0.5 : 0.58;

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
        opacity: { value: 0.38 },
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
    const ridgeLines: THREE.Line[] = [];
    const accentRGB = hexToColor(accentColor);

    // Deterministic noise — no Math.random() in mountain shape (stable across renders)
    const deterministicNoise = (i: number, seed: number) =>
      Math.sin(i * 17.3 + seed) * 0.5 + Math.sin(i * 31.7 + seed * 2) * 0.3;

    const mtLayers = [
      { z: -40,  h: 80,  color: 0x1a1020, op: 1.0,  ridgeOp: 0.55, ridgeColor: accentRGB },
      { z: -90,  h: 105, color: 0x16112a, op: 0.90, ridgeOp: 0.40, ridgeColor: accentRGB },
      { z: -160, h: 130, color: 0x0f0e22, op: 0.70, ridgeOp: 0.25, ridgeColor: accentRGB },
      { z: -240, h: 155, color: 0x0a0d1e, op: 0.50, ridgeOp: 0.15, ridgeColor: accentRGB },
    ];

    mtLayers.forEach((layer, li) => {
      const pts: THREE.Vector2[] = [];
      const linePts3: THREE.Vector3[] = [];
      const segs = 120;
      for (let i = 0; i <= segs; i++) {
        const x = (i / segs - 0.5) * 1600;
        const t = i / segs;
        const y =
          Math.sin(t * 6.28 * 2 + li) * layer.h * 0.55 +
          Math.sin(t * 6.28 * 5 + 1.2 + li * 0.7) * layer.h * 0.30 +
          Math.sin(t * 6.28 * 12 + 2.4 + li * 1.1) * layer.h * 0.12 +
          deterministicNoise(i, li * 3.7) * layer.h * 0.09 -
          60;
        pts.push(new THREE.Vector2(x, y));
        linePts3.push(new THREE.Vector3(x, y, 0));
      }
      pts.push(new THREE.Vector2(8000, -500));
      pts.push(new THREE.Vector2(-8000, -500));

      // Filled silhouette
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
      mesh.position.y = layer.z * 0.35;
      mesh.userData = { baseZ: layer.z, baseY: layer.z * 0.35 };
      scene.add(mesh);
      mountainLayers.push(mesh);

      // Glowing ridge line on top of each mountain
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts3);
      const ridgeColor = new THREE.Color(accentColor);
      const lineMat = new THREE.LineBasicMaterial({
        color: ridgeColor,
        transparent: true,
        opacity: layer.ridgeOp,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ridge = new THREE.Line(lineGeo, lineMat);
      ridge.position.z = layer.z + 0.5;
      ridge.position.y = mesh.position.y;
      ridge.userData = { baseY: mesh.position.y };
      scene.add(ridge);
      ridgeLines.push(ridge);
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
          vec3 atm = vec3(0.38, 0.40, 0.95) * i * (sin(time * 1.5) * 0.08 + 0.92);
          gl_FragColor = vec4(atm, i * 0.18);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    scene.add(new THREE.Mesh(atmGeo, atmMat));

    // ── Smooth camera state ────────────────────────────────────────────────
    const smoothCam = { x: 0, y: 18, z: 280 };
    const targetCam = { x: 0, y: 18, z: 280 };

    // Camera positions for scroll sections — more dramatic z travel
    const camPositions = [
      { x: 0, y: 18,  z: 280  },  // 0% — wide view of mountains
      { x: -8, y: 38, z: 80   },  // 50% — gliding over ridge
      { x: 5,  y: 65, z: -500 },  // 100% — deep space above
    ];

    // ── Scroll handler (coalesced to one update per frame — reduces GPU/main-thread jank / perceived flicker) ──
    let scrollRaf = 0;
    const applyScroll = () => {
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

      mountainLayers.forEach((m, i) => {
        const speed = 1 + i * 0.8;
        m.userData.scrollOffsetY = window.scrollY * speed * 0.15;
      });
      ridgeLines.forEach((r, i) => {
        const speed = 1 + i * 0.8;
        r.userData.scrollOffsetY = window.scrollY * speed * 0.15;
      });
      nebula.position.y = window.scrollY * 0.08;
    };

    const handleScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        applyScroll();
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    applyScroll();

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

      // Mountain micro-sway + scroll parallax + breathing opacity
      mountainLayers.forEach((m, i) => {
        const swayX = Math.sin(time * 0.05 + i * 1.3) * (2 + i * 0.6);
        const swayY = Math.sin(time * 0.09 + i * 0.7) * 2.5;
        const scrollOff = (m.userData.scrollOffsetY as number) ?? 0;
        m.position.x = swayX;
        m.position.y = m.userData.baseY + swayY + scrollOff;
        const mat = m.material as THREE.MeshBasicMaterial;
        const baseOp = [1.0, 0.90, 0.70, 0.50][i] ?? 0.5;
        mat.opacity = baseOp + Math.sin(time * 0.18 + i * 0.9) * 0.08;
      });
      ridgeLines.forEach((r, i) => {
        const swayX = Math.sin(time * 0.05 + i * 1.3) * (2 + i * 0.6);
        const swayY = Math.sin(time * 0.09 + i * 0.7) * 2.5;
        const scrollOff = (r.userData.scrollOffsetY as number) ?? 0;
        r.position.x = swayX;
        r.position.y = r.userData.baseY + swayY + scrollOff;
        const mat = r.material as THREE.LineBasicMaterial;
        const baseOp = [0.55, 0.40, 0.25, 0.15][i] ?? 0.2;
        mat.opacity = baseOp + Math.sin(time * 0.22 + i) * 0.12;
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ─────────────────────────────────────────────────────────────
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
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
      ridgeLines.forEach((r) => {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
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
      style={{ zIndex: 0, background: "#070710" }}
    />
  );
}
