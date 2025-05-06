// src/components/board/add-functionality-dialog.tsx
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddFunctionalityDialogProps, Priority } from './types';
import { useToast } from '@/hooks/use-toast';


const priorityLabels: Record<Priority, string> = {
  must: 'Must Have',
  should: 'Should Have',
  could: 'Could Have',
  wont: 'Won\'t Have',
};

export default function AddFunctionalityDialog({ isOpen, onClose, onAdd, initialPriority }: AddFunctionalityDialogProps) {
  const [text, setText] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setText('');
      setJustification('');
      setPriority(initialPriority);
      setIsAdding(false);
    }
  }, [isOpen, initialPriority]);

  const handleAddClick = async () => {
    if (!text.trim()) {
       toast({ title: 'Validation Error', description: 'Functionality description cannot be empty.', variant: 'destructive' });
       return;
    }
     if (!justification.trim()) {
       toast({ title: 'Validation Error', description: 'Justification cannot be empty.', variant: 'destructive' });
       return;
    }

    setIsAdding(true);
    try {
        // Directly call the passed onAdd function, which now handles its own try/catch and toasts
        await onAdd(text, justification, priority);
        onClose(); // Close dialog on success (toast is handled in onAdd)
    } catch (error) {
         // The error is already logged and toasted in the parent component's onAdd function.
         // We just need to ensure the loading state is reset.
         console.error("Add functionality failed (handled in parent):", error);
    } finally {
         setIsAdding(false); // Ensure loading state is always reset
    }

  };

  // Handler for Dialog's onOpenChange
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
    // We don't need to handle the 'open' case here as useEffect does the reset
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Functionality</DialogTitle>
          <DialogDescription>
            Describe the functionality, provide justification, and set its initial priority.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionality-text" className="text-right">
              Functionality
            </Label>
            <Input
              id="functionality-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="col-span-3"
              placeholder="e.g., User login via email"
              disabled={isAdding}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionality-justification" className="text-right">
              Justification
            </Label>
            <Textarea
              id="functionality-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="col-span-3"
              placeholder="Why is this needed?"
              disabled={isAdding}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionality-priority" className="text-right">
              Priority
            </Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)} disabled={isAdding}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(priorityLabels) as Priority[]).map((p) => (
                  <SelectItem key={p} value={p}>{priorityLabels[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
           <DialogClose asChild>
             <Button type="button" variant="outline" disabled={isAdding}>Cancel</Button>
           </DialogClose>
          <Button type="button" onClick={handleAddClick} disabled={isAdding || !text.trim() || !justification.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isAdding ? 'Adding...' : 'Add Functionality'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
