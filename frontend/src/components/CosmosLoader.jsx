import React, { useRef, useEffect } from "react";
import * as THREE from "three";

export default function CosmosLoader({
  isActive = true,
  size = 64,
  color = "#00e5ff",
  className = "",
}) {
  const ref = useRef(null);
  const sceneRef = useRef(null);
  const frameId = useRef(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;

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

    // === Black hole (central singularity) ===
    const holeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const holeMat = new THREE.MeshBasicMaterial({
      color: 0x111111,
      transparent: true,
      opacity: 0.9,
    });
    const hole = new THREE.Mesh(holeGeo, holeMat);
    scene.add(hole);

    // === Accretion disk (glowing ring) ===
    const colorObj = new THREE.Color(color);
    const diskGeo = new THREE.RingGeometry(0.12, 0.25, 32);
    const diskMat = new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2;
    scene.add(disk);

    // === Star particles (twinkling) ===
    const particles = new THREE.Group();
    const particleCount = 12;
    const particleSpeeds = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.15 + Math.random() * 0.1;
      const geo = new THREE.SphereGeometry(0.015, 4, 4);
      const mat = new THREE.MeshBasicMaterial({
        color: colorObj,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const p = new THREE.Mesh(geo, mat);
      p.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      particles.add(p);
      particleSpeeds.push(0.5 + Math.random() * 0.5);
    }
    scene.add(particles);

    // === Outer glow (pulsing) ===
    const glowGeo = new THREE.RingGeometry(0.26, 0.3, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: colorObj,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = Math.PI / 2;
    scene.add(glow);

    // === Inner glow ring (extra depth) ===
    const innerGlowGeo = new THREE.RingGeometry(0.09, 0.13, 16);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#ffffff"),
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    innerGlow.rotation.x = Math.PI / 2;
    scene.add(innerGlow);

    sceneRef.current = { scene, camera, renderer, disk, glow, innerGlow, hole, particles, diskMat, glowMat, innerGlowMat, particleSpeeds };

    // Animation loop
    const animate = () => {
      const s = sceneRef.current;
      const time = Date.now() / 1000;

      // Rotate accretion disk
      s.disk.rotation.z = time * 0.5;

      // Pulsing outer glow
      const glowScale = 1 + Math.sin(time * 2.5) * 0.12;
      s.glow.scale.set(glowScale, glowScale, glowScale);
      s.glowMat.opacity = 0.2 + Math.sin(time * 1.5) * 0.1;

      // Inner glow counter-rotates
      s.innerGlow.rotation.z = -time * 0.35;
      s.innerGlowMat.opacity = 0.12 + Math.sin(time * 3) * 0.06;

      // Star particle twinkling
      s.particles.children.forEach((p, i) => {
        const twinkle = Math.sin(time * s.particleSpeeds[i] * 4 + i) * 0.15;
        p.scale.set(1 + twinkle, 1 + twinkle, 1);
        p.position.z = Math.sin(time * 0.4 + i) * 0.015;
      });

      // Central hole subtle rotation
      s.hole.rotation.y = time * 0.2;

      s.renderer.render(s.scene, s.camera);
      frameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (frameId.current) cancelAnimationFrame(frameId.current);

      if (sceneRef.current) {
        const { renderer, scene: s } = sceneRef.current;
        s.traverse((obj) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
        });
        renderer.dispose();
      }

      if (ref.current && ref.current.firstChild) {
        ref.current.removeChild(ref.current.firstChild);
      }
    };
  }, [isActive, size, color]);

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