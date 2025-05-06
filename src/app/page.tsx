// src/app/page.tsx
'use client';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useState, useEffect } from 'react';
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
import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd';

const priorities: Priority[] = ['must', 'should', 'could', 'wont'];
const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>('');
  const [functionalities, setFunctionalities] = useState<Functionality[]>([]);
  const [loading, setLoading] = useState(true); // Start loading by default
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialDialogPriority, setInitialDialogPriority] = useState<Priority>('must');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveToConfirm, setMoveToConfirm] = useState<{ cardId: string; currentPriority: Priority; newPriority: Priority; cardText: string} | null>(null);

  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true); // Separate loading state for logs


  // Effect for user authentication state
  useEffect(() => {
    // If user is not set (on initial load or after sign out), set loading to false
    // Only try fetching data if the user *is* logged in.
    if (!user) {
        setLoading(false);
        setLogLoading(false);
    }
  }, [user]);


  // Effect for fetching functionalities
  useEffect(() => {
    if (!user) return; // Don't fetch if user isn't registered yet

    setLoading(true); // Set loading true when starting to fetch
    const q = query(collection(db, 'functionalities'), orderBy('createdAt', 'asc')); // Order by creation time

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedFunctionalities: Functionality[] = [];
      querySnapshot.forEach((doc) => {
        fetchedFunctionalities.push({ id: doc.id, ...doc.data() } as Functionality);
      });
      setFunctionalities(fetchedFunctionalities);
      setLoading(false); // Set loading false after successful fetch
    }, (error) => {
        console.error("Error fetching functionalities: ", error);
        setLoading(false); // Set loading false even if there's an error
        // Handle error display to user if needed
    });

    return () => unsubscribe(); // Cleanup listener on unmount or user change
  }, [user]);

  // Effect for fetching change log
  useEffect(() => {
    if (!user) return; // Don't fetch if user isn't registered yet

    setLogLoading(true);
    const logQuery = query(collection(db, 'changeLog'), orderBy('timestamp', 'desc')); // Order by timestamp descending

    const unsubscribeLogs = onSnapshot(logQuery, (querySnapshot) => {
      const fetchedLogs: ChangeLogEntry[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ChangeLogEntry);
      });
      setChangeLog(fetchedLogs);
      setLogLoading(false);
    }, (error) => {
        console.error("Error fetching change log: ", error);
        setLogLoading(false); // Ensure loading is false on error
    });

    return () => unsubscribeLogs(); // Cleanup listener
  }, [user]); // Re-run if user changes


   const logChange = async (details: Omit<ChangeLogEntry, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'changeLog'), {
        ...details,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error("Error logging change:", error);
      // Consider adding user feedback about logging failure
    }
  };


  const handleUserRegistered = (loggedInUser: User, registeredUsername: string) => {
    setUser(loggedInUser);
    setUsername(registeredUsername);
    setLoading(true); // Set loading true while initial data fetches after login
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

      // Add the functionality
      const docRef = await addDoc(collection(db, 'functionalities'), newFunctionalityData);

       // Log the creation after getting the ID
       // Use the logChange function which adds to Firestore directly
      await logChange({
        functionalityId: docRef.id,
        functionalityText: text,
        userId: user.uid,
        username: username,
        changeType: 'created',
        toPriority: priority,
        justification: justification, // Log initial justification
      });

  };

  // Renamed from onMoveCard in BoardColumn props, opens the confirmation dialog
  const handleInitiateMove = (cardId: string, currentPriority: Priority, newPriority: Priority) => {
      const card = functionalities.find(f => f.id === cardId);
      if (!card) return;
      setMoveToConfirm({ cardId, currentPriority, newPriority, cardText: card.text });
      setIsMoveDialogOpen(true);
  };


  const handleConfirmMove = async (justification: string) => {
    if (!user || !moveToConfirm) throw new Error("Cannot move card.");

    const { cardId, currentPriority, newPriority, cardText } = moveToConfirm;

    const cardRef = doc(db, 'functionalities', cardId);

    // Use a batch write to update the card and add the log atomically
    const batch = writeBatch(db);

    batch.update(cardRef, {
        priority: newPriority,
        updatedAt: serverTimestamp(),
    });

    const logData: Omit<ChangeLogEntry, 'id' | 'timestamp'> = { // Use Omit here
        functionalityId: cardId,
        functionalityText: cardText, // Include text in log
        userId: user.uid,
        username: username,
        changeType: 'moved' as 'moved',
        fromPriority: currentPriority,
        toPriority: newPriority,
        justification: justification,
        // timestamp will be set by serverTimestamp in logChange or batch
    };
     const logRef = doc(collection(db, 'changeLog')); // Create ref for the log entry
     batch.set(logRef, { ...logData, timestamp: serverTimestamp() }); // Add timestamp in batch


    await batch.commit(); // Commit the batch

    setIsMoveDialogOpen(false); // Close dialog
    setMoveToConfirm(null); // Reset move state
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // If dropped outside a droppable area, do nothing
    if (!destination) return;

    const sourcePriority = source.droppableId as Priority;
    const destinationPriority = destination.droppableId as Priority;

    // If dropped in the same column (even if index changed), do nothing for now
    // Reordering within a column can be implemented separately if needed
    if (source.droppableId === destination.droppableId) return;

    // If dropped in a different column, open the confirmation dialog
    const movedFunctionality = functionalities.find(f => f.id === draggableId);
    if (movedFunctionality) {
        handleInitiateMove(draggableId, sourcePriority, destinationPriority);
        // Note: We don't update the local state here immediately.
        // The Firestore listener will update the state when the change is persisted.
    } else {
        console.error("Could not find dragged functionality with ID:", draggableId);
    }
  };

return (
  <div className="flex h-screen bg-muted/40">
    <main className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 overflow-hidden">
       <header className="mb-4 md:mb-6">
           <h1 className="text-3xl md:text-4xl font-bold text-gradient">MoSCoW Realtime</h1>
           {user && username && (
             <p className="text-muted-foreground mt-1">Welcome, {username}! Prioritize features collaboratively.</p>
           )}
       </header>

       {/* Show UserRegistration if not logged in and not loading */}
       {!loading && !user && (
          <div className="flex-grow flex items-center justify-center">
            <UserRegistration onUserRegistered={handleUserRegistered} />
          </div>
        )}

        {/* Show Loading Skeletons OR Board Columns */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 flex-grow overflow-hidden">
          {loading ? (
              // Skeleton Loading State
              priorities.map((p) => (
                <Card key={p} className="flex flex-col bg-card shadow-sm">
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
              ))
            ) : user ? (
              // Board Content - Only render if user is logged in and not loading
              <DragDropContext onDragEnd={onDragEnd}>
                  {priorities.map((priority) => (
                      <BoardColumn
                        key={priority}
                        title={priorityLabels[priority]}
                        priority={priority}
                        functionalities={functionalities.filter(
                          (f) => f.priority === priority
                        )}
                        onAddCard={handleOpenAddDialog}
                        // Pass handleInitiateMove which opens the dialog
                        onMoveCard={handleInitiateMove}
                      />
                  ))}
              </DragDropContext>
            ) : null /* Don't render columns if loading or not logged in */ }
        </div>
    </main>

    {/* Sidebar for Change Log - Only render if user is logged in */}
     {user && (
        <aside className="w-64 md:w-72 border-l bg-card p-0 hidden lg:flex flex-col">
             <h2 className="text-lg font-semibold p-4 border-b text-card-foreground">Change Log</h2>
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

    <Toaster />
  </div>
);
}
