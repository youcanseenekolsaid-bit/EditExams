import React, { useState, useEffect, useRef } from 'react';

interface DraggableNumberInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  placeholder?: string;
}

export function DraggableNumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  className = '',
  placeholder = ''
}: DraggableNumberInputProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const startX = useRef(0);
  const startValue = useRef(0);

  useEffect(() => {
    if (!isDragging.current) {
      setLocalValue(value?.toString() || '');
    }
  }, [value]);

  const handlePointerDown = (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.clientX;
    const parsed = parseFloat(localValue);
    startValue.current = isNaN(parsed) ? 0 : parsed;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLInputElement>) => {
    if (!isDragging.current) return;
    const diff = e.clientX - startX.current;
    
    // Only start dragging if moved more than 3 pixels
    if (Math.abs(diff) > 3) {
      hasMoved.current = true;
      const sensitivity = step < 1 ? 100 : 2; // Adjust sensitivity based on step
      let newValue = startValue.current + (diff / sensitivity) * step;
      
      // Round to step
      const inv = 1.0 / step;
      newValue = Math.round(newValue * inv) / inv;
      newValue = Math.max(min, Math.min(max, newValue));
      
      setLocalValue(newValue.toString());
      onChange(newValue);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLInputElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!hasMoved.current) {
      e.currentTarget.focus();
    } else {
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    if (localValue === '' || localValue === '-') {
      setLocalValue('0');
      onChange(0);
      return;
    }
    
    let parsed = parseFloat(localValue);
    if (isNaN(parsed)) {
      parsed = 0;
    }
    parsed = Math.max(min, Math.min(max, parsed));
    setLocalValue(parsed.toString());
    onChange(parsed);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={localValue}
      placeholder={placeholder}
      onChange={(e) => {
        const val = e.target.value;
        setLocalValue(val);
        
        // Only update parent if it's a valid number or empty/minus
        if (val === '' || val === '-') {
          onChange(val);
        } else {
          const parsed = parseFloat(val);
          if (!isNaN(parsed)) {
            onChange(Math.max(min, Math.min(max, parsed)));
          }
        }
      }}
      onBlur={handleBlur}
      onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`${className} cursor-ew-resize`}
      style={{ touchAction: 'none' }}
      dir="ltr"
    />
  );
}
