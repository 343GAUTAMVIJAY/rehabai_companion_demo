import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { RobotStatus } from '@/lib/mockData';
import * as THREE from 'three';

interface Props {
  gripForce: number;
  xAxis: number;
  yAxis: number;
  zAxis: number;
  status: RobotStatus;
}

const statusColor = (s: RobotStatus) => s === 'SAFE' ? '#10b981' : s === 'CAUTION' ? '#f59e0b' : '#ef4444';

function RobotArmModel({ gripForce, xAxis, yAxis, zAxis, status }: Props) {
  const color = useMemo(() => statusColor(status), [status]);
  const grip = Math.max(0.05, Math.min(0.4, gripForce / 25));

  // More responsive rotation mapping
  const targetRx = (xAxis / 10) * Math.PI * 0.25;
  const targetRy = (yAxis / 10) * Math.PI * 0.25;
  const targetRz = (zAxis / 10) * Math.PI * 0.15;

  const seg1Ref = useRef<THREE.Group>(null);
  const seg2Ref = useRef<THREE.Group>(null);
  const seg3Ref = useRef<THREE.Group>(null);
  const gripL = useRef<THREE.Mesh>(null);
  const gripR = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (seg1Ref.current) {
      seg1Ref.current.rotation.z = THREE.MathUtils.lerp(seg1Ref.current.rotation.z, targetRx, 0.08);
    }
    if (seg2Ref.current) {
      seg2Ref.current.rotation.x = THREE.MathUtils.lerp(seg2Ref.current.rotation.x, targetRy, 0.08);
    }
    if (seg3Ref.current) {
      seg3Ref.current.rotation.x = THREE.MathUtils.lerp(seg3Ref.current.rotation.x, targetRz, 0.08);
    }
    if (gripL.current) {
      gripL.current.position.x = THREE.MathUtils.lerp(gripL.current.position.x, -grip, 0.1);
    }
    if (gripR.current) {
      gripR.current.position.x = THREE.MathUtils.lerp(gripR.current.position.x, grip, 0.1);
    }
  });

  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.6, 0.7, 0.3, 32]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Segment 1 */}
      <group ref={seg1Ref}>
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.2, 1, 0.2]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Joint 1 */}
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Segment 2 */}
        <group ref={seg2Ref} position={[0, 1.3, 0]}>
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[0.16, 0.8, 0.16]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Joint 2 */}
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Segment 3 */}
          <group ref={seg3Ref} position={[0, 0.9, 0]}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.12, 0.5, 0.12]} />
              <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
            </mesh>
            {/* Gripper */}
            <mesh ref={gripL} position={[-grip, 0.7, 0]}>
              <boxGeometry args={[0.04, 0.2, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh ref={gripR} position={[grip, 0.7, 0]}>
              <boxGeometry args={[0.04, 0.2, 0.08]} />
              <meshStandardMaterial color="#9ca3af" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

const RobotArm3D = (props: Props) => (
  <Canvas camera={{ position: [3, 3, 3], fov: 45 }}>
    <ambientLight intensity={0.5} />
    <directionalLight position={[5, 5, 5]} intensity={1} />
    <pointLight position={[-3, 3, -3]} intensity={0.5} />
    <RobotArmModel {...props} />
    <OrbitControls enableZoom={true} minDistance={2} maxDistance={10} />
    <gridHelper args={[4, 8, '#e5e7eb', '#e5e7eb']} />
  </Canvas>
);

export default RobotArm3D;
