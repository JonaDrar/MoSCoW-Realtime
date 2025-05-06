// src/components/board/board-column.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FunctionalityCard from './functionality-card';
import { BoardColumnProps, Functionality, Priority } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable, Droppable } from 'react-beautiful-dnd';


const columnStyles: Record<Priority, string> = {
    must: 'column-must',
    should: 'column-should',
    could: 'column-could',
    wont: 'column-wont',
};

interface DragItemProps {
  functionality: Functionality;
  index: number;
  // Use the specific function name from Home for clarity
  onInitiateMove: (cardId: string, currentPriority: Priority, newPriority: Priority) => void;
}

const DragItem = ({ functionality, index, onInitiateMove }: DragItemProps) => {
  return (
    <Draggable draggableId={functionality.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-4 transition-shadow duration-200 ${snapshot.isDragging ? 'shadow-xl' : ''}`} // Add spacing and dragging shadow
        >
          <FunctionalityCard
            functionality={functionality}
            // Pass onInitiateMove down to the card for menu actions
            onMove={(newPriority) => onInitiateMove(functionality.id, functionality.priority, newPriority)}
          />
        </div>
      )}
    </Draggable>
  );
};

// Update props to use the clearer function name
export default function BoardColumn({ title, priority, functionalities, onAddCard, onMoveCard: onInitiateMove }: BoardColumnProps) {
  return (
    <Card className={`flex flex-col h-full border-2 ${columnStyles[priority]} bg-card shadow-sm overflow-hidden`}>
       {/* Header */}
       <CardHeader className="flex flex-row items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
         <CardTitle className="text-lg font-semibold text-card-foreground">{title}</CardTitle>
         <Button variant="ghost" size="icon" onClick={() => onAddCard(priority)} className="text-accent hover:text-accent-foreground hover:bg-accent/10 rounded-full">
           <Plus className="h-5 w-5" />
           <span className="sr-only">Add Functionality to {title}</span>
         </Button>
       </CardHeader>

       {/* Droppable Area */}
       <Droppable droppableId={priority} type="FUNCTIONALITY">
         {(provided, snapshot) => (
           <ScrollArea
             className="flex-grow"
             style={{ backgroundColor: snapshot.isDraggingOver ? 'hsla(var(--accent)/0.1)' : 'transparent' }} // Highlight on drag over
             >
             <CardContent
               ref={provided.innerRef}
               {...provided.droppableProps}
               className="p-4 space-y-0 h-full min-h-[100px]" // Remove default space-y, ensure min height
               >
               {functionalities.length === 0 && !snapshot.isDraggingOver && (
                 <p className="text-sm text-muted-foreground text-center py-4">
                   Drop cards here or click '+' to add.
                 </p>
               )}
               {functionalities.map((func, index) => (
                 <DragItem
                   key={func.id}
                   functionality={func}
                   index={index}
                   onInitiateMove={onInitiateMove} // Pass down the handler
                 />
               ))}
               {provided.placeholder}
             </CardContent>
           </ScrollArea>
         )}
       </Droppable>
     </Card>
  );
};
