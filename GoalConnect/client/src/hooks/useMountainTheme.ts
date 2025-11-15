import { useEffect, useState } from "react";

interface MountainTheme {
  primary: string;
  secondary: string;
  accent: string;
  mountainName: string;
  // Climbing hold colors
  holdGlow: string;
  holdTint: string;
  // Particle colors
  particleColor: string;
  particleType: 'chalk' | 'snow' | 'dust';
  // Summit track colors
  pathGlow: string;
  waypointGlow: string;
}

const MOUNTAIN_THEMES: Record<string, MountainTheme> = {
  "el-capitan": {
    primary: "28 85% 48%", // Orange
    secondary: "210 40% 45%", // Blue
    accent: "160 50% 40%", // Green
    mountainName: "El Capitan",
    holdGlow: "28 85% 60%", // Warm orange glow
    holdTint: "28 85% 48%",
    particleColor: "28 70% 65%", // Orange chalk dust
    particleType: 'chalk',
    pathGlow: "28 85% 55%",
    waypointGlow: "160 60% 50%" // Green waypoints
  },
  "mttoukbal": {
    primary: "194 70% 50%", // Teal
    secondary: "195 20% 55%", // Slate blue
    accent: "189 85% 60%", // Bright cyan
    mountainName: "Mt. Toubkal",
    holdGlow: "189 85% 65%", // Bright cyan glow
    holdTint: "194 70% 50%",
    particleColor: "189 60% 70%", // Teal desert dust
    particleType: 'dust',
    pathGlow: "194 80% 60%",
    waypointGlow: "189 85% 65%" // Cyan waypoints
  },
  "mtwhitney": {
    primary: "220 70% 50%", // Deep blue
    secondary: "240 50% 60%", // Purple-blue
    accent: "200 80% 55%", // Sky blue
    mountainName: "Mt. Whitney",
    holdGlow: "200 80% 60%", // Sky blue glow
    holdTint: "220 70% 50%",
    particleColor: "200 70% 75%", // Light blue snow
    particleType: 'snow',
    pathGlow: "220 75% 60%",
    waypointGlow: "200 80% 65%" // Sky blue waypoints
  }
};

export function useMountainTheme() {
  const [currentMountain, setCurrentMountain] = useState<string>("el-capitan");

  useEffect(() => {
    // TODO: Get current mountain from user's expedition state
    // For now, default to el-capitan
    const theme = MOUNTAIN_THEMES[currentMountain] || MOUNTAIN_THEMES["el-capitan"];

    // Apply theme to CSS variables
    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--accent', theme.accent);

    // Climbing hold variables
    document.documentElement.style.setProperty('--hold-glow', theme.holdGlow);
    document.documentElement.style.setProperty('--hold-tint', theme.holdTint);

    // Particle variables
    document.documentElement.style.setProperty('--particle-color', theme.particleColor);
    document.documentElement.setAttribute('data-particle-type', theme.particleType);

    // Summit track variables
    document.documentElement.style.setProperty('--path-glow', theme.pathGlow);
    document.documentElement.style.setProperty('--waypoint-glow', theme.waypointGlow);

    // Store mountain name for display
    document.documentElement.setAttribute('data-mountain', theme.mountainName);
  }, [currentMountain]);

  return {
    currentMountain,
    setCurrentMountain,
    theme: MOUNTAIN_THEMES[currentMountain]
  };
}
