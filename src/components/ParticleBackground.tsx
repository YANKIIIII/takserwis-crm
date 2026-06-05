'use client';

import { useEffect, useRef, useState } from 'react';

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    setSize();

    // 1. Grid particles (the terrain wave)
    const gridParticles: any[] = [];
    const cols = 80;
    const rows = 60;
    const spacing = 50;
    
    const gridWidth = cols * spacing;
    const gridDepth = rows * spacing;

    for (let x = 0; x < cols; x++) {
      for (let z = 0; z < rows; z++) {
        gridParticles.push({
          x: x * spacing - gridWidth / 2 + (Math.random() * 10 - 5), // slight jitter
          z: z * spacing - gridDepth / 2 + (Math.random() * 10 - 5),
          isHighlight: Math.random() > 0.8, // 20% are highlighted (orange)
          currentPull: 0, // Used for smooth spring physics
        });
      }
    }

    // 2. Floating bokeh particles
    const floatingParticles: any[] = [];
    for (let i = 0; i < 150; i++) {
      floatingParticles.push({
        x: (Math.random() - 0.5) * gridWidth * 1.5,
        y: (Math.random() - 0.5) * 800 - 200, 
        z: (Math.random() - 0.5) * gridDepth * 1.5,
        size: Math.random() * 4 + 1.5, // bokeh size
        speed: Math.random() * 0.8 + 0.2, // falling speed
      });
    }

    let time = 0;
    let animationFrameId: number;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / width - 0.5) * 2;
      mouseY = (e.clientY / height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      time += 0.015;

      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2 + 150; // Shift camera down so the wave sits nicely

      const fov = 700;
      const zOff = 800; // Camera distance
      
      // Camera rotation (fixed tilt, slow automated panning)
      const rotX = Math.PI / 7; // Fixed tilt (slightly steeper to see depth well)
      const rotY = Math.sin(time * 0.1) * 0.1; // Slow automated panning left/right

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Approximate mouse position on the 3D grid
      // mouseY = 1 is bottom of screen (front of grid, negative Z)
      // mouseY = -1 is top of screen (back of grid, positive Z)
      const hoverX = mouseX * (gridWidth * 0.6);
      const hoverZ = -mouseY * (gridDepth * 0.5); 

      // Render Grid
      gridParticles.forEach(p => {
        // Calculate Y (height) using sine waves for that "terrain" look
        const distCenter = Math.sqrt(p.x * p.x + p.z * p.z);
        let y = Math.sin(p.x * 0.002 + time * 0.5) * 70 
              + Math.cos(p.z * 0.003 + time * 0.4) * 50
              + Math.sin(distCenter * 0.0015 - time * 0.3) * 30;

        // Interactive pulling effect
        const dx = p.x - hoverX;
        const dz = p.z - hoverZ;
        const distSq = dx * dx + dz * dz;
        const radius = 1200; 
        const radiusSq = radius * radius;
        let targetPull = 0;
        
        if (distSq < radiusSq) {
          // Only do expensive Math.sqrt if within bounding box radius
          const distToMouse = Math.sqrt(distSq);
          const normalized = (radius - distToMouse) / radius;
          targetPull = normalized * normalized * (3 - 2 * normalized); 
        }

        // Apply smooth spring physics (interpolation)
        p.currentPull += (targetPull - p.currentPull) * 0.04; 

        y -= p.currentPull * 250; // Gentle, wider lift instead of a sharp spike

        // Apply 3D rotation
        let y1 = y * cosX - p.z * sinX;
        let z1 = y * sinX + p.z * cosX;

        let x2 = p.x * cosY + z1 * sinY;
        let z2 = -p.x * sinY + z1 * cosY;
        let y2 = y1;

        // Allow points to come closer to the camera to fill the bottom of the screen
        if (z2 + zOff < -500) return; // Behind camera singularity

        const scale = fov / (fov + z2 + zOff);
        const drawX = centerX + x2 * scale;
        const drawY = centerY + y2 * scale;

        // Opacity drops for distant points
        const alpha = Math.max(0.05, Math.min(0.9, scale * 1.5));
        
        // Color logic: Fast quantized alpha & RGB interpolation
        const isPeak = p.isHighlight && y < 50;
        const baseR = isPeak ? 255 : 100;
        const baseG = isPeak ? 140 : 100;
        const baseB = isPeak ? 50 : 100;
        const baseA = isPeak ? alpha : alpha * 0.6;

        const t = Math.min(1, p.currentPull * 1.5); 
        
        if (t > 0.01) {
          const r = Math.round(baseR + (255 - baseR) * t);
          const g = Math.round(baseG + (110 - baseG) * t);
          const b = Math.round(baseB + (20 - baseB) * t);
          // Quantize alpha to 2 decimal places to help with GC string caching
          const a = (baseA + (Math.min(0.85, alpha + 0.3) - baseA) * t).toFixed(2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        } else {
          // Quantize standard alpha
          ctx.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${baseA.toFixed(2)})`;
        }
        
        // Fast rectangle drawing (5x faster than arc)
        const size = 5.2 * scale;
        ctx.fillRect(drawX - size/2, drawY - size/2, size, size);
      });

      // Render Floating Bokeh
      floatingParticles.forEach(p => {
        p.y += p.speed;
        if (p.y > 400) p.y = -800; // loop falling slowly

        let y1 = p.y * cosX - p.z * sinX;
        let z1 = p.y * sinX + p.z * cosX;

        let x2 = p.x * cosY + z1 * sinY;
        let z2 = -p.x * sinY + z1 * cosY;
        let y2 = y1;

        if (z2 + zOff < -500) return;

        const scale = fov / (fov + z2 + zOff);
        const drawX = centerX + x2 * scale;
        const drawY = centerY + y2 * scale;

        const alpha = Math.max(0.1, Math.min(0.5, scale * 1.2)).toFixed(2);
        
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 150, 70, ${alpha})`; 
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
      if (!isReady) setIsReady(true);
    };
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -10,
        opacity: isReady ? 0.8 : 0,
        transition: 'opacity 1.5s ease-in-out'
      }}
    />
  );
}
