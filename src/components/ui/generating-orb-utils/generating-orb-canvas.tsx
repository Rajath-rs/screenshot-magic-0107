"use client";

import React, { useEffect, useRef } from "react";
import type { GeneratingOrbProps } from "./types";

export function GeneratingOrbCanvas({
  size = 180,
  speed = 1.8,
  pop = 1.08,
  restOpacity = 0.65,
  textSize = 0.85,
  tracking = 0.12,
  text = "Generating",
  showText = true,
  highlightColor = "#ffffff",
  haloColor = "#941B46",
  coreColor = "#731235",
  haloColorAlt = "#C48A9C",
  coreColorAlt = "#420A1E",
  textColor = "#ffffff",
  playback = "play",
  className = "",
  style,
}: GeneratingOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let startTime = performance.now();
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const render = (now: number) => {
      if (playback !== "play") {
        return;
      }
      const elapsed = (now - startTime) / 1000;
      const angle = elapsed * speed;
      const pulse = Math.sin(elapsed * speed * 2) * 0.5 + 0.5; // 0 to 1
      const currentScale = 0.98 + pulse * (pop - 0.98);
      const currentOpacity = restOpacity * (0.85 + pulse * 0.3);

      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const coreRadius = (size * 0.34) * currentScale;

      // 1. Clean Luminous Atmospheric Aura (Rose-Berry, NO muddy green/brown)
      const auraGradient = ctx.createRadialGradient(cx, cy, coreRadius * 0.3, cx, cy, coreRadius * 1.55);
      auraGradient.addColorStop(0, "rgba(168, 32, 82, 0.28)");
      auraGradient.addColorStop(0.35, "rgba(148, 27, 70, 0.16)");
      auraGradient.addColorStop(0.65, "rgba(196, 138, 156, 0.06)");
      auraGradient.addColorStop(1, "transparent");

      ctx.save();
      ctx.globalAlpha = currentOpacity;
      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Gyroscopic Elliptical Orbit Rings
      ctx.save();
      ctx.translate(cx, cy);
      
      // Ring 1 (Tilted X, dashed Olive Moss accent)
      ctx.save();
      ctx.rotate(0.3);
      ctx.scale(1, 0.36);
      ctx.rotate(angle * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 1.3, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(161, 170, 104, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Ring 2 (Tilted other way, solid Rose)
      ctx.save();
      ctx.rotate(-0.4);
      ctx.scale(1, 0.42);
      ctx.rotate(-angle * 0.6);
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(220, 100, 145, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      // 3. Dense 3D Glass Sphere Core
      const coreGrad = ctx.createRadialGradient(
        cx - coreRadius * 0.28,
        cy - coreRadius * 0.32,
        coreRadius * 0.05,
        cx,
        cy,
        coreRadius,
      );
      coreGrad.addColorStop(0, "#DF487A");
      coreGrad.addColorStop(0.28, haloColor);
      coreGrad.addColorStop(0.62, coreColor);
      coreGrad.addColorStop(0.95, coreColorAlt);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      // Core shadow
      ctx.shadowColor = "rgba(115, 18, 53, 0.35)";
      ctx.shadowBlur = 18 * currentScale;
      ctx.shadowOffsetY = 6;
      ctx.fill();
      ctx.restore();

      // 4. Specular Crescent Arc Highlight
      const specGrad = ctx.createRadialGradient(
        cx - coreRadius * 0.24,
        cy - coreRadius * 0.32,
        0,
        cx - coreRadius * 0.24,
        cy - coreRadius * 0.32,
        coreRadius * 0.6,
      );
      specGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      specGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.2)");
      specGrad.addColorStop(0.7, "transparent");

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = specGrad;
      ctx.fill();
      ctx.restore();

      // 5. Center Holographic Text & Wave Dots
      if (showText) {
        ctx.save();
        ctx.fillStyle = textColor;
        const fontPx = Math.round(14 * textSize);
        ctx.font = `700 ${fontPx}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 1;

        const mainText = text.toUpperCase();
        ctx.fillText(mainText, cx - 10, cy);

        // Animated 3 dots
        const dotBaseX = cx + (ctx.measureText(mainText).width / 2) + 2;
        for (let i = 0; i < 3; i++) {
          const dotWave = Math.sin(elapsed * 4 - i * 0.7) * 0.5 + 0.5;
          const dotY = cy - dotWave * 2;
          ctx.beginPath();
          ctx.arc(dotBaseX + i * 5, dotY, 1.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + dotWave * 0.6})`;
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    size,
    speed,
    pop,
    restOpacity,
    textSize,
    tracking,
    text,
    showText,
    highlightColor,
    haloColor,
    coreColor,
    haloColorAlt,
    coreColorAlt,
    textColor,
    playback,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`select-none pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      role="status"
      aria-label={`${text}...`}
    />
  );
}
