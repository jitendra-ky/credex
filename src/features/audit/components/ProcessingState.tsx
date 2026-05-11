import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calculator, CheckCircle2, Bot } from 'lucide-react';

const steps = [
  { icon: Search, text: "Scanning your tool stack..." },
  { icon: Calculator, text: "Crunching the numbers..." },
  { icon: Bot, text: "AI generating recommendations..." },
  { icon: CheckCircle2, text: "Finalizing your audit..." }
];

export function ProcessingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-t-4 border-brand-DEFAULT border-opacity-50"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-b-4 border-deep-navy border-opacity-50"
        />
        {React.createElement(steps[currentStep].icon, { className: "w-12 h-12 text-brand-DEFAULT animate-pulse" })}
      </div>
      
      <div className="h-12 overflow-hidden text-center">
        <motion.div
          animate={{ y: `-${currentStep * 3}rem` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {steps.map((step, index) => (
            <div key={index} className="h-12 flex items-center justify-center text-xl font-medium text-deep-navy">
              {step.text}
            </div>
          ))}
        </motion.div>
      </div>
      <p className="mt-4 text-muted-foreground text-sm">This usually takes less than 10 seconds.</p>
    </div>
  );
}
