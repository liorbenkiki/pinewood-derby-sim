import React, { useState } from 'react';
import { CarConfig, TrackConfig, BodyStyle } from '../types';
import { Slider, Toggle } from './ui/Controls';
import { XYWeightSelector } from './ui/XYWeightSelector';
import { TRACK_PRESETS } from '../constants';
import { calibrateFriction } from '../utils/physics';

interface SidebarProps {
  config: CarConfig;
  trackConfig: TrackConfig;
  activeTab: 'car' | 'track' | 'garage';
  onTabChange: (tab: 'car' | 'track' | 'garage') => void;
  onChange: (newConfig: CarConfig) => void;
  onTrackChange: (newTrack: TrackConfig) => void;
  onRun: () => void;
  onSave: () => void;
}

export function Sidebar({ config, trackConfig, activeTab, onTabChange, onChange, onTrackChange, onRun, onSave }: SidebarProps) {
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [calibrationTime, setCalibrationTime] = useState<string>('');
  const [calibratedMu, setCalibratedMu] = useState<number | null>(null);

  const update = (key: keyof CarConfig, val: any) => {
    onChange({ ...config, [key]: val });
  };

  // Garage Helpers
  const handleBodyStyleChange = (style: BodyStyle) => {
    onChange({ ...config, bodyStyle: style });
  };

  const addSticker = (sticker: string) => {
    update('stickers', [...config.stickers, sticker]);
  };

  const clearStickers = () => {
    update('stickers', []);
  };

  // Simple Mode Handlers
  const handleXYWeightChange = (x: number, y: number) => {
    const newWeightDist = (x / 8) + 0.5;
    onChange({ ...config, weightDistribution: newWeightDist, weightHeight: y });
  };

  const handleCantSimple = (val: string) => {
    if (val === 'none') update('wheelCant', 0);
    if (val === 'slight') update('wheelCant', 1.5);
    if (val === 'aggressive') update('wheelCant', 3.0);
  };

  const handleWheelbaseSimple = (val: string) => {
    if (val === 'short') update('wheelbase', 4.0);
    if (val === 'standard') update('wheelbase', 4.375);
    if (val === 'extended') update('wheelbase', 5.0);
  };

  const updateTrack = (key: keyof TrackConfig, val: any) => {
    onTrackChange({ ...trackConfig, [key]: val });
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = TRACK_PRESETS.find(p => p.name === e.target.value);
    if (preset) {
      onTrackChange({ ...preset });
    }
  };

  const runCalibration = () => {
    const time = parseFloat(calibrationTime);
    if (isNaN(time) || time <= 0) return;

    const mu = calibrateFriction(time, config, trackConfig);
    setCalibratedMu(mu);
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto flex flex-col">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Derby Sim</h1>
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button
            onClick={() => onTabChange('car')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'car' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Car
          </button>
          <button
            onClick={() => onTabChange('track')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'track' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Track
          </button>
          <button
            onClick={() => onTabChange('garage')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'garage' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Garage
          </button>
        </div>

        {activeTab === 'car' && (
          <div className="flex items-center justify-end mb-4">
            <span className="text-xs text-gray-500 mr-2">Mode:</span>
            <div className="flex bg-gray-100 rounded p-0.5">
              <button
                onClick={() => setMode('simple')}
                className={`px-2 py-0.5 text-xs rounded ${mode === 'simple' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500'}`}
              >
                Simple
              </button>
              <button
                onClick={() => setMode('advanced')}
                className={`px-2 py-0.5 text-xs rounded ${mode === 'advanced' ? 'bg-white shadow text-indigo-600 font-medium' : 'text-gray-500'}`}
              >
                Advanced
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 px-6 space-y-6 overflow-y-auto">
        {activeTab === 'car' && (
          <>
            {mode === 'simple' ? (
              // SIMPLE MODE
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chassis</h3>
                  <Slider
                    label="Total Weight"
                    value={config.totalWeightOz}
                    min={1} max={10} step={0.1} unit="oz"
                    onChange={(v) => update('totalWeightOz', v)}
                  />

                  <XYWeightSelector
                    x={Math.max(-4, Math.min(4, Math.round((config.weightDistribution - 0.5) * 8)))}
                    y={Math.max(-4, Math.min(4, config.weightHeight || 0))}
                    onChange={handleXYWeightChange}
                  />

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wheelbase</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['short', 'standard', 'extended'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleWheelbaseSimple(opt)}
                          className={`py-2 text-xs border rounded-md capitalize ${(opt === 'short' && config.wheelbase < 4.2) ||
                            (opt === 'standard' && config.wheelbase >= 4.2 && config.wheelbase <= 4.6) ||
                            (opt === 'extended' && config.wheelbase > 4.6)
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Wheels & Axles</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Axle Prep</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => update('axleSanded', !config.axleSanded)}
                        className={`py-2 text-xs border rounded-md capitalize ${config.axleSanded
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        Sanded
                      </button>
                      <button
                        onClick={() => update('graphite', !config.graphite)}
                        className={`py-2 text-xs border rounded-md capitalize ${config.graphite
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        Graphite
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Axle Bend (Cant)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['none', 'slight', 'aggressive'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleCantSimple(opt)}
                          className={`py-2 text-xs border rounded-md capitalize ${(opt === 'none' && config.wheelCant < 0.5) ||
                            (opt === 'slight' && config.wheelCant >= 0.5 && config.wheelCant < 2.5) ||
                            (opt === 'aggressive' && config.wheelCant >= 2.5)
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Toggle
                    label="Raised Wheel (3-wheeler)"
                    checked={config.raisedWheel}
                    onChange={(v) => update('raisedWheel', v)}
                  />
                </section>
              </div>
            ) : (
              // ADVANCED MODE (Existing UI)
              <>
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chassis</h3>
                  <Slider
                    label="Total Weight"
                    value={config.totalWeightOz}
                    min={1} max={10} step={0.1} unit="oz"
                    onChange={(v) => update('totalWeightOz', v)}
                  />
                  <Slider
                    label="Weight Dist (Rear -> Front)"
                    value={config.weightDistribution}
                    min={0} max={1} step={0.05} unit="%"
                    onChange={(v) => update('weightDistribution', v)}
                  />
                  <Slider
                    label="L/R Bias (Left -> Right)"
                    value={config.leftRightBias}
                    min={-1} max={1} step={0.1} unit=""
                    onChange={(v) => update('leftRightBias', v)}
                  />
                  <Slider
                    label="Wheelbase"
                    value={config.wheelbase}
                    min={3} max={6} step={0.125} unit="in"
                    onChange={(v) => update('wheelbase', v)}
                  />
                </section>

                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Wheels & Axles</h3>
                  <Toggle
                    label="Sanded Axles (Remove Burrs)"
                    checked={config.axleSanded}
                    onChange={(v) => update('axleSanded', v)}
                  />
                  <Toggle
                    label="Add Graphite"
                    checked={config.graphite}
                    onChange={(v) => update('graphite', v)}
                  />
                  <Slider
                    label="Wheel Cant (Bend Axles)"
                    value={config.wheelCant}
                    min={0} max={5} step={0.5} unit="°"
                    onChange={(v) => update('wheelCant', v)}
                  />
                  <Toggle
                    label="Raised Wheel (3-wheeler)"
                    checked={config.raisedWheel}
                    onChange={(v) => update('raisedWheel', v)}
                  />
                </section>

                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Aerodynamics</h3>
                  <Slider
                    label="Drag Coeff (Cd)"
                    value={config.dragCoefficient}
                    min={0.2} max={1.0} step={0.05} unit=""
                    onChange={(v) => update('dragCoefficient', v)}
                  />
                </section>

                <section className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Advanced Physics</h3>
                  <div className="mb-3 text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded border border-gray-200">
                    F_scrub = 0.5 · m · v² · (Base + Scale·|Bias|) / Stability
                  </div>
                  <Slider
                    label="Scrub Base (Wobble)"
                    value={config.scrubBase}
                    min={0} max={0.2} step={0.01} unit=""
                    onChange={(v) => update('scrubBase', v)}
                  />
                  <Slider
                    label="Scrub Bias Scale"
                    value={config.scrubBiasScale}
                    min={0} max={0.5} step={0.01} unit=""
                    onChange={(v) => update('scrubBiasScale', v)}
                  />
                </section>

                <section className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Debug</h3>
                  <Toggle
                    label="Lossless Test (Zero Friction)"
                    checked={config.losslessTest}
                    onChange={(v) => update('losslessTest', v)}
                  />
                </section>
              </>
            )}
          </>
        )}
        {activeTab === 'track' && (
          <>
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Track Configuration</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Preset</label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  onChange={handlePresetChange}
                  value={TRACK_PRESETS.find(p =>
                    p.lengthMeters === trackConfig.lengthMeters &&
                    p.startHeightMeters === trackConfig.startHeightMeters
                  )?.name || ""}
                >
                  <option value="">Custom</option>
                  {TRACK_PRESETS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <Slider
                label="Total Length"
                value={trackConfig.lengthMeters}
                min={5} max={20} step={0.1} unit="m"
                onChange={(v) => updateTrack('lengthMeters', v)}
              />
              <Slider
                label="Start Height"
                value={trackConfig.startHeightMeters}
                min={0.5} max={3} step={0.05} unit="m"
                onChange={(v) => updateTrack('startHeightMeters', v)}
              />
              <Slider
                label="Ramp Angle"
                value={trackConfig.rampAngleDeg}
                min={15} max={45} step={1} unit="°"
                onChange={(v) => updateTrack('rampAngleDeg', v)}
              />
              <Slider
                label="Flat Section Length"
                value={trackConfig.flatLengthMeters}
                min={1} max={10} step={0.1} unit="m"
                onChange={(v) => updateTrack('flatLengthMeters', v)}
              />
            </section>

            <section className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Friction Calibration</h3>
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Enter a real-world finish time to estimate the axle friction coefficient (μ).
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Time (s)</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.001"
                      value={calibrationTime}
                      onChange={(e) => setCalibrationTime(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      placeholder="e.g. 3.050"
                    />
                    <button
                      onClick={runCalibration}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium"
                    >
                      Calibrate
                    </button>
                  </div>
                </div>

                {calibratedMu !== null && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-md">
                    <div className="text-xs text-indigo-800 font-medium">Estimated Friction (μ)</div>
                    <div className="text-xl font-mono font-bold text-indigo-600">
                      {calibratedMu.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
        {activeTab === 'garage' && (
          <div className="space-y-6">
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Body Style</h3>
              <div className="grid grid-cols-2 gap-3">
                {(['wedge', 'block', 'bullet', 'shark'] as BodyStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => handleBodyStyleChange(style)}
                    className={`p-3 border rounded-lg flex flex-col items-center space-y-2 transition-all ${config.bodyStyle === style
                      ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="w-full h-12 bg-gray-100 rounded flex items-center justify-center text-2xl">
                      {style === 'wedge' && '📐'}
                      {style === 'block' && '🧱'}
                      {style === 'bullet' && '🚀'}
                      {style === 'shark' && '🦈'}
                    </div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{style}</span>
                    <span className="text-xs text-gray-500">
                      {style === 'bullet' && 'Fastest'}
                      {style === 'wedge' && 'Balanced'}
                      {style === 'shark' && 'Agile'}
                      {style === 'block' && 'Slowest'}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paint Job</h3>
              <div className="grid grid-cols-5 gap-2">
                {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#111827', '#6b7280', '#ffffff'].map((color) => (
                  <button
                    key={color}
                    onClick={() => update('color', color)}
                    className={`w-10 h-10 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${config.color === color ? 'border-gray-900 scale-110 ring-2 ring-offset-2 ring-gray-400' : 'border-transparent'
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Stickers</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'flames', label: '🔥 Flames' },
                  { id: 'lightning', label: '⚡ Bolt' },
                  { id: 'star', label: '⭐ Star' },
                  { id: 'skull', label: '💀 Skull' },
                  { id: 'flag', label: '🏁 Flag' },
                  { id: 'number', label: '1️⃣ #1' },
                ].map((sticker) => (
                  <button
                    key={sticker.id}
                    onClick={() => addSticker(sticker.id)}
                    className="py-2 px-1 text-sm border rounded-md transition-colors bg-white border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600"
                  >
                    {sticker.label}
                  </button>
                ))}
              </div>
              {config.stickers.length > 0 && (
                <button
                  onClick={clearStickers}
                  className="mt-3 w-full py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                >
                  Clear All Stickers
                </button>
              )}
            </section>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 space-y-3">
        <button
          onClick={onRun}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition-colors"
        >
          Run Simulation
        </button>
        <button
          onClick={onSave}
          className="w-full py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
        >
          Save to Leaderboard
        </button>
      </div>
    </div>
  );
}
