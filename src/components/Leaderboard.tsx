import React, { useState } from 'react';
import { LeaderboardEntry } from '../types';
import { generateBuildSummary } from '../utils/helpers';
import { clsx } from 'clsx';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onDelete: (id: string) => void;
  onCompare: (entry: LeaderboardEntry) => void;
  comparingId: string | null;
}

export function Leaderboard({ entries, onDelete, onCompare, comparingId }: LeaderboardProps) {
  const [filterLegal, setFilterLegal] = useState(true);

  const isLegal = (entry: LeaderboardEntry) => {
    const c = entry.config;
    return c.totalWeightOz <= 5.0 && c.wheelbase >= 4 && c.wheelbase <= 4.5;
  };

  const filtered = entries
    .filter(e => !filterLegal || isLegal(e))
    .sort((a, b) => a.result.finishTime - b.result.finishTime);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Leaderboard</h3>
        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-600 flex items-center">
            <input 
              type="checkbox" 
              checked={filterLegal} 
              onChange={e => setFilterLegal(e.target.checked)}
              className="mr-1 rounded text-indigo-600 focus:ring-indigo-500"
            />
            Legal Only
          </label>
        </div>
      </div>
      
      <div className="overflow-y-auto flex-1 p-0">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Top Speed</th>
              <th className="px-4 py-3">Build Summary</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((entry, idx) => (
              <tr key={entry.id} className={clsx("hover:bg-gray-50 transition-colors", comparingId === entry.id && "bg-indigo-50")}>
                <td className="px-4 py-3 font-medium text-gray-900">#{idx + 1}</td>
                <td className="px-4 py-3 font-mono text-indigo-600 font-bold">
                  {entry.result.finishTime.toFixed(4)}s
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {entry.result.maxSpeed.toFixed(2)} m/s
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {generateBuildSummary(entry.config)}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => onCompare(entry)}
                    className={clsx(
                      "text-xs font-medium px-2 py-1 rounded transition-colors",
                      comparingId === entry.id 
                        ? "bg-indigo-100 text-indigo-700" 
                        : "text-gray-500 hover:text-indigo-600 hover:bg-gray-100"
                    )}
                  >
                    {comparingId === entry.id ? 'Comparing' : 'Compare'}
                  </button>
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="text-gray-400 hover:text-red-600 px-1"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
