"use client";

import GeneratingOrb from "@/components/ui/generating-orb";

export default function GeneratingOrbDemo() {
  return (
    <div className="flex size-full min-h-[400px] items-center justify-center p-6 bg-[#F8F6F2]">
      <GeneratingOrb
        renderer="css"
        size={240}
        depth={1.0}
        speed={2.0}
        duration={2000}
        stagger={100}
        pop={1.15}
        restOpacity={0.4}
        textSize={1.2}
        tracking={0}
        text="Generating"
        showText={true}
        highlightColor="#ffffff"
        haloColor="#731235"
        coreColor="#5B0E2A"
        haloColorAlt="#A1AA68"
        coreColorAlt="#3C081A"
        textColor="#ffffff"
        playback="play"
      />
    </div>
  );
}
