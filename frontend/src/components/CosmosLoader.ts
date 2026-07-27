import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function CosmosLoader({
  isActive = true,
  size = 64,
  color = "#00e5ff",
  intensity = 1,
  className = "",
  operationType = "idle",
}: {
  isActive?: boolean;
  size?: number;
  color?: string;
  intensity?: number;
  className?: string;
  operationType?: "idle" | "load" | "render" | "export";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number>();
  const sceneRef = useRef<any>(null);

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

    // Operation-specific config
    const opConfig = {
      load: { speed: 3, particles: 12, coreColor: "#00ff9d" },
      render: { speed: 2, particles: 10, coreColor: "#9d00ff" },
      export: { speed: 1.5, particles: 12, coreColor: "#ff009d" },
      idle: { speed: 1.5, particles: 8, coreColor: color },
    }[operationType];

    const baseColor = new THREE.Color(color);
    const coreColor = new THREE.Color(opConfig.coreColor);

    // Core
    const coreGeo = new THREE.SphereGeometry(0.06 + intensity * 0.02, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      transparent: true,
      opacity: 0.6 + intensity * 0.3,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Primary ring
    const ringGeo = new THREE.RingGeometry(0.18, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Secondary halo
    const haloGeo = new THREE.RingGeometry(0.35, 0.42, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#4facfe"),
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = Math.PI / 2;
    scene.add(halo);

    // Particle field
    const particles = new THREE.Group();
    const particleSpeeds: number[] = [];
    for (let i = 0; i < opConfig.particles; i++) {
      const angle = (i / opConfig.particles) * Math.PI * 2;
      const radius = 0.22 + Math.sin(i * 0.5) * 0.05;
      const geo = new THREE.SphereGeometry(0.015, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#8ae6ff"),
        transparent: true,
        opacity: 0.6,
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      particles.add(p);
      particleSpeeds.push(0.5 + Math.random() * 0.5);
    }
    scene.add(particles);

    sceneRef.current = { scene, camera, renderer, core, ring, halo, particles, coreMat, ringMat, haloMat, particleSpeeds, opConfig };

    // Animation loop
    const animate = () => {
      animationFrame.current = requestAnimationFrame(animate);
      const s = sceneRef.current;
      const time = Date.now() / 1000;
      const speed = s.opConfig.speed * intensity;

      // Rotate ring
      s.ring.rotation.z = time * speed;

      // Core pulse
      const pulse = Math.sin(time * 3) * 0.1;
      s.core.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      s.coreMat.opacity = 0.6 + pulse * 0.4;

      // Halo counter-rotation
      s.halo.rotation.z = -time * 1.5;
      s.haloMat.opacity = 0.2 + Math.sin(time * 2) * 0.05;

      // Particle twinkling
      s.particles.children.forEach((p: any, i: number) => {
        p.position.x = Math.cos(i) * 0.22 + Math.sin(time + i) * 0.02;
        p.position.y = Math.sin(i) * 0.22 + Math.cos(time + i) * 0.02;
        const twinkle = Math.sin(time * s.particleSpeeds[i] * 3 + i) * 0.1;
        p.scale.set(1 + twinkle, 1 + twinkle, 1);
      });

      s.renderer.render(s.scene, s.camera);
    };
    animate();

    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      if (ref.current?.firstChild) ref.current.removeChild(ref.current.firstChild);
    };
  }, [isActive, size, color, intensity, operationType]);

  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    />
  );
}