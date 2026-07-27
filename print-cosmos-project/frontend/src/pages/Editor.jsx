import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Undo2,
  Redo2,
  Lightbulb,
  Upload,
  Download,
  Send,
  Home,
  Frame,
  ZoomIn,
  ZoomOut,
  Cuboid,
  Box,
  Circle,
  Cylinder,
  Cone,
  Shield,
  Layers,
  Group,
  Ungroup,
  AlignLeft,
  FlipHorizontal,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const TAB_ORDER = ["HOLES", "BASIC", "STARTERS", "HARDWARE", "CREATURES", "GENERATORS"];

const SHAPE_LIBRARY = {
  HOLES: [
    { key: "box-hole", label: "Box Hole", base: "box", hole: true },
    { key: "cylinder-hole", label: "Cylinder Hole", base: "cylinder", hole: true },
  ],
  BASIC: [
    { key: "box", label: "Box/Cube", base: "box" },
    { key: "cylinder", label: "Cylinder", base: "cylinder" },
    { key: "sphere", label: "Sphere", base: "sphere" },
    { key: "scribble", label: "Scribble", base: "scribble" },
    { key: "roof", label: "Roof", base: "roof" },
    { key: "cone", label: "Cone", base: "cone" },
    { key: "round-roof", label: "Round Roof", base: "roundRoof" },
    { key: "text", label: "Text Engine", base: "text" },
    { key: "wedge", label: "Wedge", base: "wedge" },
    { key: "pyramid", label: "Pyramid", base: "pyramid" },
    { key: "half-sphere", label: "Half Sphere", base: "halfSphere" },
    { key: "torus", label: "Torus", base: "torus" },
    { key: "tube", label: "Tube", base: "tube" },
    { key: "heart", label: "Heart", base: "heart" },
    { key: "star", label: "Star", base: "star" },
    { key: "yellow-star", label: "Yellow Star", base: "yellowStar" },
    { key: "icosahedron", label: "Icosahedron", base: "icosahedron" },
    { key: "ring", label: "Ring", base: "ring" },
    { key: "dice", label: "Dice", base: "dice" },
    { key: "diamond", label: "Diamond", base: "diamond" },
  ],
  STARTERS: [
    { key: "connector-ball", label: "Connector Ball", base: "sphere" },
    { key: "connector-socket", label: "Connector Socket", base: "tube" },
    { key: "connector-pivot", label: "Connector Pivot", base: "cylinder" },
    ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c) => ({ key: `letter-${c}`, label: `Letter ${c}`, base: "text" })),
    ..."0123456789".split("").map((c) => ({ key: `num-${c}`, label: `Number ${c}`, base: "text" })),
  ],
  HARDWARE: [
    { key: "gear", label: "Gear", base: "gear" },
    { key: "wheel", label: "Wheel", base: "torus" },
    { key: "threaded-screw", label: "Threaded Screw", base: "threaded" },
    { key: "nut", label: "Nut", base: "tube" },
    { key: "bolt", label: "Bolt", base: "threaded" },
    { key: "axle", label: "Axle", base: "cylinder" },
    { key: "hinge", label: "Hinge", base: "hinge" },
    { key: "bracket", label: "Bracket", base: "bracket" },
  ],
  CREATURES: [
    { key: "chicken-foot", label: "Chicken Foot", base: "star" },
    { key: "egg", label: "Egg", base: "sphere" },
    { key: "mustache", label: "Mustache", base: "heart" },
    { key: "wall-section", label: "Wall Section", base: "box" },
    { key: "doorway", label: "Doorway", base: "archway" },
    { key: "window-frame", label: "Window Frame", base: "ring" },
    { key: "archway", label: "Archway", base: "archway" },
    { key: "tree", label: "Tree", base: "tree" },
    { key: "fence", label: "Fence", base: "box" },
  ],
  GENERATORS: [
    { key: "curve-extruder", label: "Custom Curve Extruder", base: "extrude", proOnly: true },
    { key: "thread-spring", label: "Thread/Spring Generator", base: "threaded", proOnly: true },
    { key: "meta-ball", label: "Meta-Ball Mesh", base: "sphere", proOnly: true },
    { key: "voronoi", label: "Voronoi Pattern Generator", base: "icosahedron", proOnly: true },
  ],
};

const DEFAULT_COLOR = "#f59e0b";
const HOLE_COLOR = "#7dd3fc";

