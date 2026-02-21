import { CarConfig, SimulationResult, SimulationPoint, TrackConfig } from '../types';
import { PHYSICS, DEFAULT_TRACK } from '../constants';

// Helper to get track height at position x
function getTrackHeight(x: number, track: TrackConfig): number {
  const rampLength = track.lengthMeters - track.flatLengthMeters;
  if (x < 0) return track.startHeightMeters; // Should not happen but clamp
  if (x >= rampLength) return 0;
  
  // Parabolic profile: y = h * (1 - x/L)^2
  const p = x / rampLength;
  return track.startHeightMeters * (1 - p) * (1 - p);
}

// Helper to get track slope angle at position x
function getTrackAngle(x: number, track: TrackConfig): number {
  const rampLength = track.lengthMeters - track.flatLengthMeters;
  if (x >= rampLength) return 0;
  
  // y = h * (1 - x/L)^2
  // dy/dx = 2h * (1 - x/L) * (-1/L) = -2h/L * (1 - x/L)
  // Since x is arc length, dy/dx is sin(theta), not tan(theta)
  const p = x / rampLength;
  const dydx = -2 * track.startHeightMeters * (1 - p) / rampLength;
  // Clamp value to [-1, 1] for asin safety, though geometry shouldn't exceed vertical
  const val = Math.max(-1, Math.min(1, Math.abs(dydx)));
  return Math.asin(val);
}

export function simulateRace(car: CarConfig, track: TrackConfig = DEFAULT_TRACK, frictionOverride?: number, dt: number = 0.01): SimulationResult {
  let time = 0;
  let position = 0; // meters along track
  let velocity = 0; // m/s
  
  const points: SimulationPoint[] = [];
  const mass = car.totalWeightOz * PHYSICS.OZ_TO_KG;
  
  // Track geometry
  const rampLength = track.lengthMeters - track.flatLengthMeters;
  const rampAngleRad = (track.rampAngleDeg * Math.PI) / 180;
  
  // COM Effect
  const carLengthM = 7 * PHYSICS.IN_TO_M;
  const comOffset = (car.weightDistribution - 0.5) * carLengthM; 
  
  // Initial State
  // Position 0 is the nose. COM is at 0 + comOffset.
  const startPosCOM = comOffset;
  const startHeightCOM = getTrackHeight(startPosCOM, track);
  const initialPE = mass * PHYSICS.GRAVITY * startHeightCOM;

  let workFriction = 0;
  let workDrag = 0;
  let workScrub = 0;
  
  while (position < track.lengthMeters && time < 10) {
    // Current COM position
    const posCOM = position + comOffset;
    const thetaCOM = getTrackAngle(posCOM, track);
    
    // Forces
    const F_gravity_COM = mass * PHYSICS.GRAVITY * Math.sin(thetaCOM);
    const F_normal_COM = mass * PHYSICS.GRAVITY * Math.cos(thetaCOM);
    
    // Resistive Forces
    let F_friction_COM = 0;
    let F_drag = 0;
    let F_scrub = 0;

    if (!car.losslessTest) {
        // Friction
        let mu = 0.12;
        if (frictionOverride !== undefined) {
          mu = frictionOverride;
        } else {
          if (car.axleSanded) mu -= 0.04;
          if (car.graphite) mu -= 0.05;
        }
        
        const cantFrictionPenalty = 1 + (car.wheelCant * 0.005);
        const wheelFactor = car.raisedWheel ? 0.75 : 1.0;
        F_friction_COM = mu * F_normal_COM * wheelFactor * cantFrictionPenalty;

        // Drag
        F_drag = 0.5 * PHYSICS.AIR_DENSITY * car.dragCoefficient * PHYSICS.FRONTAL_AREA * velocity * velocity;

        // Scrub
        const normalizedWheelbase = (car.wheelbase * PHYSICS.IN_TO_M) / (4.375 * PHYSICS.IN_TO_M);
        const cantStabilityFactor = 1 + (car.wheelCant * car.wheelCant);
        const stability = normalizedWheelbase * cantStabilityFactor;
        
        // Formula: F_scrub = 0.5 * mass * v^2 * (Base + Bias*|bias|) / Stability
        const baseWobble = car.scrubBase; 
        const biasEffect = Math.abs(car.leftRightBias) * car.scrubBiasScale;
        const instabilityCoeff = (baseWobble + biasEffect) / stability;
        
        F_scrub = 0.5 * instabilityCoeff * mass * velocity * velocity;
    }
    
    const F_net_COM = F_gravity_COM - F_friction_COM - F_drag - F_scrub;
    const acc_COM = F_net_COM / mass;
    
    // Integration
    const velocity_new = velocity + acc_COM * dt;
    // No rolling back check on velocity_new for now, or apply after
    
    const dx = 0.5 * (velocity + Math.max(0, velocity_new)) * dt;
    position += dx;
    
    velocity = Math.max(0, velocity_new);

    // Accumulate Work (Energy Losses)
    workFriction += F_friction_COM * dx;
    workDrag += F_drag * dx;
    workScrub += F_scrub * dx;
    
    time += dt;
    points.push({ time, position, velocity, acceleration: acc_COM });
  }

  // Final Energy Calculation
  // Final Height of COM
  const finalPosCOM = position + comOffset;
  const finalHeightCOM = getTrackHeight(finalPosCOM, track);
  const finalPE = mass * PHYSICS.GRAVITY * finalHeightCOM; // Should be 0 if finished
  
  // Translational KE
  const finalKE_Trans = 0.5 * mass * velocity * velocity;
  
  // Rotational KE
  let rotationalKE = 0;
  if (!car.losslessTest) {
      const wheelMassKg = 0.0025; // 2.5g per wheel
      const numWheels = 4; 
      rotationalKE = numWheels * 0.25 * wheelMassKg * velocity * velocity;
  }

  const totalLoss = workFriction + workDrag + workScrub;
  
  // Energy Balance
  const energyError = initialPE - (finalPE + finalKE_Trans + rotationalKE + totalLoss);

  return {
    finishTime: time,
    maxSpeed: Math.max(...points.map(p => p.velocity)),
    data: points,
    didFinish: position >= track.lengthMeters,
    energy: {
      initialPE,
      finalKE: finalKE_Trans,
      rotationalKE,
      workFriction,
      workDrag,
      workScrub,
      totalLoss,
      energyError
    }
  };
}

export function calibrateFriction(targetTime: number, car: CarConfig, track: TrackConfig): number | null {
  // Bisection method to find mu that results in targetTime
  let minMu = 0.001;
  let maxMu = 0.2;
  let iterations = 0;
  
  // Check bounds
  const resMin = simulateRace(car, track, minMu);
  const resMax = simulateRace(car, track, maxMu);
  
  if (resMin.finishTime > targetTime) return null; // Impossible (even with min friction, too slow)
  if (resMax.finishTime < targetTime) return null; // Impossible (even with max friction, too fast)
  
  while (iterations < 20) {
    const midMu = (minMu + maxMu) / 2;
    const res = simulateRace(car, track, midMu);
    
    if (Math.abs(res.finishTime - targetTime) < 0.001) {
      return midMu;
    }
    
    if (res.finishTime > targetTime) {
      // Too slow, need less friction
      maxMu = midMu;
    } else {
      // Too fast, need more friction
      minMu = midMu;
    }
    iterations++;
  }
  
  return (minMu + maxMu) / 2;
}
