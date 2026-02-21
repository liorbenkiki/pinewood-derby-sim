import React, { useEffect, useRef, useState } from 'react';
import { SimulationResult, TrackConfig, CarConfig } from '../types';
import { PHYSICS } from '../constants';

interface TrackProps {
  result: SimulationResult | null;
  isAnimating: boolean;
  track: TrackConfig;
  config: CarConfig;
}

export function Track({ result, isAnimating, track, config }: TrackProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0); // 0 to 1

  useEffect(() => {
    if (!isAnimating || !result) {
      setProgress(result ? 1 : 0);
      return;
    }

    let startTime: number;
    const duration = result.finishTime * 1000; // Realtime playback
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);

      if (p < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, result]);

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw Track Profile
    // Map x (0 to TRACK_LENGTH) to canvas width
    // Map y (height) to canvas height
    const scaleX = (width - 40) / track.lengthMeters;
    const scaleY = (height - 40) / track.startHeightMeters;
    const offsetX = 20;
    const offsetY = height - 20; // Bottom

    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    
    // Draw curve
    const rampLength = track.lengthMeters - track.flatLengthMeters;
    // Draw track path
    for (let i = 0; i <= 200; i++) {
        const x = (i / 200) * track.lengthMeters;
        let y = 0;
        
        if (x < rampLength) {
            const p = x / rampLength;
            y = track.startHeightMeters * (1 - p) * (1 - p);
        } else {
            y = 0;
        }

        const cx = offsetX + x * scaleX;
        const cy = offsetY - y * scaleY;
        
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Draw Car
    const drawCar = (x: number, y: number, angle: number) => {
        const cx = offsetX + x * scaleX;
        const cy = offsetY - y * scaleY;

        ctx.save();
        ctx.translate(cx, cy);
        // Rotate: angle is slope angle (positive down). Canvas rotation is clockwise positive.
        // If angle is from atan(dy/dx), and dy is negative for down slope in physics but positive in canvas...
        // Wait, in our physics y is height (up). So dy/dx is negative on the slope.
        // atan(negative) is negative angle (slope down).
        // Canvas y is down. So we need to rotate by -angle to match the visual slope?
        // Let's check the previous implementation: `ctx.rotate(angle)`.
        // If angle is negative (slope down), rotating by negative angle rotates counter-clockwise (up).
        // But the track is drawn with y up (subtracted from height).
        // Actually, let's just use the slope of the visual line segment.
        // Visual slope: dy_canvas / dx_canvas.
        // dy_canvas = -dy_physics * scaleY
        // dx_canvas = dx_physics * scaleX
        // visual_angle = atan( (-dy/dx) * (scaleY/scaleX) )
        // Let's approximate rotation for now.
        
        // Calculate visual angle from track derivative
        let slope = 0;
        if (x < rampLength) {
             const p = x / rampLength;
             slope = -2 * track.startHeightMeters * (1 - p) / rampLength;
        }
        // Visual slope
        const visualSlope = -slope * (scaleY / scaleX);
        const visualAngle = Math.atan(visualSlope);
        
        ctx.rotate(-visualAngle); // Rotate to match track

        // Draw Body
        ctx.fillStyle = config.color;
        
        if (config.bodyStyle === 'wedge') {
            ctx.beginPath();
            ctx.moveTo(-15, -5); // Rear bottom
            ctx.lineTo(15, -5);  // Front bottom
            ctx.lineTo(-15, -15); // Rear top
            ctx.closePath();
            ctx.fill();
        } else if (config.bodyStyle === 'block') {
            ctx.fillRect(-15, -15, 30, 10);
        } else if (config.bodyStyle === 'bullet') {
            ctx.beginPath();
            ctx.moveTo(-15, -5);
            ctx.lineTo(5, -5);
            ctx.quadraticCurveTo(15, -5, 15, -10);
            ctx.quadraticCurveTo(15, -15, 5, -15);
            ctx.lineTo(-15, -15);
            ctx.closePath();
            ctx.fill();
        } else if (config.bodyStyle === 'shark') {
            ctx.beginPath();
            ctx.moveTo(-15, -5);
            ctx.lineTo(15, -5);
            ctx.lineTo(15, -10);
            ctx.lineTo(0, -10);
            ctx.lineTo(-5, -20); // Fin
            ctx.lineTo(-10, -10);
            ctx.lineTo(-15, -10);
            ctx.closePath();
            ctx.fill();
        }

        // Draw Stickers
        ctx.font = '10px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        config.stickers.forEach((s, i) => {
            let stickerChar = '';
            if (s === 'flames') stickerChar = '🔥';
            if (s === 'lightning') stickerChar = '⚡';
            if (s === 'star') stickerChar = '⭐';
            if (s === 'skull') stickerChar = '💀';
            if (s === 'flag') stickerChar = '🏁';
            if (s === 'number') stickerChar = '1️⃣';
            
            // Distribute stickers along the body
            const stickerX = -10 + (i * 8) % 20;
            const stickerY = -10;
            ctx.fillText(stickerChar, stickerX, stickerY);
        });

        // Wheels
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-10, -5, 4, 0, Math.PI * 2);
        ctx.arc(10, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    if (result) {
      // Find position at current progress
      const totalTime = result.finishTime;
      const currentTime = progress * totalTime;
      const point = result.data.find(p => p.time >= currentTime) || result.data[result.data.length - 1];
      
      if (point) {
        let y = 0;
        if (point.position < rampLength) {
           const p = point.position / rampLength;
           y = track.startHeightMeters * (1 - p) * (1 - p);
        }
        drawCar(point.position, y, 0);
      }
    } else {
        // Draw at start
        drawCar(0, track.startHeightMeters, 0);
    }

  }, [progress, result, track, config]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-64 w-full">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Track Visualization</h3>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        className="w-full h-full object-contain"
      />
    </div>
  );
}
