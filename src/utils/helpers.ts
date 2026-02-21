import { CarConfig } from '../types';

export function generateBuildSummary(config: CarConfig): string {
  const parts: string[] = [];

  // Weight Distribution
  if (config.weightDistribution < 0.3) {
    parts.push("Rear-heavy");
  } else if (config.weightDistribution > 0.7) {
    parts.push("Front-heavy");
  } else {
    parts.push("Balanced");
  }

  // Prep
  if (config.graphite) parts.push("Graphite");
  if (config.axleSanded) parts.push("Sanded");
  if (!config.graphite && !config.axleSanded) parts.push("Stock");

  // Cant
  if (config.wheelCant > 0) {
    parts.push(`${config.wheelCant}° Cant`);
  }

  // Wheels
  if (config.raisedWheel) parts.push("3-Wheel");

  // Wheelbase
  if (config.wheelbase > 4.5) parts.push("Long WB");
  if (config.wheelbase < 4.2) parts.push("Short WB");

  return parts.join(", ");
}
