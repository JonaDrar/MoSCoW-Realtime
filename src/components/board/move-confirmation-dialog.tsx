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
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function MoveConfirmationDialog({ isOpen, onClose, onConfirm, cardText, currentPriority, newPriority }: MoveConfirmationDialogProps) {
  const t = useTranslations('MoveConfirmationDialog'); // Initialize translations
  const tp = useTranslations('Priorities'); // Translations for priorities
  const tc = useTranslations('Common'); // Translations for common terms

  const [justification, setJustification] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();

   // Use translated priority labels
   const priorityLabels: Record<Priority, string> = {
    must: tp('must'),
    should: tp('should'),
    could: tp('could'),
    wont: tp('wont'),
  };

  useEffect(() => {
    if (isOpen) {
      setJustification('');
      setIsMoving(false);
    }
  }, [isOpen]);

  const handleConfirmClick = async () => {
    if (!justification.trim()) {
      toast({ title: t('validationErrorTitle'), description: t('validationErrorMessage'), variant: 'destructive' });
      return;
    }

    setIsMoving(true);
    try {
        await onConfirm(justification); // onConfirm handles its own toasts
        // onClose(); // Closed in parent's finally block
    } catch (error) {
         console.error("Move card failed (handled in parent):", error);
    } finally {
         setIsMoving(false);
         onClose(); // Ensure dialog closes even if parent's finally doesn't (belt and suspenders)
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isMoving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription className="pt-2">
             {t('description', {
                cardText: cardText,
                currentPriorityLabel: priorityLabels[currentPriority],
                newPriorityLabel: priorityLabels[newPriority]
             })}
             {/* Using interpolation instead of ArrowRight component directly in translated string */}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="move-justification">{t('justificationLabel')}</Label>
            <Textarea
              id="move-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder={t('justificationPlaceholder')}
              disabled={isMoving}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
           <DialogClose asChild>
             <Button type="button" variant="outline" disabled={isMoving}>{tc('cancel')}</Button>
           </DialogClose>
          <Button type="button" onClick={handleConfirmClick} disabled={isMoving || !justification.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isMoving ? t('movingButton') : t('confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
