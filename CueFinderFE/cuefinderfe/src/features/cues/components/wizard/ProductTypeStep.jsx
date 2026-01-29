import React from 'react';
import { Card, CardContent } from '../../../../components/ui/card';

/**
 * ProductTypeStep - Step 1: Select product type
 * Large, touch-friendly cards for mobile
 * Visual selection with icons and descriptions
 */
export default function ProductTypeStep({ productType, onProductTypeChange }) {
  const productTypes = [
    {
      value: 'cue',
      icon: '🎱',
      title: 'Billiard Cue',
      description: 'Pool & Snooker Cues',
      details: 'Playing, Break, or Jump Cues'
    },
    {
      value: 'case',
      icon: '💼',
      title: 'Cue Case',
      description: 'Protective Cases',
      details: 'Various capacities & styles'
    },
    {
      value: 'table',
      icon: '🎳',
      title: 'Billiard Table',
      description: 'Pool & Snooker Tables',
      details: 'Complete tables for sale'
    },
    {
      value: 'accessory',
      icon: '🎯',
      title: 'Accessories',
      description: 'Chalk, Tips & More',
      details: 'Essential billiard gear'
    }
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
          What are you listing?
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select the type of item you want to sell
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {productTypes.map((type) => (
          <Card
            key={type.value}
            className={`
              cursor-pointer transition-all duration-200 hover:scale-[1.02]
              ${productType === type.value
                ? 'border-primary border-2 bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50'
              }
            `}
            onClick={() => onProductTypeChange(type.value)}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="text-3xl sm:text-4xl">{type.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm sm:text-base text-foreground mb-0.5">
                    {type.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                    {type.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    {type.details}
                  </p>
                </div>
                {productType === type.value && (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
