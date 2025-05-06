// src/app/page.tsx
'use client';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import React, { useState, useEffect } from 'react'; // Import React
import type { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UserRegistration from '@/components/auth/user-registration';
import BoardColumn from '@/components/board/board-column';
import AddFunctionalityDialog from '@/components/board/add-functionality-dialog';
import ChangeLog from '@/components/board/change-log';
import { Functionality, Priority, ChangeLogEntry } from '@/components/board/types';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';
import MoveConfirmationDialog from '@/components/board/move-confirmation-dialog';
import MoSCowExplanationDialog from '@/components/board/moscow-explanation-dialog'; // Import the new component
import { DragDropContext, DropResult, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components
import { Button } from "@/components/ui/button"; // Import Button
import { Plus, Info } from "lucide-react"; // Import Plus and Info icons
import FunctionalityCard from "@/components/board/functionality-card"; // Import FunctionalityCard
import { cn } from "@/lib/utils"; // Import cn utility
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

const priorities: Priority[] = ['must', 'should', 'could', 'wont'];
const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

// Styles for accordion trigger based on priority
const columnTriggerStyles: Record<Priority, string> = {
    must: 'border-l-4 border-[hsl(var(--moscow-must-border))] hover:bg-[hsl(var(--moscow-must-bg))]',
    should: 'border-l-4 border-[hsl(var(--moscow-should-border))] hover:bg-[hsl(var(--moscow-should-bg))]',
    could: 'border-l-4 border-[hsl(var(--moscow-could-border))] hover:bg-[hsl(var(--moscow-could-bg))]',
    wont: 'border-l-4 border-[hsl(var(--moscow-wont-border))] hover:bg-[hsl(var(--moscow-wont-bg))]',
};

// Reusable DragItem component for both grid and accordion views
interface DragItemProps {
  functionality: Functionality;
  index: number;
  onInitiateMove: (cardId: string, currentPriority: Priority, newPriority: Priority) => void;
}

const DragItem = React.memo(({ functionality, index, onInitiateMove }: DragItemProps) => {
  return (
    <Draggable draggableId={functionality.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps} // Apply drag handle here
          className={cn(
            'mb-2 transition-shadow duration-200 outline-none focus:outline-none', // Use mb-2 for tighter mobile list
            snapshot.isDragging ? 'shadow-xl ring-2 ring-ring' : 'shadow-md'
          )}
          style={{
            ...provided.draggableProps.style,
            userSelect: 'none', // Prevent text selection during drag
          }}
        >
          <FunctionalityCard
            functionality={functionality}
            onMove={(newPriority) => onInitiateMove(functionality.id, functionality.priority, newPriority)}
          />
        </div>
      )}
    </Draggable>
  );
});
DragItem.displayName = 'DragItem';


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialDialogPriority, setInitialDialogPriority] = useState<Priority>('must');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false); // State for explanation dialog
  const [isClient, setIsClient] = useState(false);
  const [moveToConfirm, setMoveToConfirm] = useState<{ cardId: string; currentPriority: Priority; newPriority: Priority; cardText: string} | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile(); // Use the hook to check screen size

  useEffect(() => {
    // Ensure this code only runs on the client
    if (typeof window !== 'undefined') {
      setIsClient(true);
    }
  }, []);


  useEffect(() => {
    if (!user) {
        setLoading(false);
        setLogLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, 'functionalities'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedFunctionalities: Functionality[] = [];
      querySnapshot.forEach((doc) => {
        fetchedFunctionalities.push({ id: doc.id, ...doc.data() } as Functionality);
      });
      setFunctionalities(fetchedFunctionalities);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching functionalities: ", error);
        setLoading(false);
        toast({
            title: 'Error Fetching Functionalities',
            description: 'Could not load board items. Please try again later.',
            variant: 'destructive',
        });
    });

    return () => unsubscribe();
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    setLogLoading(true);
    const logQuery = query(collection(db, 'changeLog'), orderBy('timestamp', 'desc'));

    const unsubscribeLogs = onSnapshot(logQuery, (querySnapshot) => {
      const fetchedLogs: ChangeLogEntry[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.timestamp) {
          fetchedLogs.push({ id: doc.id, ...data } as ChangeLogEntry);
        } else {
          console.warn(`Log entry ${doc.id} is missing timestamp.`);
        }
      });
      setChangeLog(fetchedLogs);
      setLogLoading(false);
    }, (error) => {
        console.error("Error fetching change log: ", error);
        setLogLoading(false);
         toast({
            title: 'Error Fetching Change Log',
            description: 'Could not load activity feed. Please try again later.',
            variant: 'destructive',
        });
    });

    return () => unsubscribeLogs();
  }, [user, toast]);

  const handleUserRegistered = (loggedInUser: User, registeredUsername: string) => {
    setUser(loggedInUser);
    setUsername(registeredUsername);
    setLoading(true);
    setLogLoading(true);
  };

  const handleOpenAddDialog = (priority: Priority) => {
    setInitialDialogPriority(priority);
    setIsAddDialogOpen(true);
  };

  const handleAddFunctionality = async (text: string, justification: string, priority: Priority) => {
     if (!user) throw new Error("User not authenticated.");

     const newFunctionalityData = {
        text,
        justification,
        priority,
        proposerId: user.uid,
        proposerUsername: username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
     }

     const batch = writeBatch(db);
     const functionalityRef = doc(collection(db, 'functionalities'));
     batch.set(functionalityRef, newFunctionalityData);

     const logData: Omit<ChangeLogEntry, 'id' | 'timestamp'> = {
        functionalityId: functionalityRef.id,
        functionalityText: text,
        userId: user.uid,
        username: username,
        changeType: 'created' as 'created',
        toPriority: priority,
        justification: justification, // Include justification in log
    };
     const logRef = doc(collection(db, 'changeLog'));
     batch.set(logRef, { ...logData, timestamp: serverTimestamp() });

     try {
       await batch.commit();
       toast({
          title: 'Functionality Added',
          description: `"${text}" was added to ${priorityLabels[priority]}.`,
       });
     } catch (error) {
         console.error("Error adding functionality or logging change:", error);
         toast({
            title: 'Action Failed',
            description: 'Could not add the functionality or log the change. Please try again.',
            variant: 'destructive',
         });
         throw error;
     }
  };

  const handleInitiateMove = (cardId: string, currentPriority: Priority, newPriority: Priority) => {
      const card = functionalities.find(f => f.id === cardId);
      if (!card) {
           console.error(`handleInitiateMove: Could not find card with ID: ${cardId}`);
           toast({
                title: 'Move Error',
                description: 'Could not find the item to move.',
                variant: 'destructive',
           });
           return;
      }
      setMoveToConfirm({ cardId, currentPriority, newPriority, cardText: card.text });
      setIsMoveDialogOpen(true);
  };

  const handleConfirmMove = async (justification: string) => {
    if (!user || !moveToConfirm) {
        console.error("handleConfirmMove: Cannot move card. User or moveToConfirm state is missing.", {user, moveToConfirm});
         toast({
            title: 'Move Error',
            description: 'Cannot complete the move. Missing required information.',
            variant: 'destructive',
        });
        setIsMoveDialogOpen(false);
        setMoveToConfirm(null);
        return;
    }

    const { cardId, currentPriority, newPriority, cardText } = moveToConfirm;
    const cardRef = doc(db, 'functionalities', cardId);
    const batch = writeBatch(db);

    batch.update(cardRef, {
        priority: newPriority,
        updatedAt: serverTimestamp(),
    });

    const logData: Omit<ChangeLogEntry, 'id' | 'timestamp'> = {
        functionalityId: cardId,
        functionalityText: cardText,
        userId: user.uid,
        username: username,
        changeType: 'moved' as 'moved',
        fromPriority: currentPriority,
        toPriority: newPriority,
        justification: justification, // Include justification in log
    };
     const logRef = doc(collection(db, 'changeLog'));
     batch.set(logRef, { ...logData, timestamp: serverTimestamp() });

    try {
        await batch.commit();
        toast({
            title: 'Card Moved',
            description: `"${cardText}" moved from ${priorityLabels[currentPriority]} to ${priorityLabels[newPriority]}.`,
        });
    } catch(error) {
        console.error("Error moving card or logging change:", error);
        toast({
            title: 'Action Failed',
            description: 'Could not move the card or log the change. Please try again.',
            variant: 'destructive',
        });
        throw error;
    } finally {
        setIsMoveDialogOpen(false);
        setMoveToConfirm(null);
    }
  };

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        // If dropped outside of any droppable area, do nothing
        if (!destination) {
            return;
        }

        const sourcePriority = source.droppableId as Priority;
        const destinationPriority = destination.droppableId as Priority;

        // If dropped in the same column and same position, do nothing
        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        // If dropped in a different column
        if (source.droppableId !== destination.droppableId) {
            if (!functionalities || functionalities.length === 0) {
                console.error("onDragEnd: Functionalities array is empty or undefined. Cannot find card.");
                toast({
                    title: 'Drag Error',
                    description: 'Board items are not loaded. Cannot move card.',
                    variant: 'destructive',
                });
                return;
            }

            const movedFunctionality = functionalities.find(f => f.id === draggableId);

            if (movedFunctionality) {
                handleInitiateMove(draggableId, sourcePriority, destinationPriority);
            } else {
                console.error(`Could not find dragged functionality with ID: ${draggableId}. Functionalities list:`, functionalities);
                toast({
                    title: 'Drag Error',
                    description: 'Could not find the item you tried to move.',
                    variant: 'destructive',
                });
            }
        } else {
            // If dropped in the same column, but different position (reordering - currently not implemented fully)
            // For now, we just log it or do nothing as reordering persistence is not implemented
            console.log('Reordering within the same column - not fully implemented');
            // To fully implement reordering, you would need to update the 'order' or 'createdAt'
            // of the items within the same priority based on the source and destination index.
            // This often requires adding an 'order' field to your Firestore documents.
        }
    };


  const renderBoardContent = () => {
    if (loading) {
      // Skeleton Loading State for both mobile and desktop
      return isMobile ? (
        <div className="space-y-2 p-4">
          {priorities.map(p => <Skeleton key={p} className="h-12 w-full rounded-md" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-grow overflow-hidden min-h-0">
          {priorities.map((p) => (
            <Card key={p} className="flex flex-col bg-card shadow-sm min-h-[300px]">
              <CardHeader className="p-4 border-b flex flex-row justify-between items-center">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardHeader>
              <CardContent className="p-4 space-y-4 flex-grow overflow-y-auto">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-28 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!user || !isClient) {
        return null; // Don't render anything if not logged in or not on client
    }

     // Use DragDropContext here, wrapping the conditional rendering
     return (
        <DragDropContext onDragEnd={onDragEnd}>
            {isMobile ? (
                // Accordion Layout for Mobile
                <Accordion type="multiple" className="w-full p-4 space-y-2">
                    {priorities.map((priority) => (
                        <AccordionItem value={priority} key={priority} className="border bg-card rounded-md shadow-sm">
                            <AccordionTrigger className={cn("flex justify-between items-center p-4 font-semibold text-sm hover:no-underline", columnTriggerStyles[priority])}>
                                <div className="flex justify-between items-center w-full">
                                   <span>{priorityLabels[priority]} ({functionalities.filter(f => f.priority === priority).length})</span>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenAddDialog(priority); }} className="h-7 w-7 text-accent hover:text-accent-foreground hover:bg-accent/10 rounded-full -mr-2">
                                        <Plus className="h-4 w-4" />
                                        <span className="sr-only">Add to {priorityLabels[priority]}</span>
                                    </Button>
                                </div>

                            </AccordionTrigger>
                             <AccordionContent className="border-t">
                                {/* Droppable area inside accordion */}
                                <Droppable droppableId={priority} type="FUNCTIONALITY">
                                    {(provided, snapshot) => (
                                        <ScrollArea
                                            className="flex-grow max-h-60" // Limit height and allow scroll
                                            style={{ backgroundColor: snapshot.isDraggingOver ? 'hsla(var(--accent)/0.1)' : 'transparent' }}
                                        >
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="p-4 space-y-2 min-h-[50px]" // Add min-height
                                            >
                                                {functionalities.filter(f => f.priority === priority).length === 0 && !snapshot.isDraggingOver && (
                                                   <p className="text-xs text-muted-foreground text-center py-2">
                                                     Drop cards here or click '+' to add.
                                                   </p>
                                                )}
                                                {functionalities
                                                    .filter((f) => f.priority === priority)
                                                     // Sort by createdAt to maintain order consistency
                                                    .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0))
                                                    .map((func, index) => (
                                                        <DragItem
                                                            key={func.id}
                                                            functionality={func}
                                                            index={index}
                                                            onInitiateMove={handleInitiateMove}
                                                        />
                                                    ))}
                                                {provided.placeholder}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </Droppable>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                // Grid Layout for Desktop
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-grow overflow-hidden min-h-0">
                    {priorities.map((priority) => (
                        <BoardColumn
                            key={priority}
                            title={priorityLabels[priority]}
                            priority={priority}
                            functionalities={functionalities.filter(
                                (f) => f.priority === priority
                            )}
                            onAddCard={handleOpenAddDialog}
                            onMoveCard={handleInitiateMove} // Pass handleInitiateMove directly
                        />
                    ))}
                </div>
            )}
        </DragDropContext>
    );
  };


  return (
    <div className="flex flex-col md:flex-row h-screen bg-muted/40 overflow-hidden"> {/* Prevent outer scroll */}
      {/* Main content area */}
       <main className="flex-1 flex flex-col p-0 md:p-6 lg:p-8 overflow-hidden"> {/* Remove padding on mobile */}
         {/* Header */}
         <header className="mb-0 md:mb-6 p-4 md:p-0 flex-shrink-0 flex justify-between items-center"> {/* Added flex justify-between */}
            <div>
               <h1 className="text-3xl md:text-4xl font-bold text-gradient">MoSCoW Realtime</h1>
               {user && username && (
                 <p className="text-muted-foreground mt-1 text-sm md:text-base">Welcome, {username}! Prioritize features collaboratively.</p>
               )}
            </div>
            {/* Add MoSCoW Explanation Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExplanationOpen(true)}
                className="ml-4"
            >
                <Info className="h-4 w-4 mr-2" />
                What is MoSCoW?
            </Button>
         </header>

         {/* Show UserRegistration if not logged in and not loading */}
         {!loading && !user && (
            <div className="flex-grow flex items-center justify-center p-4">
              <UserRegistration onUserRegistered={handleUserRegistered} />
            </div>
          )}

           {/* Container for Board Content (either grid or accordion) */}
           {/* Use flex-grow and overflow-y-auto for scrolling */}
           <div className="flex-grow overflow-y-auto">
              {renderBoardContent()}
           </div>
      </main>

      {/* Sidebar for Change Log */}
       {user && (
          <aside className={cn(
              "border-t md:border-t-0 md:border-l bg-card flex-shrink-0 flex flex-col",
              // Mobile: Fixed height at bottom, takes full width, slight initial collapse ability
              "fixed bottom-0 left-0 right-0 h-48 md:h-auto md:relative md:w-64 lg:w-72 z-20 transition-height duration-300 ease-in-out", // Ensure sidebar is above content on mobile
              // Add state for potential resizing/collapsing later if needed
          )}>
               <h2 className="text-lg font-semibold p-4 border-b text-card-foreground hidden md:block">Change Log</h2>
               {/* Mobile: Add a handle or indicator */}
               <div className="md:hidden w-8 h-1 bg-border rounded-full mx-auto mt-2 mb-1 cursor-grab active:cursor-grabbing"></div>
               <ChangeLog logs={changeLog} loading={logLoading} />
          </aside>
       )}

      <AddFunctionalityDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddFunctionality}
        initialPriority={initialDialogPriority}
      />

       <MoveConfirmationDialog
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        onConfirm={handleConfirmMove}
        cardText={moveToConfirm?.cardText || ''}
        currentPriority={moveToConfirm?.currentPriority || 'must'}
        newPriority={moveToConfirm?.newPriority || 'must'}
      />

       <MoSCowExplanationDialog
         isOpen={isExplanationOpen}
         onClose={() => setIsExplanationOpen(false)}
       />

      <Toaster />
    </div>
  );
}
