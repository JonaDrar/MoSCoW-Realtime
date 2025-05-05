// src/components/board/types.ts
import type { Timestamp } from 'firebase/firestore';

export type Priority = 'must' | 'should' | 'could' | 'wont';

export interface Functionality {
  id: string;
  text: string;
  justification: string;
  proposerId: string;
  proposerUsername: string;
  priority: Priority;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Add fields for voting/approval if needed later
}

export interface BoardColumnProps {
  title: string;
  priority: Priority;
  functionalities: Functionality[];
  onAddCard: (priority: Priority) => void;
  onMoveCard: (cardId: string, currentPriority: Priority, newPriority: Priority, justification: string) => void;
}

export interface FunctionalityCardProps {
  functionality: Functionality;
  onMove: (newPriority: Priority, justification: string) => void;
}

export interface AddFunctionalityDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (text: string, justification: string, priority: Priority) => Promise<void>; // Make onAdd async
    initialPriority: Priority;
}

export interface MoveConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (justification: string) => Promise<void>; // Make onConfirm async
  cardText: string;
  currentPriority: Priority;
  newPriority: Priority;
}

// Add other types as needed, e.g., for change logs
export interface ChangeLogEntry {
  id: string;
  functionalityId: string;
  functionalityText: string; // Store text for easier display
  userId: string;
  username: string;
  timestamp: Timestamp;
  changeType: 'created' | 'moved' | 'edited'; // Add more types as needed
  fromPriority?: Priority;
  toPriority?: Priority;
  justification?: string;
  // Add fields for voting/approval results if implementing that
}
