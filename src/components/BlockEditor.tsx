import React from 'react';
import { Block, Equation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, X, Settings2 } from 'lucide-react';
import { DraggableNumberInput } from './DraggableNumberInput';

interface BlockEditorProps {
  block: Block;
  onChange: (block: Block) => void;
  onClose: () => void;
}

export function BlockEditor({ block, onChange, onClose }: BlockEditorProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...block, [field]: value });
  };

  const handleEquationChange = (id: string, field: string, value: string) => {
    if (block.type === 'horizontal_math' || block.type === 'vertical_math') {
      const newEquations = block.equations.map(eq => 
        eq.id === id ? { ...eq, [field]: value } : eq
      );
      handleChange('equations', newEquations);
    }
  };

  const addEquation = () => {
    if (block.type === 'horizontal_math' || block.type === 'vertical_math') {
      handleChange('equations', [
        ...block.equations,
        { id: uuidv4(), num1: '1', num2: '1', operator: '+' }
      ]);
    }
  };

  const removeEquation = (id: string) => {
    if (block.type === 'horizontal_math' || block.type === 'vertical_math') {
      handleChange('equations', block.equations.filter(eq => eq.id !== id));
    }
  };

  const [startY, setStartY] = React.useState<number | null>(null);
  const [currentY, setCurrentY] = React.useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(y);
    setCurrentY(y);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (startY !== null) {
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setCurrentY(y);
    }
  };

  const handleTouchEnd = () => {
    if (startY !== null && currentY !== null) {
      const diff = currentY - startY;
      if (diff > 50) {
        onClose();
      }
    }
    setStartY(null);
    setCurrentY(null);
  };

  const translateY = startY !== null && currentY !== null && currentY > startY ? currentY - startY : 0;

  return (
    <div 
      className="bg-white border-t border-gray-200 absolute bottom-0 left-0 right-0 rounded-t-3xl shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)] z-50 max-h-[60vh] overflow-y-auto pb-safe transition-transform duration-300 ease-out"
      style={{ transform: `translateY(${translateY}px)` }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Drag Handle Indicator */}
      <div 
        className="w-full flex justify-center pt-3 pb-1 sticky top-0 bg-white z-20 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      <div className="flex items-center justify-between px-6 pb-4 pt-2 sticky top-[20px] bg-white z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Settings2 size={16} />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">تعديل العنصر</h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Spacing Controls */}
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <label className="block text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
            المسافات (التباعد)
          </label>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-600">المسافة العلوية</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{block.marginTop ?? 0}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={block.marginTop ?? 0}
                onChange={(e) => handleChange('marginTop', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-600">المسافة السفلية</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{block.marginBottom ?? 16}px</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="1"
                value={block.marginBottom ?? 16}
                onChange={(e) => handleChange('marginBottom', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-600">حجم العنصر (تكبير/تصغير)</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{Math.round((block.scale || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.01"
                value={block.scale || 1}
                onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-600">حجم نص السؤال</label>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{block.questionFontSize || 12}px</span>
              </div>
              <input
                type="range"
                min="8"
                max="48"
                step="1"
                value={block.questionFontSize || 12}
                onChange={(e) => handleChange('questionFontSize', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {block.type === 'text' && (
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              النص
            </label>
            <textarea
              value={block.content}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors resize-none"
              rows={4}
              dir="rtl"
              placeholder="اكتب النص هنا..."
            />
          </div>
        )}

        {(block.type === 'horizontal_math' || block.type === 'vertical_math') && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-green-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                العمليات الحسابية
              </label>
              <div className="space-y-3">
                {block.equations.map((eq) => (
                  <div key={eq.id} className="flex flex-col gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100" dir="ltr">
                    <div className="flex items-center gap-2">
                      <DraggableNumberInput
                        value={eq.num1}
                        onChange={(val) => handleEquationChange(eq.id, 'num1', val.toString())}
                        className={`w-16 border rounded-lg p-2 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 ${eq.missingField === 'num1' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}
                        placeholder="رقم 1"
                      />
                      <select
                        value={eq.operator}
                        onChange={(e) => handleEquationChange(eq.id, 'operator', e.target.value)}
                        className="border border-gray-200 rounded-lg p-2 text-center text-base font-bold bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="+">+</option>
                        <option value="-">-</option>
                        <option value="×">×</option>
                        <option value="÷">÷</option>
                      </select>
                      <DraggableNumberInput
                        value={eq.num2}
                        onChange={(val) => handleEquationChange(eq.id, 'num2', val.toString())}
                        className={`w-16 border rounded-lg p-2 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 ${eq.missingField === 'num2' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}
                        placeholder="رقم 2"
                      />
                      <span className="font-bold text-gray-500">=</span>
                      <DraggableNumberInput
                        value={eq.result || ''}
                        onChange={(val) => handleEquationChange(eq.id, 'result', val.toString())}
                        className={`w-16 border rounded-lg p-2 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 ${(!eq.missingField || eq.missingField === 'result') ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200'}`}
                        placeholder="الناتج"
                      />
                      <button 
                        onClick={() => removeEquation(eq.id)} 
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors ml-auto"
                        title="حذف العملية"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 justify-end border-t border-gray-200 pt-2" dir="rtl">
                      <span className="font-medium">المربع الفارغ:</span>
                      <select
                        value={eq.missingField || 'result'}
                        onChange={(e) => handleEquationChange(eq.id, 'missingField', e.target.value)}
                        className="border border-gray-200 rounded-md p-1.5 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="result">الناتج</option>
                        <option value="num1">الرقم الأول</option>
                        <option value="num2">الرقم الثاني</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={addEquation}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 py-3 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} /> إضافة عملية جديدة
              </button>
            </div>

            {block.type === 'horizontal_math' && (
              <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-400 rounded-full"></span>
                  عدد العمليات في الصف الواحد
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={block.columns || 2}
                    onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-sm font-bold text-indigo-600 bg-white border border-indigo-100 px-3 py-1 rounded-lg shadow-sm">{block.columns || 2}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">سيتم تصغير العمليات تلقائياً إذا تجاوزت عرض الصفحة.</p>
              </div>
            )}
          </div>
        )}

        {block.type === 'number_line' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">البداية</label>
                <DraggableNumberInput
                  value={block.start}
                  onChange={(val) => handleChange('start', val)}
                  min={-100}
                  max={100}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">النهاية</label>
                <DraggableNumberInput
                  value={block.end}
                  onChange={(val) => handleChange('end', val)}
                  min={-100}
                  max={100}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-600">الخطوة</label>
                <DraggableNumberInput
                  value={block.step}
                  onChange={(val) => handleChange('step', val)}
                  min={1}
                  max={20}
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {block.type === 'shapes' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-pink-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-pink-400 rounded-full"></span>
                المجموعات
              </label>
              <div className="space-y-3">
                {block.groups.map((group) => (
                  <div key={group.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <select
                      value={group.shapeType}
                      onChange={(e) => {
                        const newGroups = block.groups.map(g => g.id === group.id ? { ...g, shapeType: e.target.value } : g);
                        handleChange('groups', newGroups);
                      }}
                      className="flex-1 border border-gray-200 rounded-lg p-2.5 text-base font-bold bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="star">نجوم ⭐</option>
                      <option value="apple">تفاح 🍎</option>
                      <option value="heart">قلوب ❤️</option>
                      <option value="pencil">أقلام ✏️</option>
                      <option value="circle">دوائر ⭕</option>
                      <option value="square">مربعات ⬛</option>
                    </select>
                    <DraggableNumberInput
                      value={group.count}
                      onChange={(val) => {
                        const count = typeof val === 'number' ? val : parseInt(val) || 1;
                        const newGroups = block.groups.map(g => g.id === group.id ? { ...g, count } : g);
                        handleChange('groups', newGroups);
                      }}
                      className="w-20 border border-gray-200 rounded-lg p-2.5 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      min={1}
                      max={20}
                    />
                    <button 
                      onClick={() => {
                        handleChange('groups', block.groups.filter(g => g.id !== group.id));
                      }} 
                      className="p-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                      title="حذف المجموعة"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  handleChange('groups', [...block.groups, { id: uuidv4(), shapeType: 'star', count: 3 }]);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 py-3 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} /> إضافة مجموعة جديدة
              </button>
            </div>
          </div>
        )}

        {block.type === 'comparison' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-teal-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-teal-400 rounded-full"></span>
                المقارنات
              </label>
              <div className="space-y-3">
                {block.pairs.map((pair) => (
                  <div key={pair.id} className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100" dir="ltr">
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(e) => {
                        const newPairs = block.pairs.map(p => p.id === pair.id ? { ...p, left: e.target.value } : p);
                        handleChange('pairs', newPairs);
                      }}
                      className="w-20 border border-gray-200 rounded-lg p-2.5 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-gray-400 text-sm bg-white">؟</div>
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(e) => {
                        const newPairs = block.pairs.map(p => p.id === pair.id ? { ...p, right: e.target.value } : p);
                        handleChange('pairs', newPairs);
                      }}
                      className="w-20 border border-gray-200 rounded-lg p-2.5 text-center text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button 
                      onClick={() => {
                        handleChange('pairs', block.pairs.filter(p => p.id !== pair.id));
                      }} 
                      className="p-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors ml-auto"
                      title="حذف المقارنة"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  handleChange('pairs', [...block.pairs, { id: uuidv4(), left: '5', right: '3' }]);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 py-3 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} /> إضافة مقارنة جديدة
              </button>
            </div>
            
            <div className="space-y-2 bg-teal-50/50 p-4 rounded-xl border border-teal-100">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-teal-400 rounded-full"></span>
                عدد المقارنات في الصف الواحد
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={block.columns || 2}
                  onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <span className="text-sm font-bold text-teal-600 bg-white border border-teal-100 px-3 py-1 rounded-lg shadow-sm">{block.columns || 2}</span>
              </div>
            </div>
          </div>
        )}

        {block.type === 'pattern' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-full"></span>
                النمط <span className="text-xs font-normal text-gray-500">(اترك المربع فارغاً ليكون سؤالاً)</span>
              </label>
              <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100" dir="rtl">
                {block.sequence.map((item, i) => (
                  <div key={i} className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm relative group">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newSeq = [...block.sequence];
                        newSeq[i] = e.target.value;
                        handleChange('sequence', newSeq);
                      }}
                      className="w-12 text-center border-none p-1 text-base font-bold focus:ring-0"
                      placeholder="؟"
                    />
                    <button
                      onClick={() => {
                        handleChange('sequence', block.sequence.filter((_, idx) => idx !== i));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      title="حذف العنصر"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleChange('sequence', ['', ...block.sequence])}
                  className="w-12 h-[46px] flex items-center justify-center bg-white text-indigo-600 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 rounded-lg transition-all"
                  title="إضافة عنصر للنمط"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {block.type === 'ordering_grid' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-orange-400 rounded-full"></span>
                الشبكات
              </label>
              {block.grids.map((grid, index) => (
                <div key={grid.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 space-y-3 relative">
                  <button
                    onClick={() => {
                      const newGrids = [...block.grids];
                      newGrids.splice(index, 1);
                      handleChange('grids', newGrids);
                    }}
                    className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">العنوان</label>
                      <input
                        type="text"
                        value={grid.label}
                        onChange={(e) => {
                          const newGrids = [...block.grids];
                          newGrids[index].label = e.target.value;
                          handleChange('grids', newGrids);
                        }}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500">الأعداد (مفصولة بفاصلة)</label>
                      <input
                        type="text"
                        value={grid.numbers}
                        onChange={(e) => {
                          const newGrids = [...block.grids];
                          newGrids[index].numbers = e.target.value;
                          handleChange('grids', newGrids);
                        }}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        dir="rtl"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => handleChange('grids', [...block.grids, { id: uuidv4(), label: 'جديد:', numbers: '١, ٢, ٣' }])}
                className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                إضافة شبكة
              </button>
            </div>
          </div>
        )}

        {block.type === 'text_to_number' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-lime-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-lime-400 rounded-full"></span>
                الأسئلة
              </label>
              <div className="space-y-3">
                {block.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const newItems = block.items.map(i => i.id === item.id ? { ...i, text: e.target.value } : i);
                        handleChange('items', newItems);
                      }}
                      className="flex-1 border border-gray-200 rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="rtl"
                    />
                    <button 
                      onClick={() => {
                        handleChange('items', block.items.filter(i => i.id !== item.id));
                      }} 
                      className="p-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors shrink-0"
                      title="حذف السؤال"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  handleChange('items', [...block.items, { id: uuidv4(), text: 'سؤال جديد' }]);
                }}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 py-3 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} /> إضافة سؤال جديد
              </button>
            </div>
            
            <div className="space-y-2 bg-lime-50/50 p-4 rounded-xl border border-lime-100">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-lime-400 rounded-full"></span>
                عدد الأسئلة في الصف الواحد
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={block.columns || 2}
                  onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lime-600"
                />
                <span className="text-sm font-bold text-lime-600 bg-white border border-lime-100 px-3 py-1 rounded-lg shadow-sm">{block.columns || 2}</span>
              </div>
            </div>
          </div>
        )}

        {block.type === 'previous_next' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-500 rounded-full"></span>
                السؤال
              </label>
              <input
                type="text"
                value={block.question}
                onChange={(e) => handleChange('question', e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 hover:bg-white transition-colors"
                dir="rtl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-400 rounded-full"></span>
                نوع السؤال
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={block.boxType === 'previous'} 
                    onChange={() => handleChange('boxType', 'previous')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm font-medium">العدد السابق</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    checked={block.boxType === 'next'} 
                    onChange={() => handleChange('boxType', 'next')}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="text-sm font-medium">العدد التالي</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-400 rounded-full"></span>
                الأعداد
              </label>
              <div className="flex flex-wrap gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100" dir="rtl">
                {block.cells.map((cell, i) => (
                  <div key={cell.id} className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm relative group">
                    <input
                      type="text"
                      value={cell.number}
                      onChange={(e) => {
                        const newCells = [...block.cells];
                        newCells[i] = { ...cell, number: e.target.value };
                        handleChange('cells', newCells);
                      }}
                      className="w-12 text-center border-none p-1 text-base font-bold focus:ring-0"
                    />
                    <button
                      onClick={() => {
                        handleChange('cells', block.cells.filter((c) => c.id !== cell.id));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      title="حذف العدد"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleChange('cells', [{ id: uuidv4(), number: '١' }, ...block.cells])}
                  className="w-12 h-[46px] flex items-center justify-center bg-white text-indigo-600 border-2 border-dashed border-indigo-200 hover:bg-indigo-50 hover:border-indigo-400 rounded-lg transition-all"
                  title="إضافة عدد"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
              <label className="block text-sm font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-sky-400 rounded-full"></span>
                عدد الأسئلة في الصف الواحد
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={block.columns || 4}
                  onChange={(e) => handleChange('columns', parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
                <span className="text-sm font-bold text-sky-600 bg-white border border-sky-100 px-3 py-1 rounded-lg shadow-sm">{block.columns || 4}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
