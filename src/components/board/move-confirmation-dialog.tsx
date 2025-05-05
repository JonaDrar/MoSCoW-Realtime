// src/components/board/move-confirmation-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MoveConfirmationDialogProps, Priority } from './types';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight } from 'lucide-react';

const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

export default function MoveConfirmationDialog({ isOpen, onClose, onConfirm, cardText, currentPriority, newPriority }: MoveConfirmationDialogProps) {
  const [justification, setJustification] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setJustification('');
      setIsMoving(false);
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
    if (!justification.trim()) {
      toast({ title: 'Error', description: 'Justification is required to move the card.', variant: 'destructive' });
      return;
    }

    setIsMoving(true);
    try {
        await onConfirm(justification);
        toast({ title: 'Success', description: 'Card moved successfully.' });
        onClose(); // Close dialog on success
    } catch (error: any) {
         console.error("Error moving card:", error);
         toast({ title: 'Error', description: error.message || 'Failed to move card.', variant: 'destructive' });
    } finally {
         setIsMoving(false);
    }
  };

  // Handler for Dialog's onOpenChange
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Move</DialogTitle>
          <DialogDescription className="pt-2">
            You are moving the functionality <span className="font-semibold">"{cardText}"</span> from
            <span className="font-semibold mx-1">{priorityLabels[currentPriority]}</span>
             <ArrowRight className="inline h-4 w-4 mx-1"/>
            <span className="font-semibold">{priorityLabels[newPriority]}</span>.
            Please provide a justification for this change.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="move-justification">Justification</Label>
            <Textarea
              id="move-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explain why this change is being made..."
              disabled={isMoving}
              rows={4}
            />
          </div>
          {/* Placeholder for future voting mechanism */}
          {/* <div className="mt-4 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              Voting/Approval feature will be implemented here. For now, providing justification confirms the move.
          </div> */}
        </div>
        <DialogFooter>
           <DialogClose asChild>
             <Button type="button" variant="outline" disabled={isMoving}>Cancel</Button>
           </DialogClose>
          <Button type="button" onClick={handleConfirmClick} disabled={isMoving || !justification.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isMoving ? 'Moving...' : 'Confirm Move'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
