import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Move, Trash2, Check, Type } from 'lucide-react';
import { HeaderText } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface HeaderImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  headerTexts: HeaderText[];
  onSave: (texts: HeaderText[]) => void;
}

export function HeaderImageEditor({ isOpen, onClose, headerTexts, onSave }: HeaderImageEditorProps) {
  const [texts, setTexts] = useState<HeaderText[]>(headerTexts || []);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTexts(headerTexts || []);
    }
  }, [isOpen, headerTexts]);

  if (!isOpen) return null;

  const handleAddText = () => {
    // Add text in the center of the container (50%, 50%)
    setTexts([...texts, { id: uuidv4(), text: 'نص جديد', x: 50, y: 50, scale: 1 }]);
  };

  const handleUpdateText = (id: string, updates: Partial<HeaderText>) => {
    setTexts(texts.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleDeleteText = (id: string) => {
    setTexts(texts.filter(t => t.id !== id));
  };

  const handleSave = () => {
    onSave(texts);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100" dir="rtl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Type size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">تعديل نصوص الترويسة</h2>
              <p className="text-xs text-gray-500 mt-0.5">أضف النصوص وحركها فوق الصورة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-gray-50 border-b border-gray-200 flex gap-2 shrink-0">
          <button
            onClick={handleAddText}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus size={16} />
            إضافة نص جديد
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-12 bg-gray-100/50 flex items-center justify-center relative min-h-[300px]">
          <div 
            ref={containerRef}
            className="relative bg-white shadow-md rounded-lg border border-gray-200"
            style={{ width: '100%', maxWidth: '800px', containerType: 'inline-size' }}
          >
            <img 
              src="/calesha.png" 
              alt="Header Background" 
              className="w-full h-auto object-contain pointer-events-none block rounded-lg" 
            />
            
            {texts.map(text => (
              <DraggableText
                key={text.id}
                text={text}
                onUpdate={(updates) => handleUpdateText(text.id, updates)}
                onDelete={() => handleDeleteText(text.id)}
                containerRef={containerRef}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 flex justify-end gap-3 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg transform active:scale-95"
          >
            <Check size={18} />
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
}

function DraggableText({ 
  text, 
  onUpdate, 
  onDelete,
  containerRef
}: { 
  key?: string;
  text: HeaderText; 
  onUpdate: (updates: Partial<HeaderText>) => void; 
  onDelete: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const showControls = isFocused || isHovered;
  const currentScale = text.scale || 1;
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (textRef.current && textRef.current.textContent !== text.text) {
      textRef.current.textContent = text.text;
    }
  }, [text.text]);

  return (
    <div
      className="absolute z-10 group"
      style={{ 
        left: `${text.x}%`, 
        top: `${text.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(true);
        textRef.current?.focus();
      }}
    >
      <div className="relative flex items-center justify-center">
        
        {/* Controls Container - Only visible on hover/focus */}
        <div className={`absolute -inset-2 border-2 border-indigo-400 border-dashed rounded pointer-events-none transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Drag Handle */}
        <div 
          className={`absolute -top-8 left-1/2 -translate-x-1/2 p-1.5 bg-indigo-600 text-white rounded cursor-move shadow-md transition-opacity duration-200 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const container = containerRef.current;
            if (!container) return;

            const startX = e.clientX;
            const startY = e.clientY;
            const startPctX = text.x;
            const startPctY = text.y;
            
            const onPointerMove = (moveEvent: PointerEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              
              // Convert delta to percentage of container
              const pctDeltaX = (deltaX / container.clientWidth) * 100;
              const pctDeltaY = (deltaY / container.clientHeight) * 100;
              
              onUpdate({ 
                x: Math.max(0, Math.min(100, startPctX + pctDeltaX)),
                y: Math.max(0, Math.min(100, startPctY + pctDeltaY))
              });
            };
            
            const onPointerUp = () => {
              window.removeEventListener('pointermove', onPointerMove);
              window.removeEventListener('pointerup', onPointerUp);
            };
            
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
          }}
        >
          <Move size={14} />
        </div>

        {/* Delete Button */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className={`absolute -top-3 -right-3 p-1 bg-white border border-gray-200 rounded-full text-red-500 transition-all duration-200 shadow-md hover:bg-red-50 hover:text-red-600 z-30 ${showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
        >
          <Trash2 size={12} />
        </button>

        {/* Resize Handle */}
        <div 
          className={`absolute -bottom-3 -left-3 w-6 h-6 bg-white border border-gray-300 rounded-full cursor-nwse-resize transition-all duration-200 shadow-md z-30 flex items-center justify-center ${showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            const startX = e.clientX;
            const startY = e.clientY;
            const startScale = currentScale;
            
            const onPointerMove = (moveEvent: PointerEvent) => {
              // Calculate distance moved diagonally
              const deltaX = startX - moveEvent.clientX; // RTL: moving left increases size
              const deltaY = moveEvent.clientY - startY; // Moving down increases size
              
              // Use the larger of the two movements to determine scale change
              // This makes resizing feel more natural whether dragging horizontally or vertically
              const movement = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
              
              // Adjust sensitivity
              const newScale = Math.max(0.5, Math.min(8, startScale + movement * 0.015));
              onUpdate({ scale: newScale });
            };
            
            const onPointerUp = () => {
              window.removeEventListener('pointermove', onPointerMove);
              window.removeEventListener('pointerup', onPointerUp);
            };
            
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
          }}
        >
          <div className="w-2 h-2 bg-indigo-500 rounded-full pointer-events-none"></div>
        </div>

        {/* Text Input */}
        <span
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            setIsFocused(false);
            onUpdate({ text: e.currentTarget.textContent || 'نص' });
          }}
          onFocus={() => setIsFocused(true)}
          onPointerDown={(e) => e.stopPropagation()}
          className={`outline-none font-bold text-center whitespace-nowrap px-2 py-1 z-10 ${showControls ? 'bg-white/50 rounded' : ''}`}
          style={{ 
            fontSize: `${2 * currentScale}cqw`,
            lineHeight: '1.2',
            color: '#000',
            textShadow: '0px 0px 2px rgba(255,255,255,0.8)',
            minWidth: '20px',
            display: 'inline-block'
          }}
          dir="rtl"
        >
          {text.text}
        </span>
      </div>
    </div>
  );
}
