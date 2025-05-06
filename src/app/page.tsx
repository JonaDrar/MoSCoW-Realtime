// src/app/[locale]/page.tsx
'use client';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UserRegistration from '@/components/auth/user-registration';
import BoardColumn from '@/components/board/board-column';
import AddFunctionalityDialog from '@/components/board/add-functionality-dialog';
import ChangeLog from '@/components/board/change-log';
import { Functionality, Priority, ChangeLogEntry } from '@/components/board/types';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';
import MoveConfirmationDialog from '@/components/board/move-confirmation-dialog';
import MoSCowExplanationDialog from '@/components/board/moscow-explanation-dialog';
import { DragDropContext, DropResult, Droppable, Draggable } from 'react-beautiful-dnd';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import FunctionalityCard from "@/components/board/functionality-card";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/language-switcher';
import { ThemeToggle } from "@/components/theme-toggle"; // Import ThemeToggle

const priorities: Priority[] = ['must', 'should', 'could', 'wont'];

// Styles for accordion trigger based on priority
const columnTriggerStyles: Record<Priority, string> = {
    must: 'border-l-4 border-[hsl(var(--moscow-must-border))] hover:bg-[hsl(var(--moscow-must-bg))]',
    should: 'border-l-4 border-[hsl(var(--moscow-should-border))] hover:bg-[hsl(var(--moscow-should-bg))]',
    could: 'border-l-4 border-[hsl(var(--moscow-could-border))] hover:bg-[hsl(var(--moscow-could-bg))]',
    wont: 'border-l-4 border-[hsl(var(--moscow-wont-border))] hover:bg-[hsl(var(--moscow-wont-bg))]',
};

