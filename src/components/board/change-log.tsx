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
function formatLogTimestamp(timestamp: any, locale: string, tInvalid: string, tError: string): string {
  if (!timestamp?.toDate) {
    // Use translation for invalid date
    return tInvalid;
  }
  try {
    const dateLocale = locale === 'es' ? es : enUS;
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale: dateLocale });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
     // Use translation for error formatting date
    return tError;
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

    // Define components to pass to t.rich. Keys MUST match the tags in the translation JSON.
    // Pass simple JSX elements instead of complex components for badges.
    // Add unique keys to satisfy React's requirement for lists.
    const components = {
      username: <span key={`log-${log.id}-username`} className="font-medium">{log.username}</span>,
      cardTextShort: <span key={`log-${log.id}-cardtext`} className="italic">"{cardTextShort}"</span>,
      fromPriority: log.fromPriority ? (
        <Badge key={`log-${log.id}-from`} variant="secondary" className={`mx-1 priority-badge-${log.fromPriority}`}>
          {priorityLabels[log.fromPriority]}
        </Badge>
      ) : <React.Fragment key={`log-${log.id}-from-empty`}></React.Fragment>, // Add key even for empty fragment
      toPriority: log.toPriority ? (
        <Badge key={`log-${log.id}-to`} variant="secondary" className={`mx-1 priority-badge-${log.toPriority}`}>
          {priorityLabels[log.toPriority]}
        </Badge>
      ) : <React.Fragment key={`log-${log.id}-to-empty`}></React.Fragment>, // Add key even for empty fragment
    };


    let messageElement;

    switch (log.changeType) {
      case 'created':
        // Ensure the key 'createdLog' and tags match the JSON exactly
        messageElement = t.rich('createdLog', components);
        return (
          <>
            <PlusCircle className="h-4 w-4 text-green-600 mr-1.5 flex-shrink-0 mt-0.5" /> {/* Added mt-0.5 for alignment */}
            <div className="flex-1">{messageElement}</div> {/* Render directly in a div */}
            {justificationText}
          </>
        );
      case 'moved':
         // Ensure the key 'movedLog' and tags match the JSON exactly
         messageElement = t.rich('movedLog', components);
        return (
            <>
              <ArrowRight className="h-4 w-4 text-blue-600 mr-1.5 flex-shrink-0 mt-0.5" /> {/* Added mt-0.5 for alignment */}
               <div className="flex-1">{messageElement}</div> {/* Render directly in a div */}
               {justificationText}
            </>
          );
      case 'edited':
         // Ensure the key 'editedLog' and tags match the JSON exactly
         messageElement = t.rich('editedLog', components);
        return (
            <>
              <Pencil className="h-4 w-4 text-orange-600 mr-1.5 flex-shrink-0 mt-0.5" /> {/* Added mt-0.5 for alignment */}
              <div className="flex-1">{messageElement}</div> {/* Render directly in a div */}
              {log.justification && (
                 <p className="text-xs text-foreground/80 mt-1 ml-6 w-full">
                   {t('detailsPrefix')} {log.justification}
                </p>
               )}
             </>
           );
      default:
        // Ensure the key 'unknownLog' and tags match the JSON exactly
        messageElement = t.rich('unknownLog', components);
        return (
           <>
             {/* Optional: Add an icon for unknown changes. Adding mt-0.5 */}
              <div className="flex-1 mt-0.5">{messageElement}</div> {/* Render directly in a div */}
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
            {/* Ensure parent takes full width for flex-1 to work */}
            <div className="flex items-start text-sm text-foreground mb-1 flex-wrap w-full">
                {renderChangeDescription(log)}
            </div>
            <p className="text-xs text-muted-foreground ml-6">
                {formatLogTimestamp(log.timestamp, locale, t('invalidDate'), t('errorFormattingDate'))}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Inject badge styles - This method is generally fine for client components
const badgeStyles = `
.priority-badge-must { background-color: hsl(var(--moscow-must-bg)); color: hsl(var(--moscow-must-fg)); border: 1px solid hsl(var(--moscow-must-border)); }
.priority-badge-should { background-color: hsl(var(--moscow-should-bg)); color: hsl(var(--moscow-should-fg)); border: 1px solid hsl(var(--moscow-should-border)); }
.priority-badge-could { background-color: hsl(var(--moscow-could-bg)); color: hsl(var(--moscow-could-fg)); border: 1px solid hsl(var(--moscow-could-border)); }
.priority-badge-wont { background-color: hsl(var(--moscow-wont-bg)); color: hsl(var(--moscow-wont-fg)); border: 1px solid hsl(var(--moscow-wont-border)); }
`;

if (typeof window !== 'undefined') {
  const styleId = 'priority-badge-styles';
  let styleSheet = document.getElementById(styleId);
  if (!styleSheet) {
      styleSheet = document.createElement("style");
      styleSheet.id = styleId;
      styleSheet.setAttribute("type", "text/css"); // Use setAttribute
      document.head.appendChild(styleSheet);
  }
   // Update innerText safely
  if (styleSheet.textContent !== badgeStyles) {
     styleSheet.textContent = badgeStyles;
  }
}
