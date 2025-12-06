import React, { useState, useEffect } from 'react';

interface ClockWeatherProps {
  weather: string;
}

export const ClockWeather: React.FC<ClockWeatherProps> = ({ weather }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="flex items-center space-x-4 text-xs md:text-sm">
      <div className="flex items-center text-gray-400">
        <span className="mr-2 opacity-50">气温:</span>
        <span>-24°C</span>
      </div>
      <div className="flex items-center text-gray-400 border-l border-[#333] pl-4">
        <span className="mr-2 opacity-50">天气:</span>
        <span>{weather || "未知"}</span>
      </div>
      <div className="flex items-center text-white font-bold border-l border-[#333] pl-4">
        <span className="animate-pulse mr-1 text-green-700">●</span>
        {formatTime(time)}
      </div>
    </div>
  );
};