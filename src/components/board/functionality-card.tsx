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

  // Simplified handleMove: just calls the passed onMove prop (which now opens the dialog)
  const handleMove = (newPriority: Priority) => {
    if (newPriority !== priority) {
        onMove(newPriority); // No justification prompt here
    }
  };


  const formattedDate = createdAt?.toDate().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) || 'Date unavailable';

  return (
    <Card className={`shadow-md border ${categoryClasses[priority]}`}> {/* Add border back for visual separation */}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start">
           <CardTitle className="text-base font-semibold leading-tight break-words mr-2">{text}</CardTitle> {/* Add margin-right */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {/* Make button slightly smaller and ensure it doesn't shrink */}
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-current rounded-full -mr-2 -mt-1">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Move to</DropdownMenuLabel>
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
        <CardDescription className="text-sm break-words flex items-start gap-1.5 text-current/80"> {/* Slightly muted description */}
             <MessageSquareText className="h-4 w-4 mt-0.5 flex-shrink-0" />
             <span>{justification}</span>
        </CardDescription>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground px-4 pb-3 pt-1 flex justify-between items-center">
        <div className="flex items-center gap-1">
           <User className="h-3 w-3" />
           <span>{proposerUsername || 'Unknown User'}</span> {/* Handle potential missing username */}
        </div>
        <time dateTime={createdAt?.toDate().toISOString()}>{formattedDate}</time>
      </CardFooter>
    </Card>
  );
}
