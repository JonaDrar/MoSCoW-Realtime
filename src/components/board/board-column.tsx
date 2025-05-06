// src/components/board/board-column.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FunctionalityCard from './functionality-card';
import { BoardColumnProps, Priority } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl'; // Import useTranslations

const columnStyles: Record<Priority, string> = {
    must: 'column-must',
    should: 'column-should',
    could: 'column-could',
    wont: 'column-wont',
};

export default function BoardColumn({ title, priority, functionalities, onAddCard, onMoveCard }: BoardColumnProps) {
  const t = useTranslations('HomePage'); // Initialize translations

  return (
    <Card className={`flex flex-col h-full border-2 ${columnStyles[priority]} bg-card shadow-sm overflow-hidden`}>
       <CardHeader className="flex flex-row items-center justify-between p-4 border-b sticky top-0 bg-card z-10 flex-shrink-0">
         <CardTitle className="text-lg font-semibold text-card-foreground">{title}</CardTitle>
         <Button variant="ghost" size="icon" onClick={() => onAddCard(priority)} className="text-accent hover:text-accent-foreground hover:bg-accent/10 rounded-full">
           <Plus className="h-5 w-5" />
           <span className="sr-only">{t('addCardTooltip', { title })}</span>
         </Button>
       </CardHeader>

       {/* Explicitly set isDropDisabled, isCombineEnabled and ignoreContainerClipping to false to satisfy invariant checks */}
       <Droppable
            droppableId={priority}
            type="FUNCTIONALITY"
            isDropDisabled={false}
            isCombineEnabled={false}
            ignoreContainerClipping={false}
        >
         {(provided, snapshot) => {
           return (
             <ScrollArea
               className="flex-grow"
               style={{ backgroundColor: snapshot.isDraggingOver ? 'hsla(var(--accent)/0.1)' : 'transparent' }}
             >
               <CardContent
                 ref={provided.innerRef}
                 {...provided.droppableProps}
                 className="p-4 h-full min-h-[100px]"
               >
                 {functionalities.length === 0 && !snapshot.isDraggingOver && (
                   <p className="text-sm text-muted-foreground text-center py-4">
                     {t('dropPlaceholder')}
                   </p>
                 )}
                 {functionalities
                  .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)) // Maintain consistent order
                  .map((func, index) => (
                    <Draggable key={func.id} draggableId={func.id} index={index}>
                      {(providedDraggable, snapshotDraggable) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps}
                          className={cn(
                            'mb-4 transition-shadow duration-200 outline-none focus:outline-none',
                             snapshotDraggable.isDragging ? 'shadow-xl ring-2 ring-ring' : 'shadow-md'
                          )}
                           style={{
                            ...providedDraggable.draggableProps.style,
                            userSelect: 'none',
                          }}
                        >
                          <FunctionalityCard
                            functionality={func}
                            onMove={(newPriority) => onMoveCard(func.id, func.priority, newPriority)}
                          />
                        </div>
                      )}
                    </Draggable>
                 ))}
                 {provided.placeholder}
               </CardContent>
             </ScrollArea>
           );
           }}
       </Droppable>
     </Card>
  );
};
