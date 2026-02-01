import React from 'react';
import { Check } from 'lucide-react';

/**
 * StepIndicator - Visual progress indicator for multi-step wizard
 * Displays step numbers, titles, and completion status
 * Mobile-responsive with truncated labels on small screens
 */
export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="w-full py-3 sm:py-4">
      <div className="flex justify-between items-center relative">
        {/* Progress line behind steps */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" style={{ zIndex: 0 }} />
        <div 
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-300" 
          style={{ 
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            zIndex: 0 
          }} 
        />
        
        {/* Step indicators */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          
          return (
            <div key={index} className="flex flex-col items-center relative" style={{ zIndex: 1 }}>
              {/* Circle indicator */}
              <div 
                className={`
                  w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center
                  font-semibold text-xs sm:text-sm transition-all duration-200
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground scale-105' 
                    : isCurrent
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110'
                    : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : index + 1}
              </div>
              
              {/* Step label */}
              <span 
                className={`
                  mt-1.5 text-xs sm:text-sm font-medium text-center max-w-[70px] sm:max-w-none
                  ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}
                `}
              >
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.shortTitle || step.title}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
