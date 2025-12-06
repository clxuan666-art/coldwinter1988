import React from 'react';
import { InventoryItem } from '../types';

interface ItemModalProps {
  item: InventoryItem | null;
  onClose: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px]" onClick={onClose}>
      <div 
        className={`w-80 md:w-96 bg-[#0a0a0a] border-2 p-1 flex flex-col shadow-[0_0_30px_rgba(0,0,0,1)] transform scale-100 animate-in fade-in zoom-in duration-200 ${item.isKeyItem ? 'border-red-900' : 'border-[#333]'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-3 py-2 border-b flex justify-between items-center ${item.isKeyItem ? 'bg-red-900/20 border-red-900' : 'bg-[#111] border-[#333]'}`}>
            <h3 className={`font-bold tracking-widest text-sm ${item.isKeyItem ? 'text-red-500' : 'text-gray-300'}`}>
                {item.isKeyItem ? '★ 重要证物' : '物品详情'}
            </h3>
            <span className="text-[10px] text-gray-600">{item.isKeyItem ? 'EVIDENCE' : 'ITEM'}</span>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
            <div className="text-center py-2">
                <span className="text-xl text-white font-serif tracking-wide border-b border-gray-800 pb-1">{item.name}</span>
            </div>
            
            <div className="min-h-[80px] text-xs md:text-sm text-gray-400 leading-6 font-serif">
                {item.description}
            </div>

            {item.isKeyItem && (
                 <div className="text-[10px] text-red-700 mt-2 border border-red-900/30 p-2 bg-red-950/10">
                    警告：此物品可能与案件核心有关，请妥善保管。
                 </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#333] flex justify-end">
            <button 
                onClick={onClose}
                className="px-4 py-1 text-xs text-white bg-[#222] hover:bg-[#333] border border-[#444] uppercase"
            >
                关闭
            </button>
        </div>
      </div>
    </div>
  );
};