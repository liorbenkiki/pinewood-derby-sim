import React, { useState, useRef, useEffect } from 'react';

interface XYWeightSelectorProps {
    x: number; // -4 to 4
    y: number; // -4 to 4
    onChange: (x: number, y: number) => void;
}

export function XYWeightSelector({ x, y, onChange }: XYWeightSelectorProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const GRID_SIZE = 9;
    const RANGE = 4;

    const handlePointerInteraction = (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
        if (!gridRef.current) return;
        const rect = gridRef.current.getBoundingClientRect();
        let cx = e.clientX - rect.left;
        let cy = e.clientY - rect.top;

        // clamp
        cx = Math.max(0, Math.min(cx, rect.width - 1)); // -1 to avoid hitting the very edge which might push to the next cell visually
        cy = Math.max(0, Math.min(cy, rect.height - 1));

        // calculate cells
        const cellWidth = rect.width / GRID_SIZE;
        const cellHeight = rect.height / GRID_SIZE;

        const gridX = Math.floor(cx / cellWidth);
        const gridY = Math.floor(cy / cellHeight);

        // convert to -4..4
        const newX = Math.min(RANGE, Math.max(-RANGE, gridX - RANGE));
        const newY = Math.min(RANGE, Math.max(-RANGE, gridY - RANGE));

        if (newX !== x || newY !== y) {
            onChange(newX, newY);
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault(); // prevent scrolling while dragging
        setIsDragging(true);
        handlePointerInteraction(e);
    };

    useEffect(() => {
        const handlePointerMove = (e: PointerEvent) => {
            if (isDragging) {
                e.preventDefault();
                handlePointerInteraction(e);
            }
        };

        const handlePointerUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove, { passive: false });
            window.addEventListener('pointerup', handlePointerUp);
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [isDragging, x, y, onChange]);

    return (
        <div className="mb-4">
            <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Weight Position</label>
                <div className="text-xs space-x-2">
                    <span className="text-gray-500 font-mono">
                        X: {x > 0 ? '+' : ''}{x}
                    </span>
                    <span className="text-gray-500 font-mono">
                        Y: {y > 0 ? '+' : ''}{y}
                    </span>
                </div>
            </div>

            <div className="flex text-[10px] text-gray-400 font-semibold uppercase justify-between px-1 mb-1 ml-6">
                <span>Rear</span>
                <span className="tracking-widest">X-Axis</span>
                <span>Front</span>
            </div>

            <div className="flex relative items-stretch gap-1">
                <div className="flex flex-col text-[10px] text-gray-400 font-semibold uppercase justify-between py-2 items-center w-6">
                    <span>Top</span>
                    <span className="tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Y-Axis</span>
                    <span>Bot</span>
                </div>
                <div
                    ref={gridRef}
                    onPointerDown={handlePointerDown}
                    className="relative flex-1 aspect-square bg-gray-50 border border-gray-300 rounded-md touch-none cursor-crosshair overflow-hidden shadow-inner"
                >
                    {/* Draw checkerboard or grid */}
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
                        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
                            <div key={i} className={`border-r border-b ${i % 2 === 0 ? 'bg-white/50' : ''} border-gray-200/40`} />
                        ))}
                    </div>
                    {/* X/Y Axes lines */}
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-px h-[2px] bg-indigo-500/20 pointer-events-none" />
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-px w-[2px] bg-indigo-500/20 pointer-events-none" />

                    {/* Draw the selected point */}
                    <div
                        className="absolute w-5 h-5 rounded-full bg-indigo-600 shadow-md border-2 border-white pointer-events-none transition-all duration-100 ease-out z-10"
                        style={{
                            left: `calc(${(x + RANGE) * (100 / GRID_SIZE)}% + ${100 / GRID_SIZE / 2}%)`,
                            top: `calc(${(y + RANGE) * (100 / GRID_SIZE)}% + ${100 / GRID_SIZE / 2}%)`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
