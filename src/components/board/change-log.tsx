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
    return 'Invalid date'; // Handle cases where timestamp is not a Firestore Timestamp
  }
  try {
    const dateLocale = locale === 'es' ? es : enUS;
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: dateLocale });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return 'Error formatting date';
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

  // Helper to render the change description with translations
  function renderChangeDescription(log: ChangeLogEntry) {
    const cardTextShort = log.functionalityText.length > 30
      ? `"${log.functionalityText.substring(0, 27)}..."`
      : `"${log.functionalityText}"`;

    const toPriorityBadge = log.toPriority ? (
      <Badge variant="secondary" className={`ml-1.5 priority-badge-${log.toPriority}`}>
        {priorityLabels[log.toPriority]}
      </Badge>
    ) : null;

    const fromPriorityBadge = log.fromPriority ? (
      <Badge variant="secondary" className={`mx-1.5 priority-badge-${log.fromPriority}`}>
        {priorityLabels[log.fromPriority]}
      </Badge>
    ) : null;

    const justificationText = log.justification ? (
      <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
        {t('reasonPrefix')} {log.justification}
      </p>
    ) : null;

    switch (log.changeType) {
      case 'created':
        return (
          <>
            <PlusCircle className="h-4 w-4 text-green-600 mr-1.5 flex-shrink-0" />
            <span
                dangerouslySetInnerHTML={{
                  __html: t('createdLog', {
                    username: `<span class="font-medium mr-1">${log.username}</span>`,
                    cardTextShort: cardTextShort,
                    toPriorityBadge: toPriorityBadge ? `<span class="inline-block">${React.renderToStaticMarkup(toPriorityBadge)}</span>` : '',
                  })
                }}
              />.
            {justificationText}
          </>
        );
      case 'moved':
         return (
            <>
              <ArrowRight className="h-4 w-4 text-blue-600 mr-1.5 flex-shrink-0" />
              <span
                dangerouslySetInnerHTML={{
                  __html: t('movedLog', {
                    username: `<span class="font-medium mr-1">${log.username}</span>`,
                    cardTextShort: cardTextShort,
                    fromPriorityBadge: fromPriorityBadge ? `<span class="inline-block">${React.renderToStaticMarkup(fromPriorityBadge)}</span>` : '',
                    toPriorityBadge: toPriorityBadge ? `<span class="inline-block">${React.renderToStaticMarkup(toPriorityBadge)}</span>` : '',
                  })
                }}
              />.
              {justificationText && (
                 <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
                    {t('reasonPrefix')} {log.justification}
                 </p>
              )}
            </>
          );
      case 'edited':
         return (
            <>
              <Pencil className="h-4 w-4 text-orange-600 mr-1.5 flex-shrink-0" />
              <span
                dangerouslySetInnerHTML={{
                  __html: t('editedLog', {
                    username: `<span class="font-medium mr-1">${log.username}</span>`,
                    cardTextShort: cardTextShort,
                  })
                }}
              />.
              {log.justification && (
                 <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
                   {t('detailsPrefix')} {log.justification}
                </p>
               )}
             </>
           );
      default:
         return (
           <>
              <span
                 dangerouslySetInnerHTML={{
                   __html: t('unknownLog', {
                     username: `<span class="font-medium mr-1">${log.username}</span>`,
                     cardTextShort: cardTextShort,
                   })
                 }}
               />.
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
