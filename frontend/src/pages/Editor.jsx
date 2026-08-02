import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { PLYLoader } from "three/examples/jsm/loaders/PLYLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { OBJExporter } from "three/examples/jsm/exporters/OBJExporter";
import { PLYExporter } from "three/examples/jsm/exporters/PLYExporter";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Copy, ClipboardPaste, CopyPlus, Trash2, Undo2, Redo2,
  Lightbulb, Upload, Download, Send, Home, Frame, ZoomIn, ZoomOut,
  Cuboid, Box, Circle, Cylinder, Cone, Shield, Layers, Group, Ungroup,
  AlignLeft, FlipHorizontal, Save, Sparkles, Ruler, Grid3X3, Eye, EyeOff,
  MousePointer2, Move3D, Rotate3D, Maximize2, Minimize2,
} from "lucide-react";
import { toast } from "sonner";
import { TeaserUI } from "@/components/TeaserUI";
import CosmosLoader from "@/components/CosmosLoader";

const TAB_ORDER = ["BASIC", "HOLES", "STRUCTURES", "HARDWARE", "ELECTRONICS", "FIDGET_TOYS", "EVERYDAY", "ASMR_TOOLS", "CREATURES", "VEHICLES", "FUN_GAMES", "LETTERS_NUMBERS", "GENERATORS"];

const SHAPE_LIBRARY = {
  BASIC: [
    { key: "box", label: "Box", base: "box" },
    { key: "wedge", label: "Wedge", base: "wedge" },
    { key: "cylinder", label: "Cylinder", base: "cylinder" },
    { key: "cone", label: "Cone", base: "cone" },
    { key: "sphere", label: "Sphere", base: "sphere" },
    { key: "torus", label: "Torus", base: "torus" },
    { key: "tube", label: "Tube", base: "tube" },
    { key: "pyramid", label: "Pyramid", base: "pyramid" },
    { key: "diamond", label: "Diamond", base: "diamond" },
    { key: "dodecahedron", label: "Dodecahedron", base: "icosahedron" },
    { key: "icosahedron", label: "Icosahedron", base: "icosahedron" },
    { key: "octahedron", label: "Octahedron", base: "star" },
    { key: "hexagon", label: "Hexagon", base: "polygon" },
    { key: "triangle", label: "Triangle", base: "polygon" },
    { key: "paraboloid", label: "Paraboloid", base: "paraboloid" },
    { key: "round-roof", label: "Round Roof", base: "roundRoof" },
    { key: "roof", label: "Roof", base: "roof" },
    { key: "half-sphere", label: "Half Sphere", base: "halfSphere" },
    { key: "archway", label: "Arch", base: "archway" },
    { key: "ring", label: "Ring", base: "ring" },
  ],
  HOLES: [
    { key: "box-hole", label: "Box Hole", base: "box", hole: true },
    { key: "cylinder-hole", label: "Cylinder Hole", base: "cylinder", hole: true },
    { key: "cone-hole", label: "Cone Hole", base: "cone", hole: true },
  ],
  STRUCTURES: [
    { key: "wall", label: "Wall", base: "box" },
    { key: "beam", label: "Beam", base: "box" },
    { key: "pillar", label: "Pillar", base: "cylinder" },
    { key: "floor", label: "Floor", base: "box" },
    { key: "ceiling", label: "Ceiling", base: "box" },
    { key: "doorway", label: "Doorway", base: "archway" },
    { key: "window", label: "Window", base: "ring" },
    { key: "stairs", label: "Stairs", base: "wedge" },
    { key: "ramp", label: "Ramp", base: "wedge" },
    { key: "railing", label: "Railing", base: "tube" },
  ],
  HARDWARE: [
    { key: "gear", label: "Gear", base: "gear" },
    { key: "wheel", label: "Wheel", base: "torus" },
    { key: "axle", label: "Axle", base: "cylinder" },
    { key: "bolt", label: "Bolt", base: "threaded" },
    { key: "nut", label: "Nut", base: "tube" },
    { key: "screw", label: "Screw", base: "threaded" },
    { key: "hinge", label: "Hinge", base: "hinge" },
    { key: "bracket", label: "Bracket", base: "bracket" },
  ],
  ELECTRONICS: [
    { key: "chip", label: "Chip", base: "box" },
    { key: "resistor", label: "Resistor", base: "cylinder" },
    { key: "capacitor", label: "Capacitor", base: "cylinder" },
    { key: "led", label: "LED", base: "sphere" },
    { key: "wire", label: "Wire", base: "tube" },
    { key: "connector", label: "Connector", base: "box" },
    { key: "battery", label: "Battery", base: "cylinder" },
    { key: "switch", label: "Switch", base: "box" },
    { key: "circuit-board", label: "Circuit Board", base: "box" },
  ],
  CREATURES: [
    { key: "egg", label: "Egg", base: "sphere" },
    { key: "tree", label: "Tree", base: "tree" },
    { key: "chicken-foot", label: "Chicken Foot", base: "star" },
    { key: "heart", label: "Heart", base: "heart" },
    { key: "fence", label: "Fence", base: "box" },
  ],
  VEHICLES: [
    { key: "car-body", label: "Car Body", base: "box" },
    { key: "wheel", label: "Wheel", base: "torus" },
    { key: "axle", label: "Axle", base: "cylinder" },
    { key: "engine", label: "Engine", base: "cylinder" },
    { key: "chassis", label: "Chassis", base: "box" },
    { key: "propeller", label: "Propeller", base: "star" },
    { key: "cabin", label: "Cabin", base: "roof" },
    { key: "exhaust", label: "Exhaust", base: "tube" },
  ],
  FUN_GAMES: [
    { key: "dice", label: "Dice", base: "dice" },
    { key: "ball", label: "Ball", base: "sphere" },
    { key: "board", label: "Game Board", base: "box" },
    { key: "card", label: "Card", base: "box" },
    { key: "token", label: "Token", base: "cylinder" },
    { key: "spinner", label: "Spinner", base: "star" },
    { key: "goal", label: "Goal Post", base: "torus" },
    { key: "pawn", label: "Pawn", base: "cylinder" },
  ],
  LETTERS_NUMBERS: [
    ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => ({ key: `letter-${c}`, label: `Letter ${c}`, base: "text" })),
    ...'0123456789'.split('').map((c) => ({ key: `num-${c}`, label: `Number ${c}`, base: "text" })),
  ],
  GENERATORS: [
    { key: "curve-extruder", label: "Curve Extruder", base: "extrude", proOnly: true },
    { key: "thread-spring", label: "Thread/Spring", base: "threaded", proOnly: true },
    { key: "meta-ball", label: "Meta Ball", base: "sphere", proOnly: true },
    { key: "voronoi", label: "Voronoi", base: "icosahedron", proOnly: true },
  ],
  FIDGET_TOYS: [
    { key: "fidget-spinner", label: "Fidget Spinner", base: "star" },
    { key: "fidget-bearing", label: "Center Bearing", base: "cylinder", hole: true },
    { key: "fidget-paddle", label: "Paddle Arm", base: "box" },
    { key: "fidget-center", label: "Center Cap", base: "cylinder" },
    { key: "fidget-button", label: "Click Button", base: "cylinder" },
    { key: "fidget-roller", label: "Roller Ball", base: "sphere" },
    { key: "infinity-cube", label: "Infinity Cube", base: "box" },
    { key: "gear-spinner", label: "Gear Spinner", base: "gear" },
    { key: "squishy-ball", label: "Squishy Ball", base: "sphere" },
    { key: "flippy-chain", label: "Flippy Chain", base: "torus" },
    { key: "bike-chain-fidget", label: "Bike Chain Fidget", base: "tube" },
    { key: "spinner-ring", label: "Spinner Ring", base: "torus" },
    { key: "click-cube", label: "Clicky Cube", base: "box" },
    { key: "pop-it", label: "Pop It", base: "box" },
    { key: "slug-fidget", label: "Slug Fidget", base: "cylinder" },
  ],
  EVERYDAY: [
    { key: "phone-stand", label: "Phone Stand", base: "wedge" },
    { key: "tablet-stand", label: "Tablet Stand", base: "wedge" },
    { key: "cup", label: "Cup/Mug", base: "cylinder" },
    { key: "cup-hole", label: "Cup Interior", base: "cylinder", hole: true },
    { key: "hook", label: "Wall Hook", base: "archway" },
    { key: "key-holder", label: "Key Holder", base: "box" },
    { key: "cable-tie", label: "Cable Tie", base: "torus" },
    { key: "bottle-opener", label: "Bottle Opener", base: "wedge" },
    { key: "bag-clip", label: "Bag Clip", base: "box" },
    { key: "toothbrush-holder", label: "Toothbrush Holder", base: "cylinder" },
    { key: "soap-dish", label: "Soap Dish", base: "box" },
    { key: "towel-rack", label: "Towel Rack", base: "tube" },
    { key: "coaster", label: "Coaster", base: "cylinder" },
    { key: "pencil-cup", label: "Pencil Cup", base: "cylinder" },
    { key: "card-holder", label: "Card Holder", base: "box" },
    { key: "cable-organizer", label: "Cable Organizer", base: "box" },
    { key: "sd-card-holder", label: "SD Card Holder", base: "box" },
    { key: "earbud-case", label: "Earbud Case", base: "box" },
    { key: "wallet-stand", label: "Wallet Stand", base: "wedge" },
  ],
  ASMR_TOOLS: [
    { key: "clicker", label: "Clicker", base: "cylinder" },
    { key: "spinner", label: "Smooth Spinner", base: "torus" },
    { key: "ratchet", label: "Ratcheting Gear", base: "gear" },
    { key: "scratch-pad", label: "Scratch Pad", base: "box" },
    { key: "rolling-pin", label: "Rolling Pin", base: "cylinder" },
    { key: "knob", label: "Tactile Knob", base: "cylinder" },
    { key: "toggle-switch", label: "Toggle Switch", base: "box" },
    { key: "slider", label: "Slider", base: "box" },
    { key: "dimple-plate", label: "Dimple Plate", base: "box" },
    { key: "bubble-wrap", label: "Bubble Wrap", base: "box" },
    { key: "spring-coil", label: "Spring Coil", base: "threaded" },
    { key: "marble-run", label: "Marble Run Piece", base: "tube" },
    { key: "sand-timer", label: "Sand Timer Frame", base: "box" },
    { key: "maze", label: "Finger Maze", base: "box" },
    { key: "stress-ball", label: "Stress Ball", base: "sphere" },
  ],
};