// Starter templates shown when opening a brand-new design, so people start
// from a real composition instead of one blank cube. Each shape here uses
// the exact same base primitives already in SHAPE_LIBRARY (box, cone, tube,
// text, etc.) — nothing fake, just a sensible pre-arranged starting point
// that's fully editable afterward like any other shape.
const TEMPLATES = [
  {
    id: "blank",
    label: "Blank Canvas",
    description: "Start from a single box, like before.",
    shapes: [{ key: "box", label: "Box", base: "box", position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }],
  },
  {
    id: "phone-stand",
    label: "Phone Stand",
    description: "Base, angled back support, front lip.",
    shapes: [
      { key: "box", label: "Base", base: "box", position: [0, 0.2, 0], rotation: [0, 0, 0], scale: [4, 0.4, 3] },
      { key: "roof", label: "Back Support", base: "roof", position: [0, 1.6, -1.1], rotation: [0.35, 0, 0], scale: [4, 2.2, 0.5] },
      { key: "box", label: "Front Lip", base: "box", position: [0, 0.55, 0.9], rotation: [0, 0, 0], scale: [4, 0.7, 0.4] },
    ],
  },
  {
    id: "keychain",
    label: "Keychain",
    description: "Flat tag with a ring hole at the top.",
    shapes: [
      { key: "box", label: "Tag", base: "box", position: [0, 1.25, 0], rotation: [0, 0, 0], scale: [0.15, 2.5, 1.4] },
      { key: "ring", label: "Ring Hole", base: "ring", hole: true, position: [0, 2.5, 0], rotation: [0, 0, 0], scale: [0.7, 0.7, 0.3] },
    ],
  },
  {
    id: "plant-pot",
    label: "Plant Pot",
    description: "Tapered body with a rim.",
    shapes: [
      { key: "cone", label: "Pot Body", base: "cone", position: [0, 1, 0], rotation: [Math.PI, 0, 0], scale: [3, 2, 3] },
      { key: "ring", label: "Rim", base: "ring", position: [0, 2, 0], rotation: [Math.PI / 2, 0, 0], scale: [3.2, 3.2, 0.3] },
    ],
  },
  {
    id: "organizer",
    label: "Organizer",
    description: "Tray base with 3 dividers.",
    shapes: [
      { key: "box", label: "Base", base: "box", position: [0, 0.2, 0], rotation: [0, 0, 0], scale: [6, 0.4, 4] },
      { key: "box", label: "Divider", base: "box", position: [-1.5, 0.9, 0], rotation: [0, 0, 0], scale: [0.15, 1, 3.6] },
      { key: "box", label: "Divider", base: "box", position: [0, 0.9, 0], rotation: [0, 0, 0], scale: [0.15, 1, 3.6] },
      { key: "box", label: "Divider", base: "box", position: [1.5, 0.9, 0], rotation: [0, 0, 0], scale: [0.15, 1, 3.6] },
    ],
  },
  {
    id: "desk-tray",
    label: "Desk Tray",
    description: "Flat base with 4 raised walls.",
    shapes: [
      { key: "box", label: "Base", base: "box", position: [0, 0.15, 0], rotation: [0, 0, 0], scale: [6, 0.3, 4] },
      { key: "box", label: "Front Wall", base: "box", position: [0, 0.55, 1.9], rotation: [0, 0, 0], scale: [6, 0.8, 0.2] },
      { key: "box", label: "Back Wall", base: "box", position: [0, 0.55, -1.9], rotation: [0, 0, 0], scale: [6, 0.8, 0.2] },
      { key: "box", label: "Left Wall", base: "box", position: [-2.9, 0.55, 0], rotation: [0, 0, 0], scale: [0.2, 0.8, 4] },
      { key: "box", label: "Right Wall", base: "box", position: [2.9, 0.55, 0], rotation: [0, 0, 0], scale: [0.2, 0.8, 4] },
    ],
  },
  {
    id: "cookie-cutter",
    label: "Cookie Cutter",
    description: "Thin circular cutting wall.",
    shapes: [{ key: "tube", label: "Cutter Wall", base: "tube", position: [0, 1, 0], rotation: [Math.PI / 2, 0, 0], scale: [4, 4, 0.15] }],
  },
  {
    id: "dice-tower",
    label: "Dice Tower",
    description: "Funnel, shaft, and landing tray.",
    shapes: [
      { key: "cone", label: "Funnel", base: "cone", position: [0, 4, 0], rotation: [Math.PI, 0, 0], scale: [2, 1.5, 2] },
      { key: "box", label: "Shaft", base: "box", position: [0, 2, 0], rotation: [0, 0, 0], scale: [1.2, 3, 1.2] },
      { key: "box", label: "Landing Tray", base: "box", position: [0, 0.15, 0], rotation: [0, 0, 0], scale: [2.5, 0.3, 2] },
    ],
  },
  {
    id: "lithophane",
    label: "Lithophane",
    description: "Thin flat panel to sculpt an image into.",
    shapes: [{ key: "box", label: "Panel", base: "box", position: [0, 1.5, 0], rotation: [0, 0, 0], scale: [4, 3, 0.08] }],
  },
  {
    id: "sign",
    label: "Sign",
    description: "Backing plate with a text layer.",
    shapes: [
      { key: "box", label: "Backing", base: "box", position: [0, 1.5, 0], rotation: [0, 0, 0], scale: [5, 3, 0.2] },
      { key: "text", label: "Text", base: "text", position: [0, 1.5, 0.2], rotation: [0, 0, 0], scale: [3, 1, 0.15] },
    ],
  },
  {
    id: "name-plate",
    label: "Name Plate",
    description: "Desk-sized backing with a text layer.",
    shapes: [
      { key: "box", label: "Backing", base: "box", position: [0, 0.4, 0], rotation: [0, 0, 0], scale: [3, 0.8, 0.15] },
      { key: "text", label: "Text", base: "text", position: [0, 0.4, 0.15], rotation: [0, 0, 0], scale: [2.2, 0.4, 0.1] },
    ],
  },
];

function makeGeometry(base) {
  switch (base) {
    case "box": return new THREE.BoxGeometry(1, 1, 1);
    case "sphere": return new THREE.SphereGeometry(0.5, 32, 24);
    case "cylinder": return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    case "cone": return new THREE.ConeGeometry(0.5, 1, 32);
    case "roof": return new THREE.ConeGeometry(0.7, 1, 4);
    case "roundRoof": return new THREE.CylinderGeometry(0.5, 0.5, 1, 24, 1, false, 0, Math.PI);
    case "wedge": return new THREE.CylinderGeometry(0, 0.65, 1, 4);
    case "pyramid": return new THREE.ConeGeometry(0.65, 1, 4);
    case "halfSphere": return new THREE.SphereGeometry(0.5, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    case "torus": return new THREE.TorusGeometry(0.5, 0.2, 18, 48);
    case "tube": return new THREE.TorusGeometry(0.5, 0.1, 18, 48);
    case "heart": {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0.25);
      shape.bezierCurveTo(0, 0.55, -0.4, 0.55, -0.4, 0.2);
      shape.bezierCurveTo(-0.4, -0.05, -0.1, -0.2, 0, -0.45);
      shape.bezierCurveTo(0.1, -0.2, 0.4, -0.05, 0.4, 0.2);
      shape.bezierCurveTo(0.4, 0.55, 0, 0.55, 0, 0.25);
      return new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03 });
    }
    case "star": return new THREE.OctahedronGeometry(0.6, 0);
    case "yellowStar": return new THREE.OctahedronGeometry(0.6, 1);
    case "icosahedron": return new THREE.IcosahedronGeometry(0.6, 0);
    case "ring": return new THREE.TorusGeometry(0.45, 0.12, 18, 48);
    case "dice": return new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
    case "diamond": return new THREE.OctahedronGeometry(0.7, 0);
    case "gear": return new THREE.CylinderGeometry(0.55, 0.55, 0.25, 16);
    case "threaded": return new THREE.CylinderGeometry(0.2, 0.2, 1.2, 20);
    case "hinge": return new THREE.BoxGeometry(0.8, 0.2, 0.3);
    case "bracket": return new THREE.BoxGeometry(0.8, 0.8, 0.2);
    case "archway": return new THREE.TorusGeometry(0.5, 0.15, 12, 24, Math.PI);
    case "tree": return new THREE.ConeGeometry(0.5, 1.2, 8);
    case "scribble":
    case "text":
    case "extrude":
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function getMouseButtons() {
  return {
    LEFT: null,
    MIDDLE: THREE.MOUSE.PAN,
    RIGHT: THREE.MOUSE.ROTATE,
  };
}

