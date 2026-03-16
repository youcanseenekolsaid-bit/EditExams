import React, { useState, useEffect } from 'react';
import { BookOpen, Calculator, FileText, Trash2, Edit2, Sparkles, Settings, Key } from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal';
import { GeneratingModal } from './GeneratingModal';
import { generateWorksheet, getApiKey, setApiKey } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';

export function Home({ onSelectMath, onEditDocument }: { onSelectMath: () => void, onEditDocument: (id: string) => void }) {
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasAutosave, setHasAutosave] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');

  useEffect(() => {
    const docs = localStorage.getItem('math-editor-saved-docs');
    if (docs) {
      try {
        setSavedDocs(JSON.parse(docs));
      } catch (e) {}
    }
    
    const autosaveStr = localStorage.getItem('math-editor-autosave');
    if (autosaveStr) {
      setHasAutosave(true);
    }
  }, []);

  const handleDelete = (id: string) => {
    const updatedDocs = savedDocs.filter(doc => doc.id !== id);
    setSavedDocs(updatedDocs);
    localStorage.setItem('math-editor-saved-docs', JSON.stringify(updatedDocs));
    setDocToDelete(null);
  };

  const handleAIGenerate = async (params: any) => {
    setIsAIModalOpen(false);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('جاري التهيئة...');
    setShowCancelConfirm(false);
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const generatedPages = await generateWorksheet(
        params,
        (progress, status) => {
          setGenerationProgress(progress);
          setGenerationStatus(status);
        },
        controller.signal
      );
      
      const newDocId = uuidv4();
      const newDoc = {
        id: newDocId,
        title: 'ورقة عمل بالذكاء الاصطناعي',
        updatedAt: Date.now(),
        pages: generatedPages.length > 0 
          ? generatedPages.map(blocks => ({ id: uuidv4(), blocks }))
          : [{ id: uuidv4(), blocks: [] }],
        header: {
          schoolName: 'مدرسة منابر العلم',
          studentNameLabel: 'الاسم: ........................',
          testTitle: 'ورقة عمل بالذكاء الاصطناعي',
          gradeLabel: 'الصف: الأول',
          scoreLabel: 'الدرجة:',
          useImageHeader: true,
          imageScale: 1,
          headerTexts: []
        }
      };

      const docsStr = localStorage.getItem('math-editor-saved-docs');
      let docs = [];
      if (docsStr) {
        try {
          docs = JSON.parse(docsStr);
        } catch (e) {}
      }
      docs.push(newDoc);
      localStorage.setItem('math-editor-saved-docs', JSON.stringify(docs));

      setIsGenerating(false);
      onEditDocument(newDocId);
    } catch (error: any) {
      setIsGenerating(false);
      if (error.message === 'تم الإلغاء') {
        // User cancelled, do nothing
      } else if (error.message.includes('مفتاح API')) {
        alert(error.message);
      } else {
        console.error('Error generating worksheet:', error);
        alert(error.message || 'حدث خطأ أثناء توليد ورقة العمل. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setAbortController(null);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    if (abortController) {
      abortController.abort();
    }
    setIsGenerating(false);
    setShowCancelConfirm(false);
  };

  const handleAbortCancel = () => {
    setShowCancelConfirm(false);
  };

  const openSettings = () => {
    setApiKeyValue(getApiKey());
    setShowSettings(true);
  };

  const saveSettings = () => {
    setApiKey(apiKeyValue);
    setShowSettings(false);
    alert('تم حفظ الإعدادات بنجاح');
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50 h-full overflow-y-auto">
      <div className="bg-indigo-600 px-6 pt-16 pb-8 md:pt-24 md:pb-16 rounded-b-[40px] md:rounded-b-[80px] shadow-lg shrink-0 relative">
        <button 
          onClick={openSettings}
          className="absolute top-6 left-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
          title="الإعدادات"
        >
          <Settings size={24} />
        </button>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-4 md:mb-8">
            <div className="bg-white/20 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-sm">
              <FileText className="text-white w-12 h-12 md:w-20 md:h-20" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-2 md:mb-4">مصمم أوراق العمل</h1>
          <p className="text-indigo-100 text-center text-sm md:text-lg">صمم امتحاناتك وأوراق عملك بسهولة من هاتفك أو حاسوبك</p>
        </div>
      </div>

      <div className="p-6 md:p-10 flex-1 mt-4 max-w-4xl mx-auto w-full">
        {/* AI Generation Button */}
        <button 
          onClick={() => setIsAIModalOpen(true)}
          className="w-full mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 flex items-center gap-5 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-[0.98] active:translate-y-0 text-white relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md relative z-10">
            <Sparkles size={32} className="text-yellow-300" />
          </div>
          <div className="text-right flex-1 relative z-10">
            <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
              الإنشاء بالذكاء الاصطناعي
              <span className="bg-yellow-400 text-yellow-900 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider">جديد</span>
            </h2>
            <p className="text-indigo-100 text-xs leading-relaxed">دع الذكاء الاصطناعي يصمم لك ورقة عمل متكاملة بضغطة زر</p>
          </div>
        </button>

        <h2 className="text-lg font-bold text-gray-800 mb-4">أو ابدأ من الصفر:</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => {
              localStorage.removeItem('math-editor-autosave');
              onSelectMath();
            }}
            className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="bg-blue-100 p-4 rounded-2xl text-blue-600">
              <Calculator size={32} />
            </div>
            <div className="text-right flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-1">الرياضيات</h2>
              <p className="text-gray-500 text-xs">عمليات حسابية، خط أعداد، أشكال، مقارنات</p>
            </div>
          </button>

          <button 
            disabled
            className="w-full bg-gray-50 p-6 rounded-3xl border border-gray-200 flex items-center gap-5 opacity-60 cursor-not-allowed"
          >
            <div className="bg-gray-200 p-4 rounded-2xl text-gray-500">
              <BookOpen size={32} />
            </div>
            <div className="text-right flex-1">
              <h2 className="text-xl font-bold text-gray-700 mb-1">اللغة العربية</h2>
              <p className="text-gray-500 text-xs">قريباً... (نصوص، قواعد، إملاء)</p>
            </div>
          </button>
        </div>

        {hasAutosave && (
          <div className="mb-8">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex-1 text-right ml-4">
                <h3 className="font-bold text-orange-800">تصميم غير محفوظ</h3>
                <p className="text-xs text-orange-600">يوجد تصميم سابق لم يتم حفظه. هل ترغب في استعادته؟</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onSelectMath()}
                  className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 transition-colors"
                >
                  استعادة
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('math-editor-autosave');
                    setHasAutosave(false);
                  }}
                  className="px-4 py-2 bg-white text-orange-600 border border-orange-200 text-sm font-bold rounded-xl hover:bg-orange-50 transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {savedDocs.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4">الأعمال المحفوظة:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedDocs.map(doc => (
                <div key={doc.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex-1 text-right ml-4 cursor-pointer" onClick={() => onEditDocument(doc.id)}>
                    <h3 className="font-bold text-gray-800">{doc.title || 'ورقة عمل بدون عنوان'}</h3>
                    <p className="text-xs text-gray-500">{new Date(doc.updatedAt).toLocaleDateString('ar-SA')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onEditDocument(doc.id)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => setDocToDelete(doc.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد أنك تريد حذف ورقة العمل هذه؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={() => handleDelete(docToDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      <AIGeneratorModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onGenerate={handleAIGenerate} 
      />

      <GeneratingModal
        isOpen={isGenerating}
        progress={generationProgress}
        status={generationStatus}
        onCancelClick={handleCancelClick}
        showCancelConfirm={showCancelConfirm}
        onConfirmCancel={handleConfirmCancel}
        onAbortCancel={handleAbortCancel}
      />
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 text-white flex items-center gap-3 shrink-0">
              <Settings className="w-6 h-6" />
              <h2 className="text-xl font-bold">إعدادات التطبيق</h2>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2 flex items-center gap-2">
                  <Key size={18} className="text-indigo-600" />
                  مفتاح Gemini API
                </label>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  لتمكين ميزة الإنشاء الذكي، يرجى إدخال مفتاح API الخاص بك من Google Gemini. 
                  يتم حفظ هذا المفتاح محلياً على جهازك فقط.
                </p>
                <input 
                  type="password" 
                  value={apiKeyValue}
                  onChange={(e) => setApiKeyValue(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left dir-ltr"
                />
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
              <button 
                onClick={saveSettings}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                حفظ الإعدادات
              </button>
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
