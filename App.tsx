import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, AIResponse, InventoryItem } from './types';
import { generateNextTurn } from './services/geminiService';
import { ClockWeather } from './components/ClockWeather';
import { StatusPanel } from './components/StatusPanel';
import { AsciiDisplay } from './components/AsciiDisplay';
import { GameLog } from './components/GameLog';
import { BackgroundMusic } from './components/BackgroundMusic';
import { ItemModal } from './components/ItemModal';

const SAVE_KEY = '1988_SAVE_DATA';

const INITIAL_STATE: GameState = {
  locationName: "桦钢市 - 站前招待所 302室",
  weather: "大雪纷飞",
  time: "05:30",
  stats: {
    money: 120, // RMB
    hp: 80,
    maxHp: 100,
    stamina: 60,
    maxStamina: 100,
    reputation: 10 // Guanxi
  },
  inventory: [
    { name: "大前门香烟", description: "一盒挤扁了的软包大前门，里面还剩三根。烟盒上用圆珠笔写着几个模糊的数字。", isKeyItem: false },
    { name: "警官证(已停职)", description: "职务栏盖着红色的'停职'印章。照片里的人眼神锐利，与现在的你判若两人。", isKeyItem: true },
    { name: "生锈的铁盒", description: "从床底下翻出来的饼干盒，里面装着一些旧票据和那张现场照片。", isKeyItem: false }
  ],
  nearbyLocations: ["招待所走廊", "站前大街", "国营饺子馆"],
  characters: ["前台服务员"],
  sceneDescription: "你被窗外蒸汽机车的汽笛声吵醒。房间里暖气片冰凉，玻璃窗上结满了厚厚的冰花。昏暗的灯光下，你看到桌上放着一盒没抽完的'大前门'和那张导致你被停职的现场照片。照片背后写着一个地址：第三轧钢厂，锅炉房。",
  asciiArt: `
      _______________________
     /                      /|
    /______________________/ |
   |      __________      |  |
   |     |          |     |  |
   |     |  [窗户]  |     |  |
   |     |___\\\\//___|     |  |
   |        //\\\\          |  |
   |       //  \\\\         |  |
   |______________________|  |
   |   [桌子]     [床铺]  | /
   |______________________|/
  `,
  logs: ["1988年12月14日，档案记录开始。", "醒来，头痛欲裂。", "外面的雪下得很大。"]
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicMood, setMusicMood] = useState<'normal' | 'suspense'>('normal');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  const moodTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input on mount and after actions
  useEffect(() => {
    if (!selectedItem) {
      inputRef.current?.focus();
    }
  }, [gameState, isLoading, selectedItem]);

  const toggleMusic = () => {
    setIsMusicPlaying(!isMusicPlaying);
  };

  const triggerSuspenseMusic = useCallback(() => {
    setMusicMood('suspense');
    // Clear existing timer if any
    if (moodTimerRef.current) {
      window.clearTimeout(moodTimerRef.current);
    }
    // Revert to normal after 30 seconds
    moodTimerRef.current = window.setTimeout(() => {
      setMusicMood('normal');
    }, 30000);
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, "系统: 进度已保存到磁带存储器。"]
      }));
    } catch (e) {
      console.error("Save failed", e);
      alert("保存失败：存储空间不足");
    }
  };

  const handleLoad = () => {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) {
        const parsedState = JSON.parse(savedData) as GameState;
        setGameState({
            ...parsedState,
            logs: [...parsedState.logs, "系统: 进度读取成功。"]
        });
        // Reset suspense mood just in case
        setMusicMood('normal');
      } else {
        setGameState(prev => ({
            ...prev,
            logs: [...prev.logs, "系统: 未检测到存档记录。"]
        }));
      }
    } catch (e) {
      console.error("Load failed", e);
      setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, "系统错误: 存档文件损坏。"]
      }));
    }
  };

  const handleAction = useCallback(async (actionText: string) => {
    if (!actionText.trim() || isLoading) return;

    setIsLoading(true);
    setInput(""); 
    
    // Optimistic log update
    const userLog = `> ${actionText}`;
    setGameState(prev => ({
      ...prev,
      logs: [...prev.logs, userLog]
    }));

    try {
      const aiResponse: AIResponse = await generateNextTurn(gameState, actionText);

      setGameState(prev => {
        const newStats = { ...prev.stats, ...aiResponse.statsChange };
        
        let newInventory = [...prev.inventory];
        
        // Add new items (objects)
        if (aiResponse.inventoryAdd) {
            newInventory = [...newInventory, ...aiResponse.inventoryAdd];
        }
        
        // Remove items (by name matching)
        if (aiResponse.inventoryRemove) {
            newInventory = newInventory.filter(item => !aiResponse.inventoryRemove?.includes(item.name));
        }

        return {
          ...prev,
          locationName: aiResponse.locationName,
          weather: aiResponse.weather,
          sceneDescription: aiResponse.sceneDescription,
          nearbyLocations: aiResponse.nearbyLocations,
          characters: aiResponse.characters,
          asciiArt: aiResponse.asciiArt,
          stats: newStats,
          inventory: newInventory,
          logs: [...prev.logs, aiResponse.logEntry]
        };
      });

      // Handle Music Mood Switch
      if (aiResponse.isSuspense) {
        triggerSuspenseMusic();
      }

    } catch (error) {
      console.error("Game loop error", error);
      setGameState(prev => ({
        ...prev,
        logs: [...prev.logs, "错误：信号干扰。"]
      }));
    } finally {
      setIsLoading(false);
    }
  }, [gameState, isLoading, triggerSuspenseMusic]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAction(input);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#050505] text-[#cccccc] font-mono overflow-hidden flex flex-col items-center justify-center p-2">
      <BackgroundMusic isPlaying={isMusicPlaying} mood={musicMood} />
      
      {/* Item Inspection Modal */}
      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />

      {/* Main CRT Frame */}
      <div className="w-full max-w-7xl h-full max-h-[95vh] border border-[#333] bg-black flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* CRT Scanline Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

        {/* --- Top Header Bar --- */}
        <div className="h-12 border-b border-[#333] flex items-center justify-between px-4 bg-[#111]">
           <div className="flex items-center gap-4">
              <span className="font-bold text-lg text-white tracking-widest">1988: 凛冬</span>
              <span className="text-xs text-gray-500 hidden md:inline">案件编号: 88-12-14-CN</span>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
             <button 
               onClick={handleSave}
               className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#333] text-gray-500 hover:text-white hover:border-gray-500 hover:bg-[#222] transition-colors"
               title="保存当前进度"
             >
               保存
             </button>
             <button 
               onClick={handleLoad}
               className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[#333] text-gray-500 hover:text-white hover:border-gray-500 hover:bg-[#222] transition-colors"
               title="读取存档"
             >
               读取
             </button>
             <div className="w-px h-4 bg-[#333] mx-1"></div>
             <button 
               onClick={toggleMusic}
               className={`text-[10px] uppercase tracking-wider px-2 py-1 border ${isMusicPlaying ? 'border-green-800 text-green-500 bg-green-900/20' : 'border-[#333] text-gray-500 hover:text-gray-300'}`}
             >
               {isMusicPlaying ? (musicMood === 'suspense' ? '背景音: 警报' : '背景音: 常规') : '背景音: 关闭'}
             </button>
             <div className="hidden md:block">
               <ClockWeather weather={gameState.weather} />
             </div>
           </div>
        </div>

        {/* --- Main Layout Grid --- */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left: Status & Inventory (Fixed Width) */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#333] flex flex-col bg-[#0a0a0a]">
            <StatusPanel 
                gameState={gameState} 
                onAction={handleAction} 
                onItemClick={(item) => setSelectedItem(item)}
            />
          </div>

          {/* Center: Scene Display (Flexible) */}
          <div className="flex-1 flex flex-col relative bg-black">
             {/* Scene Header */}
             <div className={`absolute top-0 left-0 right-0 p-2 z-10 transition-colors duration-1000 ${musicMood === 'suspense' ? 'bg-gradient-to-b from-red-900/50 to-transparent' : 'bg-gradient-to-b from-black to-transparent'}`}>
                <h2 className="text-xl text-center text-white font-bold tracking-widest drop-shadow-md">{gameState.locationName}</h2>
             </div>

             {/* ASCII Art Area - Maximize space */}
             <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
                {/* Non-blocking loading indicator */}
                {isLoading && (
                  <div className="absolute top-10 right-4 z-20">
                     <div className="flex items-center space-x-2 text-green-500 text-xs font-mono animate-pulse bg-black/50 px-2 py-1 rounded border border-green-900/50">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>正在接收电传信号...</span>
                     </div>
                  </div>
                )}
                <AsciiDisplay art={gameState.asciiArt} />
             </div>

             {/* Scene Description Box (Bottom of Center) */}
             <div className={`min-h-[120px] max-h-[180px] border-t border-[#333] p-4 overflow-y-auto transition-colors duration-1000 ${musicMood === 'suspense' ? 'bg-[#1a0505]' : 'bg-[#080808]'}`}>
               <p className="text-sm md:text-base leading-7 text-[#ddd] font-serif tracking-wide">
                 <span className={`inline-block w-2 h-2 mr-2 mb-0.5 ${musicMood === 'suspense' ? 'bg-red-600 animate-pulse' : 'bg-[#333]'}`}></span>
                 {gameState.sceneDescription}
               </p>
             </div>
          </div>

          {/* Right: Log (Fixed Width) */}
          <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-[#333] bg-[#0a0a0a] hidden md:flex flex-col">
             <GameLog logs={gameState.logs} />
          </div>
        </div>

        {/* --- Bottom: Input Bar (Full Width) --- */}
        <div className="h-14 border-t border-[#333] bg-[#000] flex items-center px-4 shrink-0 z-40">
           <span className={`text-white font-bold mr-3 animate-pulse ${musicMood === 'suspense' ? 'text-red-500' : ''}`}>{">"}</span>
           <input 
              ref={inputRef}
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !!selectedItem}
              placeholder={isLoading ? "正在处理请求..." : "输入行动指令 (例如: 调查桌子, 询问服务员, 前往工厂)"}
              className="flex-1 bg-transparent border-none outline-none text-white font-mono text-lg placeholder-gray-700"
              autoComplete="off"
            />
            <button 
              onClick={() => handleAction(input)}
              disabled={isLoading || !input.trim() || !!selectedItem}
              className="ml-4 px-6 py-1 border border-[#333] text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors uppercase tracking-widest"
            >
              执行
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;