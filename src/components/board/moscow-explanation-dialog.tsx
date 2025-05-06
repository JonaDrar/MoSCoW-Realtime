// src/components/board/moscow-explanation-dialog.tsx
'use client';

import React from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl'; // Import useTranslations

interface MoSCowExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoSCowExplanationDialog({ isOpen, onClose }: MoSCowExplanationDialogProps) {
  const t = useTranslations('MoscowExplanationDialog'); // Initialize translations

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-4">
            <div className="space-y-4 py-4">
            <div className="p-4 rounded-md border border-[hsl(var(--moscow-must-border))] bg-[hsl(var(--moscow-must-bg))] text-[hsl(var(--moscow-must-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-must !text-[hsl(var(--moscow-must-fg))] !bg-transparent !border-[hsl(var(--moscow-must-fg))]">M</Badge> {t('mustTitle')}
                </h3>
                {/* Use dangerouslySetInnerHTML for HTML in translations */}
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('mustDescription') }} />
            </div>

            <div className="p-4 rounded-md border border-[hsl(var(--moscow-should-border))] bg-[hsl(var(--moscow-should-bg))] text-[hsl(var(--moscow-should-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-should !text-[hsl(var(--moscow-should-fg))] !bg-transparent !border-[hsl(var(--moscow-should-fg))]">S</Badge> {t('shouldTitle')}
                </h3>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('shouldDescription') }} />
            </div>

            <div className="p-4 rounded-md border border-[hsl(var(--moscow-could-border))] bg-[hsl(var(--moscow-could-bg))] text-[hsl(var(--moscow-could-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-could !text-[hsl(var(--moscow-could-fg))] !bg-transparent !border-[hsl(var(--moscow-could-fg))]">C</Badge> {t('couldTitle')}
                </h3>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('couldDescription') }} />
            </div>

            <div className="p-4 rounded-md border border-[hsl(var(--moscow-wont-border))] bg-[hsl(var(--moscow-wont-bg))] text-[hsl(var(--moscow-wont-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-wont !text-[hsl(var(--moscow-wont-fg))] !bg-transparent !border-[hsl(var(--moscow-wont-fg))]">W</Badge> {t('wontTitle')}
                </h3>
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: t.raw('wontDescription') }} />
            </div>

            <p className="text-sm text-muted-foreground pt-2">
                {t('summary')}
            </p>
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">{t('closeButton')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Badge styling remains the same
const badgeStyles = `
.priority-badge-must { background-color: hsl(var(--moscow-must-bg)); color: hsl(var(--moscow-must-fg)); border: 1px solid hsl(var(--moscow-must-border)); }
.priority-badge-should { background-color: hsl(var(--moscow-should-bg)); color: hsl(var(--moscow-should-fg)); border: 1px solid hsl(var(--moscow-should-border)); }
.priority-badge-could { background-color: hsl(var(--moscow-could-bg)); color: hsl(var(--moscow-could-fg)); border: 1px solid hsl(var(--moscow-could-border)); }
.priority-badge-wont { background-color: hsl(var(--moscow-wont-bg)); color: hsl(var(--moscow-wont-fg)); border: 1px solid hsl(var(--moscow-wont-border)); }
`;

if (typeof window !== 'undefined') {
  const styleId = 'priority-badge-styles';
  if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement("style");
      styleSheet.id = styleId;
      styleSheet.type = "text/css";
      styleSheet.innerText = badgeStyles;
      document.head.appendChild(styleSheet);
  }
}
