import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Download, Type, Hash, ListOrdered, Image as ImageIcon, MinusSquare, Settings2, Eye, FileDown, Plus, Trash2, MoreHorizontal, ArrowUpDown, Languages, ArrowLeftRight, Move, Undo2, Redo2, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Block, DocumentHeader } from '../types';
import { BlockRenderer } from './BlockRenderer';
import { BlockEditor } from './BlockEditor';
import { HeaderImageEditor } from './HeaderImageEditor';
import { motion, useDragControls, Reorder } from 'motion/react';

interface FloatingCircle {
  id: string;
  x: number;
  y: number;
  number: string;
  scale?: number;
}

interface PageData {
  id: string;
  blocks: Block[];
  floatingCircles?: FloatingCircle[];
}

export function MathEditor({ onBack, documentId }: { onBack: () => void, documentId?: string | null }) {
  const [pages, setPages] = useState<PageData[]>(() => {
    if (documentId) {
      const docs = localStorage.getItem('math-editor-saved-docs');
      if (docs) {
        try {
          const parsedDocs = JSON.parse(docs);
          const doc = parsedDocs.find((d: any) => d.id === documentId);
          if (doc && doc.pages) return doc.pages;
        } catch (e) {}
      }
    } else {
      const saved = localStorage.getItem('math-editor-autosave');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.pages) return parsed.pages;
        } catch (e) {}
      }
    }
    return [{ id: uuidv4(), blocks: [] }];
  });
  
  const [activePageId, setActivePageId] = useState<string>(pages[0].id);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isHeaderEditorOpen, setIsHeaderEditorOpen] = useState(false);
  const [globalZoom, setGlobalZoom] = useState(1);
  
  const [header, setHeader] = useState<DocumentHeader>(() => {
    if (documentId) {
      const docs = localStorage.getItem('math-editor-saved-docs');
      if (docs) {
        try {
          const parsedDocs = JSON.parse(docs);
          const doc = parsedDocs.find((d: any) => d.id === documentId);
          if (doc && doc.header) return doc.header;
        } catch (e) {}
      }
    } else {
      const saved = localStorage.getItem('math-editor-autosave');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.header) return parsed.header;
        } catch (e) {}
      }
    }
    return {
      schoolName: 'مدرسة منابر العلم',
      studentNameLabel: 'الاسم: ........................',
      testTitle: 'اختبار رياضيات',
      gradeLabel: 'الصف: الأول',
      scoreLabel: 'الدرجة:',
      useImageHeader: true,
      imageScale: 1,
      headerTexts: []
    };
  });

  const [currentDocId, setCurrentDocId] = useState<string>(documentId || uuidv4());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const historyRef = useRef<{pages: PageData[], header: DocumentHeader}[]>([{ pages, header }]);
  const historyIndexRef = useRef(0);
  const isUndoRedoAction = useRef(false);
  const [historyIndexState, setHistoryIndexState] = useState(0);

  useEffect(() => {
    // Auto-save for current session recovery
    const saveTimeout = setTimeout(() => {
      if (!documentId) {
        localStorage.setItem('math-editor-autosave', JSON.stringify({ pages, header }));
      }
    }, 1000);

    // History tracking
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return () => clearTimeout(saveTimeout);
    }
    
    const historyTimeout = setTimeout(() => {
      const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      newHistory.push({ pages, header });
      if (newHistory.length > 50) newHistory.shift();
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setHistoryIndexState(historyIndexRef.current);
      
      // Mark as unsaved if it's not the initial load
      if (historyRef.current.length > 1) {
        setHasUnsavedChanges(true);
      }
    }, 500);

    return () => {
      clearTimeout(saveTimeout);
      clearTimeout(historyTimeout);
    };
  }, [pages, header, documentId]);

  const undo = () => {
    if (historyIndexRef.current > 0) {
      isUndoRedoAction.current = true;
      historyIndexRef.current -= 1;
      const state = historyRef.current[historyIndexRef.current];
      setPages(state.pages);
      setHeader(state.header);
      setHistoryIndexState(historyIndexRef.current);
      setHasUnsavedChanges(true);
    }
  };

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoAction.current = true;
      historyIndexRef.current += 1;
      const state = historyRef.current[historyIndexRef.current];
      setPages(state.pages);
      setHeader(state.header);
      setHistoryIndexState(historyIndexRef.current);
      setHasUnsavedChanges(true);
    }
  };

  const saveWork = () => {
    const docsStr = localStorage.getItem('math-editor-saved-docs');
    let docs = [];
    if (docsStr) {
      try {
        docs = JSON.parse(docsStr);
      } catch (e) {}
    }

    const docIndex = docs.findIndex((d: any) => d.id === currentDocId);
    const docData = {
      id: currentDocId,
      title: header.testTitle || 'ورقة عمل بدون عنوان',
      updatedAt: Date.now(),
      pages,
      header
    };

    if (docIndex >= 0) {
      docs[docIndex] = docData;
    } else {
      docs.push(docData);
    }

    localStorage.setItem('math-editor-saved-docs', JSON.stringify(docs));
    setHasUnsavedChanges(false);
    
    // Optional: Show a brief success message
    const btn = document.getElementById('save-btn');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<span class="text-xs font-bold">تم الحفظ!</span>';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 2000);
    }
  };

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowExitModal(true);
    } else {
      onBack();
    }
  };

  const handleExitWithoutSaving = () => {
    setShowExitModal(false);
    onBack();
  };

  const handleSaveAndExit = () => {
    saveWork();
    setShowExitModal(false);
    onBack();
  };

  const addBlock = (type: Block['type']) => {
    const newBlockId = uuidv4();
    let newBlock: Block;

    switch (type) {
      case 'text': newBlock = { id: newBlockId, type: 'text', content: 'اكتب النص هنا...' }; break;
      case 'horizontal_math': newBlock = { id: newBlockId, type: 'horizontal_math', question: 'السؤال: جدي ناتج الجمع', equations: [{ id: uuidv4(), num1: '10', num2: '5', operator: '+' }], columns: 2 }; break;
      case 'vertical_math': newBlock = { id: newBlockId, type: 'vertical_math', question: 'السؤال: اجمعي عمودياً', equations: [{ id: uuidv4(), num1: '20', num2: '15', operator: '+' }] }; break;
      case 'number_line': newBlock = { id: newBlockId, type: 'number_line', question: 'السؤال: استخدمي خط الأعداد', start: 0, end: 10, step: 1 }; break;
      case 'shapes': newBlock = { id: newBlockId, type: 'shapes', question: 'السؤال: عدي الأشكال واكتبي الرقم', groups: [{ id: uuidv4(), shapeType: 'star', count: 5 }] }; break;
      case 'comparison': newBlock = { id: newBlockId, type: 'comparison', question: 'السؤال: ضعي علامة (>, <, =)', pairs: [{ id: uuidv4(), left: '10', right: '15' }], columns: 2 }; break;
      case 'pattern': newBlock = { id: newBlockId, type: 'pattern', question: 'السؤال: أككمل النمط', sequence: ['٢', '٤', '', '٨'] }; break;
      case 'text_to_number': newBlock = { id: newBlockId, type: 'text_to_number', question: 'السؤال: أكتب رمز الأعداد التالية:', items: [{ id: uuidv4(), text: 'واحد وعشرون' }, { id: uuidv4(), text: 'ستة وسبعون' }], columns: 2 }; break;
      case 'previous_next': newBlock = { id: newBlockId, type: 'previous_next', question: 'السؤال: أكتب العدد السابق:', boxType: 'previous', cells: [{ id: uuidv4(), number: '٢' }, { id: uuidv4(), number: '٩' }], columns: 4 }; break;
      case 'ordering_grid': newBlock = { id: newBlockId, type: 'ordering_grid', question: 'ج/ رتب (ي) تصاعديا وتنازليا:', grids: [{ id: uuidv4(), label: 'تصاعديا:', numbers: '١, ٧, ٥, ٣, ٨' }, { id: uuidv4(), label: 'تنازليا:', numbers: '٩, ٦, ٧, ٤, ٨' }] }; break;
      default: return;
    }

    setPages(pages.map(p => p.id === activePageId ? { ...p, blocks: [...p.blocks, newBlock] } : p));
    setEditingBlockId(newBlockId);
  };

  const addFloatingCircle = () => {
    const newCircle: FloatingCircle = {
      id: uuidv4(),
      x: 100,
      y: 100,
      number: '٢',
      scale: 1
    };
    setPages(pages.map(p => p.id === activePageId ? { ...p, floatingCircles: [...(p.floatingCircles || []), newCircle] } : p));
  };

  const updateBlock = (updatedBlock: Block) => {
    setPages(pages.map(p => ({
      ...p,
      blocks: p.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b)
    })));
  };

  const deleteBlock = (id: string) => {
    setPages(pages.map(p => ({
      ...p,
      blocks: p.blocks.filter(b => b.id !== id)
    })));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const updateFloatingCircle = (pageId: string, updatedCircle: FloatingCircle) => {
    setPages(pages.map(p => p.id === pageId ? {
      ...p,
      floatingCircles: p.floatingCircles?.map(c => c.id === updatedCircle.id ? updatedCircle : c)
    } : p));
  };

  const deleteFloatingCircle = (pageId: string, circleId: string) => {
    setPages(pages.map(p => p.id === pageId ? {
      ...p,
      floatingCircles: p.floatingCircles?.filter(c => c.id !== circleId)
    } : p));
  };

  useEffect(() => {
    const handleOpenHeaderEditor = () => setIsHeaderEditorOpen(true);
    const handleUpdateHeaderScale = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setHeader(prev => ({ ...prev, imageScale: customEvent.detail }));
    };

    window.addEventListener('open-header-editor', handleOpenHeaderEditor);
    window.addEventListener('update-header-scale', handleUpdateHeaderScale);

    return () => {
      window.removeEventListener('open-header-editor', handleOpenHeaderEditor);
      window.removeEventListener('update-header-scale', handleUpdateHeaderScale);
    };
  }, []);

  useEffect(() => {
    if (editingBlockId) {
      setTimeout(() => {
        const el = document.getElementById(`block-${editingBlockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [editingBlockId]);

  const addPage = () => {
    const newPageId = uuidv4();
    setPages([...pages, { id: newPageId, blocks: [] }]);
    setActivePageId(newPageId);
    setTimeout(() => {
      document.getElementById(`page-container-${newPageId}`)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const deletePage = (pageId: string) => {
    if (pages.length === 1) return;
    const newPages = pages.filter(p => p.id !== pageId);
    setPages(newPages);
    if (activePageId === pageId) {
      setActivePageId(newPages[0].id);
    }
  };

  const exportPDF = async () => {
    setIsExporting(true);
    setEditingBlockId(null); // Clear selection before export

    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for UI to update
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const a4Height = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        const pageId = pages[i].id;
        const pageElement = document.getElementById(`page-${pageId}`);
        
        if (!pageElement) continue;

        const rect = pageElement.getBoundingClientRect();
        const canvasWidth = rect.width * 3; // Use pixelRatio 3 for better quality
        const canvasHeight = rect.height * 3;

        const imgData = await toPng(pageElement, {
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        });
        
        const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth;
        
        const finalWidth = pdfHeight > a4Height ? (pdfWidth * a4Height / pdfHeight) : pdfWidth;
        const finalHeight = pdfHeight > a4Height ? a4Height : pdfHeight;
        const xOffset = (pdfWidth - finalWidth) / 2;
        
        if (i > 0) {
          pdf.addPage();
        }
        
        pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
      }
      
      pdf.save('math-worksheet.pdf');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('حدث خطأ أثناء تصدير الملف');
    } finally {
      setIsExporting(false);
    }
  };

  // Find the currently editing block across all pages
  let editingBlock: Block | undefined;
  for (const page of pages) {
    const found = page.blocks.find(b => b.id === editingBlockId);
    if (found) {
      editingBlock = found;
      break;
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 z-50">
      {/* Header */}
      <header className="bg-white px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-1 sm:gap-3">
          <button onClick={handleBackClick} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <ArrowRight size={20} className="text-gray-700 sm:w-[22px] sm:h-[22px]" />
          </button>
          <h1 className="text-sm sm:text-base font-bold text-gray-800 hidden sm:block truncate max-w-[150px] md:max-w-xs">{header.testTitle || 'تصميم ورقة رياضيات'}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200 mr-2">
            <button 
              onClick={() => setGlobalZoom(z => Math.max(0.5, z - 0.1))}
              className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-200 transition-colors"
              title="تصغير"
            >
              <ZoomOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <span className="text-xs sm:text-sm font-bold w-10 text-center text-gray-700">
              {Math.round(globalZoom * 100)}%
            </span>
            <button 
              onClick={() => setGlobalZoom(z => Math.min(2, z + 0.1))}
              className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-200 transition-colors"
              title="تكبير"
            >
              <ZoomIn size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
          <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1"></div>
          <button 
            onClick={undo}
            disabled={historyIndexState === 0}
            className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="تراجع"
          >
            <Undo2 size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
          <button 
            onClick={redo}
            disabled={historyIndexState === historyRef.current.length - 1}
            className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="إعادة"
          >
            <Redo2 size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
          <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1"></div>
          <button 
            id="save-btn"
            onClick={saveWork}
            className="p-1.5 sm:p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center min-w-[36px]"
            title="حفظ العمل"
          >
            <Save size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
          <div className="w-px h-5 sm:h-6 bg-gray-300 mx-0.5 sm:mx-1"></div>
          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="bg-indigo-600 text-white rounded-lg flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm disabled:opacity-50"
          >
            {isExporting ? <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <FileDown size={14} className="sm:w-[16px] sm:h-[16px]" />}
            <span className="font-bold text-xs sm:text-sm">تصدير</span>
          </button>
        </div>
      </header>

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">تغييرات غير محفوظة</h3>
            <p className="text-gray-600 mb-6">لديك تغييرات لم يتم حفظها. ماذا تريد أن تفعل؟</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleSaveAndExit}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
              >
                حفظ وخروج
              </button>
              <button 
                onClick={handleExitWithoutSaving}
                className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
              >
                خروج بدون حفظ
              </button>
              <button 
                onClick={() => setShowExitModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Toolbar (Tools Ribbon) */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-10 px-2 py-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <ToolButton onClick={() => addBlock('text')} icon={<Type size={18} />} label="نص/سؤال" color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
          <ToolButton onClick={() => addBlock('horizontal_math')} icon={<MinusSquare size={18} />} label="أفقية" color="text-green-600" bg="bg-green-50" border="border-green-100" />
          <ToolButton onClick={() => addBlock('vertical_math')} icon={<ListOrdered size={18} />} label="عمودية" color="text-orange-600" bg="bg-orange-50" border="border-orange-100" />
          <ToolButton onClick={() => addBlock('number_line')} icon={<Hash size={18} />} label="خط أعداد" color="text-purple-600" bg="bg-purple-50" border="border-purple-100" />
          <ToolButton onClick={() => addBlock('shapes')} icon={<ImageIcon size={18} />} label="أشكال" color="text-pink-600" bg="bg-pink-50" border="border-pink-100" />
          <ToolButton onClick={() => addBlock('comparison')} icon={<Settings2 size={18} />} label="مقارنة" color="text-teal-600" bg="bg-teal-50" border="border-teal-100" />
          <ToolButton onClick={() => addBlock('pattern')} icon={<MoreHorizontal size={18} />} label="أنماط" color="text-cyan-600" bg="bg-cyan-50" border="border-cyan-100" />
          <ToolButton onClick={() => addBlock('ordering_grid')} icon={<ArrowUpDown size={18} />} label="ترتيب" color="text-orange-600" bg="bg-orange-50" border="border-orange-100" />
          <ToolButton onClick={() => addBlock('text_to_number')} icon={<Languages size={18} />} label="رمز العدد" color="text-lime-600" bg="bg-lime-50" border="border-lime-100" />
          <ToolButton onClick={() => addBlock('previous_next')} icon={<ArrowLeftRight size={18} />} label="سابق/تالي" color="text-sky-600" bg="bg-sky-50" border="border-sky-100" />
          <ToolButton onClick={addFloatingCircle} icon={<div className="w-4 h-4 border-2 border-current rounded-full relative"><div className="absolute top-1/2 left-0 right-0 border-t-2 border-current"></div></div>} label="دائرة درجة" color="text-rose-600" bg="bg-rose-50" border="border-rose-100" />
        </div>
      </div>

      {/* Canvas Area (Multiple Pages) */}
      <div 
        className={`flex-1 overflow-auto p-4 flex flex-col items-center bg-gray-200/80 transition-all duration-300 ${editingBlock ? 'pb-[50vh]' : ''}`} 
        onClick={() => setEditingBlockId(null)}
      >
        <div className="flex flex-col items-center w-full transition-all duration-200">
          {pages.map((page, index) => (
            <PageRenderer
              key={page.id}
              page={page}
              isFirstPage={index === 0}
              header={header}
              isActive={activePageId === page.id}
              onActivate={() => setActivePageId(page.id)}
              onDeletePage={() => deletePage(page.id)}
              canDelete={pages.length > 1}
              editingBlockId={editingBlockId}
              onEditBlock={setEditingBlockId}
              onDeleteBlock={deleteBlock}
              onUpdateBlocks={(newBlocks) => setPages(pages.map(p => p.id === page.id ? { ...p, blocks: newBlocks } : p))}
              onUpdateFloatingCircle={(circle) => updateFloatingCircle(page.id, circle)}
              onDeleteFloatingCircle={(circleId) => deleteFloatingCircle(page.id, circleId)}
              isExporting={isExporting}
              globalZoom={globalZoom}
            />
          ))}

          {/* Add New Page Button */}
          <button 
            onClick={(e) => { e.stopPropagation(); addPage(); }}
            className="mt-4 mb-12 flex items-center gap-2 bg-white border-2 border-dashed border-gray-300 text-gray-600 px-6 py-3 rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <Plus size={20} />
            <span className="font-bold">إضافة صفحة جديدة</span>
          </button>
        </div>
      </div>

      {/* Block Editor Modal/Sidebar */}
      {editingBlock && (
        <BlockEditor 
          block={editingBlock} 
          onChange={updateBlock} 
          onClose={() => setEditingBlockId(null)} 
        />
      )}

      {/* Header Image Editor Modal */}
      <HeaderImageEditor
        isOpen={isHeaderEditorOpen}
        onClose={() => setIsHeaderEditorOpen(false)}
        headerTexts={header.headerTexts || []}
        onSave={(texts) => setHeader({ ...header, headerTexts: texts })}
      />
    </div>
  );
}

// --- Subcomponents ---

function ReorderItemWrapper({ block, isEditing, onEdit, onDelete, isExporting }: { key?: string | number, block: Block, isEditing: boolean, onEdit: () => void, onDelete: () => void, isExporting: boolean }) {
  const controls = useDragControls();
  
  return (
    <Reorder.Item 
      value={block} 
      dragListener={false} 
      dragControls={controls}
      className="relative"
    >
      <BlockRenderer 
        block={block} 
        isEditing={isEditing}
        onEdit={onEdit}
        onDelete={onDelete}
        onDragStart={(e) => controls.start(e)}
        isExporting={isExporting}
      />
    </Reorder.Item>
  );
}

interface PageRendererProps {
  key?: string | number;
  page: PageData;
  isFirstPage: boolean;
  header: DocumentHeader;
  isActive: boolean;
  onActivate: () => void;
  onDeletePage: () => void;
  canDelete: boolean;
  editingBlockId: string | null;
  onEditBlock: (id: string | null) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlocks: (blocks: Block[]) => void;
  onUpdateFloatingCircle: (circle: FloatingCircle) => void;
  onDeleteFloatingCircle: (id: string) => void;
  isExporting: boolean;
  globalZoom: number;
}

function PageRenderer({ 
  page, isFirstPage, header, isActive, onActivate, onDeletePage, canDelete, 
  editingBlockId, onEditBlock, onDeleteBlock, onUpdateBlocks, onUpdateFloatingCircle, onDeleteFloatingCircle, isExporting, globalZoom
}: PageRendererProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!pageRef.current || !contentRef.current) return;
    
    const updateScale = () => {
      if (!pageRef.current || !contentRef.current) return;
      
      const containerWidth = pageRef.current.clientWidth;
      const containerHeight = pageRef.current.clientHeight;
      
      // The content has a fixed width of 794px
      const baseScale = containerWidth / 794;
      
      const contentHeight = contentRef.current.scrollHeight;
      const scaledContentHeight = contentHeight * baseScale;
      
      let newScale = baseScale;
      
      if (scaledContentHeight > containerHeight && containerHeight > 0) {
        newScale = containerHeight / contentHeight;
      }
      
      setScale(prev => Math.abs(prev - newScale) > 0.005 ? newScale : prev);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(pageRef.current);
    observer.observe(contentRef.current);
    
    updateScale();
    
    return () => observer.disconnect();
  }, [page.blocks, header, isFirstPage, globalZoom]);

  return (
    <div id={`page-container-${page.id}`} className="relative mb-8 flex flex-col items-center w-full" style={{ maxWidth: `${794 * globalZoom}px` }}>
      {/* Page Controls */}
      <div className="flex justify-between w-full mb-2 px-2">
        <span className={`text-xs font-bold ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
          {isFirstPage ? 'الصفحة الأولى (الرئيسية)' : 'صفحة إضافية'} {isActive && '(نشطة)'}
        </span>
        {canDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDeletePage(); }} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 font-bold bg-red-50 px-2 py-1 rounded">
            <Trash2 size={14} /> حذف الصفحة
          </button>
        )}
      </div>
      
      {/* A4 Paper Container */}
      <div 
        id={`page-${page.id}`}
        ref={pageRef}
        onClick={(e) => { 
          e.stopPropagation(); 
          onActivate(); 
          if (editingBlockId) {
            onEditBlock(null);
          }
        }}
        className={`bg-white shadow-md relative overflow-hidden flex justify-center cursor-pointer transition-all ${isExporting ? '' : isActive ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-100' : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 hover:ring-offset-gray-100'}`}
        style={{ 
          aspectRatio: '210 / 297',
          width: isExporting ? '794px' : `${100 * globalZoom}%`,
          maxWidth: isExporting ? 'none' : `${794 * globalZoom}px`
        }}
      >
        <div 
          ref={contentRef}
          id={`content-${page.id}`}
          className="w-[794px] origin-top shrink-0"
          style={{ 
            transform: `scale(${isExporting ? 1 : scale})`,
            paddingBottom: '5%',
            paddingLeft: '5%',
            paddingRight: '5%',
            paddingTop: '5%'
          }}
        >
          {/* Header Block - Only on First Page */}
          {isFirstPage && (
            <div 
              className={`mb-4 relative group cursor-pointer ${isExporting ? '' : 'hover:ring-2 hover:ring-indigo-300'} rounded transition-all`}
              onClick={(e) => {
                e.stopPropagation();
                // Open header editor
                const event = new CustomEvent('open-header-editor');
                window.dispatchEvent(event);
              }}
            >
              {header.useImageHeader ? (
                <div className="relative w-full flex justify-center overflow-visible">
                  <div 
                    className="relative"
                    style={{ 
                      transform: `scale(${header.imageScale || 1})`,
                      transformOrigin: 'top center',
                      width: '100%',
                      maxWidth: '800px',
                      containerType: 'inline-size'
                    }}
                  >
                    <img src="/calesha.png" alt="Header" className="w-full h-auto object-contain" />
                    {header.headerTexts?.map(text => (
                      <div
                        key={text.id}
                        className="absolute font-bold text-center pointer-events-none whitespace-nowrap"
                        style={{
                          left: `${text.x}%`,
                          top: `${text.y}%`,
                          fontSize: `${2 * (text.scale || 1)}cqw`,
                          transform: 'translate(-50%, -50%)',
                          color: '#000'
                        }}
                      >
                        {text.text}
                      </div>
                    ))}
                  </div>
                  
                  {/* Resize handle for the image header */}
                  {!isExporting && (
                    <div 
                      className="absolute -bottom-4 right-1/2 translate-x-1/2 w-8 h-8 bg-white border border-gray-300 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20 flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const startY = e.clientY;
                        const startScale = header.imageScale || 1;
                        
                        const onPointerMove = (moveEvent: PointerEvent) => {
                          const deltaY = moveEvent.clientY - startY;
                          const newScale = Math.max(0.5, Math.min(2, startScale + deltaY * 0.005));
                          const updateEvent = new CustomEvent('update-header-scale', { detail: newScale });
                          window.dispatchEvent(updateEvent);
                        };
                        
                        const onPointerUp = () => {
                          window.removeEventListener('pointermove', onPointerMove);
                          window.removeEventListener('pointerup', onPointerUp);
                        };
                        
                        window.addEventListener('pointermove', onPointerMove);
                        window.addEventListener('pointerup', onPointerUp);
                      }}
                    >
                      <ArrowUpDown size={14} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-b-2 border-gray-800 pb-2 flex justify-between items-start text-[9px] sm:text-xs">
                   <div className="space-y-1">
                     <p className="font-bold text-xs sm:text-sm">{header.schoolName}</p>
                     <p>{header.studentNameLabel}</p>
                   </div>
                   <div className="text-center pt-1">
                     <p className="font-bold text-sm sm:text-base">{header.testTitle}</p>
                   </div>
                   <div className="space-y-1">
                     <p>{header.gradeLabel}</p>
                     <p className="flex items-center gap-1">{header.scoreLabel} <span className="inline-block w-6 h-4 sm:w-10 sm:h-6 border border-gray-400"></span></p>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Content Blocks */}
          <Reorder.Group 
            axis="y" 
            values={page.blocks} 
            onReorder={onUpdateBlocks}
            className="space-y-4"
          >
            {page.blocks.map(block => (
              <ReorderItemWrapper 
                key={block.id} 
                block={block} 
                isEditing={editingBlockId === block.id}
                onEdit={() => onEditBlock(block.id)}
                onDelete={() => onDeleteBlock(block.id)}
                isExporting={isExporting}
              />
            ))}

            {page.blocks.length === 0 && (
              <div className={`border border-dashed p-3 rounded-lg flex flex-col items-center justify-center gap-1.5 mt-2 ${isActive ? 'bg-indigo-50/50 border-indigo-200 text-indigo-400' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                {isActive ? (
                  <>
                    <div className="bg-white p-1 rounded-full shadow-sm">
                      <ArrowRight size={14} className="rotate-90" />
                    </div>
                    <p className="text-[9px] sm:text-[10px] font-medium">اختر أداة من الأعلى لإضافتها في هذه الصفحة</p>
                  </>
                ) : (
                  <p className="text-[9px] sm:text-[10px] font-medium">انقر هنا لتحديد هذه الصفحة وإضافة عناصر</p>
                )}
              </div>
            )}
          </Reorder.Group>

          {/* Floating Circles */}
          {page.floatingCircles?.map(circle => (
            <FloatingCircleComponent
              key={circle.id}
              circle={circle}
              scale={scale}
              onUpdate={(updated) => onUpdateFloatingCircle(updated)}
              onDelete={() => onDeleteFloatingCircle(circle.id)}
              isExporting={isExporting}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, color, bg, border, onClick }: { icon: React.ReactNode, label: string, color: string, bg: string, border: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 min-w-[56px] group p-1">
      <div className={`w-10 h-10 rounded-xl ${bg} ${border} border flex items-center justify-center ${color} group-hover:scale-105 group-active:scale-95 transition-all shadow-sm`}>
        {icon}
      </div>
      <span className="text-[9px] text-gray-600 font-bold">{label}</span>
    </button>
  );
}

function FloatingCircleComponent({ 
  circle, 
  scale, 
  onUpdate, 
  onDelete,
  isExporting
}: { 
  key?: string;
  circle: FloatingCircle, 
  scale: number, 
  onUpdate: (circle: FloatingCircle) => void, 
  onDelete: () => void,
  isExporting?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const showControls = !isExporting && (isHovered || isFocused);
  const currentScale = circle.scale || 1;
  const size = 48 * currentScale;

  return (
    <div
      className="absolute z-50 group"
      style={{ 
        left: `${circle.x}px`, 
        top: `${circle.y}px`,
        width: size,
        height: size,
        transform: 'translate(-50%, -50%)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsFocused(true);
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        
        {/* Controls Container - Only visible on hover/focus */}
        <div className={`absolute -inset-2 border-2 border-indigo-400 border-dashed rounded pointer-events-none transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Drag Handle */}
        <div 
          className={`absolute -top-8 left-1/2 -translate-x-1/2 p-1.5 bg-indigo-600 text-white rounded cursor-move shadow-md transition-opacity duration-200 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startCircleX = circle.x;
            const startCircleY = circle.y;
            
            const onPointerMove = (moveEvent: PointerEvent) => {
              const deltaX = moveEvent.clientX - startX;
              const deltaY = moveEvent.clientY - startY;
              
              onUpdate({ 
                ...circle,
                x: startCircleX + deltaX / scale,
                y: startCircleY + deltaY / scale
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
              const movement = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
              
              // Adjust sensitivity
              const newScale = Math.max(0.5, Math.min(8, startScale + movement * 0.015));
              onUpdate({ ...circle, scale: newScale });
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

        {/* The Circle Content */}
        <div className="w-full h-full rounded-full border-2 border-black bg-white flex flex-col items-center justify-center overflow-hidden">
          <div className="w-full h-1/2 border-b-2 border-black pointer-events-none"></div>
          <div className="w-full h-1/2 flex items-center justify-center">
            <input
              type="text"
              value={circle.number}
              onChange={(e) => onUpdate({ ...circle, number: e.target.value })}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onPointerDown={(e) => e.stopPropagation()} // Prevent dragging when interacting with input
              className="w-full text-center bg-transparent outline-none font-bold"
              style={{ fontSize: `${1.125 * currentScale}rem` }}
              dir="rtl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
