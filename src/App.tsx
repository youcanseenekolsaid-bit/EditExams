import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { MathEditor } from './components/MathEditor';
import { StatusBar } from '@capacitor/status-bar';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'math'>('home');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        await StatusBar.hide(); 
      } catch (e) {
        console.log('StatusBar not available on web');
      }
    };
    initApp();
  }, []);

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