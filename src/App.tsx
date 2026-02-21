import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Track } from './components/Track';
import { Results } from './components/Results';
import { Leaderboard } from './components/Leaderboard';
import { GarageDisplay } from './components/GarageDisplay';
import { CarConfig, SimulationResult, LeaderboardEntry, TrackConfig } from './types';
import { DEFAULT_CAR, DEFAULT_TRACK } from './constants';
import { simulateRace } from './utils/physics';
import { PhysicsDebug } from './components/PhysicsDebug';

export default function App() {
  const [config, setConfig] = useState<CarConfig>(DEFAULT_CAR);
  const [trackConfig, setTrackConfig] = useState<TrackConfig>(DEFAULT_TRACK);
  const [activeTab, setActiveTab] = useState<'car' | 'track' | 'garage'>('car');
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [comparisonResult, setComparisonResult] = useState<SimulationResult | null>(null);
  const [comparingId, setComparingId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [history, setHistory] = useState<LeaderboardEntry[]>(() => {
    try {
      const saved = localStorage.getItem('derby-history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('derby-history', JSON.stringify(history));
  }, [history]);

  const handleRun = () => {
    const simResult = simulateRace(config, trackConfig);
    setResult(simResult);
    setIsAnimating(true);
    // Animation lasts simResult.finishTime seconds
    setTimeout(() => setIsAnimating(false), simResult.finishTime * 1000);
  };

  const handleSave = () => {
    if (!result) return;
    const entry: LeaderboardEntry = {
      id: Date.now().toString(),
      config: { ...config },
      result: { ...result },
      date: Date.now(),
    };
    setHistory(prev => [...prev, entry]);
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
    if (comparingId === id) {
      setComparingId(null);
      setComparisonResult(null);
    }
  };

  const handleCompare = (entry: LeaderboardEntry) => {
    if (comparingId === entry.id) {
      setComparingId(null);
      setComparisonResult(null);
    } else {
      setComparingId(entry.id);
      setComparisonResult(entry.result);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      <Sidebar 
        config={config} 
        trackConfig={trackConfig}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onChange={setConfig} 
        onTrackChange={setTrackConfig}
        onRun={handleRun}
        onSave={handleSave}
      />
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeTab === 'garage' ? (
          <div className="flex-1 p-6 overflow-hidden">
            <GarageDisplay config={config} />
          </div>
        ) : (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Top Section: Track & Leaderboard */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <Track result={result} isAnimating={isAnimating} track={trackConfig} config={config} />
              </div>
              <div className="xl:col-span-1 h-64">
                <Leaderboard 
                  entries={history} 
                  onDelete={handleDelete} 
                  onCompare={handleCompare}
                  comparingId={comparingId}
                />
              </div>
            </div>

            {/* Bottom Section: Detailed Results */}
            <div className="h-96">
               <Results result={result} comparisonResult={comparisonResult} history={history} />
            </div>
            
            <PhysicsDebug energy={result?.energy} />
          </div>
        )}
      </main>
    </div>
  );
}