// Reusable DragItem component
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
          {...provided.dragHandleProps}
          className={cn(
            'mb-2 transition-shadow duration-200 outline-none focus:outline-none select-none', // Added select-none here
            snapshot.isDragging ? 'shadow-xl ring-2 ring-ring' : 'shadow-md'
          )}
          style={{
            ...provided.draggableProps.style,
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
  const t = useTranslations();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialDialogPriority, setInitialDialogPriority] = useState<Priority>('must');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [moveToConfirm, setMoveToConfirm] = useState<{ cardId: string; currentPriority: Priority; newPriority: Priority; cardText: string} | null>(null);
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const priorityLabels: Record<Priority, string> = {
    must: t('Priorities.must'),
    should: t('Priorities.should'),
    could: t('Priorities.could'),
    wont: t('Priorities.wont'),
  };

  useEffect(() => {
    // Prevent hydration errors by ensuring client-side only execution
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
    if (!user || !isClient) return; // Only run on client and when user is logged in

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
            title: t('HomePage.fetchErrorTitle'),
            description: t('HomePage.fetchErrorDescription'),
            variant: 'destructive',
        });
    });

    return () => unsubscribe();
  }, [user, toast, t, isClient]); // Added isClient dependency

  useEffect(() => {
    if (!user || !isClient) return; // Only run on client and when user is logged in

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
            title: t('HomePage.logErrorTitle'),
            description: t('HomePage.logErrorDescription'),
            variant: 'destructive',
        });
    });

    return () => unsubscribeLogs();
  }, [user, toast, t, isClient]); // Added isClient dependency

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
        justification: justification,
    };
     const logRef = doc(collection(db, 'changeLog'));
     batch.set(logRef, { ...logData, timestamp: serverTimestamp() });

     try {
       await batch.commit();
       toast({
          title: t('AddFunctionalityDialog.successToastTitle'),
          description: t('AddFunctionalityDialog.successToastDescription', { text: text, priorityLabel: priorityLabels[priority] }),
       });
     } catch (error) {
         console.error("Error adding functionality or logging change:", error);
         toast({
            title: t('AddFunctionalityDialog.errorToastTitle'),
            description: t('AddFunctionalityDialog.errorToastDescription'),
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
                title: t('MoveConfirmationDialog.moveErrorTitle'),
                description: t('MoveConfirmationDialog.moveErrorFindItem'),
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
            title: t('MoveConfirmationDialog.moveErrorTitle'),
            description: t('MoveConfirmationDialog.moveErrorMissingInfo'),
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
        justification: justification,
    };
     const logRef = doc(collection(db, 'changeLog'));
     batch.set(logRef, { ...logData, timestamp: serverTimestamp() });

    try {
        await batch.commit();
        toast({
            title: t('MoveConfirmationDialog.successToastTitle'),
            description: t('MoveConfirmationDialog.successToastDescription', {
              cardText: cardText,
              currentPriorityLabel: priorityLabels[currentPriority],
              newPriorityLabel: priorityLabels[newPriority]
            }),
        });
    } catch(error) {
        console.error("Error moving card or logging change:", error);
        toast({
            title: t('MoveConfirmationDialog.errorToastTitle'),
            description: t('MoveConfirmationDialog.errorToastDescription'),
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

        if (!destination) {
            return;
        }

        const sourcePriority = source.droppableId as Priority;
        const destinationPriority = destination.droppableId as Priority;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (source.droppableId !== destination.droppableId) {
            if (!functionalities || functionalities.length === 0) {
                console.error("onDragEnd: Functionalities array is empty or undefined. Cannot find card.");
                toast({
                    title: t('HomePage.dragErrorTitle'),
                    description: t('HomePage.dragErrorBoardItems'),
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
                    title: t('HomePage.dragErrorTitle'),
                    description: t('HomePage.dragErrorFindItem'),
                    variant: 'destructive',
                });
            }
        } else {
            // Reordering within the same column
            console.log(t('HomePage.reorderLog'));
            // Note: Reordering within the same column is not persisted.
            // To persist, update item order in Firestore (requires adding an 'order' field).
            // For now, we just reorder locally for visual feedback during the drag session.
            const items = Array.from(functionalities.filter(f => f.priority === sourcePriority));
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);

            // Update local state (this won't persist unless you save to DB)
            // This local update can cause flickering if DB update is slow or fails.
            // It's often better to rely solely on Firestore snapshots for updates.
            /*
            setFunctionalities(prev => {
              const otherItems = prev.filter(f => f.priority !== sourcePriority);
              return [...otherItems, ...items];
            });
            */
        }
    };


  const renderBoardContent = () => {
     if (!isClient) {
      // Render skeleton or nothing on the server/before client mount
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

    if (loading) {
        // Show skeletons while data is loading on the client
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

    if (!user) {
        // UserRegistration component takes full screen, so nothing else needs to be rendered here.
        return null;
    }

     // Render the board only on the client after hydration and data loaded
     return (
        <DragDropContext onDragEnd={onDragEnd}>
            {isMobile ? (
                <Accordion type="multiple" className="w-full p-4 space-y-2">
                    {priorities.map((priority) => (
                        <AccordionItem value={priority} key={priority} className="border bg-card rounded-md shadow-sm">
                            <AccordionTrigger className={cn("flex justify-between items-center p-4 font-semibold text-sm hover:no-underline", columnTriggerStyles[priority])}>
                                <div className="flex justify-between items-center w-full">
                                   <span>{priorityLabels[priority]} ({functionalities.filter(f => f.priority === priority).length})</span>
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleOpenAddDialog(priority); }} className="h-7 w-7 text-accent hover:text-accent-foreground hover:bg-accent/10 rounded-full -mr-2">
                                        <Plus className="h-4 w-4" />
                                        <span className="sr-only">{t('HomePage.mobileAddCardTooltip', { title: priorityLabels[priority] })}</span>
                                    </Button>
                                </div>

                            </AccordionTrigger>
                             <AccordionContent className="border-t">
                                <Droppable droppableId={priority} type="FUNCTIONALITY" isDropDisabled={false} isCombineEnabled={false} ignoreContainerClipping={false}>
                                    {(provided, snapshot) => (
                                        <ScrollArea
                                            className="flex-grow max-h-60"
                                            style={{ backgroundColor: snapshot.isDraggingOver ? 'hsla(var(--accent)/0.1)' : 'transparent' }}
                                        >
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="p-4 space-y-2 min-h-[50px]"
                                            >
                                                {functionalities.filter(f => f.priority === priority).length === 0 && !snapshot.isDraggingOver && (
                                                   <p className="text-xs text-muted-foreground text-center py-2">
                                                     {t('HomePage.dropPlaceholder')}
                                                   </p>
                                                )}
                                                {functionalities
                                                    .filter((f) => f.priority === priority)
                                                    .sort((a, b) => (a.createdAt?.toMillis() ?? 0) - (b.createdAt?.toMillis() ?? 0)) // Consistent order
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
                            onMoveCard={handleInitiateMove}
                        />
                    ))}
                </div>
            )}
        </DragDropContext>
    );
  };


  return (
    <div className="flex flex-col md:flex-row h-screen bg-muted/40 overflow-hidden">
      {/* Render UserRegistration if user is not logged in and client is ready */}
       {!loading && !user && isClient && (
          <UserRegistration onUserRegistered={handleUserRegistered} />
       )}

      {/* Render the main board and sidebar only if user is logged in */}
       {user && isClient && (
         <>
           <main className={cn(
                "flex-1 flex flex-col overflow-hidden",
                // Add padding only when user is logged in, as UserRegistration handles its own layout
                "p-4 md:p-6 lg:p-8"
            )}>
              <header className="mb-4 md:mb-6 flex-shrink-0 flex justify-between items-center flex-wrap gap-2">
                 <div className="flex-grow min-w-0">
                    <h1 className="text-3xl md:text-4xl font-bold text-gradient truncate">{t('App.title')}</h1>
                    {username && (
                      <p className="text-muted-foreground mt-1 text-sm md:text-base">{t('HomePage.welcomeMessage', { username: username })}</p>
                    )}
                 </div>
                 {/* Container for Buttons */}
                 <div className="flex items-center gap-2 flex-shrink-0">
                     <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setIsExplanationOpen(true)}
                     >
                         <Info className="h-4 w-4 mr-2" />
                         {t('HomePage.moscowExplanationButton')}
                     </Button>
                      <LanguageSwitcher />
                      <ThemeToggle /> {/* Add ThemeToggle button */}
                 </div>
              </header>

              <div className="flex-grow overflow-y-auto">
                  {renderBoardContent()}
              </div>
           </main>

           <aside className={cn(
               "border-t md:border-t-0 md:border-l bg-card flex-shrink-0 flex flex-col",
               isMobile
                  ? "fixed bottom-0 left-0 right-0 h-48 z-20 transition-transform duration-300 ease-in-out transform translate-y-full peer-checked:translate-y-0" // Example class for bottom sheet
                  : "relative md:w-64 lg:w-72" // Desktop sidebar
           )}>
                 {/* Checkbox or state to control mobile sheet visibility */}
                 {isMobile && (
                    <input type="checkbox" id="sheet-toggle" className="peer hidden" />
                 )}
                 <label htmlFor="sheet-toggle" className={cn(
                    "md:hidden p-2 text-center bg-card border-t cursor-pointer select-none",
                     // Simple handle for now
                     "w-8 h-1 bg-border rounded-full mx-auto my-2"
                 )}>
                     {/* Drag Handle Visual */}
                 </label>

                  <div className={cn(
                      "flex flex-col flex-grow",
                      isMobile ? "overflow-hidden" : "" // Allow scrolling only on desktop initially
                  )}>
                     <h2 className="text-lg font-semibold p-4 border-b text-card-foreground hidden md:block">{t('ChangeLog.title')}</h2>
                     <ChangeLog logs={changeLog} loading={logLoading} />
                 </div>
           </aside>
         </>
       )}

      {/* Dialogs rendered outside the conditional user block to ensure they are always in the DOM if needed */}
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
