# Pinewood Derby Simulator

A high-fidelity, physics-based simulator for Pinewood Derby cars, built with React and TypeScript. This application allows users to design cars, configure tracks, and simulate races with realistic physics calculations including friction, air drag, and rotational inertia.

## 🏗 Project Architecture

The project follows a standard React + Vite structure with a clear separation between simulation logic, state management, and UI rendering.

### Core Directories

- **`src/utils/`**: Contains the core business logic and physics engine.
  - `physics.ts`: **CRITICAL**. This is the physics engine. It calculates the race simulation step-by-step. It handles gravity, friction, air resistance, and energy budgets.
- **`src/components/`**: React UI components.
  - `GarageDisplay.tsx`: Purely aesthetic visualization of the car. **Does not affect physics.**
  - `Track.tsx`: Canvas-based visualization of the race simulation.
  - `Sidebar.tsx`: Main configuration interface for Car, Track, and Garage settings.
  - `Results.tsx`: Charts and statistics display using `recharts`.
  - `Leaderboard.tsx`: History of past runs.
  - `PhysicsDebug.tsx`: Debug view for energy loss analysis.
- **`src/types.ts`**: Global TypeScript definitions. **Read this first** to understand the data models (`CarConfig`, `TrackConfig`, `SimulationResult`).
- **`src/constants.ts`**: Physics constants (Gravity, Air Density) and default configurations.

## 🧠 Physics Engine (`src/utils/physics.ts`)

The simulation is deterministic. It takes a `CarConfig` and `TrackConfig` and returns a `SimulationResult`.

- **Input**: Car parameters (weight, distribution, aerodynamics, friction) and Track geometry.
- **Process**: Time-stepped simulation calculating forces at each point.
- **Output**: Array of position/velocity/time data points and summary statistics.

**Key Physics Concepts Implemented:**
- **Potential Energy (PE)**: Converted to Kinetic Energy (KE).
- **Rotational Inertia**: Energy lost to spinning up the wheels.
- **Air Drag**: $F_d = 0.5 \cdot \rho \cdot v^2 \cdot C_d \cdot A$
- **Friction**: $\mu \cdot N$ (Normal force varies with track slope).
- **"Scrub"**: Energy loss due to wheel alignment issues (hunting/wobble).

## 🎨 Garage vs. Physics

**Important Distinction for Developers & Agents:**

- **The "Garage" tab (`GarageDisplay.tsx`) is purely aesthetic.**
  - Changing the "Body Style" (Wedge, Block, etc.) in the Garage tab changes the *visual appearance* but **MUST NOT** automatically change the `dragCoefficient` in the physics config.
  - Physics parameters (Drag Coeff, Weight, etc.) are controlled in the "Car" tab (Simple/Advanced modes).
  - This separation allows users to have a "cool looking" car that performs poorly, or a "simple block" that performs well, preserving the simulation's integrity.

## 📂 File Structure Reference

```text
/src
├── App.tsx                 # Main entry point. Manages global state (config, results, history).
├── main.tsx                # React DOM root.
├── types.ts                # Data models. Source of truth for shapes.
├── constants.ts            # Physics constants and default values.
├── index.css               # Global styles (Tailwind imports).
├── utils/
│   └── physics.ts          # The Simulation Engine. Pure functions.
└── components/
    ├── GarageDisplay.tsx   # SVG car visualization (Aesthetic only).
    ├── Track.tsx           # Canvas race visualizer.
    ├── Sidebar.tsx         # Configuration controls (Inputs, Sliders).
    ├── Results.tsx         # Post-race analysis and charts.
    ├── Leaderboard.tsx     # Run history management.
    ├── PhysicsDebug.tsx    # Energy budget breakdown.
    └── ui/                 # Reusable UI atoms.
```

## 🤖 Guidelines for AI Agents

If you are an AI agent working on this codebase, follow these rules:

1.  **Physics Integrity**: Never modify `src/utils/physics.ts` unless explicitly asked to change the simulation model. The physics engine is the core value of this app.
2.  **Type Safety**: Always check `src/types.ts` before modifying data structures.
3.  **Separation of Concerns**:
    - If asked to change how the car *looks*, edit `GarageDisplay.tsx`.
    - If asked to change how the car *behaves*, edit `Sidebar.tsx` (to change inputs) or `physics.ts` (to change calculations).
4.  **Performance**: The `Track.tsx` component uses an animation loop. Ensure expensive calculations are done once in `physics.ts` and not during the render loop.
5.  **Styling**: Use Tailwind CSS for all styling. Do not introduce new CSS files.

## 🛠 Development

1.  **Install**: `npm install`
2.  **Run**: `npm run dev`
3.  **Build**: `npm run build`
4.  **Lint**: `npm run lint`

## 🧪 Testing

Currently, the app relies on manual verification using the "Physics Debug" panel in the UI to ensure energy conservation (Total Energy should remain roughly constant minus losses).
