import React, { useState } from 'react';
import { EnergyBudget } from '../types';
import { clsx } from 'clsx';

interface PhysicsDebugProps {
  energy: EnergyBudget | undefined;
}

export function PhysicsDebug({ energy }: PhysicsDebugProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!energy) return null;

  const hasError = Math.abs(energy.energyError) > 0.1; // 0.1J tolerance
  const isGain = energy.energyError < -0.1; // Negative error means energy was gained (bad)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-mono text-sm font-semibold text-gray-700">
          Physics Debug / Energy Budget
        </span>
        <span className="text-gray-500 text-xs">
          {isOpen ? 'Hide' : 'Show'}
        </span>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Energy Table */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Energy Breakdown (Joules)
              </h4>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 text-gray-600">Initial Potential (PE)</td>
                    <td className="py-2 text-right font-mono text-gray-900">
                      {energy.initialPE.toFixed(4)} J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Final Kinetic (KE)</td>
                    <td className="py-2 text-right font-mono text-indigo-600">
                      {energy.finalKE.toFixed(4)} J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Rotational KE</td>
                    <td className="py-2 text-right font-mono text-indigo-600">
                      {energy.rotationalKE.toFixed(4)} J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Friction Loss</td>
                    <td className="py-2 text-right font-mono text-red-500">
                      -{energy.workFriction.toFixed(4)} J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Drag Loss</td>
                    <td className="py-2 text-right font-mono text-red-500">
                      -{energy.workDrag.toFixed(4)} J
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">Scrub/Wobble Loss</td>
                    <td className="py-2 text-right font-mono text-red-500">
                      -{energy.workScrub.toFixed(4)} J
                    </td>
                  </tr>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2 pl-2 text-gray-900">Net Error</td>
                    <td className={clsx(
                      "py-2 pr-2 text-right font-mono",
                      hasError ? "text-red-600" : "text-green-600"
                    )}>
                      {energy.energyError.toFixed(5)} J
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Warnings */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                System Status
              </h4>
              <div className="space-y-3">
                {hasError ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <strong>Warning:</strong> Energy conservation violation detected.
                    {isGain ? " System gained energy (instability)." : " Excessive energy loss."}
                  </div>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <strong>OK:</strong> Energy conserved within tolerance.
                  </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <p>• PE converts to KE minus losses.</p>
                  <p>• Friction is dominant at low speeds.</p>
                  <p>• Drag scales with v².</p>
                  <p>• Scrub scales with v² and instability.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
