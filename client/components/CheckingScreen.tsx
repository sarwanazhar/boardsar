import React, { useState, useEffect } from 'react';

interface CheckingScreenProps {
  onFinish?: () => void;
}

const CheckingScreen: React.FC<CheckingScreenProps> = ({ onFinish }) => {
  const [dots, setDots] = useState('');

  // Animated dots for the "Checking..." vibe
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0f172a]">
      {/* Animated Grid that pulses slightly */}
      <div className="absolute inset-0 hand-drawn-grid opacity-30 animate-pulse"></div>

      {/* Floating Neon Decorations */}
      <div className="absolute top-[10%] left-[15%] w-12 h-12 bg-transparent border-4 border-[#3b82f6] rounded-xl animate-float opacity-40 rotate-12"></div>
      <div className="absolute bottom-[20%] right-[10%] w-16 h-16 bg-transparent border-4 border-[#8b5cf6] rounded-full animate-float opacity-30 delay-700"></div>
      <div className="absolute top-[25%] right-[20%] w-8 h-8 bg-[#06b6d4] rounded-sm animate-wobble opacity-40 -rotate-45"></div>

      <div className="relative flex flex-col items-center">
        {/* The Main Loading Character / Shape */}
        <div className="relative w-32 h-32 mb-8">
          {/* Neon Glow Circles */}
          <div className="absolute inset-0 bg-[#8b5cf6] rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="absolute inset-0 bg-[#3b82f6] rounded-full blur-2xl opacity-10 animate-pulse delay-500" style={{ transform: 'scale(1.2)' }}></div>
          
          {/* Central Animated Orbiters */}
          <div className="absolute inset-0 border-[6px] border-dashed border-[#06b6d4] rounded-full animate-[spin_4s_linear_infinite] p-2">
             <div className="w-full h-full rounded-full border-[6px] border-[#3b82f6] opacity-50"></div>
          </div>

          {/* Center "Eye" or Core */}
          <div className="absolute inset-4 bg-[#0f172a] border-4 border-white rounded-full flex items-center justify-center animate-wobble overflow-hidden shadow-[inset_0_0_15px_rgba(255,255,255,0.2)]">
             <div className="w-8 h-8 bg-white rounded-full relative shadow-[0_0_15px_#fff]">
                <div className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full"></div>
             </div>
          </div>

          {/* Squiggly orbiters */}
          <div className="absolute -top-4 -right-4 w-6 h-6 bg-[#8b5cf6] rounded-full border-4 border-white shadow-[0_0_10px_#8b5cf6] animate-bounce"></div>
          <div className="absolute -bottom-2 -left-4 w-5 h-5 bg-[#3b82f6] rounded-full border-4 border-white shadow-[0_0_10px_#3b82f6] animate-[bounce_1.5s_infinite_delay-1s]"></div>
        </div>

        {/* Text Area */}
        <div className="text-center z-10">
          <h2 className="text-[#3b82f6] text-4xl font-black tracking-widest uppercase italic drop-shadow-[2px_2px_0px_#8b5cf6] mb-2 animate-jitter">
            Checking
          </h2>
          <div className="flex items-center justify-center gap-1">
             <span className="text-white text-lg font-medium opacity-80 uppercase tracking-tighter">Server Status</span>
             <span className="text-[#3b82f6] text-xl font-black min-w-[20px]">{dots}</span>
          </div>
        </div>

        {/* Progress Bar (Stylized) */}
        <div className="mt-12 w-64 h-6 bg-[#1e293b] rounded-full border-2 border-white/20 p-1 relative overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#8b5cf6] via-[#06b6d4] to-[#3b82f6] rounded-full animate-[progress_3s_ease-in-out_infinite] w-[40%] shadow-[0_0_15px_#06b6d4]"></div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(50%); }
          100% { transform: translateX(150%); }
        }
      `}</style>
    </div>
  );
};

export default CheckingScreen;