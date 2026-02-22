export type BodyStyle = 'wedge' | 'block' | 'bullet' | 'shark';

export interface CarConfig {
  name: string;
  totalWeightOz: number; // Max 5.0 usually
  weightDistribution: number; // 0 (rear) to 1 (front)
  weightHeight: number; // -4 (top) to 4 (bottom)
  leftRightBias: number; // -1 (left) to 1 (right), 0 is center
  axleSanded: boolean; // True if axles are deburred/polished
  graphite: boolean; // True if graphite lubrication is applied
  wheelCant: number; // Degrees 0-3
  raisedWheel: boolean; // 3 wheels touching vs 4
  wheelbase: number; // Inches, standard ~4.375
  dragCoefficient: number; // 0.3 (streamlined) to 0.6 (block)
  losslessTest: boolean; // Debug: Set all losses to 0

  // Visuals
  color: string;
  bodyStyle: BodyStyle;
  stickers: string[];

  // Advanced Physics
  scrubBase: number; // Base instability (hunting)
  scrubBiasScale: number; // Penalty for L/R bias
}

export interface TrackConfig {
  name: string;
  lengthMeters: number;
  startHeightMeters: number;
  rampAngleDeg: number;
  flatLengthMeters: number;
}

export interface SimulationPoint {
  time: number;
  position: number;
  velocity: number;
  acceleration: number;
}

export interface EnergyBudget {
  initialPE: number;
  finalKE: number;
  workFriction: number;
  workDrag: number;
  workScrub: number;
  rotationalKE: number;
  totalLoss: number;
  energyError: number;
}

export interface SimulationResult {
  finishTime: number;
  maxSpeed: number;
  data: SimulationPoint[];
  didFinish: boolean;
  energy: EnergyBudget;
}

export interface LeaderboardEntry {
  id: string;
  config: CarConfig;
  result: SimulationResult;
  date: number;
}
