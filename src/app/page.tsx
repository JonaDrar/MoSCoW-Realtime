// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UserRegistration from '@/components/auth/user-registration';
import BoardColumn from '@/components/board/board-column';
import AddFunctionalityDialog from '@/components/board/add-functionality-dialog';
import MoveConfirmationDialog from '@/components/board/move-confirmation-dialog';
import ChangeLog from '@/components/board/change-log';
import { Functionality, Priority, ChangeLogEntry } from '@/components/board/types';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';


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
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [initialDialogPriority, setInitialDialogPriority] = useState<Priority>('must');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [moveToConfirm, setMoveToConfirm] = useState<{ cardId: string; currentPriority: Priority; newPriority: Priority; cardText: string} | null>(null);


  useEffect(() => {
    if (!user) return; // Don't fetch if user isn't registered yet

    setLoading(true);
    const q = query(collection(db, 'functionalities'), orderBy('createdAt', 'asc')); // Order by creation time

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
        // Handle error display to user if needed
    });

    return () => unsubscribe(); // Cleanup listener on unmount or user change
  }, [user]);

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

  const handleOpenMoveDialog = (cardId: string, currentPriority: Priority, newPriority: Priority) => {
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

    const logData = {
        functionalityId: cardId,
        functionalityText: cardText, // Include text in log
        userId: user.uid,
        username: username,
        changeType: 'moved' as 'moved',
        fromPriority: currentPriority,
        toPriority: newPriority,
        justification: justification,
        timestamp: serverTimestamp() // Firestore handles this on the server
    };
     const logRef = doc(collection(db, 'changeLog')); // Create ref for the log entry
     batch.set(logRef, logData);


    await batch.commit(); // Commit the batch

    setMoveToConfirm(null); // Reset move state
  };

  if (!user) {
    return (
      <>
        <UserRegistration onUserRegistered={handleUserRegistered} />
        <Toaster />
      </>
      );
  }

  return (
    <div className="flex h-screen bg-muted/40">
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
         <header className="mb-4">
             <h1 className="text-3xl font-bold text-gradient">MoSCoW Realtime</h1>
             <p className="text-muted-foreground">Welcome, {username}! Prioritize features collaboratively.</p>
         </header>
         {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
                {priorities.map((p) => (
                    <Card key={p} className="flex flex-col">
                         <CardHeader className="p-4 border-b">
                            <Skeleton className="h-6 w-3/4" />
                         </CardHeader>
                         <CardContent className="p-4 space-y-4 flex-grow">
                             <Skeleton className="h-24 w-full" />
                             <Skeleton className="h-20 w-full" />
                             <Skeleton className="h-28 w-full" />
                         </CardContent>
                    </Card>
                ))}
             </div>
         ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow min-h-0"> {/* Ensure grid takes remaining space and allows scrolling */}
            {priorities.map((priority) => (
            <BoardColumn
                key={priority}
                title={priorityLabels[priority]}
                priority={priority}
                functionalities={functionalities.filter((f) => f.priority === priority)}
                onAddCard={handleOpenAddDialog}
                 onMoveCard={handleOpenMoveDialog} // Use the function that opens the dialog
            />
            ))}
        </div>
         )}
      </main>
       <aside className="w-72 border-l p-0 hidden lg:block"> {/* Adjust width as needed */}
            <ChangeLog />
       </aside>


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
