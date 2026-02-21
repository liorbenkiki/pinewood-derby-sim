import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SimulationResult, LeaderboardEntry } from '../types';
import { motion } from 'motion/react';

interface ResultsProps {
  result: SimulationResult | null;
  comparisonResult?: SimulationResult | null;
  history: LeaderboardEntry[];
}

export function Results({ result, comparisonResult, history }: ResultsProps) {
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        Run simulation to see results
      </div>
    );
  }

  // Downsample data for chart performance
  const chartData = result.data.filter((_, i) => i % 5 === 0).map((p, i) => {
    const compPoint = comparisonResult?.data[i * 5];
    return {
      time: p.time.toFixed(2),
      velocity: p.velocity,
      compVelocity: compPoint ? compPoint.velocity : null,
    };
  });

  // Badges Logic
  const badges = [];
  const bestTime = history.length > 0 ? Math.min(...history.map(e => e.result.finishTime)) : Infinity;
  
  // Check if this result is already in history (to avoid self-comparison if it was just added)
  // But history is updated after run? Or passed from App state.
  // App state updates history on "Save". If we just ran, it might not be in history yet.
  // If we just saved, it is in history.
  // Let's assume we are checking against *previous* best.
  // If result.finishTime < bestTime, it's a record.
  
  if (result.finishTime < bestTime) {
    badges.push({ icon: '🏆', label: 'New Record!', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' });
  }
  
  if (result.finishTime < 2.5) {
     badges.push({ icon: '⚡', label: 'Speed Demon', color: 'bg-blue-100 text-blue-800 border-blue-200' });
  }
  
  if (result.maxSpeed > 5.0) { // 5 m/s is pretty fast for these tracks
     badges.push({ icon: '🚀', label: 'Rocket', color: 'bg-red-100 text-red-800 border-red-200' });
  }
  
  const efficiency = 1 - (Math.abs(result.energy.workFriction) / result.energy.initialPE);
  if (efficiency > 0.85) {
     badges.push({ icon: '🧊', label: 'Smooth Operator', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Stats Card */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Performance</h3>
          <div className="space-y-6">
            <div>
              <div className="text-3xl font-bold text-gray-900">{result.finishTime.toFixed(4)}s</div>
              <div className="text-sm text-gray-500">Finish Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">{result.maxSpeed.toFixed(2)} m/s</div>
              <div className="text-sm text-gray-500">Top Speed</div>
            </div>
            <div>
              <div className="text-lg font-medium text-gray-900">
                {(result.maxSpeed * 2.23694).toFixed(1)} mph
              </div>
              <div className="text-sm text-gray-500">Scale Speed</div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Achievements</h4>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, i) => (
                  <motion.div
                    key={badge.label}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}
                  >
                    <span className="mr-1.5 text-sm">{badge.icon}</span>
                    {badge.label}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {comparisonResult && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Comparison</h4>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Diff:</span>
                <span className={`font-mono font-bold ${result.finishTime < comparisonResult.finishTime ? 'text-green-600' : 'text-red-600'}`}>
                  {(result.finishTime - comparisonResult.finishTime).toFixed(4)}s
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Velocity Profile</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fontSize: 12 }}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                itemStyle={{ color: '#4f46e5' }}
              />
              <Line 
                type="monotone" 
                dataKey="velocity" 
                stroke="#4f46e5" 
                strokeWidth={2} 
                dot={false} 
                activeDot={{ r: 6 }}
                name="Current"
              />
              {comparisonResult && (
                <Line 
                  type="monotone" 
                  dataKey="compVelocity" 
                  stroke="#9ca3af" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false} 
                  name="Comparison"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