const DEFAULT_COLOR = "#f59e0b";
const HOLE_COLOR = "#7dd3fc";

const TEMPLATES = [
  {
    id: "blank", label: "Blank Canvas", description: "Start from a single box.",
    icon: (<svg viewBox="0 0 64 64" className="w-full h-full"><rect x="12" y="20" width="40" height="32" rx="2" fill="none" stroke="#6b7280" strokeWidth="1.5"/><rect x="16" y="24" width="32" height="24" rx="1" fill="#9ca3af" opacity="0.3"/><line x1="12" y1="36" x2="52" y2="36" stroke="#6b7280" strokeWidth="0.5" opacity="0.5"/></svg>),
    shapes: [{ key: "box", label: "Box", base: "box", position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }],
  },
  {
    id: "phone-stand", label: "Phone Stand", description: "Base, angled back support, front lip.",
    shapes: [
      { key: "box", label: "Base", base: "box", position: [0, 0.2, 0], rotation: [0, 0, 0], scale: [4, 0.4, 3] },
      { key: "roof", label: "Back Support", base: "roof", position: [0, 1.6, -1.1], rotation: [0.35, 0, 0], scale: [4, 2.2, 0.5] },
      { key: "box", label: "Front Lip", base: "box", position: [0, 0.55, 0.9], rotation: [0, 0, 0], scale: [4, 0.7, 0.4] },
    ],
    icon: (<svg viewBox="0 0 64 64" className="w-full h-full"><rect x="8" y="30" width="48" height="6" rx="1" fill="none" stroke="#6b7280" strokeWidth="1.5"/><rect x="12" y="18" width="40" height="14" rx="2" fill="none" stroke="#6b7280" strokeWidth="1" transform="rotate(-15, 32, 25)"/><rect x="16" y="12" width="12" height="14" rx="1" fill="#9ca3af" opacity="0.3" transform="rotate(-15, 22, 19)"/><rect x="36" y="12" width="12" height="14" rx="1" fill="#9ca3af" opacity="0.3" transform="rotate(-15, 42, 19)"/></svg>),
  },
  {
    id: "keychain", label: "Keychain", description: "Flat tag with a ring hole.",
    icon: (<svg viewBox="0 0 64 64" className="w-full h-full"><rect x="18" y="10" width="28" height="40" rx="2" fill="none" stroke="#6b7280" strokeWidth="1.5"/><circle cx="32" cy="30" r="6" fill="none" stroke="#6b7280" strokeWidth="1.5"/></svg>),
    shapes: [
      { key: "box", label: "Tag", base: "box", position: [0, 1.25, 0], rotation: [0, 0, 0], scale: [0.15, 2.5, 1.4] },
      { key: "ring", label: "Ring Hole", base: "ring", hole: true, position: [0, 2.5, 0], rotation: [0, 0, 0], scale: [0.7, 0.7, 0.3] },
    ],
  },
  {
    id: "plant-pot", label: "Plant Pot", description: "Tapered body with a rim.",
    icon: (<svg viewBox="0 0 64 64" className="w-full h-full"><path d="M16 30 L20 48 L44 48 L48 30 Z" fill="none" stroke="#6b7280" strokeWidth="1.5"/><ellipse cx="32" cy="30" rx="16" ry="3" fill="none" stroke="#6b7280" strokeWidth="1.5"/></svg>),
    shapes: [
      { key: "cone", label: "Pot Body", base: "cone", position: [0, 1, 0], rotation: [Math.PI, 0, 0], scale: [3, 2, 3] },
      { key: "ring", label: "Rim", base: "ring", position: [0, 2, 0], rotation: [Math.PI / 2, 0, 0], scale: [3.2, 3.2, 0.3] },
    ],
  },
  {
    id: "fidget-spinner", label: "Fidget Spinner", description: "Classic spinning toy.",
    icon: (<svg viewBox="0 0 64 64" className="w-full h-full"><circle cx="32" cy="32" r="4" fill="#9ca3af"/><line x1="32" y1="8" x2="32" y2="20" stroke="#6b7280" strokeWidth="2"/><line x1="32" y1="44" x2="32" y2="56" stroke="#6b7280" strokeWidth="2"/><line x1="8" y1="32" x2="20" y2="32" stroke="#6b7280" strokeWidth="2"/><line x1="44" y1="32" x2="56" y2="32" stroke="#6b7280" strokeWidth="2"/><circle cx="32" cy="8" r="3" fill="#9ca3af" opacity="0.7"/><circle cx="32" cy="56" r="3" fill="#9ca3af" opacity="0.7"/><circle cx="8" cy="32" r="3" fill="#9ca3af" opacity="0.7"/><circle cx="56" cy="32" r="3" fill="#9ca3af" opacity="0.7"/></svg>),
    shapes: [
      { key: "cylinder", label: "Center Bearing", base: "cylinder", position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [0.35, 0.35, 0.35], metalness: 0.8, roughness: 0.1, color: "#c0c0c0" },
      { key: "box", label: "Arm 1", base: "box", position: [0, 0.5, 1.4], rotation: [0, 0, 0], scale: [0.18, 0.28, 1.0] },
      { key: "box", label: "Arm 2", base: "box", position: [1.22, 0.5, -0.7], rotation: [0, 0, 0], scale: [0.18, 0.28, 1.0] },
      { key: "box", label: "Arm 3", base: "box", position: [-1.22, 0.5, -0.7], rotation: [0, 0, 0], scale: [0.18, 0.28, 1.0] },
      { key: "sphere", label: "Weight 1", base: "sphere", position: [0, 0.5, 2.0], rotation: [0, 0, 0], scale: [0.35, 0.35, 0.35], metalness: 0.9, roughness: 0.05 },
      { key: "sphere", label: "Weight 2", base: "sphere", position: [1.5, 0.5, -1.0], rotation: [0, 0, 0], scale: [0.35, 0.35, 0.35], metalness: 0.9, roughness: 0.05 },
      { key: "sphere", label: "Weight 3", base: "sphere", position: [-1.5, 0.5, -1.0], rotation: [0, 0, 0], scale: [0.35, 0.35, 0.35], metalness: 0.9, roughness: 0.05 },
    ],
  },
  {
    id: "sign", label: "Sign", description: "Backing plate with text.",
    icon: (<svg viewBox="0 0 64 64" className="w-full h-full"><rect x="8" y="10" width="48" height="36" rx="1" fill="none" stroke="#6b7280" strokeWidth="1.5"/><line x1="16" y1="20" x2="48" y2="20" stroke="#6b7280" strokeWidth="1" opacity="0.5"/><line x1="16" y1="26" x2="40" y2="26" stroke="#6b7280" strokeWidth="1" opacity="0.5"/><line x1="16" y1="32" x2="48" y2="32" stroke="#6b7280" strokeWidth="1" opacity="0.5"/></svg>),
    shapes: [
      { key: "box", label: "Backing", base: "box", position: [0, 1.5, 0], rotation: [0, 0, 0], scale: [5, 3, 0.2] },
      { key: "text", label: "Text", base: "text", position: [0, 1.5, 0.2], rotation: [0, 0, 0], scale: [3, 1, 0.15] },
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
    case "polygon": return new THREE.CylinderGeometry(0.5, 0.5, 1, 6);
    case "paraboloid": return new THREE.SphereGeometry(0.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    case "text":
    case "extrude":
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function getMouseButtons() {
  return { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
}

function createTextSprite(text, color = "#f59e0b") {
  const safeText = String(text ?? "").slice(0, 64);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  context.font = 'bold 48px monospace';
  context.fillStyle = color;
  context.textAlign = 'center';
  context.fillText(safeText, 128, 80);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 1, 1);
  return sprite;
}

function ThreeCanvas({
  objects, selectedIds, onSelect, onObjectTransform, mode, snap,
  isPerspective, sceneApiRef, onDrop, onDragOver,
  workplaneActive, workplaneVisible, onWorkplaneToggle, rulerActive, onRulerToggle,
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    scene: null, camera: null, orthoCamera: null, activeCamera: null,
    renderer: null, controls: null, transform: null,
    meshes: new Map(), imported: new Map(),
    raycaster: null, pointer: new THREE.Vector2(),
    defaultPos: new THREE.Vector3(9, 8, 9),
    handleGroup: null, shiftScale: false, altScale: false,
    workplane: null, workplaneActive: false,
    rulerLine: null, rulerTextSprite: null, rulerActive: false,
    spotLight: null, mouseNDC: new THREE.Vector2(0, 0),
    lastActivityTime: Date.now(),
  });

  // Intentional: this global key handler reads latest selection/clipboard/object state,
  // while command callbacks are recreated often and would cause listener churn.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0f1014");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 3000);
    camera.position.set(9, 8, 9);
    const frustum = 12;
    const ortho = new THREE.OrthographicCamera(
      (-frustum * width) / height, (frustum * width) / height,
      frustum, -frustum, 0.1, 3000,
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

    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-6, 4, -8);
    scene.add(fill);

    // Ambient spotlight that follows mouse when idle
    const spotLight = new THREE.SpotLight(0xffffff, 0.4);
    spotLight.angle = 0.6;
    spotLight.penumbra = 0.5;
    spotLight.decay = 1.5;
    spotLight.distance = 50;
    spotLight.position.set(0, 12, 0);
    spotLight.target.position.set(0, 0, 0);
    scene.add(spotLight);
    scene.add(spotLight.target);
    stateRef.current.spotLight = spotLight;

    const grid = new THREE.GridHelper(80, 80, 0x5c5f6a, 0x2a2d35);
    scene.add(grid);

    // Tinkercad-style workplane grid
    const gridFloorGeo = new THREE.PlaneGeometry(80, 80, 80, 80);
    const gridFloorMat = new THREE.MeshBasicMaterial({
      color: 0x1a1c20, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const gridFloor = new THREE.Mesh(gridFloorGeo, gridFloorMat);
    gridFloor.rotation.x = -Math.PI / 2;
    gridFloor.position.y = -0.001;
    scene.add(gridFloor);

    // Origin marker
    const originGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const originMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const originMarker = new THREE.Mesh(originGeo, originMat);
    originMarker.position.set(0, 0.25, 0);
    scene.add(originMarker);

    // Workplane
    const workplaneGeo = new THREE.PlaneGeometry(20, 20);
    const workplaneMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b, transparent: true, opacity: 0.15, side: THREE.DoubleSide,
    });
    const workplane = new THREE.Mesh(workplaneGeo, workplaneMat);
    workplane.rotation.x = -Math.PI / 2;
    workplane.position.y = 0;
    workplane.visible = false;
    scene.add(workplane);

    // Ruler
    const rulerLineGeo = new THREE.BufferGeometry();
    const rulerLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
    const rulerLine = new THREE.Line(rulerLineGeo, rulerLineMat);
    rulerLine.visible = false;
    scene.add(rulerLine);
    const rulerTextSprite = createTextSprite("0.0 mm");
    rulerTextSprite.visible = false;
    scene.add(rulerTextSprite);

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
    transform.setTranslationSnap(snap);
    transform.setScaleSnap(Math.max(snap * 0.1, 0.05));
    transform.setRotationSnap(THREE.MathUtils.degToRad(22.5));
    // Keep the gizmo compact so it doesn't dominate the view or swallow clicks
    // meant for other shapes / the orbit camera.
    transform.setSize(0.7);

    const onTransformDraggingChanged = (event) => { controls.enabled = !event.value; };
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

    // Track pointer-down position so a quick click can select while a real
    // drag keeps OrbitControls in control (360° orbit / pan / zoom).
    const clickState = {
      pointerId: null, downX: 0, downY: 0, downTime: 0, active: false,
    };

    const boxSelectState = {
      active: false, startPoint: new THREE.Vector2(),
      endPoint: new THREE.Vector2(), element: null,
    };

    const getPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const updateBoxSelectionElement = () => {
      if (!boxSelectState.element) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const startScreenX = ((boxSelectState.startPoint.x + 1) / 2) * rect.width;
      const startScreenY = ((-boxSelectState.startPoint.y + 1) / 2) * rect.height;
      const endScreenX = ((boxSelectState.endPoint.x + 1) / 2) * rect.width;
      const endScreenY = ((-boxSelectState.endPoint.y + 1) / 2) * rect.height;
      const left = Math.min(startScreenX, endScreenX);
      const top = Math.min(startScreenY, endScreenY);
      boxSelectState.element.style.left = `${left}px`;
      boxSelectState.element.style.top = `${top}px`;
      boxSelectState.element.style.width = `${Math.abs(endScreenX - startScreenX)}px`;
      boxSelectState.element.style.height = `${Math.abs(endScreenY - startScreenY)}px`;
    };

    // Click-to-select with a drag threshold: a quick click (or click+shift)
    // selects/deselects; a real drag is left to OrbitControls so the camera can
    // orbit 360°. TransformControls remains the way to move/rotate/scale shapes.
    const onPointerDown = (event) => {
      stateRef.current.lastActivityTime = Date.now();
      if (event.button !== 0) return;
      getPointer(event);

      if (stateRef.current.workplaneActive) {
        // Click a face to reposition the workplane (existing behaviour).
        const meshesForWp = Array.from(stateRef.current.meshes.values()).concat(Array.from(stateRef.current.imported.values()));
        raycaster.setFromCamera(pointer, stateRef.current.activeCamera);
        const intersects = raycaster.intersectObjects(meshesForWp, true);
        if (intersects.length) {
          const intersect = intersects[0];
          const wp = stateRef.current.workplane;
          if (wp) {
            wp.position.copy(intersect.point);
            wp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), intersect.face.normal);
            wp.visible = true;
          }
        }
        return;
      }

      clickState.pointerId = event.pointerId;
      clickState.downX = event.clientX;
      clickState.downY = event.clientY;
      clickState.downTime = Date.now();
      clickState.active = true;

      if (event.shiftKey) {
        // Shift-drag = box selection (drawn as an overlay rectangle).
        boxSelectState.active = true;
        boxSelectState.startPoint.set(pointer.x, pointer.y);
        boxSelectState.endPoint.set(pointer.x, pointer.y);
        if (!boxSelectState.element) {
          boxSelectState.element = document.createElement('div');
          boxSelectState.element.style.position = 'absolute';
          boxSelectState.element.style.border = '1px dashed #f59e0b';
          boxSelectState.element.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
          boxSelectState.element.style.pointerEvents = 'none';
          renderer.domElement.parentElement.appendChild(boxSelectState.element);
        }
        boxSelectState.element.style.display = 'block';
        updateBoxSelectionElement();
      }
    };

    const onPointerMove = (event) => {
      getPointer(event);
      stateRef.current.mouseNDC.set(pointer.x, pointer.y);
      stateRef.current.lastActivityTime = Date.now();
      if (boxSelectState.active) {
        boxSelectState.endPoint.set(pointer.x, pointer.y);
        updateBoxSelectionElement();
      }
    };

    const onPointerUp = (event) => {
      stateRef.current.lastActivityTime = Date.now();
      // Box select finished — gather shapes whose centers are inside the box.
      if (boxSelectState.active) {
        boxSelectState.active = false;
        if (boxSelectState.element) boxSelectState.element.style.display = 'none';
        const activeCamera = stateRef.current.activeCamera;
        const meshes = Array.from(stateRef.current.meshes.values()).concat(Array.from(stateRef.current.imported.values()));
        const pickedIds = [];
        meshes.forEach((mesh) => {
          if (mesh.userData.id == null) return;
          const center = new THREE.Vector3();
          mesh.getWorldPosition(center);
          center.project(activeCamera);
          const minX = Math.min(boxSelectState.startPoint.x, boxSelectState.endPoint.x);
          const maxX = Math.max(boxSelectState.startPoint.x, boxSelectState.endPoint.x);
          const minY = Math.min(boxSelectState.startPoint.y, boxSelectState.endPoint.y);
          const maxY = Math.max(boxSelectState.startPoint.y, boxSelectState.endPoint.y);
          if (center.x >= minX && center.x <= maxX && center.y >= minY && center.y <= maxY) {
            pickedIds.push(mesh.userData.id);
          }
        });
        if (pickedIds.length > 0) {
          onSelect(pickedIds[0], true);
          pickedIds.slice(1).forEach((id) => onSelect(id, true));
        }
        return;
      }

      // Only treat as a "click" if the pointer barely moved — otherwise it was
      // an orbit drag and we must NOT change selection (and must not fight the
      // camera). This is what restores the free 360° view.
      if (!clickState.active || clickState.pointerId !== event.pointerId) return;
      const dx = Math.abs(event.clientX - clickState.downX);
      const dy = Math.abs(event.clientY - clickState.downY);
      const dt = Date.now() - clickState.downTime;
      clickState.active = false;
      if (dx > 5 || dy > 5 || dt > 500) return;

      getPointer(event);
      raycaster.setFromCamera(pointer, stateRef.current.activeCamera);
      const meshes = Array.from(stateRef.current.meshes.values()).concat(Array.from(stateRef.current.imported.values()));
      const intersects = raycaster.intersectObjects(meshes, true);
      if (intersects.length) {
        let target = intersects[0].object;
        while (target && target.userData.id == null && target.parent) target = target.parent;
        const id = target?.userData?.id;
        if (id == null) return;
        onSelect(id, false);
      } else {
        onSelect(null, false);
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    stateRef.current = {
      ...stateRef.current, scene, camera, orthoCamera: ortho, activeCamera: camera,
      renderer, controls, transform, meshes: new Map(), imported: new Map(),
      raycaster, pointer, handleGroup, workplane, rulerLine, rulerTextSprite,
    };

    const onModifier = (e) => {
      stateRef.current.lastActivityTime = Date.now();
      stateRef.current.shiftScale = e.shiftKey;
      stateRef.current.altScale = e.altKey;
    };
    window.addEventListener("keydown", onModifier);
    window.addEventListener("keyup", onModifier);

    if (sceneApiRef) {
      sceneApiRef.current = {
        stateRef,
        homeView: () => {
          const s = stateRef.current;
          const wasDamping = s.controls.enableDamping;
          s.controls.enableDamping = false;
          s.activeCamera.position.copy(s.defaultPos);
          s.controls.target.set(0, 0, 0);
          s.activeCamera.lookAt(0, 0, 0);
          s.controls.update();
          s.controls.enableDamping = wasDamping;
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
          const wasDamping = s.controls.enableDamping;
          s.controls.enableDamping = false;
          s.activeCamera.position.set(center.x + distance, center.y + distance, center.z + distance);
          s.controls.target.copy(center);
          s.controls.update();
          s.controls.enableDamping = wasDamping;
        },
        viewTo: (preset) => {
          const s = stateRef.current;
          const dist = 12;
          const map = {
            front: [0, 0, dist], back: [0, 0, -dist],
            left: [-dist, 0, 0], right: [dist, 0, 0],
            top: [0, dist, 0], bottom: [0, -dist, 0], iso: [dist, dist, dist],
          };
          const p = map[preset] || map.iso;
          const wasDamping = s.controls.enableDamping;
          s.controls.enableDamping = false;
          s.activeCamera.position.set(p[0], p[1], p[2]);
          s.controls.target.set(0, 0, 0);
          s.activeCamera.lookAt(0, 0, 0);
          s.controls.update();
          s.controls.enableDamping = wasDamping;
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
          const wasDamping = s.controls.enableDamping;
          s.controls.enableDamping = false;
          s.controls.update();
          s.controls.enableDamping = wasDamping;
        },
        importMeshFile: async (file) => {
          const originalName = file.name || "unknown";
          const ext = originalName.split(".").pop()?.toLowerCase();
          const allowedExts = ["stl", "obj", "ply", "gltf", "glb"];
          if (!ext || !allowedExts.includes(ext)) {
            throw new Error("Unsupported file type");
          }
          const s = stateRef.current;
          let object = null;
          try {
            if (ext === "stl") {
              const buf = await file.arrayBuffer();
              if (buf.byteLength > 50 * 1024 * 1024) throw new Error("File too large");
              const geom = new STLLoader().parse(buf);
              geom.computeVertexNormals();
              object = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45, metalness: 0.1 }));
            } else if (ext === "obj") {
              const txt = await file.text();
              if (txt.length > 10 * 1024 * 1024) throw new Error("File too large");
              const root = new OBJLoader().parse(txt);
              root.traverse((c) => { if (c.isMesh) c.material = new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45, metalness: 0.1 }); });
              object = root;
            } else if (ext === "ply") {
              const buf = await file.arrayBuffer();
              if (buf.byteLength > 50 * 1024 * 1024) throw new Error("File too large");
              const geom = new PLYLoader().parse(buf);
              geom.computeVertexNormals();
              object = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: 0x60a5fa, roughness: 0.45, metalness: 0.1 }));
            } else if (ext === "gltf" || ext === "glb") {
              const url = URL.createObjectURL(file);
              try {
                object = await new Promise((resolve, reject) => { new GLTFLoader().load(url, (g) => resolve(g.scene), undefined, reject); });
              } finally {
                URL.revokeObjectURL(url);
              }
            }
          } catch (err) {
            throw new Error(`Failed to parse ${ext.toUpperCase()}: ${err.message}`);
          }
          const id = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          object.userData.id = id;
          object.userData.fileName = originalName;
          s.scene.add(object);
          s.imported.set(id, object);
          sceneApiRef.current?.fitInView?.();
          return id;
        },
        exportAs: (format, sourceMeshes) => {
          const group = new THREE.Group();
          sourceMeshes.forEach((m) => group.add(m.clone()));
          if (format === "stl") return { content: new STLExporter().parse(group), mime: "model/stl", ext: "stl", binary: false };
          if (format === "obj") return { content: new OBJExporter().parse(group), mime: "text/plain", ext: "obj", binary: false };
          if (format === "ply") return { content: new PLYExporter().parse(group, undefined, { binary: false }), mime: "application/octet-stream", ext: "ply", binary: false };
          if (format === "gltf") return new Promise((resolve) => { new GLTFExporter().parse(group, (gltf) => resolve({ content: JSON.stringify(gltf), mime: "model/gltf+json", ext: "gltf", binary: false })); });
          if (format === "glb") return new Promise((resolve, reject) => { new GLTFExporter().parse(group, (glb) => resolve({ content: glb, mime: "model/gltf-binary", ext: "glb", binary: true }), { binary: true }, reject); });
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
      const s = stateRef.current;
      if (s.spotLight) {
        const idleDuration = Date.now() - s.lastActivityTime;
        const isIdle = idleDuration > 2000;
        const target = new THREE.Vector3();
        if (isIdle) {
          s.raycaster.setFromCamera(s.mouseNDC, s.activeCamera);
          const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hit = new THREE.Vector3();
          if (s.raycaster.ray.intersectPlane(ground, hit)) {
            target.set(hit.x, 10, hit.z);
          } else {
            target.set(0, 10, 0);
          }
        } else {
          target.set(0, 12, 0);
        }
        s.spotLight.position.lerp(target, 0.04);
        s.spotLight.target.position.lerp(new THREE.Vector3(0, 0, 0), 0.04);
      }
      renderer.render(scene, s.activeCamera);
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
      try { scene.remove(transformHelper); } catch { /* noop */ }
      try { transform.dispose(); } catch { /* noop */ }
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      if (boxSelectState.element && boxSelectState.element.parentNode) {
        boxSelectState.element.parentNode.removeChild(boxSelectState.element);
      }
    };
  }, [onObjectTransform, onSelect, sceneApiRef, onWorkplaneToggle, snap]);

  useEffect(() => {
    const s = stateRef.current;
    if (!s.scene) return;

    const drawHandleOverlay = (mesh) => {
      const hg = s.handleGroup;
      if (!hg) return;
      hg.clear();
      if (!mesh) { hg.visible = false; return; }

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
      [[min.x, yBase, min.z], [max.x, yBase, min.z], [min.x, yBase, max.z], [max.x, yBase, max.z]].forEach((p) => {
        const m = new THREE.Mesh(cornerGeo, whiteMat);
        m.position.set(...p);
        hg.add(m);
      });

      const edgeGeo = new THREE.BoxGeometry(markerSize * 0.9, markerSize * 0.9, markerSize * 0.9);
      [[(min.x + max.x) * 0.5, yBase, min.z], [(min.x + max.x) * 0.5, yBase, max.z], [min.x, yBase, (min.z + max.z) * 0.5], [max.x, yBase, (min.z + max.z) * 0.5]].forEach((p) => {
        const m = new THREE.Mesh(edgeGeo, blackMat);
        m.position.set(...p);
        hg.add(m);
      });

      const topGeo = new THREE.BoxGeometry(markerSize, markerSize, markerSize);
      const topSquare = new THREE.Mesh(topGeo, whiteMat);
      topSquare.position.set(center.x, yTop + markerSize * 0.5, center.z);
      hg.add(topSquare);

      const coneGeo = new THREE.ConeGeometry(markerSize * 0.45, markerSize * 1.35, 16);
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
      if (obj.hidden) {
        const mesh = s.meshes.get(obj.id);
        if (mesh) mesh.visible = false;
        return;
      }
      let mesh = s.meshes.get(obj.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          makeGeometry(obj.base || "box"),
          new THREE.MeshStandardMaterial({
            color: obj.hole ? HOLE_COLOR : (obj.color || DEFAULT_COLOR),
            transparent: !!obj.hole || !!obj.transparent,
            opacity: obj.hole ? 0.35 : (obj.transparent ? 0.5 : 1),
            roughness: obj.roughness ?? 0.45,
            metalness: obj.metalness ?? 0.08,
          }),
        );
        mesh.userData = { id: obj.id };
        s.scene.add(mesh);
        s.meshes.set(obj.id, mesh);
      } else {
        mesh.visible = true;
      }
      mesh.position.set(...obj.position);
      mesh.rotation.set(...obj.rotation);
      mesh.scale.set(...obj.scale);
      mesh.material.color.set(obj.hole ? HOLE_COLOR : (obj.color || DEFAULT_COLOR));
      mesh.material.opacity = obj.hole ? 0.35 : (obj.transparent ? 0.5 : 1);
      mesh.material.transparent = !!obj.hole || !!obj.transparent;
      const selected = selectedIds.includes(obj.id);
      mesh.material.emissive.set(selected ? "#f59e0b" : "#000000");
      mesh.material.emissiveIntensity = selected ? 0.18 : 0;
    });

    if (selectedIds.length === 1) {
      const mesh = s.meshes.get(selectedIds[0]) || s.imported.get(selectedIds[0]);
      if (mesh) {
        // Avoid re-attaching mid-drag: re-attach() resets world transforms and
        // can cause jumpy/blocked gizmo interaction. Only attach if needed.
        if (s.transform.object !== mesh) s.transform.attach(mesh);
        if (s.transform.mode !== mode) s.transform.setMode(mode);
        drawHandleOverlay(mesh);
      }
    } else {
      s.transform.detach();
      drawHandleOverlay(null);
    }
  }, [objects, selectedIds, mode]);

  useEffect(() => { stateRef.current.transform?.setMode(mode); }, [mode]);
  useEffect(() => {
    const t = stateRef.current.transform;
    if (!t) return;
    t.setTranslationSnap(snap);
    t.setScaleSnap(Math.max(snap * 0.1, 0.05));
    t.setRotationSnap(THREE.MathUtils.degToRad(22.5));
  }, [snap]);
  useEffect(() => { sceneApiRef.current?.setProjection?.(isPerspective); }, [isPerspective, sceneApiRef]);
  useEffect(() => {
    const s = stateRef.current;
    if (!s.workplane) return;
    s.workplaneActive = workplaneActive;
    s.workplane.visible = workplaneVisible;
  }, [workplaneActive, workplaneVisible]);
  useEffect(() => {
    const s = stateRef.current;
    if (!s.rulerLine || !s.rulerTextSprite) return;
    s.rulerActive = rulerActive;
    if (rulerActive && selectedIds.length === 2) {
      const mesh1 = s.meshes.get(selectedIds[0]) || s.imported.get(selectedIds[0]);
      const mesh2 = s.meshes.get(selectedIds[1]) || s.imported.get(selectedIds[1]);
      if (mesh1 && mesh2) {
        const pos1 = new THREE.Vector3();
        const pos2 = new THREE.Vector3();
        mesh1.getWorldPosition(pos1);
        mesh2.getWorldPosition(pos2);
        s.rulerLine.geometry.setFromPoints([pos1, pos2]);
        s.rulerLine.visible = true;
        const distance = pos1.distanceTo(pos2).toFixed(2);
        const midpoint = pos1.clone().add(pos2).multiplyScalar(0.5);
        s.rulerTextSprite.position.copy(midpoint);
        s.rulerTextSprite.position.y += 0.5;
        const canvas = s.rulerTextSprite.material.map.image;
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = 'bold 48px monospace';
        context.fillStyle = 'rgba(245, 158, 11, 1)';
        context.textAlign = 'center';
        context.fillText(`${distance} mm`, 128, 80);
        s.rulerTextSprite.material.map.needsUpdate = true;
        s.rulerTextSprite.visible = true;
      }
    } else {
      s.rulerLine.visible = false;
      s.rulerTextSprite.visible = false;
    }
  }, [rulerActive, selectedIds]);

  return <div ref={mountRef} className="w-full h-full" onContextMenu={(e) => e.preventDefault()} onDrop={onDrop} onDragOver={onDragOver} />;
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
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved
  const [isPerspective, setIsPerspective] = useState(true);
  const [alignOverlayOpen, setAlignOverlayOpen] = useState(false);
  const [mirrorOverlayOpen, setMirrorOverlayOpen] = useState(false);
  const [clipboard, setClipboard] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [historyState, setHistoryState] = useState({ past: [], future: [] });
  const [workplaneActive, setWorkplaneActive] = useState(false);
  const [workplaneVisible, setWorkplaneVisible] = useState(false);
  const [rulerActive, setRulerActive] = useState(false);

  const toggleWorkplane = useCallback(() => {
    setWorkplaneActive((v) => {
      const next = !v;
      if (next) {
        setWorkplaneVisible(true);
      } else {
        setWorkplaneVisible(false);
      }
      return next;
    });
  }, []);
  const [projectActionOpen, setProjectActionOpen] = useState(false);
  const [untitledCount, setUntitledCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const idCounter = useRef(1);
  const skipHistory = useRef(false);
  const skipAutosaveRef = useRef(false);

  // Only ever open the template picker for a brand-new design. Never seed a
  // phantom default box on saved-design routes — that's what made shapes
  // appear to "disappear" (a phantom box would flash first, then undo would
  // revert to it after reload).
  const templateOpenedRef = useRef(false);
  useEffect(() => {
    if (templateOpenedRef.current) return;
    if (!routeId || routeId === "new") {
      templateOpenedRef.current = true;
      setTemplatePickerOpen(true);
    }
  }, [routeId]);

  useEffect(() => {
    if (routeId && routeId !== "new" && designId && !projectActionOpen) {
      setProjectActionOpen(true);
    }
  }, [routeId, designId, projectActionOpen]);

  const applyTemplate = (template) => {
    const created = template.shapes.map((s) => ({
      id: idCounter.current++, key: s.key, label: s.label, base: s.base,
      hole: !!s.hole, position: s.position, rotation: s.rotation, scale: s.scale,
      color: s.hole ? HOLE_COLOR : DEFAULT_COLOR,
    }));
    setObjects(created);
    setSelectedIds([]);
    setTemplatePickerOpen(false);
  };

  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; return; }
    setHistoryState((prev) => ({ past: [...prev.past, JSON.stringify(objects)].slice(-100), future: [] }));
  }, [objects]);

  useEffect(() => {
    if (!routeId || routeId === "new") return;
    let cancelled = false;
    setLoading(true);
    api.get(`/designs/${routeId}`).then((r) => {
      if (cancelled) return;
      const d = r.data;
      setTitle(d.title || "");
      setDesignId(d.design_id);
      const saved = d.geometry?.objects || [];
      skipHistory.current = true;
      skipAutosaveRef.current = true; // don't immediately re-save what we just loaded
      // Load the real saved shapes (or a clean empty canvas). Never seed a box.
      // Also make the loaded state the undo baseline so Ctrl+Z can't wipe an
      // existing design back to an empty canvas.
      setObjects(saved);
      setHistoryState({ past: [JSON.stringify(saved)], future: [] });
      const numericIds = saved
        .map((o) => Number(o.id))
        .filter((n) => Number.isFinite(n) && n >= 0);
      idCounter.current = (numericIds.length ? Math.max(...numericIds) : 0) + 1;
    }).catch(() => { if (!cancelled) toast.error("Could not load design"); })
    .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [routeId]);

  // Always read the latest designId/objects/title inside the debounced callback.
  const autosaveSnapshot = useRef({ designId, objects, title });
  autosaveSnapshot.current = { designId, objects, title };
  const untitledAutoRef = useRef(1);

  // Debounced autosave (~1.2s) so shapes persist even if the user never clicks
  // Save — this stops shapes from "disappearing once I stop editing".
  useEffect(() => {
    if (skipAutosaveRef.current) { skipAutosaveRef.current = false; return; }
    if (!user) return;
    const timer = setTimeout(() => {
      const snap = autosaveSnapshot.current;
      if (!snap.objects.length && !snap.title.trim()) return;
      const finalTitle = snap.title.trim() || `Untitled Design ${untitledAutoRef.current}`;
      const payload = {
        title: finalTitle,
        description: "Updated in Print Cosmos Designer",
        geometry: { objects: snap.objects },
        is_public: true,
        model_path: null,
        image_paths: [],
      };
      setSaveStatus("saving");
      const req = snap.designId
        ? api.put(`/designs/${snap.designId}`, payload)
        : api.post("/designs", payload).then((r) => {
            setDesignId(r.data.design_id);
            untitledAutoRef.current += 1;
            return r;
          });
      req.then(() => setSaveStatus("saved")).catch(() => setSaveStatus("idle"));
    }, 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects, title, user]);

  const selected = useMemo(() => objects.find((o) => o.id === selectedIds[0]), [objects, selectedIds]);

  const handleShapeDragStart = (e, shapeDef) => {
    e.dataTransfer.setData('application/json', JSON.stringify(shapeDef));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    try {
      const shapeDef = JSON.parse(data);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const s = sceneApiRef.current?.stateRef?.current;
      if (s?.activeCamera) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(x, y), s.activeCamera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          addShape(shapeDef, [intersection.x, 0.5, intersection.z]);
        } else {
          addShape(shapeDef);
        }
      } else {
        addShape(shapeDef);
      }
    } catch (err) {
      console.warn('Failed to parse drag data:', err);
    }
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const addShape = (shapeDef, position = null) => {
    if (shapeDef.proOnly && !user?.is_pro) {
      toast.info("Hyperspace unlock required for this geometry");
      return;
    }
    const id = idCounter.current++;
    const s = sceneApiRef.current?.stateRef?.current;
    let finalPosition = position;
    
    if (!finalPosition && s?.workplane?.visible) {
      const wp = s.workplane;
      const localPos = new THREE.Vector3(0, 0.5, 0);
      localPos.applyQuaternion(wp.quaternion);
      localPos.add(wp.position);
      finalPosition = [localPos.x, localPos.y, localPos.z];
    } else if (!finalPosition) {
      finalPosition = [snap, 0.5, snap];
    }
    
    const next = {
      id, key: shapeDef.key, label: shapeDef.label, base: shapeDef.base,
      hole: !!shapeDef.hole,
      position: finalPosition,
      rotation: [0, 0, 0], scale: [1, 1, 1],
      color: shapeDef.hole ? HOLE_COLOR : DEFAULT_COLOR,
    };
    setObjects((prev) => [...prev, next]);
    setSelectedIds([id]);
  };

  const updateShapeFromTransform = useCallback((id, patch) => {
    // Snap=0 previously caused Math.round(v / 0) → Infinity (shapes "flying
    // away"/disappearing). Treat 0 as "no snapping".
    const applySnap = (arr) => arr.map((v, idx) => {
      const raw = Number(v.toFixed(3));
      if (idx === 1 || !snap) return raw;
      return Number((Math.round(raw / snap) * snap).toFixed(3));
    });
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch, position: applySnap(patch.position || o.position) } : o)));
  }, [snap]);

  const onSelect = useCallback((id, withAdditive) => {
    if (id == null) return setSelectedIds([]);
    if (withAdditive) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setSelectedIds((prev) => (prev.length === 1 && prev[0] === id ? prev : [id]));
  }, []);

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
      return { ...item, id, position: [item.position[0] + snap, item.position[1], item.position[2] + snap] };
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
        return { ...item, id, position: [item.position[0] + snap, item.position[1], item.position[2] + snap] };
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

  const updateSelectedMaterial = (field, value) => {
    if (!selected) return;
    setObjects((prev) => prev.map((o) => (o.id === selected.id ? { ...o, [field]: value } : o)));
  };

  const toggleSelectedHole = () => {
    if (!selected) return;
    setObjects((prev) => prev.map((o) => (o.id === selected.id ? { ...o, hole: !o.hole } : o)));
  };

  const toggleSelectedTransparent = () => {
    if (!selected) return;
    setObjects((prev) => prev.map((o) => (o.id === selected.id ? { ...o, transparent: !o.transparent } : o)));
  };

  const hideSelected = () => {
    if (!selectedIds.length) return;
    setObjects((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, hidden: true } : o)));
    setSelectedIds([]);
    toast.success("Hidden");
  };

  const showAllHidden = () => {
    setObjects((prev) => prev.map((o) => (o.hidden ? { ...o, hidden: false } : o)));
    toast.success("All visible");
  };

  const selectAll = () => {
    if (!objects.length) return;
    setSelectedIds(objects.map((o) => o.id));
  };

  const undo = () => {
    setHistoryState((prev) => {
      if (prev.past.length < 2) return prev;
      const past = [...prev.past];
      past.pop();
      const previous = past[past.length - 1];
      skipHistory.current = true;
      setObjects(JSON.parse(previous));
      return { past, future: [] };
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
    if (selectedIds.length < 2) { toast.info("Select at least two shapes to group"); return; }
    const groupId = `grp_${Date.now()}`;
    setObjects((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, groupId } : o)));
    toast.success("Grouped");
  };

  const ungroupSelection = () => {
    if (!selectedIds.length) return;
    setObjects((prev) => prev.map((o) => (selectedIds.includes(o.id) ? { ...o, groupId: null } : o)));
    toast.success("Ungrouped");
  };

  const alignSelection = (axis, mode) => {
    if (selectedIds.length < 2) return;
    const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
    const positions = selectedObjects.map((o) => o.position[axis]);
    const sizes = selectedObjects.map((o) => o.scale[axis]);

    let targetPos;
    if (mode === 'min') {
      targetPos = Math.min(...positions);
    } else if (mode === 'center') {
      const mins = positions.map((p, i) => p - sizes[i] / 2);
      const maxs = positions.map((p, i) => p + sizes[i] / 2);
      targetPos = (Math.min(...mins) + Math.max(...maxs)) / 2;
    } else if (mode === 'max') {
      targetPos = Math.max(...positions);
    }

    setObjects((prev) => prev.map((o) => {
      if (!selectedIds.includes(o.id)) return o;
      const nextPos = [...o.position];
      nextPos[axis] = targetPos;
      return { ...o, position: nextPos };
    }));
    toast.success(`Aligned on ${['X', 'Y', 'Z'][axis]}`);
  };

  const mirrorSelection = (axis) => {
    if (!selectedIds.length) return;
    const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
    const positions = selectedObjects.map((o) => o.position[axis]);
    const center = (Math.min(...positions) + Math.max(...positions)) / 2;
    setObjects((prev) => prev.map((o) => {
      if (!selectedIds.includes(o.id)) return o;
      const nextPos = [...o.position];
      nextPos[axis] = center * 2 - nextPos[axis];
      const nextRot = [...o.rotation];
      nextRot[axis] = -nextRot[axis];
      return { ...o, position: nextPos, rotation: nextRot };
    }));
    toast.success(`Mirrored on ${['X', 'Y', 'Z'][axis]}`);
  };

  const nudgeSelection = (dx, dy, dz) => {
    if (!selectedIds.length) return;
    setObjects((prev) => prev.map((o) => {
      if (!selectedIds.includes(o.id)) return o;
      return { ...o, position: [Number((o.position[0] + dx).toFixed(3)), Number((o.position[1] + dy).toFixed(3)), Number((o.position[2] + dz).toFixed(3))] };
    }));
  };

  const saveDesign = async () => {
    if (!user) return openAuth("signin");
    const finalTitle = title.trim() || `Untitled Design ${untitledCount}`;
    if (!title.trim()) { setTitle(finalTitle); setUntitledCount((prev) => prev + 1); }
    setSaving(true);
    try {
      if (designId) {
        await api.put(`/designs/${designId}`, { title: finalTitle, description: "Updated in Print Cosmos Designer", geometry: { objects }, is_public: true, model_path: null, image_paths: [] });
        toast.success("Design updated");
      } else {
        const r = await api.post("/designs", { title: finalTitle, description: "Created in Print Cosmos Designer", geometry: { objects }, is_public: true, model_path: null, image_paths: [] });
        setDesignId(r.data.design_id);
        toast.success("Design saved");
      }
    } catch { toast.error("Could not save"); }
    finally { setSaving(false); }
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
      const safeTitle = (title || "print_cosmos_design").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
      a.download = `${safeTitle}.${file.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} exported`);
    } catch { toast.error("Export failed"); }
  };

  const importMesh = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await sceneApiRef.current?.importMeshFile?.(file);
      toast.success(`${file.name} imported`);
    } catch { toast.error("Import failed: use STL, OBJ, PLY, GLTF, or GLB"); }
    finally { event.target.value = ""; }
  };

  const sendTo = async () => {
    if (!designId) { toast.info("Save your design before sharing"); return; }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/designer/${designId}`);
      toast.success("Share link copied");
      setShareDialogOpen(false);
    } catch { toast.error("Could not copy link"); }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      // Escape deselects so the transform gizmo never traps the user — they can
      // immediately pick another shape.
      if (e.key === "Escape" && !(document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA")) {
        setSelectedIds([]);
        return;
      }
      if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); copySelected(); return; }
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); pasteClipboard(); return; }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateRepeat(); return; }
      if (mod && e.key.toLowerCase() === "g" && !e.shiftKey) { e.preventDefault(); groupSelection(); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === "g") { e.preventDefault(); ungroupSelection(); return; }
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && !(document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA")) { e.preventDefault(); removeSelected(); return; }
      if (e.key.toLowerCase() === "a" && mod) { e.preventDefault(); selectAll(); return; }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); sceneApiRef.current?.fitInView?.(); return; }
      if (mod && e.shiftKey && e.key.toLowerCase() === "h") { e.preventDefault(); showAllHidden(); return; }
      if (mod && e.key.toLowerCase() === "h" && !e.shiftKey) { e.preventDefault(); hideSelected(); return; }
      if (e.key.toLowerCase() === "w" && !mod) { toggleWorkplane(); return; }
      if (e.key.toLowerCase() === "r" && !mod && !e.shiftKey) { setMode("rotate"); return; }
      if (e.key.toLowerCase() === "s" && !mod) { setMode("scale"); return; }
      if (e.key.toLowerCase() === "b" && !mod) { setMode("translate"); return; }
      if (e.key.toLowerCase() === "l" && !mod) { setAlignOverlayOpen((v) => !v); return; }
      if (e.key.toLowerCase() === "m" && !mod) { setMirrorOverlayOpen((v) => !v); return; }
      if (e.key.toLowerCase() === "r" && e.shiftKey && !mod) { setRulerActive((v) => !v); return; }

      const step = 0.5;
      const zStep = 0.25;
      if (e.key === "ArrowLeft") { e.preventDefault(); if (mod) nudgeSelection(0, 0, -zStep); else nudgeSelection(-step, 0, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); if (mod) nudgeSelection(0, 0, zStep); else nudgeSelection(step, 0, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (mod) nudgeSelection(0, zStep, 0); else nudgeSelection(0, 0, -step); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (mod) nudgeSelection(0, -zStep, 0); else nudgeSelection(0, 0, step); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, clipboard, objects]);

  const shapeList = SHAPE_LIBRARY[libraryTab] || [];

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <div className="flex flex-col items-center gap-4">
          <CosmosLoader isActive={true} size={64} color="#00e5ff" operationType="load" />
          <p className="font-tech text-xs text-muted-foreground animate-pulse">Loading design...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="designer-page" className="pt-14">
      <div className="h-[calc(100vh-3.5rem)] relative bg-[#111217]">
        {/* Top toolbar */}
        <div className="absolute top-0 left-0 right-0 z-20 h-12 border-b border-border bg-card/95 backdrop-blur px-3 flex items-center gap-2 overflow-x-auto">
          <ToolbarButton icon={Sparkles} label="Templates" onClick={() => setTemplatePickerOpen(true)} />
          <Menubar className="h-8 bg-transparent border-none shadow-none p-0 gap-1 shrink-0">
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => navigate("/")}><Home className="h-3.5 w-3.5 mr-2" /> Home</MenubarItem>
                <MenubarItem onClick={() => fileInputRef.current?.click()}><Upload className="h-3.5 w-3.5 mr-2" /> Import</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={() => setShareDialogOpen(true)}><Send className="h-3.5 w-3.5 mr-2" /> Send To</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={copySelected}><Copy className="h-3.5 w-3.5 mr-2" /> Copy</MenubarItem>
                <MenubarItem onClick={pasteClipboard} disabled={!clipboard?.length}><ClipboardPaste className="h-3.5 w-3.5 mr-2" /> Paste</MenubarItem>
                <MenubarItem onClick={duplicateRepeat}><CopyPlus className="h-3.5 w-3.5 mr-2" /> Duplicate</MenubarItem>
                <MenubarItem onClick={removeSelected}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={undo}><Undo2 className="h-3.5 w-3.5 mr-2" /> Undo</MenubarItem>
                <MenubarItem onClick={redo}><Redo2 className="h-3.5 w-3.5 mr-2" /> Redo</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => sceneApiRef.current?.showAll?.()}><Lightbulb className="h-3.5 w-3.5 mr-2" /> Show All</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger className="h-8 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider px-2.5">Export</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => exportMesh("stl")}><Download className="h-3.5 w-3.5 mr-2" /> STL</MenubarItem>
                <MenubarItem onClick={() => exportMesh("obj")}><Download className="h-3.5 w-3.5 mr-2" /> OBJ</MenubarItem>
                <MenubarItem onClick={() => exportMesh("ply")}><Download className="h-3.5 w-3.5 mr-2" /> PLY</MenubarItem>
                <MenubarItem onClick={() => exportMesh("gltf")}><Download className="h-3.5 w-3.5 mr-2" /> GLTF</MenubarItem>
                <MenubarItem onClick={() => exportMesh("glb")}><Download className="h-3.5 w-3.5 mr-2" /> GLB</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <input ref={fileInputRef} type="file" accept=".stl,.obj,.ply,.gltf,.glb" onChange={importMesh} className="hidden" />
          <div className="ml-auto flex items-center gap-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Design title" className="h-8 w-56 font-tech text-xs" />
            <Button onClick={saveDesign} disabled={saving} className="h-8 rounded-xl font-tech text-xs uppercase tracking-wider" title="Changes are auto-saved">
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "saving" ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/designer")} className="h-8 rounded-xl font-tech text-xs uppercase tracking-wider">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Workshop
            </Button>
          </div>
        </div>

        {/* ViewCube panel */}
        <div className="absolute left-3 top-16 z-20 w-40 rounded-xl border border-border bg-card/95 backdrop-blur p-2 space-y-2">
          <div className="text-[9px] font-tech uppercase tracking-[0.22em] text-muted-foreground">ViewCube</div>
          <div className="grid grid-cols-3 gap-1 text-[9px] font-tech uppercase tracking-wider">
            <CubeBtn label="Top" onClick={() => sceneApiRef.current?.viewTo?.("top")} />
            <CubeBtn label="Left" onClick={() => sceneApiRef.current?.viewTo?.("left")} />
            <CubeBtn label="Iso" onClick={() => sceneApiRef.current?.viewTo?.("iso")} />
            <CubeBtn label="Right" onClick={() => sceneApiRef.current?.viewTo?.("right")} />
            <CubeBtn label="Front" onClick={() => sceneApiRef.current?.viewTo?.("front")} />
            <CubeBtn label="Back" onClick={() => sceneApiRef.current?.viewTo?.("back")} />
          </div>
          <div className="grid grid-cols-2 gap-1">
            <OverlayBtn icon={Home} label="Home" onClick={() => sceneApiRef.current?.homeView?.()} />
            <OverlayBtn icon={Frame} label="Fit" onClick={() => sceneApiRef.current?.fitInView?.()} />
            <OverlayBtn icon={ZoomIn} label="Zoom +" onClick={() => sceneApiRef.current?.zoomBy?.(-2)} />
            <OverlayBtn icon={ZoomOut} label="Zoom -" onClick={() => sceneApiRef.current?.zoomBy?.(2)} />
          </div>
          <button onClick={() => setIsPerspective((v) => !v)} className="w-full h-7 rounded-xl border border-border text-[9px] font-tech uppercase tracking-wider hover:border-primary">
            {isPerspective ? "Perspective" : "Orthographic"}
          </button>
        </div>

        {/* Right panel - Shape library */}
        <div className={`absolute top-16 right-0 bottom-0 border-l border-border bg-card/95 backdrop-blur z-20 flex flex-col transition-all ${libraryCollapsed ? "w-14" : "w-[340px]"}`}>
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-tech uppercase tracking-[0.25em] text-muted-foreground">Shapes</div>
              <button type="button" onClick={() => setLibraryCollapsed((v) => !v)} className="h-7 w-7 border border-border rounded-xl inline-flex items-center justify-center hover:border-primary">
                <Layers className="h-3.5 w-3.5" />
              </button>
            </div>
            {!libraryCollapsed && <div className="flex flex-wrap gap-1">
              {TAB_ORDER.map((tab) => (
                <button key={tab} onClick={() => setLibraryTab(tab)}
                  className={`h-6 px-2 rounded-xl border text-[9px] font-tech uppercase tracking-wider ${libraryTab === tab ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                  {tab}
                </button>
              ))}
            </div>}
          </div>

          {!libraryCollapsed && <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {shapeList.map((shape) => (
                <button key={shape.key} onClick={() => addShape(shape)}
                  className={`h-20 border rounded-xl p-2 text-left hover:border-primary cursor-grab active:cursor-grabbing ${shape.proOnly && !user?.is_pro ? "opacity-45" : ""}`}>
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
                <ModeBtn label="Move (B)" active={mode === "translate"} onClick={() => setMode("translate")} />
                <ModeBtn label="Rotate (R)" active={mode === "rotate"} onClick={() => setMode("rotate")} />
                <ModeBtn label="Scale (S)" active={mode === "scale"} onClick={() => setMode("scale")} />
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
            <div className="grid grid-cols-2 gap-1">
              <button onClick={toggleWorkplane} className={`h-7 border rounded-xl text-[9px] font-tech uppercase tracking-wider inline-flex items-center justify-center gap-1 hover:border-primary ${workplaneActive ? "border-primary text-primary" : "border-border"}`}><Grid3X3 className="h-3 w-3" /> Workplane (W)</button>
              <button onClick={() => setRulerActive((v) => !v)} className={`h-7 border rounded-xl text-[9px] font-tech uppercase tracking-wider inline-flex items-center justify-center gap-1 hover:border-primary ${rulerActive ? "border-primary text-primary" : "border-border"}`}><Ruler className="h-3 w-3" /> Ruler (⇧R)</button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">Snap</span>
              <select value={snap} onChange={(e) => setSnap(Number(e.target.value))} className="h-7 flex-1 border border-border rounded-xl bg-background text-[10px] font-tech px-2">
                <option value={0}>Off</option>
                <option value={0.1}>0.1 mm</option>
                <option value={0.25}>0.25 mm</option>
                <option value={0.5}>0.5 mm</option>
                <option value={1}>1 mm</option>
                <option value={2}>2 mm</option>
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
                  <span>Transparent</span>
                  <input type="checkbox" checked={selected.transparent} onChange={toggleSelectedTransparent} />
                </label>
                <label className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider">
                  <span>Color</span>
                  <input type="color" value={selected.color || DEFAULT_COLOR} onChange={(e) => updateSelectedColor(e.target.value)} className="h-7 w-16 bg-transparent" />
                </label>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">Material</div>
                  <label className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider">
                    <span>Roughness</span>
                    <input type="range" min="0" max="1" step="0.05" value={selected.roughness ?? 0.45} onChange={(e) => updateSelectedMaterial("roughness", parseFloat(e.target.value))} className="w-24" />
                    <span className="w-8 text-right">{(selected.roughness ?? 0.45).toFixed(2)}</span>
                  </label>
                  <label className="flex items-center justify-between text-[10px] font-tech uppercase tracking-wider">
                    <span>Metalness</span>
                    <input type="range" min="0" max="1" step="0.05" value={selected.metalness ?? 0.08} onChange={(e) => updateSelectedMaterial("metalness", parseFloat(e.target.value))} className="w-24" />
                    <span className="w-8 text-right">{(selected.metalness ?? 0.08).toFixed(2)}</span>
                  </label>
                </div>
                <TeaserUI selected={selected} onMaterialChange={updateSelectedMaterial} onColorChange={updateSelectedColor} />
              </div>
            ) : null}
          </div>}
        </div>

        {/* 3D Canvas */}
        <div className={`absolute top-12 left-0 bottom-0 ${libraryCollapsed ? "right-[56px]" : "right-[340px]"}`}>
          <ThreeCanvas
            objects={objects} selectedIds={selectedIds} onSelect={onSelect}
            onObjectTransform={updateShapeFromTransform} mode={mode} snap={snap}
            isPerspective={isPerspective} sceneApiRef={sceneApiRef}
            onDrop={handleCanvasDrop} onDragOver={handleCanvasDragOver}
            workplaneActive={workplaneActive} workplaneVisible={workplaneVisible} onWorkplaneToggle={toggleWorkplane}
            rulerActive={rulerActive} onRulerToggle={setRulerActive}
          />
        </div>

        {/* Bottom hint bar */}
        {selected && (
          <div className="absolute left-1/2 bottom-3 -translate-x-1/2 z-20 rounded-xl border border-border bg-card/90 backdrop-blur px-3 py-2 text-[10px] font-tech uppercase tracking-wider text-muted-foreground whitespace-nowrap">
            White corners: resize · Black edges: stretch · Top cone: elevate · Arrows: rotate · Shift: uniform scale
          </div>
        )}

        {/* Align overlay */}
        {alignOverlayOpen && (
          <div className="absolute left-1/2 top-20 -translate-x-1/2 z-30 border border-border bg-card rounded-xl p-4 text-xs font-tech">
            <div className="mb-2 text-[10px] font-medium text-foreground">Align Tool (L)</div>
            <div className="space-y-2">
              {[0, 1, 2].map((axis) => (
                <div key={axis} className="flex gap-2">
                  {['min', 'center', 'max'].map((m) => (
                    <button key={m} onClick={() => alignSelection(axis, m)} className="flex-1 text-left p-2 border border-border rounded hover:bg-primary/10 text-[10px]">
                      {['X', 'Y', 'Z'][axis]} {m}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <button onClick={() => setAlignOverlayOpen(false)} className="mt-3 w-full border border-border rounded px-2 py-1 text-[9px] font-tech">Close</button>
          </div>
        )}

        {/* Mirror overlay */}
        {mirrorOverlayOpen && (
          <div className="absolute left-1/2 top-32 -translate-x-1/2 z-30 border border-border bg-card rounded-xl p-4 text-xs font-tech">
            <div className="mb-2 text-[10px] font-medium text-foreground">Mirror Tool (M)</div>
            <div className="flex gap-2">
              {[0, 1, 2].map((axis) => (
                <button key={axis} onClick={() => mirrorSelection(axis)} className="flex-1 text-left p-2 border border-border rounded hover:bg-primary/10 text-[10px]">
                  Mirror {['X', 'Y', 'Z'][axis]}
                </button>
              ))}
            </div>
            <button onClick={() => setMirrorOverlayOpen(false)} className="mt-3 w-full border border-border rounded px-2 py-1 text-[9px] font-tech">Close</button>
          </div>
        )}

        {/* Workplane hint */}
        {workplaneVisible && (
          <div className="absolute left-1/2 bottom-12 -translate-x-1/2 z-30 border border-border bg-card rounded-xl px-3 py-2 text-[10px] font-tech uppercase tracking-wider">
            Workplane Active (W) — Click a face to place
          </div>
        )}

        {/* Ruler hint */}
        {rulerActive && (
          <div className="absolute left-1/2 bottom-12 -translate-x-1/2 z-30 border border-border bg-card rounded-xl px-3 py-2 text-[10px] font-tech uppercase tracking-wider">
            Ruler Active (⇧R) — Select two shapes to measure
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={projectActionOpen} onOpenChange={setProjectActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl">Project Actions</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setProjectActionOpen(false)} className="h-20 rounded-xl font-tech text-xs uppercase tracking-wider flex flex-col gap-2"><Sparkles className="h-6 w-6" /> Edit</Button>
            <Button onClick={() => { setProjectActionOpen(false); setShareDialogOpen(true); }} className="h-20 rounded-xl font-tech text-xs uppercase tracking-wider flex flex-col gap-2"><Send className="h-6 w-6" /> Share</Button>
            <Button onClick={() => { setProjectActionOpen(false); exportMesh("stl"); }} className="h-20 rounded-xl font-tech text-xs uppercase tracking-wider flex flex-col gap-2"><Download className="h-6 w-6" /> Download</Button>
            <Button onClick={() => { setProjectActionOpen(false); sendTo(); }} className="h-20 rounded-xl font-tech text-xs uppercase tracking-wider flex flex-col gap-2"><Copy className="h-6 w-6" /> Copy Link</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl">Send To</DialogTitle></DialogHeader>
          <Textarea value={designId ? `${window.location.origin}/designer/${designId}` : "Save first to generate share route"} readOnly rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Close</Button>
            <Button onClick={sendTo} className="rounded-xl font-tech text-xs uppercase tracking-wider">Copy Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={templatePickerOpen} onOpenChange={setTemplatePickerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="font-display text-2xl">Start from a template</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)} data-testid={`template-${t.id}`}
                className="text-left border border-border rounded-xl p-3 hover:border-primary hover:bg-secondary/50 transition-colors flex items-start gap-3">
                <div className="shrink-0 w-16 h-16 rounded-lg bg-secondary/50 flex items-center justify-center overflow-hidden">
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-tech text-xs uppercase tracking-wider mb-0.5">{t.label}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{t.description}</div>
                </div>
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
    <button type="button" onClick={onClick} disabled={disabled}
      className="h-8 px-2 rounded-xl border border-border text-[10px] font-tech uppercase tracking-wider inline-flex items-center gap-1 hover:border-primary disabled:opacity-40" title={label}>
      <Icon className="h-3.5 w-3.5" /><span>{label}</span>
    </button>
  );
}

function CubeBtn({ label, onClick, className = "" }) {
  return <button type="button" onClick={onClick} className={`h-6 rounded-xl border border-border hover:border-primary ${className}`}>{label}</button>;
}

function OverlayBtn({ icon: Icon, label, onClick }) {
  return <button type="button" title={label} onClick={onClick} className="h-7 rounded-xl border border-border inline-flex items-center justify-center hover:border-primary"><Icon className="h-3.5 w-3.5" /></button>;
}

function ModeBtn({ label, active, onClick }) {
  return <button type="button" onClick={onClick} className={`h-7 rounded-xl border text-[9px] font-tech uppercase tracking-wider ${active ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{label}</button>;
}

function PropRow({ label, value, onChange }) {
  return (
    <div>
      <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
      <div className="grid grid-cols-3 gap-1">
        {value.map((v, idx) => (
          <input key={`${label}-${idx}`} type="number" step="0.1" value={Number(v).toFixed(2)}
            onChange={(e) => onChange(idx, e.target.value)}
            className="h-7 px-2 border border-border rounded-xl bg-background text-[10px] font-tech" />
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