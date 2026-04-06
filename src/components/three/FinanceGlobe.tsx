import { useCallback, useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { GLView, type ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";
import Constants from "expo-constants";

type Props = {
  size?: number;
  fallback: React.ReactNode;
  /** Relative scale for income nodes (e.g. largest income / baseline) */
  incomeScale?: number;
  /** Relative scale for expense nodes */
  expenseScale?: number;
};

function createRenderer(gl: ExpoWebGLRenderingContext, w: number, h: number) {
  const canvasStub = {
    width: w,
    height: h,
    style: {} as unknown,
    addEventListener: () => {},
    removeEventListener: () => {},
    clientHeight: h,
    clientWidth: w,
  } as unknown as HTMLCanvasElement;
  return new THREE.WebGLRenderer({
    canvas: canvasStub,
    context: gl as unknown as WebGLRenderingContext,
    antialias: true,
  });
}

const vertexShader = `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  float fresnel = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 2.5);
  vec3 coreColor = vec3(0.039, 0.039, 0.118);
  vec3 glowColor = vec3(0.424, 0.388, 1.0);
  vec3 col = mix(coreColor, glowColor, fresnel);
  gl_FragColor = vec4(col, 0.85);
}
`;

const IS_EXPO_GO = Constants.appOwnership === "expo" || Constants.executionEnvironment === "storeClient";

export function FinanceGlobe({ size = 200, fallback, incomeScale = 1, expenseScale = 1 }: Props) {
  const [useFallback, setUseFallback] = useState(IS_EXPO_GO);
  const glContextReceived = useRef(false);
  const rafRef = useRef(0);
  const runningRef = useRef(true);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const nodesRef = useRef<THREE.Group | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);

  useEffect(() => {
    if (IS_EXPO_GO) return;
    glContextReceived.current = false;
    const timeout = setTimeout(() => {
      if (!glContextReceived.current) setUseFallback(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    runningRef.current = true;
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      const r = rendererRef.current;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      sphereRef.current = null;
      nodesRef.current = null;
      if (r) {
        r.dispose();
      }
    };
  }, []);

  const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
    glContextReceived.current = true;
    glRef.current = gl;
    try {
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const renderer = createRenderer(gl, width, height);
      renderer.setSize(width, height);
      renderer.setClearColor(0x0a0a0f, 1);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
      camera.position.z = 3.2;
      cameraRef.current = camera;

      scene.add(new THREE.AmbientLight(0x1a1a3e, 0.8));
      const pt = new THREE.PointLight(0x6c63ff, 1.5, 20);
      pt.position.set(2, 2, 3);
      scene.add(pt);

      const geo = new THREE.IcosahedronGeometry(1.2, 4);
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        wireframe: false,
        transparent: true,
      });
      const sphere = new THREE.Mesh(geo, mat);
      scene.add(sphere);
      sphereRef.current = sphere;

      const baseIco = new THREE.IcosahedronGeometry(1.28, 0);
      const pos = baseIco.attributes.position;
      const nodes = new THREE.Group();
      const incS = 0.028 + Math.min(0.06, incomeScale * 0.02);
      const expS = 0.028 + Math.min(0.06, expenseScale * 0.02);

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const isIncome = i % 2 === 0;
        const s = isIncome ? incS : expS;
        const g = new THREE.SphereGeometry(s, 10, 10);
        const m = new THREE.MeshBasicMaterial({ color: isIncome ? 0x00d4aa : 0xff6b9d });
        const mesh = new THREE.Mesh(g, m);
        mesh.position.set(x, y, z);
        nodes.add(mesh);
      }
      scene.add(nodes);
      nodesRef.current = nodes;

      const renderFrame = () => {
        if (!runningRef.current) return;
        const gll = glRef.current;
        if (gll && "isContextLost" in gll && typeof gll.isContextLost === "function" && gll.isContextLost()) {
          setUseFallback(true);
          return;
        }
        rafRef.current = requestAnimationFrame(renderFrame);
        if (sphereRef.current) sphereRef.current.rotation.y += 0.003;
        if (nodesRef.current) nodesRef.current.rotation.y -= 0.003;
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
        gl.endFrameEXP();
      };
      renderFrame();
    } catch {
      setUseFallback(true);
    }
  }, [incomeScale, expenseScale]);

  if (useFallback) {
    return <View style={{ width: size, height: size }}>{fallback}</View>;
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.04)",
      }}
    >
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
    </View>
  );
}
