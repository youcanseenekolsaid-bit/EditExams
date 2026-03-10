import React, { useState } from 'react';
import { Home } from './components/Home';
import { MathEditor } from './components/MathEditor';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'math'>('home');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex justify-center bg-gray-200">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
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
