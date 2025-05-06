// src/components/board/board-column.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import FunctionalityCard from './functionality-card';
import { BoardColumnProps, Functionality, Priority } from './types'; // Import types
import { ScrollArea } from '@/components/ui/scroll-area';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { cn } from '@/lib/utils';

const columnStyles: Record<Priority, string> = {
    must: 'column-must',
    should: 'column-should',
    could: 'column-could',
    wont: 'column-wont',
};

// Reusable DragItem component - moved to page.tsx for central use
// interface DragItemProps {
//   functionality: Functionality;
//   index: number;
//   onInitiateMove: (cardId: string, currentPriority: Priority, newPriority: Priority) => void;
// }

// const DragItem = React.memo(({ functionality, index, onInitiateMove }: DragItemProps) => {
//   return (
//     <Draggable draggableId={functionality.id} index={index}>
//       {(provided, snapshot) => (
//         <div
//           ref={provided.innerRef}
//           {...provided.draggableProps}
//           {...provided.dragHandleProps}
//           className={cn(
//               'mb-4 transition-shadow duration-200 outline-none focus:outline-none',
//                snapshot.isDragging ? 'shadow-xl ring-2 ring-ring' : 'shadow-md'
//           )}
//            style={{
//             ...provided.draggableProps.style,
//             userSelect: 'none',
//           }}
//         >
//           <FunctionalityCard
//             functionality={functionality}
//             onMove={(newPriority) => onInitiateMove(functionality.id, functionality.priority, newPriority)}
//           />
//         </div>
//       )}
//     </Draggable>
//   );
// });
// DragItem.displayName = 'DragItem';


export default function BoardColumn({ title, priority, functionalities, onAddCard, onMoveCard }: BoardColumnProps) {

  return (
    <Card className={`flex flex-col h-full border-2 ${columnStyles[priority]} bg-card shadow-sm overflow-hidden`}>
       <CardHeader className="flex flex-row items-center justify-between p-4 border-b sticky top-0 bg-card z-10 flex-shrink-0">
         <CardTitle className="text-lg font-semibold text-card-foreground">{title}</CardTitle>
         <Button variant="ghost" size="icon" onClick={() => onAddCard(priority)} className="text-accent hover:text-accent-foreground hover:bg-accent/10 rounded-full">
           <Plus className="h-5 w-5" />
           <span className="sr-only">Add Functionality to {title}</span>
         </Button>
       </CardHeader>

       {/* Droppable Area */}
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
                 className="p-4 h-full min-h-[100px]" // Ensure padding and min height
               >
                 {functionalities.length === 0 && !snapshot.isDraggingOver && (
                   <p className="text-sm text-muted-foreground text-center py-4">
                     Drop cards here or click '+' to add.
                   </p>
                 )}
                 {/* Use Draggable directly here */}
                 {functionalities.map((func, index) => (
                    <Draggable key={func.id} draggableId={func.id} index={index}>
                      {(providedDraggable, snapshotDraggable) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                          {...providedDraggable.dragHandleProps} // Apply drag handle here
                          className={cn(
                            'mb-4 transition-shadow duration-200 outline-none focus:outline-none', // Ensure no outline interferes, explicit focus removal
                             snapshotDraggable.isDragging ? 'shadow-xl ring-2 ring-ring' : 'shadow-md' // Apply shadow normally, enhance on drag
                          )}
                           style={{
                            ...providedDraggable.draggableProps.style, // Apply styles from react-beautiful-dnd
                            userSelect: 'none', // Prevent text selection during drag
                          }}
                        >
                          <FunctionalityCard
                            functionality={func}
                            // Pass onMoveCard (which is handleInitiateMove) down to the card
                            onMove={(newPriority) => onMoveCard(func.id, func.priority, newPriority)}
                          />
                        </div>
                      )}
                    </Draggable>
                 ))}
                 {provided.placeholder /* Essential for react-beautiful-dnd */}
               </CardContent>
             </ScrollArea>
           );
           }}
       </Droppable>
     </Card>
  );
};
