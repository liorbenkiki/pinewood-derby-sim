import React, { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

export function MobileWarningModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const dismissed = localStorage.getItem('mobile-warning-dismissed');
    
    const checkMobile = () => {
      // Only show on screens smaller than 768px and if not dismissed
      if (window.innerWidth < 768 && !dismissed) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('mobile-warning-dismissed', 'true');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 block md:hidden backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="text-center mt-2">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-50 mb-4">
            <Monitor className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Desktop Recommended</h3>
          <p className="text-sm text-gray-600 mb-6 px-2 leading-relaxed">
            For the best experience analyzing physics simulations and configuring your car, we recommend using a desktop or tablet device.
          </p>
          <button
            onClick={handleDismiss}
            className="w-full bg-blue-600 font-medium text-white rounded-lg py-2.5 px-4 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            Continue anyway
          </button>
        </div>
      </div>
    </div>
  );
}
