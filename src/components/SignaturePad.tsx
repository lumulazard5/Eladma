import React, { useRef, useEffect, useState } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';
import { motion } from 'motion/react';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';

interface SignaturePadProps {
  onSign: (signatureData: string) => void;
  onClear: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSign, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas resolution
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
       ctx.strokeStyle = '#ffffff';
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    haptics.light();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      if (!hasSigned) {
        setHasSigned(true);
        // Play small click or select on first trace
        sounds.click();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (hasSigned && canvasRef.current) {
      haptics.success();
      onSign(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      haptics.warning();
      sounds.warning();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
      onClear();
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative group">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl cursor-crosshair touch-none"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="p-2 bg-white dark:bg-zinc-700 text-zinc-500 hover:text-red-500 rounded-lg shadow-sm border dark:border-zinc-600 transition-colors"
            title="Effacer"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>
        {!hasSigned && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="flex flex-col items-center gap-2">
              <PenTool className="w-8 h-8 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-500">Signez ici</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-400 px-2">
        <Check className={`w-3 h-3 ${hasSigned ? 'text-emerald-500' : 'text-zinc-200'}`} />
        Signature Électronique Certifiée Eladma
      </div>
    </div>
  );
};
