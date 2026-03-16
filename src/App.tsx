import React, { useState } from 'react';
import { Home } from './components/Home';
import { MathEditor } from './components/MathEditor';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'math'>('home');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

  return (
  /* w-screen و h-screen تضمنان ملء الشاشة تماماً على الهاتف */
  <div className="w-screen h-screen overflow-hidden bg-white">
    <div className="flex flex-col h-full w-full relative">
      {currentScreen === 'home' && (
        <Home 
          onSelectMath={() => {
            setCurrentDocumentId(null);
            setCurrentScreen('math');
          }} 
          onEditDocument={(id) => {
            setCurrentDocumentId(id);
            setCurrentScreen('math');
          }}
        />
      )}
      {currentScreen === 'math' && (
        <MathEditor 
          documentId={currentDocumentId}
          onBack={() => setCurrentScreen('home')} 
        />
      )}
    </div>
  </div>
);
}