function ThreeCanvas({
  objects,
  selectedIds,
  onSelect,
  onObjectTransform,
  mode,
  snap,
  isPerspective,
  sceneApiRef,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scene: null,
    camera: null,
    orthoCamera: null,
    activeCamera: null,
    renderer: null,
    controls: null,
    transform: null,
    meshes: new Map(),
    imported: new Map(),
    raycaster: null,
    pointer: new THREE.Vector2(),
    defaultPos: new THREE.Vector3(9, 8, 9),
    handleGroup: null,
    shiftScale: false,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f1014");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3000);
    camera.position.set(9, 8, 9);
    const frustum = 12;
    const ortho = new THREE.OrthographicCamera(
      (-frustum * width) / height,
      (frustum * width) / height,
      frustum,
      -frustum,
      0.1,
      3000,
    );
    ortho.position.copy(camera.position);
    ortho.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(6, 10, 8);
    scene.add(key);

    const grid = new THREE.GridHelper(80, 80, 0x5c5f6a, 0x2a2d35);
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.mouseButtons = getMouseButtons();
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controls.target.set(0, 0, 0);

    const preventContextMenu = (e) => e.preventDefault();
    renderer.domElement.addEventListener("contextmenu", preventContextMenu);

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setMode("translate");
    transform.setSpace("world");
    transform.setTranslationSnap(1);
    transform.setScaleSnap(0.1);
    transform.setRotationSnap(THREE.MathUtils.degToRad(5));
    const onTransformDraggingChanged = (event) => {
      controls.enabled = !event.value;
    };
    const onTransformObjectChange = () => {
      const object = transform.object;
      if (!object || object.userData.id == null) return;
      const patch = {
        position: [object.position.x, object.position.y, object.position.z],
        rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
        scale: [object.scale.x, object.scale.y, object.scale.z],
      };
      if (transform.mode === "scale" && stateRef.current.shiftScale) {
        const uniform = Math.max(patch.scale[0], patch.scale[1], patch.scale[2]);
        patch.scale = [uniform, uniform, uniform];
      }
      onObjectTransform?.(object.userData.id, patch);
    };
    transform.addEventListener("dragging-changed", onTransformDraggingChanged);
    transform.addEventListener("objectChange", onTransformObjectChange);
    const transformHelper = typeof transform.getHelper === "function" ? transform.getHelper() : transform;
    scene.add(transformHelper);

    const handleGroup = new THREE.Group();
    handleGroup.visible = false;
    scene.add(handleGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // Free drag state (Tinkercad-style body drag on the ground plane)
    const dragState = {
      active: false,
      mesh: null,
      plane: new THREE.Plane(),
      offset: new THREE.Vector3(),
      intersection: new THREE.Vector3(),
      moved: false,
      pointerId: null,
    };

    const getPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (event) => {
      // Only left-click drives selection + drag. Right/middle stays for orbit/pan.
      if (event.button !== 0) return;
      getPointer(event);
      const activeCamera = stateRef.current.activeCamera;
      raycaster.setFromCamera(pointer, activeCamera);
      const meshes = Array.from(stateRef.current.meshes.values()).concat(Array.from(stateRef.current.imported.values()));
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length) {
        // Find the top-level tracked mesh (in case of imported groups)
        let target = intersects[0].object;
        while (target && target.userData.id == null && target.parent) target = target.parent;
        const id = target?.userData?.id;
        if (id == null) return;

        onSelect(id, event.shiftKey);

        // Set up ground-plane drag at the mesh's current Y level
        dragState.active = true;
        dragState.mesh = target;
        dragState.moved = false;
        dragState.pointerId = event.pointerId;
        dragState.plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), target.position.clone());
        raycaster.ray.intersectPlane(dragState.plane, dragState.intersection);
        dragState.offset.copy(dragState.intersection).sub(target.position);
        stateRef.current.controls.enabled = false;
        try { renderer.domElement.setPointerCapture(event.pointerId); } catch { /* ignore */ }
      } else {
        onSelect(null, false);
      }
    };

    const onPointerMove = (event) => {
      if (!dragState.active || !dragState.mesh) return;
      getPointer(event);
      raycaster.setFromCamera(pointer, stateRef.current.activeCamera);
      if (raycaster.ray.intersectPlane(dragState.plane, dragState.intersection)) {
        const next = dragState.intersection.clone().sub(dragState.offset);
        dragState.mesh.position.x = next.x;
        dragState.mesh.position.z = next.z;
        dragState.moved = true;
      }
    };

    const onPointerUp = (event) => {
      if (!dragState.active) return;
      try { renderer.domElement.releasePointerCapture(dragState.pointerId); } catch { /* ignore */ }
      // Commit position to React state so it persists across re-renders
      if (dragState.moved && dragState.mesh?.userData?.id != null) {
        const m = dragState.mesh;
        onObjectTransform?.(m.userData.id, {
          position: [m.position.x, m.position.y, m.position.z],
          rotation: [m.rotation.x, m.rotation.y, m.rotation.z],
          scale: [m.scale.x, m.scale.y, m.scale.z],
        });
      }
      dragState.active = false;
      dragState.mesh = null;
      dragState.moved = false;
      dragState.pointerId = null;
      stateRef.current.controls.enabled = true;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    stateRef.current = {
      ...stateRef.current,
      scene,
      camera,
      orthoCamera: ortho,
      activeCamera: camera,
      renderer,
      controls,
      transform,
      meshes: new Map(),
      imported: new Map(),
      raycaster,
      pointer,
      handleGroup,
      dragState,
    };

    const onModifier = (e) => {
      stateRef.current.shiftScale = e.shiftKey;
    };
    window.addEventListener("keydown", onModifier);
    window.addEventListener("keyup", onModifier);

    if (sceneApiRef) {
      sceneApiRef.current = {
        homeView: () => {
          const s = stateRef.current;
          s.activeCamera.position.copy(s.defaultPos);
          s.controls.target.set(0, 0, 0);
          s.activeCamera.lookAt(0, 0, 0);
          s.controls.update();
        },
        fitInView: () => {
          const s = stateRef.current;
          const all = Array.from(s.meshes.values()).concat(Array.from(s.imported.values()));
          if (!all.length) return;
          const box = new THREE.Box3();
          all.forEach((m) => box.expandByObject(m));
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const distance = maxDim * 2.2;
          s.activeCamera.position.set(center.x + distance, center.y + distance, center.z + distance);
          s.controls.target.copy(center);
          s.controls.update();
        },
        viewTo: (preset) => {
          const s = stateRef.current;
          const dist = 12;
          const map = {
            front: [0, 0, dist],
            back: [0, 0, -dist],
            left: [-dist, 0, 0],
            right: [dist, 0, 0],
            top: [0, dist, 0],
            bottom: [0, -dist, 0],
            iso: [dist, dist, dist],
          };
          const p = map[preset] || map.iso;
          s.activeCamera.position.set(p[0], p[1], p[2]);
          s.controls.target.set(0, 0, 0);
          s.activeCamera.lookAt(0, 0, 0);
          s.controls.update();
        },
        zoomBy: (delta) => {
          const s = stateRef.current;
          if (s.activeCamera.isPerspectiveCamera) {
            s.activeCamera.fov = THREE.MathUtils.clamp(s.activeCamera.fov + delta, 15, 80);
            s.activeCamera.updateProjectionMatrix();
          } else {
            s.activeCamera.zoom = THREE.MathUtils.clamp(s.activeCamera.zoom + delta * -0.03, 0.3, 5);
            s.activeCamera.updateProjectionMatrix();
          }
        },
        setProjection: (perspective) => {
          const s = stateRef.current;
          const src = s.activeCamera;
          const dst = perspective ? s.camera : s.orthoCamera;
          dst.position.copy(src.position);
          dst.quaternion.copy(src.quaternion);
          s.controls.object = dst;
          s.activeCamera = dst;
          s.transform.camera = dst;
          s.controls.update();
        },
        showAll: () => {
          sceneApiRef.current?.fitInView?.();
        },
        importMeshFile: async (file) => {
          const ext = file.name.split(".").pop()?.toLowerCase();
          const s = stateRef.current;
          let object = null;

          if (ext === "stl") {
            const buf = await file.arrayBuffer();
            const geom = new STLLoader().parse(buf);
            geom.computeVertexNormals();
            object = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45, metalness: 0.1 }));
          } else if (ext === "obj") {
            const txt = await file.text();
            const root = new OBJLoader().parse(txt);
            root.traverse((c) => {
              if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45, metalness: 0.1 });
            });
            object = root;
          } else if (ext === "ply") {
            const buf = await file.arrayBuffer();
            const geom = new PLYLoader().parse(buf);
            geom.computeVertexNormals();
            object = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45, metalness: 0.1 }));
          } else if (ext === "gltf" || ext === "glb") {
            const url = URL.createObjectURL(file);
            object = await new Promise((resolve, reject) => {
              new GLTFLoader().load(url, (g) => resolve(g.scene), undefined, reject);
            });
            URL.revokeObjectURL(url);
          } else {
            throw new Error("Unsupported mesh extension");
          }

          const id = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          object.userData.id = id;
          s.scene.add(object);
          s.imported.set(id, object);
          sceneApiRef.current?.fitInView?.();
          return id;
        },
        exportAs: (format, sourceMeshes) => {
          const group = new THREE.Group();
          sourceMeshes.forEach((m) => group.add(m.clone()));
          if (format === "stl") {
            const stl = new STLExporter().parse(group);
            return { content: stl, mime: "model/stl", ext: "stl", binary: false };
          }
          if (format === "obj") {
            const obj = new OBJExporter().parse(group);
            return { content: obj, mime: "text/plain", ext: "obj", binary: false };
          }
          if (format === "ply") {
            const ply = new PLYExporter().parse(group, undefined, { binary: false });
            return { content: ply, mime: "application/octet-stream", ext: "ply", binary: false };
          }
          if (format === "gltf") {
            return new Promise((resolve) => {
              new GLTFExporter().parse(group, (gltf) => {
                resolve({ content: JSON.stringify(gltf), mime: "model/gltf+json", ext: "gltf", binary: false });
              });
            });
          }
          if (format === "glb") {
            return new Promise((resolve) => {
              new GLTFExporter().parse(group, (glb) => {
                resolve({ content: glb, mime: "model/gltf-binary", ext: "glb", binary: true });
              }, { binary: true });
            });
          }
          throw new Error("Unsupported export format");
        },
        getAllRenderable: () => Array.from(stateRef.current.meshes.values()).concat(Array.from(stateRef.current.imported.values())),
      };
    }

    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      ortho.left = (-frustum * w) / h;
      ortho.right = (frustum * w) / h;
      ortho.top = frustum;
      ortho.bottom = -frustum;
      ortho.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    let raf = null;
    const animate = () => {
      controls.update();
      renderer.render(scene, stateRef.current.activeCamera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("contextmenu", preventContextMenu);
      window.removeEventListener("keydown", onModifier);
      window.removeEventListener("keyup", onModifier);
      transform.removeEventListener("dragging-changed", onTransformDraggingChanged);
      transform.removeEventListener("objectChange", onTransformObjectChange);
      try { transform.detach(); } catch { /* noop */ }
      controls.dispose();
      try {
        scene.remove(transformHelper);
      } catch (e) {
        console.warn("Failed to detach TransformControls helper: ", e);
      }
      try { transform.dispose(); } catch { /* noop */ }
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [onObjectTransform, onSelect, sceneApiRef]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;

    const drawHandleOverlay = (mesh) => {
      const hg = s.handleGroup;
      if (!hg) return;
      hg.clear();
      if (!mesh) {
        hg.visible = false;
        return;
      }

      const box = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const min = box.min;
      const max = box.max;
      const markerSize = Math.max(Math.min(size.x, size.z) * 0.06, 0.08);
      const yBase = min.y;
      const yTop = max.y;

      const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const blackMat = new THREE.MeshBasicMaterial({ color: 0x171717 });
      const rotMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.9, side: THREE.DoubleSide });

      const cornerGeo = new THREE.BoxGeometry(markerSize, markerSize, markerSize);
      const edgeGeo = new THREE.BoxGeometry(markerSize * 0.9, markerSize * 0.9, markerSize * 0.9);
      const topGeo = new THREE.BoxGeometry(markerSize, markerSize, markerSize);
      const coneGeo = new THREE.ConeGeometry(markerSize * 0.45, markerSize * 1.35, 16);

      const corners = [
        [min.x, yBase, min.z],
        [max.x, yBase, min.z],
        [min.x, yBase, max.z],
        [max.x, yBase, max.z],
      ];
      corners.forEach((p) => {
        const m = new THREE.Mesh(cornerGeo, whiteMat);
        m.position.set(...p);
        hg.add(m);
      });

      const edges = [
        [(min.x + max.x) * 0.5, yBase, min.z],
        [(min.x + max.x) * 0.5, yBase, max.z],
        [min.x, yBase, (min.z + max.z) * 0.5],
        [max.x, yBase, (min.z + max.z) * 0.5],
      ];
      edges.forEach((p) => {
        const m = new THREE.Mesh(edgeGeo, blackMat);
        m.position.set(...p);
        hg.add(m);
      });

      const topSquare = new THREE.Mesh(topGeo, whiteMat);
      topSquare.position.set(center.x, yTop + markerSize * 0.5, center.z);
      hg.add(topSquare);

      const topCone = new THREE.Mesh(coneGeo, blackMat);
      topCone.position.set(center.x, yTop + markerSize * 1.8, center.z);
      hg.add(topCone);

      const r = Math.max(size.x, size.y, size.z) * 0.65;
      const ringX = new THREE.Mesh(new THREE.TorusGeometry(r, markerSize * 0.07, 8, 48), rotMat);
      ringX.rotation.y = Math.PI / 2;
      ringX.position.copy(center);
      hg.add(ringX);
      const ringY = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, markerSize * 0.07, 8, 48), rotMat);
      ringY.rotation.x = Math.PI / 2;
      ringY.position.copy(center);
      hg.add(ringY);
      const ringZ = new THREE.Mesh(new THREE.TorusGeometry(r * 1.1, markerSize * 0.07, 8, 48), rotMat);
      ringZ.position.copy(center);
      hg.add(ringZ);

      hg.visible = true;
    };

    const ids = new Set(objects.map((o) => o.id));

    for (const [id, mesh] of s.meshes.entries()) {
      if (!ids.has(id)) {
        if (s.transform.object === mesh) s.transform.detach();
        s.scene.remove(mesh);
        mesh.geometry?.dispose?.();
        mesh.material?.dispose?.();
        s.meshes.delete(id);
      }
    }

    objects.forEach((obj) => {
      let mesh = s.meshes.get(obj.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          makeGeometry(obj.base || "box"),
          new THREE.MeshStandardMaterial({
            color: obj.hole ? HOLE_COLOR : (obj.color || DEFAULT_COLOR),
            transparent: !!obj.hole,
            opacity: obj.hole ? 0.35 : 1,
            roughness: 0.45,
            metalness: 0.08,
          }),
        );
        mesh.userData = { id: obj.id };
        s.scene.add(mesh);
        s.meshes.set(obj.id, mesh);
      }
      // Don't overwrite the live position of whatever's currently being
      // hand-dragged on the ground plane — a re-render triggered by
      // anything else (selection, unrelated state) would otherwise snap
      // it back to its last-saved spot mid-drag.
      const isBeingDragged = s.dragState?.active && s.dragState.mesh === mesh;
      if (!isBeingDragged) {
        mesh.position.set(...obj.position);
      }
      mesh.rotation.set(...obj.rotation);
      mesh.scale.set(...obj.scale);
      mesh.material.color.set(obj.hole ? HOLE_COLOR : (obj.color || DEFAULT_COLOR));
      mesh.material.opacity = obj.hole ? 0.35 : 1;
      mesh.material.transparent = !!obj.hole;
      const selected = selectedIds.includes(obj.id);
      mesh.material.emissive.set(selected ? "#f59e0b" : "#000000");
      mesh.material.emissiveIntensity = selected ? 0.18 : 0;
    });

    if (selectedIds.length === 1) {
      const mesh = s.meshes.get(selectedIds[0]) || s.imported.get(selectedIds[0]);
      if (mesh) {
        s.transform.attach(mesh);
        s.transform.setMode(mode);
        drawHandleOverlay(mesh);
      }
    } else {
      s.transform.detach();
      drawHandleOverlay(null);
    }
  }, [objects, selectedIds, mode]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.transform) return;
    s.transform.setMode(mode);
  }, [mode]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.transform) return;
    s.transform.setTranslationSnap(snap);
    s.transform.setScaleSnap(Math.max(snap * 0.1, 0.05));
  }, [snap]);

  useEffect(() => {
    sceneApiRef.current?.setProjection?.(isPerspective);
  }, [isPerspective, sceneApiRef]);

  return <div ref={mountRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} />;
}

