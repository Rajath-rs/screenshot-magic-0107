"use client";

import React, { useId } from "react";
import type { GeneratingOrbProps } from "./types";

export function GeneratingOrbCss({
  size = 180,
  speed = 1.8,
  duration = 2200,
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
  const isPlaying = playback === "play";
  const animDuration = `${Math.max(1000, duration / speed)}ms`;
  const rotDuration = `${Math.max(1600, (duration * 3) / speed)}ms`;
  const instanceId = useId().replace(/[:]/g, "_");

  // Calculate proportional dimensions
  const coreSize = Math.round(size * 0.72);
  const ringSize1 = Math.round(size * 0.94);
  const ringSize2 = Math.round(size * 0.86);

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
      role="status"
      aria-label={`${text}...`}
    >
      <style>{`
        @keyframes orb-breathe-${instanceId} {
          0%, 100% {
            transform: scale(0.98);
            opacity: ${restOpacity * 0.85};
          }
          50% {
            transform: scale(${pop});
            opacity: ${restOpacity * 1.25};
          }
        }
        @keyframes orb-core-pulse-${instanceId} {
          0%, 100% {
            transform: scale(0.985);
            box-shadow: 
              inset 0 2px 4px rgba(255, 255, 255, 0.75),
              inset 0 -6px 14px rgba(25, 3, 11, 0.85),
              inset 0 0 28px rgba(220, 80, 130, 0.4),
              0 0 24px rgba(148, 27, 70, 0.35),
              0 12px 36px rgba(115, 18, 53, 0.22);
          }
          50% {
            transform: scale(1.025);
            box-shadow: 
              inset 0 2px 6px rgba(255, 255, 255, 0.95),
              inset 0 -6px 16px rgba(25, 3, 11, 0.9),
              inset 0 0 38px rgba(240, 110, 160, 0.55),
              0 0 42px rgba(180, 42, 91, 0.5),
              0 16px 48px rgba(115, 18, 53, 0.3);
          }
        }
        @keyframes orb-spin-cw-${instanceId} {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orb-spin-ccw-${instanceId} {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes orb-ring-1-${instanceId} {
          0% { transform: rotateX(68deg) rotateY(18deg) rotateZ(0deg); }
          100% { transform: rotateX(68deg) rotateY(18deg) rotateZ(360deg); }
        }
        @keyframes orb-ring-2-${instanceId} {
          0% { transform: rotateX(62deg) rotateY(-28deg) rotateZ(360deg); }
          100% { transform: rotateX(62deg) rotateY(-28deg) rotateZ(0deg); }
        }
        @keyframes orb-dot-wave-${instanceId} {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>

      {/* Layer 1: Ethereal Atmospheric Aura (Clean Rose-Wine Glow with ZERO muddy brown/green) */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(168, 32, 82, 0.28) 0%, rgba(148, 27, 70, 0.18) 35%, rgba(200, 120, 150, 0.08) 58%, transparent 74%)`,
          filter: "blur(20px)",
          animation: isPlaying
            ? `orb-breathe-${instanceId} ${animDuration} ease-in-out infinite`
            : "none",
          willChange: "transform, opacity",
        }}
      />

      {/* Layer 2: Delicate Gyroscopic Orbital Rings */}
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          width: ringSize1,
          height: ringSize1,
          perspective: 800,
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            border: "1px dashed rgba(161, 170, 104, 0.45)",
            animation: isPlaying
              ? `orb-ring-1-${instanceId} ${rotDuration} linear infinite`
              : "none",
            willChange: "transform",
          }}
        />
      </div>

      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          width: ringSize2,
          height: ringSize2,
          perspective: 800,
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            border: "1px solid rgba(220, 100, 145, 0.3)",
            animation: isPlaying
              ? `orb-ring-2-${instanceId} ${animDuration} linear infinite`
              : "none",
            willChange: "transform",
          }}
        />
      </div>

      {/* Layer 3: Glassmorphic Celestial Sphere Core */}
      <div
        className="relative rounded-full flex items-center justify-center overflow-hidden pointer-events-none transition-transform"
        style={{
          width: coreSize,
          height: coreSize,
          background: `radial-gradient(circle at 35% 30%, #DF487A 0%, ${haloColor} 26%, ${coreColor} 58%, ${coreColorAlt} 92%)`,
          animation: isPlaying
            ? `orb-core-pulse-${instanceId} ${animDuration} ease-in-out infinite`
            : "none",
          willChange: "transform, box-shadow",
        }}
      >
        {/* Layer 3A: Internal Swirling Plasma Caustic */}
        <div
          className="absolute inset-0 rounded-full opacity-45 pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, rgba(255, 140, 180, 0.6), transparent 30%, rgba(161, 170, 104, 0.35) 60%, transparent 80%, rgba(255, 140, 180, 0.6))`,
            filter: "blur(8px)",
            mixBlendMode: "color-dodge",
            animation: isPlaying
              ? `orb-spin-cw-${instanceId} ${rotDuration} linear infinite`
              : "none",
            willChange: "transform",
          }}
        />

        {/* Layer 3B: High-Gloss Specular Crescent Arc */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 34% 22%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.28) 28%, transparent 58%)`,
          }}
        />

        {/* Layer 3C: Bottom Ambient Bounce Reflection */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 88%, rgba(255, 180, 210, 0.35) 0%, transparent 50%)`,
          }}
        />

        {/* Layer 4: Refined Holographic Center Readout */}
        {showText ? (
          <div
            className="relative z-10 flex flex-col items-center justify-center text-center font-display pointer-events-none select-none px-2"
            style={{
              color: textColor,
            }}
          >
            <div
              className="flex items-center gap-1.5 font-bold uppercase tracking-wider"
              style={{
                fontSize: `${textSize}rem`,
                letterSpacing: `${tracking}em`,
                textShadow: `0 1px 2px rgba(0, 0, 0, 0.5), 0 0 12px rgba(255, 255, 255, 0.6)`,
              }}
            >
              <span>{text}</span>
              <span className="inline-flex items-center gap-0.5 ml-0.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block h-1 w-1 rounded-full bg-white shadow-xs"
                    style={{
                      animation: isPlaying
                        ? `orb-dot-wave-${instanceId} 1.4s ease-in-out infinite`
                        : "none",
                      animationDelay: `${i * 0.18}s`,
                    }}
                  />
                ))}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
