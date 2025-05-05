// src/components/board/board-column.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FunctionalityCard from './functionality-card';
import { BoardColumnProps, Priority } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';


const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

const columnStyles: Record<Priority, string> = {
    must: 'column-must',
    should: 'column-should',
    could: 'column-could',
    wont: 'column-wont',
};

export default function BoardColumn({ title, priority, functionalities, onAddCard, onMoveCard }: BoardColumnProps) {

  return (
    <Card className={`flex flex-col h-full border-2 ${columnStyles[priority]}`}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="icon" onClick={() => onAddCard(priority)} className="text-accent hover:text-accent-foreground hover:bg-accent/10">
          <Plus className="h-5 w-5" />
          <span className="sr-only">Add Functionality to {title}</span>
        </Button>
      </CardHeader>
      <ScrollArea className="flex-grow">
         <CardContent className="p-4 space-y-4 h-full">
            {functionalities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No functionalities yet.</p>
            )}
            {functionalities.map((func) => (
            <FunctionalityCard
                key={func.id}
                functionality={func}
                onMove={(newPriority, justification) => onMoveCard(func.id, func.priority, newPriority, justification)}
            />
            ))}
         </CardContent>
      </ScrollArea>
    </Card>
  );
}
