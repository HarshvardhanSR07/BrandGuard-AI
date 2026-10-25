import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BrandShield3DProps {
  status?: 'verified' | 'evaluating' | 'alert';
  size?: number;
  className?: string;
}

export const BrandShield3D: React.FC<BrandShield3DProps> = ({
  status = 'verified',
  size = 48,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4.2;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Color based on status matching new palette
    let coreColor = 0xa3e635; // Electric chartreuse lime
    let wireColor = 0xd9f99d;
    if (status === 'verified') {
      coreColor = 0xa3e635;
      wireColor = 0xbef264;
    } else if (status === 'alert') {
      coreColor = 0xef4444;
      wireColor = 0xfca5a5;
    } else {
      coreColor = 0xf59e0b;
      wireColor = 0xfde68a;
    }

    // Outer Geometric Shield / Icosahedron
    const outerGeo = new THREE.IcosahedronGeometry(1.4, 0);
    const outerMat = new THREE.MeshBasicMaterial({
      color: wireColor,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    scene.add(outerMesh);

    // Inner Core / Octahedron
    const innerGeo = new THREE.OctahedronGeometry(0.85, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      wireframe: false,
      transparent: true,
      opacity: 0.9,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambient);

    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Procedural rotation
      outerMesh.rotation.x += 0.008;
      outerMesh.rotation.y += 0.012;

      innerMesh.rotation.x -= 0.014;
      innerMesh.rotation.y -= 0.01;

      // Mouse tilt responsiveness
      outerMesh.rotation.x += mouseY * 0.02;
      outerMesh.rotation.y += mouseX * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [status, size]);

  return (
    <div
      ref={mountRef}
      style={{ width: size, height: size }}
      className={`inline-block overflow-hidden shrink-0 cursor-pointer ${className}`}
      title={`BrandGuard 3D Shield (${status})`}
    />
  );
};
