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

const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

const categoryClasses: Record<Priority, string> = {
    must: 'card-must',
    should: 'card-should',
    could: 'card-could',
    wont: 'card-wont',
};

export default function FunctionalityCard({ functionality, onMove }: FunctionalityCardProps) {
  const { text, justification, proposerUsername, priority, createdAt } = functionality;

  const handleMove = (newPriority: Priority) => {
    if (newPriority !== priority) {
        // For now, prompt for justification. Later, this could open the confirmation dialog.
        const moveJustification = prompt(`Moving "${text}" from ${priorityLabels[priority]} to ${priorityLabels[newPriority]}. Please provide a reason:`);
        if (moveJustification !== null) { // Check if user cancelled prompt
             onMove(newPriority, moveJustification || 'No justification provided.');
        }
    }
  };


  const formattedDate = createdAt?.toDate().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) || 'Date unavailable';

  return (
    <Card className={`mb-4 shadow-md ${categoryClasses[priority]}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
           <CardTitle className="text-base font-semibold leading-tight break-words">{text}</CardTitle>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 text-current">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Move to</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                    p !== priority && (
                        <DropdownMenuItem key={p} onClick={() => handleMove(p)}>
                         {priorityLabels[p]}
                        </DropdownMenuItem>
                    )
                    ))}
                </DropdownMenuContent>
             </DropdownMenu>
        </div>

      </CardHeader>
      <CardContent className="px-4 py-2">
        <CardDescription className="text-sm break-words flex items-start gap-1.5">
             <MessageSquareText className="h-4 w-4 mt-0.5 flex-shrink-0" />
             <span>{justification}</span>
        </CardDescription>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground px-4 pb-3 pt-1 flex justify-between items-center">
        <div className="flex items-center gap-1">
           <User className="h-3 w-3" />
           <span>{proposerUsername}</span>
        </div>
        <time dateTime={createdAt?.toDate().toISOString()}>{formattedDate}</time>
      </CardFooter>
    </Card>
  );
}
