'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FAQItemType {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQProps {
  items: FAQItemType[];
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({ items, className }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className={cn('faq-list', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn('faq-item', activeIndex === index && 'active')}
        >
          <div
            className="faq-question"
            onClick={() => toggleItem(index)}
          >
            <h3>{item.question}</h3>
            <ChevronDown />
          </div>
          <div className="faq-answer">
            {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
          </div>
        </div>
      ))}
    </div>
  );
};

FAQ.displayName = 'FAQ';
