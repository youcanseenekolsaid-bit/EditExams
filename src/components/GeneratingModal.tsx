import React from 'react';
import { Sparkles, X, AlertTriangle } from 'lucide-react';

interface GeneratingModalProps {
  isOpen: boolean;
  progress: number;
  status: string;
  onCancelClick: () => void;
  showCancelConfirm: boolean;
  onConfirmCancel: () => void;
  onAbortCancel: () => void;
}

export function GeneratingModal({
  isOpen,
  progress,
  status,
  onCancelClick,
  showCancelConfirm,
  onConfirmCancel,
  onAbortCancel
}: GeneratingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-6" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* Main Content */}
        <div className={`p-8 flex flex-col items-center text-center transition-all duration-300 ${showCancelConfirm ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center">
              <Sparkles size={40} className="text-indigo-600 animate-pulse" />
            </div>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#EEF2FF"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 48}`}
                strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-indigo-700">{progress}%</span>
            </div>
          </div>

          <h3 className="text-2xl font-extrabold text-gray-800 mb-2">جاري الإنشاء...</h3>
          <p className="text-gray-500 mb-8 h-6">{status}</p>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-8 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <button
            onClick={onCancelClick}
            className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <X size={16} />
            إلغاء العملية
          </button>
        </div>

        {/* Cancel Confirmation Overlay */}
        <div className={`absolute inset-0 bg-white p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${showCancelConfirm ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">إلغاء الإنشاء؟</h3>
          <p className="text-gray-500 mb-8 text-sm">
            هل أنت متأكد أنك تريد إلغاء عملية الإنشاء الذكي؟ سيتم فقدان التقدم الحالي.
          </p>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onAbortCancel}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
            >
              متابعة الإنشاء
            </button>
            <button
              onClick={onConfirmCancel}
              className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
            >
              نعم، إلغاء
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
