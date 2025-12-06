import React, { useEffect, useRef } from 'react';

interface GameLogProps {
  logs: string[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      <div className="flex justify-between items-center bg-[#111] text-gray-400 px-3 py-2 border-b border-[#333]">
        <h3 className="font-bold text-xs tracking-widest">行动档案 / LOGS</h3>
        <span className="text-[10px]">记录中...</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-4 custom-scrollbar">
        {logs.map((log, i) => (
          <div key={i} className="flex flex-col animate-in fade-in duration-500">
             <div className="flex items-center mb-1 opacity-40 text-[10px]">
                <span className="mr-2">[{i + 1}]</span>
                <span>{new Date().toLocaleTimeString('zh-CN', {hour12: false})}</span>
             </div>
             <p className={`leading-relaxed ${log.startsWith('>') ? 'text-white font-bold' : 'text-gray-400'}`}>
               {log}
             </p>
             <div className="w-full h-px bg-[#222] mt-3"></div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};