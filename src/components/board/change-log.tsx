// src/components/board/change-log.tsx
'use client';

import React from 'react';
import type { ChangeLogEntry, Priority } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es } from 'date-fns/locale'; // Import locales
import { Badge } from '@/components/ui/badge';
import { ArrowRight, PlusCircle, Pencil } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl'; // Import next-intl hooks

// Helper function for consistent timestamp formatting with locale
function formatLogTimestamp(timestamp: any, locale: string): string {
  if (!timestamp?.toDate) {
    // Use translation for invalid date
    // Cannot call useTranslations here, so pass it or use a fixed string/prop
    return 'Invalid date'; // Consider passing t('invalidDate') as a prop if needed outside component scope
  }
  try {
    const dateLocale = locale === 'es' ? es : enUS;
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: dateLocale });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
     // Use translation for error formatting date
    return 'Error formatting date'; // Consider passing t('errorFormattingDate') as a prop
  }
}

// Define props for the component
interface ChangeLogProps {
  logs: ChangeLogEntry[];
  loading: boolean; // Add loading prop
}

export default function ChangeLog({ logs, loading }: ChangeLogProps) {
  const t = useTranslations('ChangeLog'); // Translations for ChangeLog
  const tp = useTranslations('Priorities'); // Translations for Priorities
  const locale = useLocale(); // Get current locale

  // Use translated priority labels
  const priorityLabels: Record<Priority, string> = {
    must: tp('must'),
    should: tp('should'),
    could: tp('could'),
    wont: tp('wont'),
  };

    // Custom Badge component for use with t.rich
    const PriorityBadge = ({ children, priority }: { children?: React.ReactNode, priority: Priority }) => (
      <Badge variant="secondary" className={`mx-1 priority-badge-${priority}`}>
        {children || priorityLabels[priority]}
      </Badge>
    );
    PriorityBadge.displayName = 'PriorityBadge';


  // Helper to render the change description with translations and rich text
  function renderChangeDescription(log: ChangeLogEntry) {
    const cardTextShort = log.functionalityText.length > 30
      ? `${log.functionalityText.substring(0, 27)}...`
      : log.functionalityText;

    const justificationText = log.justification ? (
      <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
        {t('reasonPrefix')} {log.justification}
      </p>
    ) : null;

    const usernameComponent = <span className="font-medium">{log.username}</span>;
    const cardTextComponent = <span className="italic">"{cardTextShort}"</span>;

    let message;

    switch (log.changeType) {
      case 'created':
        message = t.rich('createdLog', {
          username: () => usernameComponent,
          cardTextShort: () => cardTextComponent,
          toPriority: log.toPriority ? () => <PriorityBadge priority={log.toPriority} /> : () => null,
        });
        return (
          <>
            <PlusCircle className="h-4 w-4 text-green-600 mr-1.5 flex-shrink-0" />
            <span className="flex-1">{message}.</span>
            {justificationText}
          </>
        );
      case 'moved':
         message = t.rich('movedLog', {
           username: () => usernameComponent,
           cardTextShort: () => cardTextComponent,
           fromPriority: log.fromPriority ? () => <PriorityBadge priority={log.fromPriority} /> : () => null,
           toPriority: log.toPriority ? () => <PriorityBadge priority={log.toPriority} /> : () => null,
         });
        return (
            <>
              <ArrowRight className="h-4 w-4 text-blue-600 mr-1.5 flex-shrink-0" />
               <span className="flex-1">{message}.</span>
               {justificationText}
            </>
          );
      case 'edited':
         message = t.rich('editedLog', {
           username: () => usernameComponent,
           cardTextShort: () => cardTextComponent,
         });
        return (
            <>
              <Pencil className="h-4 w-4 text-orange-600 mr-1.5 flex-shrink-0" />
              <span className="flex-1">{message}.</span>
              {log.justification && (
                 <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
                   {t('detailsPrefix')} {log.justification}
                </p>
               )}
             </>
           );
      default:
        message = t.rich('unknownLog', {
           username: () => usernameComponent,
           cardTextShort: () => cardTextComponent,
         });
        return (
           <>
              {/* Optional: Add an icon for unknown changes */}
              <span className="flex-1">{message}.</span>
              {log.justification && (
                <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
                  {t('justificationPrefix')} {log.justification}
                </p>
              )}
           </>
         );
    }
  }


  return (
    <ScrollArea className="flex-grow h-full">
      <div className="p-4 space-y-4">
        {loading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        )}
        {!loading && logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('noLogs')}
          </p>
        )}
        {!loading && logs.map((log) => (
          <div key={log.id} className="pb-3 border-b border-border last:border-b-0">
            <div className="flex items-start text-sm text-foreground mb-1 flex-wrap">
                {renderChangeDescription(log)}
            </div>
            <p className="text-xs text-muted-foreground ml-6">
                {formatLogTimestamp(log.timestamp, locale) || t('invalidDate')}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Badge styling remains the same
const badgeStyles = `
.priority-badge-must { background-color: hsl(var(--moscow-must-bg)); color: hsl(var(--moscow-must-fg)); border: 1px solid hsl(var(--moscow-must-border)); }
.priority-badge-should { background-color: hsl(var(--moscow-should-bg)); color: hsl(var(--moscow-should-fg)); border: 1px solid hsl(var(--moscow-should-border)); }
.priority-badge-could { background-color: hsl(var(--moscow-could-bg)); color: hsl(var(--moscow-could-fg)); border: 1px solid hsl(var(--moscow-could-border)); }
.priority-badge-wont { background-color: hsl(var(--moscow-wont-bg)); color: hsl(var(--moscow-wont-fg)); border: 1px solid hsl(var(--moscow-wont-border)); }
`;

if (typeof window !== 'undefined') {
  const styleId = 'priority-badge-styles';
  if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement("style");
      styleSheet.id = styleId;
      styleSheet.type = "text/css";
      styleSheet.innerText = badgeStyles;
      document.head.appendChild(styleSheet);
  }
}
