import React, { useState } from 'react';
import { Sparkles, X, BookOpen, Calculator, FileText, Hash, Layers, CheckCircle2 } from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: any) => void;
}

export function AIGeneratorModal({ isOpen, onClose, onGenerate }: AIGeneratorModalProps) {
  const [subject, setSubject] = useState('math');
  const [numQuestions, setNumQuestions] = useState<string>('auto');
  const [elements, setElements] = useState<string>('auto');
  const [selectedTypes, setSelectedTypes] = useState<string[] | 'auto'>('auto');
  const [marks, setMarks] = useState<string>('auto');
  const [pages, setPages] = useState<string>('auto');
  const [isGenerating, setIsGenerating] = useState(false);

  const questionTypes = [
    { id: 'horizontal', label: 'أفقية' },
    { id: 'vertical', label: 'عمودية' },
    { id: 'number_line', label: 'خط أعداد' },
    { id: 'shapes', label: 'أشكال' },
    { id: 'comparison', label: 'مقارنة' },
    { id: 'pattern', label: 'أنماط' },
    { id: 'ordering', label: 'ترتيب' },
    { id: 'text_to_number', label: 'رمز أعداد' },
    { id: 'previous_next', label: 'سابق/تالي' },
  ];

  const toggleType = (id: string) => {
    if (selectedTypes === 'auto') {
      setSelectedTypes([id]);
    } else {
      if (selectedTypes.includes(id)) {
        const newTypes = selectedTypes.filter(t => t !== id);
        setSelectedTypes(newTypes.length === 0 ? 'auto' : newTypes);
      } else {
        setSelectedTypes([...selectedTypes, id]);
      }
    }
  };

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate({ subject, numQuestions, elements, selectedTypes, marks, pages });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
              <Sparkles size={24} className="text-yellow-300" />
            </div>
            <h2 className="text-2xl font-extrabold">الإنشاء الذكي</h2>
          </div>
          <p className="text-indigo-100 text-sm leading-relaxed">
            دع الذكاء الاصطناعي يصمم ورقة العمل الخاصة بك بناءً على تفضيلاتك في ثوانٍ معدودة.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Subject */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              المادة الدراسية
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSubject('math')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all ${subject === 'math' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}
              >
                <Calculator size={18} />
                الرياضيات
                {subject === 'math' && <CheckCircle2 size={16} className="text-indigo-600 mr-auto" />}
              </button>
              <button 
                disabled
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70"
              >
                <FileText size={18} />
                العربية (قريباً)
              </button>
            </div>
          </div>

          {/* Number of Questions */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Hash size={16} className="text-indigo-500" />
              عدد الأسئلة
            </label>
            <div className="flex gap-3">
              <button 
                onClick={() => setNumQuestions('auto')}
                className={`flex-1 py-2.5 rounded-xl border-2 transition-all ${numQuestions === 'auto' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}
              >
                تلقائي
              </button>
              <input 
                type="number" 
                min="1" 
                max="50"
                placeholder="أدخل رقماً..."
                value={numQuestions === 'auto' ? '' : numQuestions}
                onChange={(e) => setNumQuestions(e.target.value || 'auto')}
                className={`flex-[2] px-4 py-2.5 rounded-xl border-2 outline-none transition-all ${numQuestions !== 'auto' ? 'border-indigo-600 bg-white text-gray-800 font-bold' : 'border-gray-200 bg-gray-50 text-gray-500 focus:border-indigo-400'}`}
              />
            </div>
          </div>

          {/* Question Types */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" />
              أنواع الأسئلة
            </label>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setSelectedTypes('auto')}
                className={`w-full py-2.5 rounded-xl border-2 transition-all ${selectedTypes === 'auto' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}
              >
                اختيار تلقائي (متنوع)
              </button>
              
              <div className="grid grid-cols-3 gap-2">
                {questionTypes.map(type => {
                  const isSelected = selectedTypes !== 'auto' && selectedTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      onClick={() => toggleType(type.id)}
                      className={`py-2 px-1 text-xs rounded-lg border transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white font-bold shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}`}
                    >
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Elements / Topics */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" />
              العناصر والمواضيع
            </label>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setElements('auto')}
                className={`w-full py-2.5 rounded-xl border-2 transition-all ${elements === 'auto' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}
              >
                اختيار تلقائي (متنوع)
              </button>
              <textarea 
                placeholder="مثال: جمع وطرح، كسور، أشكال هندسية..."
                rows={2}
                value={elements === 'auto' ? '' : elements}
                onChange={(e) => setElements(e.target.value || 'auto')}
                className={`w-full px-4 py-3 rounded-xl border-2 outline-none transition-all resize-none ${elements !== 'auto' ? 'border-indigo-600 bg-white text-gray-800 font-bold' : 'border-gray-200 bg-gray-50 text-gray-500 focus:border-indigo-400'}`}
              />
            </div>
          </div>

          {/* Marks & Pages Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Marks */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-500" />
                الدرجات
              </label>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setMarks('auto')}
                  className={`py-2 rounded-lg border-2 text-sm transition-all ${marks === 'auto' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}
                >
                  تلقائي
                </button>
                <input 
                  type="number" 
                  min="1" 
                  placeholder="الدرجة الكلية"
                  value={marks === 'auto' ? '' : marks}
                  onChange={(e) => setMarks(e.target.value || 'auto')}
                  className={`px-3 py-2 rounded-lg border-2 text-sm outline-none transition-all ${marks !== 'auto' ? 'border-indigo-600 bg-white text-gray-800 font-bold' : 'border-gray-200 bg-gray-50 text-gray-500 focus:border-indigo-400'}`}
                />
              </div>
            </div>

            {/* Pages */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" />
                عدد الصفحات
              </label>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setPages('auto')}
                  className={`py-2 rounded-lg border-2 text-sm transition-all ${pages === 'auto' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'}`}
                >
                  تلقائي
                </button>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  placeholder="عدد الصفحات"
                  value={pages === 'auto' ? '' : pages}
                  onChange={(e) => setPages(e.target.value || 'auto')}
                  className={`px-3 py-2 rounded-lg border-2 text-sm outline-none transition-all ${pages !== 'auto' ? 'border-indigo-600 bg-white text-gray-800 font-bold' : 'border-gray-200 bg-gray-50 text-gray-500 focus:border-indigo-400'}`}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 shrink-0">
          <button 
            onClick={handleGenerate}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            <Sparkles size={20} />
            <span>إنشاء ورقة العمل الآن</span>
          </button>
        </div>
      </div>
    </div>
  );
}
