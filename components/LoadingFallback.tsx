import { CustomSpinner } from '@/components/CustomSpinner';
import React from 'react';

interface LoadingFallbackProps {
  message: string;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message }) => {
  return (
    <div className="flex justify-center items-center min-h-[70vh] flex-col gap-4 bg-gradient-to-b from-[#F5F4FF] via-white to-white">
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-purple-400/20 blur-xl scale-150 animate-pulse" />
        <div className="relative size-16 flex items-center justify-center rounded-2xl bg-white border border-purple-100 shadow-lg shadow-purple-100">
          <CustomSpinner className="h-8 w-8 text-purple-600" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center max-w-[320px]">
        <p className="font-semibold text-neutral-800 text-base font-mono">{message}</p>
        <p className="text-xs text-neutral-400 font-mono">This may take a few seconds...</p>
      </div>
      {/* Animated dots */}
      <div className="flex gap-1.5 mt-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="size-1.5 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingFallback;
