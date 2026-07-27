import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * MoonViewer — 360° rotatable, zoomable moon viewer.
 * 
 * INTERNAL LORE (NEVER show to users):
 * The moon is secretly Steven's hideout. What looks like villainy started as
 * a simple game of tag between friends that's since escalated. A bright green
 * star elsewhere in the sky is a future entry point into a mini-game where Bob
 * and Steven team up to find their long-lost friend John.
 * 
 * CONTENT PLACEHOLDER: Swap this entire component's content for real
 * Steven/moon-interior 3D content and the green-star mini-game when ready.
 * Look for "TODO: SWAP IN REAL STEVEN/MOON CONTENT" markers below.
 */
export default function MoonViewer({ isOpen, onClose }) {
  const mountRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen || !mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050510");

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Lighting — dramatic moon glow
    const ambient = new THREE.AmbientLight(0x222244, 0.4);
    scene.add(ambient);
    const moonLight = new THREE.DirectionalLight(0xccddff, 1.5);
    moonLight.position.set(5, 3, 5);
    scene.add(moonLight);
    const rimLight = new THREE.DirectionalLight(0x4466aa, 0.3);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // TODO: SWAP IN REAL STEVEN/MOON CONTENT
    // Replace this placeholder sphere with the actual moon interior model,
    //Steven's hideout geometry, and any interactive elements.
    const moonGeo = new THREE.SphereGeometry(2, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.9,
      metalness: 0.0,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // Surface texture placeholder — craters (simple bump map)
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    // Base gray
    ctx.fillStyle = "#aaaaaa";
    ctx.fillRect(0, 0, 1024, 512);
    // Craters
    const craters = [
      [200, 150, 40], [600, 200, 55], [350, 350, 30],
      [800, 120, 25], [150, 400, 35], [500, 450, 45],
      [750, 350, 20], [300, 100, 15], [900, 280, 50],
      [450, 250, 12], [650, 150, 18], [100, 250, 22],
    ];
    craters.forEach(([x, y, r]) => {
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "#555555");
      grad.addColorStop(1, "#aaaaaa");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    const texture = new THREE.CanvasTexture(canvas);
    moonMesh.material.map = texture;
    moonMesh.material.needsUpdate = true;

    // Orbit controls for drag-to-rotate and zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mounted) return;
      const w = mount.clientWidth || 600;
      const h = mount.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      texture.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-2xl border border-border shadow-2xl p-4 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close moon viewer"
        >
          ✕
        </button>

        {/* Viewer container */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black">
          {error ? (
            <div className="flex items-center justify-center h-full text-muted-foreground font-tech text-sm">
              MOON VIEWER UNAVAILABLE
            </div>
          ) : (
            <div ref={mountRef} className="w-full h-full" />
          )}
        </div>

        {/* Placeholder content info — swap this for real mission/mission info */}
        {/* TODO: SWAP IN REAL STEVEN/MOON CONTENT */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs font-tech uppercase tracking-wider text-muted-foreground">
            Moon Surface — Drag to orbit, scroll to zoom
          </div>
        </div>
      </div>
    </div>
  );
}
