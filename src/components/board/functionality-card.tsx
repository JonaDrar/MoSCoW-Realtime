// src/components/board/functionality-card.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FunctionalityCardProps, Priority } from './types';
import { User, MessageSquareText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { useTranslations, useLocale } from 'next-intl'; // Import next-intl hooks
import { format } from 'date-fns'; // Use format for better locale control
import { enUS, es } from 'date-fns/locale'; // Import date-fns locales

const categoryClasses: Record<Priority, string> = {
    must: 'card-must',
    should: 'card-should',
    could: 'card-could',
    wont: 'card-wont',
};

export default function FunctionalityCard({ functionality, onMove }: FunctionalityCardProps) {
  const t = useTranslations('FunctionalityCard'); // Translations for this component
  const tp = useTranslations('Priorities'); // Translations for priorities
  const locale = useLocale(); // Get current locale

  const { text, justification, proposerUsername, priority, createdAt } = functionality;

  // Use translated priority labels
  const priorityLabels: Record<Priority, string> = {
    must: tp('must'),
    should: tp('should'),
    could: tp('could'),
    wont: tp('wont'),
  };

  const handleMove = (newPriority: Priority) => {
    if (newPriority !== priority) {
        onMove(newPriority);
    }
  };

  // Format date based on locale
  let formattedDate = t('dateUnavailable');
  if (createdAt?.toDate) {
      try {
        const dateLocale = locale === 'es' ? es : enUS;
        // Example format, adjust as needed. Using 'PPp' for locale-specific date and time.
        formattedDate = format(createdAt.toDate(), 'PPp', { locale: dateLocale });
      } catch (e) {
          console.error("Error formatting card date:", e);
          formattedDate = t('dateUnavailable'); // Fallback on error
      }
  }


  return (
    <Card className={`shadow-md border ${categoryClasses[priority]}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
           <CardTitle className="text-base font-semibold leading-tight break-words mr-2">{text}</CardTitle>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-current rounded-full -mr-2 -mt-1">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">{t('moreOptions')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('moveToLabel')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                    p !== priority && (
                        <DropdownMenuItem key={p} onClick={() => handleMove(p)} className="cursor-pointer">
                         {priorityLabels[p]}
                        </DropdownMenuItem>
                    )
                    ))}
                </DropdownMenuContent>
             </DropdownMenu>
        </div>

      </CardHeader>
      <CardContent className="px-4 py-2">
        <CardDescription className="text-sm break-words flex items-start gap-1.5 text-current/80">
             <MessageSquareText className="h-4 w-4 mt-0.5 flex-shrink-0" />
             <span>{justification}</span>
        </CardDescription>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground px-4 pb-3 pt-1 flex justify-between items-center">
        <div className="flex items-center gap-1">
           <User className="h-3 w-3" />
           <span>{proposerUsername || t('unknownUser')}</span>
        </div>
        <time dateTime={createdAt?.toDate().toISOString() || ''}>{formattedDate}</time>
      </CardFooter>
    </Card>
  );
}
