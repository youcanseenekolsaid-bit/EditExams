import React from 'react';
import { Block, Equation } from '../types';
import { Settings2, Trash2, GripVertical } from 'lucide-react';
import { toArabicNumerals } from '../utils';

interface BlockRendererProps {
  key?: string | number;
  block: Block;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  onDragStart?: (e: React.PointerEvent) => void;
  isExporting?: boolean;
}

export function BlockRenderer({ block, onEdit, onDelete, isEditing, onDragStart, isExporting }: BlockRendererProps) {
  return (
    <div 
      id={`block-${block.id}`}
      className={`relative group cursor-pointer p-2 -mx-2 rounded-lg transition-colors border scroll-mt-4 ${isExporting ? 'border-transparent' : isEditing ? 'border-indigo-400 bg-indigo-50/30' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
      style={{
        marginTop: block.marginTop !== undefined ? `${block.marginTop}px` : '0px',
        marginBottom: block.marginBottom !== undefined ? `${block.marginBottom}px` : '16px'
      }}
      onClick={(e) => { e.stopPropagation(); onEdit(); }}
    >
      {!isExporting && (
        <div className={`absolute top-0 left-0 flex gap-1 z-10 transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>
          {onDragStart && (
            <button 
              onPointerDown={(e) => { e.stopPropagation(); onDragStart(e); }} 
              className="p-2 sm:p-2.5 bg-white shadow-sm border rounded text-gray-500 hover:text-indigo-600 cursor-grab active:cursor-grabbing touch-none"
              title="سحب وإفلات"
            >
              <GripVertical size={18} className="sm:w-5 sm:h-5"/>
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="p-2 sm:p-2.5 bg-white shadow-sm border rounded text-gray-500 hover:text-indigo-600"
            title="إعدادات العنصر"
          >
            <Settings2 size={18} className="sm:w-5 sm:h-5"/>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="p-2 sm:p-2.5 bg-white shadow-sm border rounded text-gray-500 hover:text-red-600"
            title="حذف العنصر"
          >
            <Trash2 size={18} className="sm:w-5 sm:h-5"/>
          </button>
        </div>
      )}

      <div className="pointer-events-none">
        {block.type === 'text' && (
          <div style={{ zoom: block.scale || 1 } as any}>
            <p className="text-xs sm:text-sm font-bold whitespace-pre-wrap">{block.content}</p>
          </div>
        )}

        {block.type === 'horizontal_math' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-2" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div 
              className="grid gap-x-4 gap-y-6" 
              style={{ 
                gridTemplateColumns: `repeat(${block.columns || 2}, minmax(0, 1fr))`,
                zoom: block.scale || 1
              } as any}
              dir="rtl"
            >
              {block.equations.map((eq) => {
                const missing = eq.missingField || 'result';
                
                const renderPart = (type: 'num1' | 'num2' | 'result') => {
                  if (missing === type) {
                    return <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-gray-800 rounded-sm flex-shrink-0 bg-white inline-block align-middle mx-1"></div>;
                  }
                  const val = type === 'num1' ? eq.num1 : type === 'num2' ? eq.num2 : eq.result;
                  return <span className="px-1 inline-block align-middle">{toArabicNumerals(val || '')}</span>;
                };

                return (
                  <div key={eq.id} className="flex items-center justify-start font-bold whitespace-nowrap">
                    <div className="flex items-center shrink min-w-0 text-sm sm:text-lg">
                      {renderPart('num1')}
                      <span className="px-1 inline-block align-middle">{eq.operator}</span>
                      {renderPart('num2')}
                      <span className="px-1 inline-block align-middle">=</span>
                      {renderPart('result')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {block.type === 'vertical_math' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-2" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div className="flex justify-around flex-wrap gap-4" dir="rtl" style={{ zoom: block.scale || 1 } as any}>
              {block.equations.map((eq) => {
                const missing = eq.missingField || 'result';
                
                const renderPart = (type: 'num1' | 'num2' | 'result', isBottom = false) => {
                  if (missing === type) {
                    return <div className={`border-2 border-gray-800 rounded-sm bg-white ${isBottom ? 'w-10 h-6 mt-1' : 'w-8 h-8'}`}></div>;
                  }
                  const val = type === 'num1' ? eq.num1 : type === 'num2' ? eq.num2 : eq.result;
                  return <span>{toArabicNumerals(val || '')}</span>;
                };

                return (
                  <div key={eq.id} className="flex flex-col items-center text-sm sm:text-lg font-bold">
                    <div className="grid grid-cols-[auto_1fr] gap-x-2 w-full items-center">
                      {/* Empty space above operator */}
                      <div></div>
                      <div className="text-right min-h-[2rem] flex items-center justify-start">
                        {renderPart('num1')}
                      </div>
                      
                      {/* Operator on the right (in RTL, col 1 is right) */}
                      <div className="text-left">
                        <span>{eq.operator}</span>
                      </div>
                      <div className="text-right min-h-[2rem] flex items-center justify-start">
                        {renderPart('num2')}
                      </div>

                      {/* Divider line spanning both columns */}
                      <div className="col-span-2 border-t-2 border-black mt-1 pt-1"></div>

                      {/* Result */}
                      <div></div>
                      <div className="text-right min-h-[2rem] flex items-center justify-start">
                        {renderPart('result', true)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {block.type === 'number_line' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-4" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div className="relative py-4 px-2" dir="ltr" style={{ zoom: block.scale || 1 } as any}>
              <div className="relative h-10 w-full">
                {/* Main line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-black"></div>
                {/* Left arrow */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-[2px] border-l-[2px] border-black -rotate-45"></div>
                {/* Right arrow */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-[2px] border-r-[2px] border-black rotate-45"></div>
                
                {/* Ticks */}
                <div className="absolute left-4 right-4 top-0 bottom-0 flex justify-between">
                  {Array.from({ length: Math.floor((block.end - block.start) / block.step) + 1 }).map((_, i) => {
                    const val = block.start + (i * block.step);
                    return (
                      <div key={i} className="flex flex-col items-center justify-start h-full">
                        <div className="w-[2px] h-3 bg-black mt-[14px]"></div>
                        <span className="text-[10px] sm:text-xs font-bold mt-1">{toArabicNumerals(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {block.equation && (
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border border-gray-400 rounded-sm"></div>
                    <span>= {toArabicNumerals(block.equation.num1)} {block.equation.operator} {toArabicNumerals(block.equation.num2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {block.type === 'shapes' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-2" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div className="flex justify-around flex-wrap gap-4" style={{ zoom: block.scale || 1 } as any}>
              {block.groups.map((group) => (
                <div key={group.id} className="flex flex-col items-center gap-2">
                  <div className="flex flex-wrap justify-center gap-1 max-w-[100px]">
                    {Array.from({ length: group.count }).map((_, i) => (
                      <span key={i} className="text-lg sm:text-xl">
                        {group.shapeType === 'star' ? '⭐' : 
                         group.shapeType === 'apple' ? '🍎' : 
                         group.shapeType === 'heart' ? '❤️' :
                         group.shapeType === 'pencil' ? '✏️' :
                         group.shapeType === 'circle' ? '⭕' :
                         group.shapeType === 'square' ? '⬛' : '🔺'}
                      </span>
                    ))}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-gray-400 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.type === 'comparison' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-4" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div 
              className="grid gap-x-8 gap-y-6" 
              style={{ 
                gridTemplateColumns: `repeat(${block.columns || 2}, minmax(0, 1fr))`,
                zoom: block.scale || 1 
              } as any}
            >
              {block.pairs.map((pair) => (
                <div key={pair.id} className="flex items-center justify-center gap-3 text-sm sm:text-lg font-bold" dir="ltr">
                  <span className="w-8 text-center">{toArabicNumerals(pair.left)}</span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-gray-800 rounded-full flex items-center justify-center shrink-0 bg-white"></div>
                  <span className="w-8 text-center">{toArabicNumerals(pair.right)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.type === 'pattern' && (() => {
          const count = Math.max(1, block.sequence.length);
          const boxSize = Math.max(16, Math.min(40, 400 / count));
          const fontSize = Math.max(10, Math.min(20, 300 / count));
          const gapSize = Math.max(2, Math.min(16, 100 / count));
          
          return (
            <div className="w-full overflow-hidden">
              <h3 className="font-bold text-[10px] sm:text-xs mb-2" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
              <div className="flex justify-center items-center w-full" style={{ gap: `${gapSize}px`, zoom: block.scale || 1 } as any} dir="rtl">
                {block.sequence.map((item, i) => (
                  <div key={i} className="flex items-center shrink-0" style={{ gap: `${gapSize}px` }}>
                    {item === '' ? (
                      <div className="border-2 border-gray-400 rounded-md shrink-0" style={{ width: `${boxSize}px`, height: `${boxSize}px` }}></div>
                    ) : (
                      <span className="font-bold shrink-0" style={{ fontSize: `${fontSize}px` }}>{toArabicNumerals(item)}</span>
                    )}
                    {i < block.sequence.length - 1 && <span className="text-gray-400 shrink-0" style={{ fontSize: `${fontSize}px` }}>،</span>}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {block.type === 'ordering_grid' && (
          <div className="w-full space-y-6" style={{ zoom: block.scale || 1 } as any}>
            {block.question && (
              <h3 className="font-bold text-[10px] sm:text-xs mb-4" dir="rtl" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            )}
            <div className="space-y-6">
              {block.grids.map((grid) => {
                const numbers = grid.numbers.split(/[,،]/).map(n => n.trim()).filter(n => n);
                return (
                  <div key={grid.id} className="flex items-center justify-start gap-4" dir="rtl">
                    {grid.label && (
                      <span className="text-sm font-bold text-gray-900 min-w-[60px]">{grid.label}</span>
                    )}
                    <div className="flex flex-col border-2 border-black bg-white">
                      <div className="flex border-b-2 border-black">
                        {numbers.map((num, i) => (
                          <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-lg sm:text-xl font-bold border-l-2 border-black last:border-l-0">
                            {toArabicNumerals(num)}
                          </div>
                        ))}
                      </div>
                      <div className="flex">
                        {numbers.map((_, i) => (
                          <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 border-l-2 border-black last:border-l-0">
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {block.type === 'text_to_number' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-4" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div 
              className="grid gap-x-8 gap-y-6" 
              style={{ 
                gridTemplateColumns: `repeat(${block.columns || 2}, minmax(0, 1fr))`,
                zoom: block.scale || 1 
              } as any}
              dir="rtl"
            >
              {block.items.map((item) => (
                <div key={item.id} className="flex items-center justify-start gap-3 text-sm sm:text-lg font-bold">
                  <span className="text-right">{item.text}</span>
                  <span>=</span>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-gray-800 rounded-sm bg-white shrink-0"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {block.type === 'previous_next' && (
          <div>
            <h3 className="font-bold text-[10px] sm:text-xs mb-4" style={{ fontSize: block.questionFontSize ? `${block.questionFontSize}px` : undefined }}>{block.question}</h3>
            <div 
              className="grid gap-x-6 gap-y-6" 
              style={{ 
                gridTemplateColumns: `repeat(${block.columns || 4}, minmax(0, 1fr))`,
                zoom: block.scale || 1 
              } as any}
              dir="rtl"
            >
              {block.cells.map((cell) => (
                <div key={cell.id} className="flex items-center justify-center">
                  <div className="flex border-2 border-gray-800 rounded-sm bg-white" dir="rtl">
                    {block.boxType === 'previous' ? (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 border-l-2 border-gray-800"></div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-sm sm:text-lg font-bold">
                          {toArabicNumerals(cell.number)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 border-l-2 border-gray-800 flex items-center justify-center text-sm sm:text-lg font-bold">
                          {toArabicNumerals(cell.number)}
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12"></div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