export default function Editor() {
  const sceneApiRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { user, openAuth } = useAuth();

  const [objects, setObjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode, setMode] = useState("translate");
  const [snap, setSnap] = useState(1);
  const [libraryTab, setLibraryTab] = useState("BASIC");
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [title, setTitle] = useState("");
  const [designId, setDesignId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isPerspective, setIsPerspective] = useState(true);
  const [alignOverlayOpen, setAlignOverlayOpen] = useState(false);
  const [mirrorOverlayOpen, setMirrorOverlayOpen] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [historyState, setHistoryState] = useState({ past: [], future: [] });

  const idCounter = useRef(1);
  const skipHistory = useRef(false);

  useEffect(() => {
    if (objects.length) return;
    if (!routeId || routeId === "new") {
      // Brand-new design: offer real starter templates instead of silently
      // dropping in one blank cube.
      setTemplatePickerOpen(true);
      return;
    }
    // Existing design that happens to have no geometry saved (e.g. user
    // deleted everything and saved) — fall back to a single box, same as
    // the previous default behavior.
    setObjects([
      {
        id: idCounter.current++,
        key: "box",
        label: "Box",
        base: "box",
        hole: false,
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: DEFAULT_COLOR,
      },
    ]);
  }, [objects.length, routeId]);

  const applyTemplate = (template) => {
    const created = template.shapes.map((s) => ({
      id: idCounter.current++,
      key: s.key,
      label: s.label,
      base: s.base,
      hole: !!s.hole,
      position: s.position,
      rotation: s.rotation,
      scale: s.scale,
      color: s.hole ? HOLE_COLOR : DEFAULT_COLOR,
    }));
    setObjects(created);
    setSelectedIds([]);
    setTemplatePickerOpen(false);
  };

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false;
      return;
    }
    setHistoryState((prev) => ({ past: [...prev.past, JSON.stringify(objects)].slice(-100), future: [] }));
  }, [objects]);

  useEffect(() => {
    if (!routeId || routeId === "new") return;
    api.get(`/designs/${routeId}`).then((r) => {
      const d = r.data;
      setTitle(d.title || "");
      setDesignId(d.design_id);
      if (d.geometry?.objects?.length) {
        setObjects(d.geometry.objects);
        const maxId = Math.max(...d.geometry.objects.map((o) => Number(o.id || 0)), 0);
        idCounter.current = maxId + 1;
      }
    }).catch(() => {
      toast.error("Could not load design");
    });
  }, [routeId]);

  const selected = useMemo(() => objects.find((o) => o.id === selectedIds[0]), [objects, selectedIds]);

  const addShape = (shapeDef) => {
    if (shapeDef.proOnly && !user?.is_pro) {
      toast.info("Pro unlock required for this geometry");
      return;
    }
    const id = idCounter.current++;
    const next = {
      id,
      key: shapeDef.key,
      label: shapeDef.label,
      base: shapeDef.base,
      hole: !!shapeDef.hole,
      position: [snap, 0.5, snap],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: shapeDef.hole ? HOLE_COLOR : DEFAULT_COLOR,
    };
    setObjects((prev) => [...prev, next]);
    setSelectedIds([id]);
  };

  const updateShapeFromTransform = useCallback((id, patch) => {
    const applySnap = (arr) => arr.map((v, idx) => (idx === 1 ? Number(v.toFixed(3)) : Number((Math.round(v / snap) * snap).toFixed(3))));
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch, position: applySnap(patch.position || o.position) } : o)));
  }, [snap]);

  const onSelect = (id, withAdditive) => {
    if (id == null) return setSelectedIds([]);
    if (withAdditive) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    // Bail out if this object is already the sole selection — creating a
    // brand-new array here on every click (even re-clicking the same
    // object) was forcing a re-render on every pointerdown, which reset
    // the mesh's position back to its last-saved value right as a drag
    // was starting. That's what made objects feel like they couldn't be
    // moved.
    setSelectedIds((prev) => (prev.length === 1 && prev[0] === id ? prev : [id]));
  };

  const removeSelected = () => {
    if (!selectedIds.length) return;
    setObjects((prev) => prev.filter((o) => !selectedIds.includes(o.id)));
    setSelectedIds([]);
  };

  const copySelected = () => {
    if (!selectedIds.length) return;
    const copy = objects.filter((o) => selectedIds.includes(o.id)).map((o) => ({ ...o }));
    setClipboard(copy);
    toast.success("Copied");
  };

  const pasteClipboard = () => {
    if (!clipboard?.length) return;
    const created = clipboard.map((item) => {
      const id = idCounter.current++;
      return {
        ...item,
        id,
        position: [item.position[0] + snap, item.position[1], item.position[2] + snap],
      };
    });
    setObjects((prev) => [...prev, ...created]);
    setSelectedIds(created.map((c) => c.id));
  };

  const duplicateRepeat = () => {
    if (!clipboard?.length && selectedIds.length) {
      const copy = objects.filter((o) => selectedIds.includes(o.id)).map((o) => ({ ...o }));
      setClipboard(copy);
      const created = copy.map((item) => {
        const id = idCounter.current++;
        return {
          ...item,
          id,
          position: [item.position[0] + snap, item.position[1], item.position[2] + snap],
        };
      });
      setObjects((prev) => [...prev, ...created]);
      setSelectedIds(created.map((c) => c.id));
      return;
    }
    pasteClipboard();
  };

  const updateSelectedShape = (field, axis, value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed) || !selected) return;
    setObjects((prev) => prev.map((o) => {
      if (o.id !== selected.id) return o;
      const next = [...o[field]];
      next[axis] = parsed;
      return { ...o, [field]: next };
    }));
  };

  const updateSelectedColor = (value) => {
    if (!selected) return;
    setObjects((prev) => prev.map((o) => (o.id === selected.id ? { ...o, color: value } : o)));
  };

  const toggleSelectedHole = () => {
    if (!selected) return;
    setObjects((prev) => prev.map((o) => (o.id === selected.id ? { ...o, hole: !o.hole } : o)));
  };

  const undo = () => {
    setHistoryState((prev) => {
      if (prev.past.length < 2) return prev;
      const past = [...prev.past];
      const current = past.pop();
      const previous = past[past.length - 1];
      skipHistory.current = true;
      setObjects(JSON.parse(previous));
      return { past, future: [current, ...prev.future] };
    });
  };

  const redo = () => {
    setHistoryState((prev) => {
      if (!prev.future.length) return prev;
      const [next, ...future] = prev.future;
      skipHistory.current = true;
      setObjects(JSON.parse(next));
      return { past: [...prev.past, next], future };
    });
  };

  const groupSelection = () => {
    if (selectedIds.length < 2) {
      toast.info("Select at least two shapes to group");
      return;
    }
    const groupId = `grp_${Date.now()}`;
    setObjects((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, groupId } : o)));
    toast.success("Grouped");
  };

  const ungroupSelection = () => {
    if (!selectedIds.length) return;
    setObjects((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, groupId: null } : o)));
    toast.success("Ungrouped");
  };

  const nudgeSelection = (dx, dy, dz) => {
    if (!selectedIds.length) return;
    setObjects((prev) => prev.map((o) => {
      if (!selectedIds.includes(o.id)) return o;
      return {
        ...o,
        position: [
          Number((o.position[0] + dx).toFixed(3)),
          Number((o.position[1] + dy).toFixed(3)),
          Number((o.position[2] + dz).toFixed(3)),
        ],
      };
    }));
  };

  const saveDesign = async () => {
    if (!user) return openAuth("signin");
    if (!title.trim()) return toast.error("Design title required");

    setSaving(true);
    try {
      if (designId) {
        await api.put(`/designs/${designId}`, {
          title,
          description: "Updated in Print Cosmos Designer",
          geometry: { objects },
          is_public: true,
          model_path: null,
          image_paths: [],
        });
        toast.success("Design updated");
      } else {
        const r = await api.post("/designs", {
          title,
          description: "Created in Print Cosmos Designer",
          geometry: { objects },
          is_public: true,
          model_path: null,
          image_paths: [],
        });
        setDesignId(r.data.design_id);
        toast.success("Design saved");
      }
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  };

  const exportMesh = async (format) => {
    try {
      const source = sceneApiRef.current?.getAllRenderable?.() || [];
      if (!source.length) return toast.error("Nothing to export");
      const file = await sceneApiRef.current?.exportAs?.(format, source);
      if (!file) return;
      const blob = new Blob([file.content], { type: file.mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(title || "print_cosmos_design").replace(/\s+/g, "_")}.${file.ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported`);
    } catch {
      toast.error("Export failed");
    }
  };

  const importMesh = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await sceneApiRef.current?.importMeshFile?.(file);
      toast.success(`${file.name} imported`);
    } catch {
      toast.error("Import failed: use STL, OBJ, PLY, GLTF, or GLB");
    } finally {
      event.target.value = "";
    }
  };

  const sendTo = async () => {
    if (!designId) {
      toast.info("Save your design before sharing");
      return;
    }
    await navigator.clipboard.writeText(`${window.location.origin}/designer/${designId}`);
    toast.success("Share link copied");
    setShareDialogOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); copySelected(); return; }
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); pasteClipboard(); return; }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateRepeat(); return; }
      if (mod && e.key.toLowerCase() === "g" && !e.shiftKey) { e.preventDefault(); groupSelection(); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === "g") { e.preventDefault(); ungroupSelection(); return; }
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }

      if ((e.key === "Delete" || e.key === "Backspace") && !(document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA")) {
        e.preventDefault();
        removeSelected();
        return;
      }

      if (e.key.toLowerCase() === "l") {
        setAlignOverlayOpen((v) => !v);
        return;
      }
      if (e.key.toLowerCase() === "m") {
        setMirrorOverlayOpen((v) => !v);
        return;
      }

      const step = 0.5;
      const zStep = 0.25;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (mod) nudgeSelection(0, 0, -zStep);
        else nudgeSelection(-step, 0, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        if (mod) nudgeSelection(0, 0, zStep);
        else nudgeSelection(step, 0, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (mod) nudgeSelection(0, zStep, 0);
        else nudgeSelection(0, 0, -step);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (mod) nudgeSelection(0, -zStep, 0);
        else nudgeSelection(0, 0, step);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedIds, clipboard, objects]);

  const shapeList = SHAPE_LIBRARY[libraryTab] || [];

  return (
    <div data-testid="designer-page" className="pt-14">
      <div className="h-[calc(100vh-3.5rem)] relative bg-[#111217]">
        <div className="absolute top-0 left-0 right-0 z-20 h-12 border-b border-border bg-card/95 backdrop-blur px-3 flex items-center gap-2 overflow-x-auto">
          <ToolbarButton icon={Sparkles} label="Templates" onClick={() => setTemplatePickerOpen(true)} />
          <Menubar className="h-8 bg-transparent border-none shadow-none p-0 gap-1 shrink-0">
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => navigate("/")}>
                  <Home className="h-3.5 w-3.5 mr-2" /> Home
                </MenubarItem>
                <MenubarItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-2" /> Import
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => setShareDialogOpen(true)}>
                  <Send className="h-3.5 w-3.5 mr-2" /> Send To
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={copySelected}>
                  <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                </MenubarItem>
                <MenubarItem onClick={pasteClipboard} disabled={!clipboard?.length}>
                  <ClipboardPaste className="h-3.5 w-3.5 mr-2" /> Paste
                </MenubarItem>
                <MenubarItem onClick={duplicateRepeat}>
                  <CopyPlus className="h-3.5 w-3.5 mr-2" /> Duplicate &amp; Repeat
                </MenubarItem>
                <MenubarItem onClick={removeSelected}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={undo}>
                  <Undo2 className="h-3.5 w-3.5 mr-2" /> Undo
                </MenubarItem>
                <MenubarItem onClick={redo}>
                  <Redo2 className="h-3.5 w-3.5 mr-2" /> Redo
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => sceneApiRef.current?.showAll?.()}>
                  <Lightbulb className="h-3.5 w-3.5 mr-2" /> Show All
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">Export</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => exportMesh("stl")}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export STL
                </MenubarItem>
                <MenubarItem onClick={() => exportMesh("obj")}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export OBJ
                </MenubarItem>
                <MenubarItem onClick={() => exportMesh("ply")}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export PLY
                </MenubarItem>
                <MenubarItem onClick={() => exportMesh("gltf")}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export GLTF
                </MenubarItem>
                <MenubarItem onClick={() => exportMesh("glb")}>
                  <Download className="h-3.5 w-3.5 mr-2" /> Export GLB
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <input ref={fileInputRef} type="file" accept=".stl,.obj,.ply,.gltf,.glb" onChange={importMesh} className="hidden" />
          <div className="ml-auto flex items-center gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design title" className="h-8 w-56 font-tech text-xs" />
            <Button onClick={saveDesign} disabled={saving} className="h-8 rounded-xl font-tech text-xs uppercase tracking-wider">
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/designer")} className="h-8 rounded-xl font-tech text-xs uppercase tracking-wider">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Workshop
            </Button>
          </div>
        </div>

        <div className="absolute left-3 top-16 z-20 w-40 rounded-xl border border-border bg-card/95 backdrop-blur p-2 space-y-2">
          <div className="text-[9px] font-tech uppercase tracking-[0.22em] text-muted-foreground">ViewCube</div>
          <div className="grid grid-cols-3 gap-1 text-[9px] font-tech uppercase tracking-wider">
            <CubeBtn label="Top" onClick={() => sceneApiRef.current?.viewTo?.("top")} className="col-start-2" />
            <CubeBtn label="Left" onClick={() => sceneApiRef.current?.viewTo?.("left")} />
            <CubeBtn label="Iso" onClick={() => sceneApiRef.current?.viewTo?.("iso")} />
            <CubeBtn label="Right" onClick={() => sceneApiRef.current?.viewTo?.("right")} />
            <CubeBtn label="Front" onClick={() => sceneApiRef.current?.viewTo?.("front")} className="col-start-2" />
            <CubeBtn label="Back" onClick={() => sceneApiRef.current?.viewTo?.("back")} className="col-start-2" />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <OverlayBtn icon={Home} label="Home View" onClick={() => sceneApiRef.current?.homeView?.()} />
            <OverlayBtn icon={Frame} label="Fit" onClick={() => sceneApiRef.current?.fitInView?.()} />
            <OverlayBtn icon={ZoomIn} label="Zoom +" onClick={() => sceneApiRef.current?.zoomBy?.(-2)} />
            <OverlayBtn icon={ZoomOut} label="Zoom -" onClick={() => sceneApiRef.current?.zoomBy?.(2)} />
          </div>
          <button
            onClick={() => setIsPerspective((v) => !v)}
            className="w-full h-7 rounded-xl border border-border text-[9px] font-tech uppercase tracking-wider hover:border-primary"
          >
            {isPerspective ? "Perspective" : "Flat (Ortho)"}
          </button>
        </div>

        <div className={`absolute top-16 right-0 bottom-0 border-l border-border bg-card/95 backdrop-blur z-20 flex flex-col transition-all ${libraryCollapsed ? "w-14" : "w-[340px]"}`}>
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-tech uppercase tracking-[0.25em] text-muted-foreground">Shapes Library</div>
              <button type="button" onClick={() => setLibraryCollapsed((v) => !v)} className="h-7 w-7 border border-border rounded-xl inline-flex items-center justify-center hover:border-primary">
                <Layers className="h-3.5 w-3.5" />
              </button>
            </div>
            {!libraryCollapsed && <div className="flex flex-wrap gap-1">
              {TAB_ORDER.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setLibraryTab(tab)}
                  className={`h-6 px-2 rounded-xl border text-[9px] font-tech uppercase tracking-wider ${libraryTab === tab ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
                >
                  {tab}
                </button>
              ))}
            </div>}
          </div>

          {!libraryCollapsed && <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {shapeList.map((shape) => (
                <button
                  key={shape.key}
                  onClick={() => addShape(shape)}
                  className={`h-20 border rounded-xl p-2 text-left hover:border-primary ${shape.proOnly && !user?.is_pro ? "opacity-45" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <ShapeIcon name={shape.base} />
                    {shape.hole ? <span className="text-[8px] font-tech text-cyan-400 uppercase tracking-wider">Hole</span> : null}
                    {shape.proOnly ? <span className="text-[8px] font-tech text-[#F59E0B] uppercase tracking-wider">Pro</span> : null}
                  </div>
                  <div className="text-[10px] font-tech uppercase tracking-wider leading-tight">{shape.label}</div>
                </button>
              ))}
            </div>
          </div>}

          {!libraryCollapsed && <div className="border-t border-border p-3 space-y-3">
            <div>
              <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">Transform</div>
              <div className="grid grid-cols-3 gap-1">
                <ModeBtn label="Move" active={mode === "translate"} onClick={() => setMode("translate")} />
                <ModeBtn label="Rotate" active={mode === "rotate"} onClick={() => setMode("rotate")} />
                <ModeBtn label="Scale" active={mode === "scale"} onClick={() => setMode("scale")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button onClick={groupSelection} className="h-7 border border-border rounded-xl text-[9px] font-tech uppercase tracking-wider inline-flex items-center justify-center gap-1 hover:border-primary"><Group className="h-3 w-3" /> Group</button>
              <button onClick={ungroupSelection} className="h-7 border border-border rounded-xl text-[9px] font-tech uppercase tracking-wider inline-flex items-center justify-center gap-1 hover:border-primary"><Ungroup className="h-3 w-3" /> Ungroup</button>
            </div>

            <div className="grid grid-cols-2 gap-1">
              <button onClick={() => setAlignOverlayOpen((v) => !v)} className="h-7 border border-border rounded-xl text-[9px] font-tech uppercase tracking-wider inline-flex items-center justify-center gap-1 hover:border-primary"><AlignLeft className="h-3 w-3" /> Align (L)</button>
              <button onClick={() => setMirrorOverlayOpen((v) => !v)} className="h-7 border border-border rounded-xl text-[9px] font-tech uppercase tracking-wider inline-flex items-center justify-center gap-1 hover:border-primary"><FlipHorizontal className="h-3 w-3" /> Mirror (M)</button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">Snap</span>
              <select value={snap} onChange={(e) => setSnap(Number(e.target.value))} className="h-7 flex-1 border border-border rounded-xl bg-background text-[10px] font-tech px-2">
                <option value={0.1}>0.1 mm</option>
                <option value={0.5}>0.5 mm</option>
                <option value={1}>1 mm</option>
                <option value={5}>5 mm</option>
              </select>
            </div>
            {selected ? (
              <div className="border-t border-border pt-3 space-y-2">
                <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">Properties</div>
                <PropRow label="Position" value={selected.position} onChange={(axis, value) => updateSelectedShape("position", axis, value)} />
                <PropRow label="Rotation" value={selected.rotation} onChange={(axis, value) => updateSelectedShape("rotation", axis, value)} />
                <PropRow label="Scale" value={selected.scale} onChange={(axis, value) => updateSelectedShape("scale", axis, value)} />
                <label className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider">
                  <span>Hole</span>
                  <input type="checkbox" checked={selected.hole} onChange={toggleSelectedHole} />
                </label>
                <label className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider">
                  <span>Color</span>
                  <input type="color" value={selected.color || DEFAULT_COLOR} onChange={(e) => updateSelectedColor(e.target.value)} className="h-7 w-16 bg-transparent" />
                </label>
              </div>
            ) : null}
          </div>}
        </div>

        <div className={`absolute top-12 left-0 bottom-0 ${libraryCollapsed ? "right-[56px]" : "right-[340px]"}`}>
          <ThreeCanvas
            objects={objects}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onObjectTransform={updateShapeFromTransform}
            mode={mode}
            snap={snap}
            isPerspective={isPerspective}
            sceneApiRef={sceneApiRef}
          />
        </div>

        {selected && (
          <div className="absolute left-1/2 bottom-3 -translate-x-1/2 z-20 rounded-xl border border-border bg-card/90 backdrop-blur px-3 py-2 text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
            Handles: white corners resize • black edges single-axis stretch • top white square height • top black cone Z-elevate • curved arrows rotate • Shift uniform scale • Alt center scale
          </div>
        )}

        {alignOverlayOpen ? (
          <div className="absolute left-1/2 top-20 -translate-x-1/2 z-30 border border-border bg-card rounded-xl p-3 text-xs font-tech">
            Align Tool Overlay Active (L)
          </div>
        ) : null}

        {mirrorOverlayOpen ? (
          <div className="absolute left-1/2 top-32 -translate-x-1/2 z-30 border border-border bg-card rounded-xl p-3 text-xs font-tech">
            Mirror Utility Overlay Active (M)
          </div>
        ) : null}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Send To</DialogTitle>
          </DialogHeader>
          <Textarea value={designId ? `${window.location.origin}/designer/${designId}` : "Save first to generate share route"} readOnly rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Close</Button>
            <Button onClick={sendTo} className="rounded-xl font-tech text-xs uppercase tracking-wider">Copy Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Start from a template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                data-testid={`template-${t.id}`}
                className="text-left border border-border rounded-xl p-3 hover:border-primary hover:bg-secondary/50 transition-colors"
              >
                <div className="font-tech text-xs uppercase tracking-wider mb-1">{t.label}</div>
                <div className="text-[11px] text-muted-foreground">{t.description}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-8 px-2 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider inline-flex items-center gap-1 hover:border-primary disabled:opacity-40"
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

function CubeBtn({ label, onClick, className = "" }) {
  return (
    <button type="button" onClick={onClick} className={`h-6 rounded-xl border border-border hover:border-primary ${className}`}>
      {label}
    </button>
  );
}

function OverlayBtn({ icon: Icon, label, onClick }) {
  return (
    <button type="button" title={label} onClick={onClick} className="h-7 rounded-xl border border-border inline-flex items-center justify-center hover:border-primary">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function ModeBtn({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 rounded-xl border text-[9px] font-tech uppercase tracking-wider ${active ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
    >
      {label}
    </button>
  );
}

function PropRow({ label, value, onChange }) {
  return (
    <div>
      <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        {value.map((v, idx) => (
          <input
            key={`${label}-${idx}`}
            type="number"
            step="0.1"
            value={Number(v).toFixed(2)}
            onChange={(e) => onChange(idx, e.target.value)}
            className="h-7 px-2 border border-border rounded-xl bg-background text-[10px] font-tech"
          />
        ))}
      </div>
    </div>
  );
}

function ShapeIcon({ name }) {
  if (name === "box") return <Box className="h-4 w-4" />;
  if (name === "sphere") return <Circle className="h-4 w-4" />;
  if (name === "cylinder") return <Cylinder className="h-4 w-4" />;
  if (name === "cone") return <Cone className="h-4 w-4" />;
  if (name === "gear") return <Shield className="h-4 w-4" />;
  return <Cuboid className="h-4 w-4" />;
}
