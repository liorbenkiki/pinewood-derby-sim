export const PHYSICS = {
  GRAVITY: 9.81, // m/s^2
  TRACK_LENGTH_METERS: 9.75, // ~32 ft
  START_HEIGHT_METERS: 1.22, // ~4 ft
  RAMP_ANGLE_RAD: (30 * Math.PI) / 180, // 30 degrees start
  FLAT_LENGTH_METERS: 5.0, // Last 5m are flat
  AIR_DENSITY: 1.225, // kg/m^3
  FRONTAL_AREA: 0.003, // m^2 approx for a small car

  // Conversion
  OZ_TO_KG: 0.0283495,
  IN_TO_M: 0.0254,
};

export const DEFAULT_CAR: import('./types').CarConfig = {
  name: "New Car",
  totalWeightOz: 5.0,
  weightDistribution: 0.2, // Rear weighted (80% rear)
  leftRightBias: 0.0,
  axleSanded: true,
  graphite: true,
  wheelCant: 1.5,
  raisedWheel: true,
  wheelbase: 4.375,
  dragCoefficient: 0.45,
  losslessTest: false,
  color: '#3b82f6', // blue-500
  bodyStyle: 'block',
  stickers: [],
  scrubBase: 0.04,
  scrubBiasScale: 0.1,
};

export const DEFAULT_TRACK: import('./types').TrackConfig = {
  name: "Standard 32ft",
  lengthMeters: 9.75, // ~32 ft
  startHeightMeters: 1.22, // ~4 ft
  rampAngleDeg: 30,
  flatLengthMeters: 5.0,
};

export const TRACK_PRESETS: import('./types').TrackConfig[] = [
  DEFAULT_TRACK,
  {
    name: "Short 28ft",
    lengthMeters: 8.53,
    startHeightMeters: 1.22,
    rampAngleDeg: 30,
    flatLengthMeters: 3.8,
  },
  {
    name: "Tall 5ft Drop",
    lengthMeters: 11.0,
    startHeightMeters: 1.52,
    rampAngleDeg: 35,
    flatLengthMeters: 6.0,
  },
  {
    name: "Commercial 42ft",
    lengthMeters: 12.8,
    startHeightMeters: 1.5,
    rampAngleDeg: 28,
    flatLengthMeters: 8.0,
  }
];
