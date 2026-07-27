import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function CosmosLoader({
  isActive = true,
  size = 64,
  color = "#00e5ff",
  intensity = 1,
  operationType = "idle",
  className = "",
}: {
  isActive?: boolean;
  size?: number;
  color?: string;
  intensity?: number;
  operationType?: "idle" | "load" | "render" | "export";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    core: THREE.Mesh;
    ring1: THREE.Mesh;
    ring2: THREE.Mesh;
    halo: THREE.Mesh;
    particles: THREE.Group;
    coreMat: THREE.MeshBasicMaterial;
    ring1Mat: THREE.MeshBasicMaterial;
    ring2Mat: THREE.MeshBasicMaterial;
    haloMat: THREE.MeshBasicMaterial;
  } | null>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    ref.current.appendChild(renderer.domElement);

    // Resolve operation-specific parameters
    const opConfig = {
      load: { speed: 4, particles: 15, segments: 32, coreColor: "#00ff9d" },
      render: { speed: 3, particles: 10, segments: 48, coreColor: "#9d00ff" },
      export: { speed: 2.5, particles: 12, segments: 64, coreColor: "#ff009d" },
      idle: { speed: 1.5, particles: 8, segments: 32, coreColor: color },
    }[operationType];

    const baseColor = new THREE.Color(color);
    const coreColor = new THREE.Color(opConfig.coreColor);

    // Core glowing sphere
    const coreGeo = new THREE.SphereGeometry(0.06 + intensity * 0.03, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.7 + intensity * 0.4,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Primary ring
    const ring1Geo = new THREE.RingGeometry(0.15, 0.22, opConfig.segments);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;
    scene.add(ring1);

    // Secondary ring (counter-rotating)
    const ring2Geo = new THREE.RingGeometry(0.28, 0.35, Math.round(opConfig.segments * 1.5));
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#4facfe"),
      transparent: true,
      opacity: 0.3 + intensity * 0.2,
      blending: THREE.AdditiveBlending,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2;
    scene.add(ring2);

    // Star particles
    const particles = new THREE.Group();
    const particlePositions: number[] = [];
    const particleSpeeds: number[] = [];
    for (let i = 0; i < opConfig.particles; i++) {
      const angle = (i / opConfig.particles) * Math.PI * 2;
      const radius = 0.3 + Math.sin(i * 0.3) * 0.05;
      const geo = new THREE.SphereGeometry(0.015, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#8ae6ff"),
        transparent: true,
        opacity: 0.6,
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      particles.add(p);
      particlePositions.push(angle, radius);
      particleSpeeds.push(0.5 + Math.random() * 0.5);
    }
    scene.add(particles);

    // Outer halo glow
    const haloGeo = new THREE.RingGeometry(0.42, 0.48, Math.round(opConfig.segments * 2));
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#00b0ff"),
      transparent: true,
      opacity: 0.2 + intensity * 0.2,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    scene.add(halo);

    sceneRef.current = {
      scene, camera, renderer,
      core, ring1, ring2, halo, particles,
      coreMat, ring1Mat, ring2Mat, haloMat,
    };

    // Animation loop — all state kept in closures, no React re-renders
    const animate = () => {
      animationFrame.current = requestAnimationFrame(animate);
      const s = sceneRef.current!;
      const time = Date.now() / 1000;
      const speed = opConfig.speed * intensity;

      // Rotate rings in opposite directions
      s.ring1.rotation.z = time * speed;
      s.ring2.rotation.z = -time * (speed * 1.2);

      // Core pulse
      const pulse = intensity * 0.3 * Math.sin(time * 2);
      const coreScale = 1 + pulse;
      s.core.scale.set(coreScale, coreScale, coreScale);
      s.coreMat.opacity = 0.7 + intensity * 0.4 + pulse * 0.5;

      // Secondary ring opacity
      s.ring2Mat.opacity = 0.3 + intensity * 0.2 + Math.sin(time * 1.5) * 0.05;

      // Particle twinkling
      s.particles.children.forEach((p, i) => {
        p.rotation.y = time * speed + i * 0.1;
        p.position.z = Math.sin(time * 0.5 + i) * 0.01;
        const twinkle = Math.sin(time * particleSpeeds[i % particleSpeeds.length] * 3 + i) * 0.08;
        p.scale.set(1 + twinkle, 1 + twinkle, 1);
      });

      // Halo glow
      s.haloMat.opacity = 0.2 + intensity * 0.2 + Math.sin(time * 0.8) * 0.1;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
      renderer.dispose();
      if (ref.current?.firstChild) ref.current.removeChild(ref.current.firstChild);
      sceneRef.current = null;
    };
  }, [isActive, size, color, intensity, operationType]);

  return (
    <div
      ref={ref}
      className={`inline-block ${className} cosmos-loader`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.3s ease",
        zIndex: isActive ? 9999 : -1,
        filter: isActive ? `brightness(${intensity})` : "none",
      }}
    />
  );
}