// src/components/board/change-log.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChangeLogEntry, Priority } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, PlusCircle, Edit3 } from 'lucide-react';

const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

function formatTimestamp(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return 'Unknown date';
  const date = timestamp.toDate();
   return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short', // e.g., 12/19/23
    timeStyle: 'short', // e.g., 11:59 AM
  }).format(date);
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .filter((_, i, arr) => i === 0 || i === arr.length - 1) // First and last initial
        .join('')
        .toUpperCase();
}


export default function ChangeLog() {
  const [logs, setLogs] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'changeLog'), orderBy('timestamp', 'desc'), limit(50)); // Limit to last 50 changes

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLogs: ChangeLogEntry[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ChangeLogEntry);
      });
      setLogs(fetchedLogs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching change log:", error);
      setLoading(false);
      // Handle error display if needed
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const renderChangeDetails = (log: ChangeLogEntry) => {
    switch (log.changeType) {
      case 'created':
        return (
          <>
            <PlusCircle className="h-4 w-4 text-green-600 mr-1" />
            created "<span className="font-medium italic">{log.functionalityText}</span>" in {priorityLabels[log.toPriority!]}.
            {log.justification && <span className="block text-xs text-muted-foreground pl-5 mt-0.5">Justification: {log.justification}</span>}
          </>
        );
      case 'moved':
        return (
          <>
             <ArrowRight className="h-4 w-4 text-blue-600 mr-1" />
            moved "<span className="font-medium italic">{log.functionalityText}</span>" from {priorityLabels[log.fromPriority!]} <ArrowRight className="inline h-3 w-3 mx-0.5"/> {priorityLabels[log.toPriority!]}.
            {log.justification && <span className="block text-xs text-muted-foreground pl-5 mt-0.5">Reason: {log.justification}</span>}
          </>
        );
       case 'edited': // Basic edit log - can be expanded
        return (
          <>
            <Edit3 className="h-4 w-4 text-orange-600 mr-1" />
            edited "<span className="font-medium italic">{log.functionalityText}</span>".
            {log.justification && <span className="block text-xs text-muted-foreground pl-5 mt-0.5">Details: {log.justification}</span>}
          </>
        );
      default:
        return 'made an unknown change.';
    }
  };

  return (
    <Card className="h-[calc(100vh-theme(spacing.16))] flex flex-col"> {/* Adjust height as needed */}
       <CardHeader className="p-4 border-b">
         <CardTitle className="text-lg font-semibold">Change Log</CardTitle>
       </CardHeader>
       <ScrollArea className="flex-grow">
         <CardContent className="p-0">
            {loading && <p className="p-4 text-sm text-muted-foreground">Loading change history...</p>}
            {!loading && logs.length === 0 && <p className="p-4 text-sm text-muted-foreground">No changes recorded yet.</p>}
            <ul className="divide-y">
                {logs.map((log) => (
                <li key={log.id} className="p-3 hover:bg-muted/50">
                    <div className="flex items-start space-x-3">
                    <Avatar className="h-6 w-6 mt-1">
                        {/* Placeholder for potential avatar image */}
                        {/* <AvatarImage src="https://github.com/shadcn.png" alt={log.username} /> */}
                        <AvatarFallback className="text-xs">{getInitials(log.username)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-sm">
                        <p>
                            <span className="font-semibold">{log.username}</span>{' '}
                            {renderChangeDetails(log)}
                        </p>
                        <time className="text-xs text-muted-foreground">
                         {formatTimestamp(log.timestamp)}
                        </time>
                    </div>
                    </div>
                </li>
                ))}
            </ul>
         </CardContent>
       </ScrollArea>
    </Card>
  );
}
