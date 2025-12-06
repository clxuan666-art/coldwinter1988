import React from 'react';
import { GameState, InventoryItem } from '../types';

interface StatusPanelProps {
  gameState: GameState;
  onAction: (action: string) => void;
  onItemClick: (item: InventoryItem) => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ gameState, onAction, onItemClick }) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      
      {/* Stats Header */}
      <div className="p-3 border-b border-[#333] bg-[#111]">
        <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase">人物状态 / STATUS</h3>
      </div>
      
      {/* Stats Grid */}
      <div className="p-3 grid grid-cols-2 gap-3 border-b border-[#333]">
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-600 mb-1">现金 (元)</span>
             <span className="text-sm font-bold text-white">¥{gameState.stats.money}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-600 mb-1">体力</span>
             <div className="w-full h-1.5 bg-[#333] mt-1">
                <div className="h-full bg-white" style={{ width: `${(gameState.stats.hp / gameState.stats.maxHp) * 100}%` }}></div>
             </div>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-600 mb-1">人际关系</span>
             <span className="text-sm font-bold text-white">{gameState.stats.reputation}</span>
           </div>
           <div className="flex flex-col">
             <span className="text-[10px] text-gray-600 mb-1">物品数量</span>
             <span className="text-sm text-gray-300">{gameState.inventory.length}</span>
           </div>
      </div>

      {/* Locations */}
      <div className="flex-1 flex flex-col">
        <div className="p-2 bg-[#111] border-b border-[#333]">
           <span className="text-xs font-bold text-gray-400 tracking-widest">周边地点 / LOCATIONS</span>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {gameState.nearbyLocations.map((loc, idx) => (
            <button
              key={idx}
              onClick={() => onAction(`前往 ${loc}`)}
              className="text-xs text-left text-gray-300 hover:text-white hover:bg-[#222] p-2 transition-colors border-l-2 border-transparent hover:border-white truncate"
            >
              <span className="mr-2 text-gray-600">➞</span> {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Characters */}
      <div className="flex-1 flex flex-col border-t border-[#333]">
        <div className="p-2 bg-[#111] border-b border-[#333]">
           <span className="text-xs font-bold text-gray-400 tracking-widest">现场人物 / PEOPLE</span>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {gameState.characters.map((char, idx) => (
            <button
              key={idx}
              onClick={() => onAction(`询问 ${char}`)}
              className="text-xs text-left text-gray-300 hover:text-white hover:bg-[#222] p-2 transition-colors flex items-center truncate"
            >
              <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></span> {char}
            </button>
          ))}
          {gameState.characters.length === 0 && (
            <div className="text-xs text-gray-600 p-2 italic">无人</div>
          )}
        </div>
      </div>

      {/* Inventory List (Clickable) */}
      <div className="border-t border-[#333] p-3">
         <span className="text-[10px] text-gray-600 block mb-2 uppercase">背包物品 / INVENTORY</span>
         <div className="flex flex-wrap gap-2">
            {gameState.inventory.map((item, i) => (
              <button 
                key={i} 
                onClick={() => onItemClick(item)}
                className={`text-[10px] border px-1.5 py-0.5 transition-colors ${
                  item.isKeyItem 
                    ? 'border-red-900 text-red-400 hover:border-red-500 hover:text-red-200 bg-red-950/20' 
                    : 'border-[#444] text-gray-400 hover:border-gray-500 hover:text-white'
                }`}
              >
                {item.isKeyItem && <span className="mr-1 text-red-500">!</span>}
                {item.name}
              </button>
            ))}
            {gameState.inventory.length === 0 && (
                <span className="text-[10px] text-gray-600 italic">空空如也</span>
            )}
         </div>
      </div>
    </div>
  );
};