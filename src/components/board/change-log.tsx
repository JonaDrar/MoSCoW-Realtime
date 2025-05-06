// src/components/board/change-log.tsx
'use client';

import React from 'react';
import type { ChangeLogEntry, Priority } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns'; // For relative time
import { Badge } from '@/components/ui/badge'; // Import Badge
import { ArrowRight, PlusCircle, Pencil } from 'lucide-react'; // Import icons

const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

// Helper function for consistent timestamp formatting
function formatLogTimestamp(timestamp: any): string {
  if (!timestamp?.toDate) {
    return 'Invalid date'; // Handle cases where timestamp is not a Firestore Timestamp
  }
  try {
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return 'Error formatting date';
  }
}

// Helper to render the change description
function renderChangeDescription(log: ChangeLogEntry) {
  const cardTextShort = log.functionalityText.length > 30
    ? `"${log.functionalityText.substring(0, 27)}..."`
    : `"${log.functionalityText}"`;

  switch (log.changeType) {
    case 'created':
      return (
        <>
          <PlusCircle className="h-4 w-4 text-green-600 mr-1.5 flex-shrink-0" />
          <span className="font-medium mr-1">{log.username}</span> created {cardTextShort} in
          <Badge variant="secondary" className={`ml-1.5 priority-badge-${log.toPriority}`}>
            {priorityLabels[log.toPriority!]}
          </Badge>
          .
        </>
      );
    case 'moved':
      return (
        <>
          <ArrowRight className="h-4 w-4 text-blue-600 mr-1.5 flex-shrink-0" />
          <span className="font-medium mr-1">{log.username}</span> moved {cardTextShort} from
          <Badge variant="secondary" className={`mx-1.5 priority-badge-${log.fromPriority}`}>
            {priorityLabels[log.fromPriority!]}
          </Badge>
          to
          <Badge variant="secondary" className={`ml-1.5 priority-badge-${log.toPriority}`}>
            {priorityLabels[log.toPriority!]}
          </Badge>
          .
          {log.justification && (
            <p className="text-xs text-muted-foreground mt-1 ml-6 italic">
              Reason: {log.justification}
            </p>
          )}
        </>
      );
    case 'edited': // Assuming an 'edited' type might exist later
       return (
        <>
          <Pencil className="h-4 w-4 text-orange-600 mr-1.5 flex-shrink-0" />
          <span className="font-medium mr-1">{log.username}</span> edited {cardTextShort}.
          {log.justification && (
             <p className="text-xs text-muted-foreground mt-1 ml-6 italic">
               Details: {log.justification}
            </p>
           )}
         </>
       );
    default:
      return `Unknown change by ${log.username} on ${cardTextShort}`;
  }
}

// Define props for the component
interface ChangeLogProps {
  logs: ChangeLogEntry[];
  loading: boolean; // Add loading prop
}

export default function ChangeLog({ logs, loading }: ChangeLogProps) {
  return (
    <ScrollArea className="flex-grow">
      <div className="p-4 space-y-4">
        {loading && ( // Display skeletons if loading
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        )}
        {!loading && logs.length === 0 && ( // Display message if no logs and not loading
          <p className="text-sm text-muted-foreground text-center py-6">
            No changes recorded yet.
          </p>
        )}
        {!loading && logs.map((log) => ( // Display logs if not loading
          <div key={log.id} className="pb-3 border-b border-border last:border-b-0">
            <div className="flex items-start text-sm text-foreground mb-1">
                {renderChangeDescription(log)}
            </div>
            <p className="text-xs text-muted-foreground ml-6">
                {formatLogTimestamp(log.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Add some basic badge styling (optional, could be in globals.css)
const badgeStyles = `
.priority-badge-must { background-color: hsl(var(--moscow-must-bg)); color: hsl(var(--moscow-must-fg)); border-color: hsl(var(--moscow-must-border)); }
.priority-badge-should { background-color: hsl(var(--moscow-should-bg)); color: hsl(var(--moscow-should-fg)); border-color: hsl(var(--moscow-should-border)); }
.priority-badge-could { background-color: hsl(var(--moscow-could-bg)); color: hsl(var(--moscow-could-fg)); border-color: hsl(var(--moscow-could-border)); }
.priority-badge-wont { background-color: hsl(var(--moscow-wont-bg)); color: hsl(var(--moscow-wont-fg)); border-color: hsl(var(--moscow-wont-border)); }
`;

// Inject styles (consider a better approach for larger apps)
if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = badgeStyles;
  document.head.appendChild(styleSheet);
}
