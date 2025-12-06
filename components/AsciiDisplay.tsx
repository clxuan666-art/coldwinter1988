import React from 'react';

interface AsciiDisplayProps {
  art: string;
}

export const AsciiDisplay: React.FC<AsciiDisplayProps> = ({ art }) => {
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      <pre className="font-mono text-[10px] md:text-[12px] lg:text-[14px] leading-tight text-[#e0e0e0] whitespace-pre select-none text-center opacity-90 drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]">
        {art}
      </pre>
    </div>
  );
};