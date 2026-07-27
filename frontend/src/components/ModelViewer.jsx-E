import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { fileUrl } from "@/lib/api";

export default function ModelViewer({ modelPath }) {
  const mountRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    /* eslint-disable */
    if (!modelPath) return;
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0a0a0a");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(50, 50, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    const grid = new THREE.GridHelper(100, 100, 0xA855F7, 0x444444);
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const url = fileUrl(modelPath);
    const ext = modelPath.split(".").pop().toLowerCase();

    let loadedObject = null;

    const fitCamera = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const dist = maxDim * 2.5;
      camera.position.set(dist, dist, dist);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    };

    if (ext === "stl") {
      const loader = new STLLoader();
      loader.load(
        url,
        (geom) => {
          geom.computeVertexNormals();
          const mat = new THREE.MeshStandardMaterial({ color: 0xA855F7, roughness: 0.6, metalness: 0.1 });
          const mesh = new THREE.Mesh(geom, mat);
          scene.add(mesh);
          loadedObject = mesh;
          fitCamera(mesh);
        },
        undefined,
        () => setError(true)
      );
    } else if (ext === "obj") {
      const loader = new OBJLoader();
      loader.load(
        url,
        (obj) => {
          obj.traverse((c) => {
            if (c.isMesh) {
              c.material = new THREE.MeshStandardMaterial({ color: 0xA855F7, roughness: 0.6, metalness: 0.1 });
            }
          });
          scene.add(obj);
          loadedObject = obj;
          fitCamera(obj);
        },
        undefined,
        () => setError(true)
      );
    } else {
      setError(true);
    }

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
      if (loadedObject) scene.remove(loadedObject);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
    /* eslint-enable */
  }, [modelPath]);

  if (!modelPath || error) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground font-tech text-xs">
        NO 3D MODEL
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full" />;
}
