export interface GeneratingOrbProps {
  renderer?: "css" | "canvas" | undefined;
  size?: number | undefined;
  depth?: number | undefined;
  speed?: number | undefined;
  duration?: number | undefined;
  stagger?: number | undefined;
  pop?: number | undefined;
  restOpacity?: number | undefined;
  textSize?: number | undefined;
  tracking?: number | undefined;
  text?: string | undefined;
  showText?: boolean | undefined;
  highlightColor?: string | undefined;
  haloColor?: string | undefined;
  coreColor?: string | undefined;
  haloColorAlt?: string | undefined;
  coreColorAlt?: string | undefined;
  textColor?: string | undefined;
  playback?: "play" | "pause" | undefined;
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}
