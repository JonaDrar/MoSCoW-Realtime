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
import { useTranslations } from 'next-intl'; // Import useTranslations

export default function AddFunctionalityDialog({ isOpen, onClose, onAdd, initialPriority }: AddFunctionalityDialogProps) {
  const t = useTranslations('AddFunctionalityDialog'); // Initialize translations
  const tp = useTranslations('Priorities'); // Translations for priorities
  const tc = useTranslations('Common'); // Translations for common terms

  const [text, setText] = useState('');
  const [justification, setJustification] = useState('');
  const [priority, setPriority] = useState<Priority>(initialPriority);
  const [isAdding, setIsAdding] = useState(false);
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
      setText('');
      setJustification('');
      setPriority(initialPriority);
      setIsAdding(false);
    }
  }, [isOpen, initialPriority]);

  const handleAddClick = async () => {
    if (!text.trim()) {
       toast({ title: t('validationErrorTitle'), description: t('validationErrorFunctionality'), variant: 'destructive' });
       return;
    }
     if (!justification.trim()) {
       toast({ title: t('validationErrorTitle'), description: t('validationErrorJustification'), variant: 'destructive' });
       return;
    }

    setIsAdding(true);
    try {
        await onAdd(text, justification, priority); // onAdd handles its own toasts now
        onClose();
    } catch (error) {
         console.error("Add functionality failed (handled in parent):", error);
    } finally {
         setIsAdding(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionality-text" className="text-right">
              {t('functionalityLabel')}
            </Label>
            <Input
              id="functionality-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="col-span-3"
              placeholder={t('functionalityPlaceholder')}
              disabled={isAdding}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionality-justification" className="text-right">
              {t('justificationLabel')}
            </Label>
            <Textarea
              id="functionality-justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="col-span-3"
              placeholder={t('justificationPlaceholder')}
              disabled={isAdding}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="functionality-priority" className="text-right">
              {t('priorityLabel')}
            </Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as Priority)} disabled={isAdding}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={t('priorityPlaceholder')} />
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
             <Button type="button" variant="outline" disabled={isAdding}>{tc('cancel')}</Button>
           </DialogClose>
          <Button type="button" onClick={handleAddClick} disabled={isAdding || !text.trim() || !justification.trim()} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {isAdding ? t('addingButton') : t('addButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
