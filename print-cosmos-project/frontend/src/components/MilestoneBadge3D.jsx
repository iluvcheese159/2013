import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DARK_THEME_LOGO_URL } from "@/components/BrandLogo";

const GOLD = 0xd4af37;
const RIBBON_PURPLE = 0xa855f7;

/**
 * Real, rotatable 3D reward — a gold medal (500 followers) or trophy
 * (1,000 followers), procedurally built in Three.js with the actual
 * Print Cosmos logo texture-mapped onto the face, same way a real medal
 * has an emblem stamped onto it. Built the same way as ModelViewer.jsx
 * (Three.js + OrbitControls) so it's fully rotatable from any angle.
 *
 * `kind`: "medal" | "trophy"
 *
 * Swap-in path for a real custom-sculpted logo model later: once you have
 * a real .glb/.stl of your logo, this component can be pointed at
 * <ModelViewer modelPath={...} /> instead — no other code needs to change.
 */
export default function MilestoneBadge3D({ kind = "medal" }) {
  const mountRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    /* eslint-disable */
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a0a");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, kind === "trophy" ? 10 : 0, 26);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(15, 20, 15);
    scene.add(key);
    const rim = new THREE.DirectionalLight(RIBBON_PURPLE, 0.6);
    rim.position.set(-15, -5, -10);
    scene.add(rim);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.4;
    controls.target.set(0, kind === "trophy" ? 3 : 0, 0);
    controls.update();

    const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.25 });
    const ribbonMat = new THREE.MeshStandardMaterial({ color: RIBBON_PURPLE, metalness: 0.1, roughness: 0.6 });

    const group = new THREE.Group();
    scene.add(group);

    let logoMesh = null;

    if (kind === "trophy") {
      // Base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 1.5, 48), goldMat);
      base.position.y = 0.75;
      group.add(base);
      // Stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 5, 32), goldMat);
      stem.position.y = 4;
      group.add(stem);
      // Cup (flared)
      const cupProfile = [
        new THREE.Vector2(2.2, 0),
        new THREE.Vector2(3.2, 0.5),
        new THREE.Vector2(3.6, 2.5),
        new THREE.Vector2(5.2, 7.5),
        new THREE.Vector2(5.6, 8),
      ];
      const cup = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 48), goldMat);
      cup.position.y = 7;
      group.add(cup);
      // Handles
      const handleGeo = new THREE.TorusGeometry(2, 0.35, 16, 32, Math.PI);
      const handleL = new THREE.Mesh(handleGeo, goldMat);
      handleL.position.set(-5.2, 11, 0);
      handleL.rotation.z = Math.PI / 2;
      group.add(handleL);
      const handleR = handleL.clone();
      handleR.position.x = 5.2;
      handleR.rotation.z = -Math.PI / 2;
      group.add(handleR);
      // Logo plaque on the base
      const plaqueGeo = new THREE.CircleGeometry(3.2, 48);
      logoMesh = new THREE.Mesh(plaqueGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.5 }));
      logoMesh.position.set(0, 1.52, 0);
      logoMesh.rotation.x = -Math.PI / 2;
      group.add(logoMesh);
    } else {
      // Medal: gold coin
      const coin = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 1.2, 64), goldMat);
      coin.rotation.x = Math.PI / 2;
      group.add(coin);
      const rimRing = new THREE.Mesh(new THREE.TorusGeometry(8, 0.5, 16, 64), goldMat);
      group.add(rimRing);
      // Logo face
      const plaqueGeo = new THREE.CircleGeometry(6.4, 64);
      logoMesh = new THREE.Mesh(plaqueGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.5 }));
      logoMesh.position.z = 0.65;
      group.add(logoMesh);
      // Ribbon
      const ribbonGeo = new THREE.BoxGeometry(2.2, 8, 0.4);
      const ribbonL = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbonL.position.set(-2, 10, -0.5);
      ribbonL.rotation.z = 0.15;
      group.add(ribbonL);
      const ribbonR = new THREE.Mesh(ribbonGeo, ribbonMat);
      ribbonR.position.set(2, 10, -0.5);
      ribbonR.rotation.z = -0.15;
      group.add(ribbonR);
    }

    new THREE.TextureLoader().load(
      DARK_THEME_LOGO_URL,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        if (logoMesh) {
          logoMesh.material.map = tex;
          logoMesh.material.color.set(0xffffff);
          logoMesh.material.needsUpdate = true;
        }
        setLoaded(true);
      },
      undefined,
      () => setLoaded(true)
    );

    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
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
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    /* eslint-enable */
  }, [kind]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-tech text-xs pointer-events-none">
          LOADING {kind === "trophy" ? "TROPHY" : "MEDAL"}...
        </div>
      )}
    </div>
  );
}
