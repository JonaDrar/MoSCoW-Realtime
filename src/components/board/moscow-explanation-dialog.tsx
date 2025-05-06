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

interface MoSCowExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoSCowExplanationDialog({ isOpen, onClose }: MoSCowExplanationDialogProps) {
  // Handler for Dialog's onOpenChange
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>What is MoSCoW Prioritization?</DialogTitle>
          <DialogDescription>
            Imagine you're packing a bag for a trip! MoSCoW helps decide what's most important to bring.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1 pr-4"> {/* Allow scrolling for content */}
            <div className="space-y-4 py-4">
            <div className="p-4 rounded-md border border-[hsl(var(--moscow-must-border))] bg-[hsl(var(--moscow-must-bg))] text-[hsl(var(--moscow-must-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-must !text-[hsl(var(--moscow-must-fg))] !bg-transparent !border-[hsl(var(--moscow-must-fg))]">M</Badge> Must Have
                </h3>
                <p className="text-sm">
                These are the really important things you absolutely <span className="font-bold">must</span> bring. Like your passport or ticket for a plane trip. Without these, the trip can't happen!
                <br/><em>Example: For a drawing app, being able to draw lines.</em>
                </p>
            </div>

            <div className="p-4 rounded-md border border-[hsl(var(--moscow-should-border))] bg-[hsl(var(--moscow-should-bg))] text-[hsl(var(--moscow-should-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-should !text-[hsl(var(--moscow-should-fg))] !bg-transparent !border-[hsl(var(--moscow-should-fg))]">S</Badge> Should Have
                </h3>
                <p className="text-sm">
                These are important things you <span className="font-bold">should</span> bring if you can. They make the trip much better, but you could maybe manage without them. Like a toothbrush or comfy shoes.
                <br/><em>Example: For a drawing app, being able to change colors.</em>
                </p>
            </div>

            <div className="p-4 rounded-md border border-[hsl(var(--moscow-could-border))] bg-[hsl(var(--moscow-could-bg))] text-[hsl(var(--moscow-could-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-could !text-[hsl(var(--moscow-could-fg))] !bg-transparent !border-[hsl(var(--moscow-could-fg))]">C</Badge> Could Have
                </h3>
                <p className="text-sm">
                These are nice things you <span className="font-bold">could</span> bring if there's extra space and time. They aren't essential but add a little extra fun. Like a book or a special snack.
                <br/><em>Example: For a drawing app, adding special glittery brushes.</em>
                </p>
            </div>

            <div className="p-4 rounded-md border border-[hsl(var(--moscow-wont-border))] bg-[hsl(var(--moscow-wont-bg))] text-[hsl(var(--moscow-wont-fg))]">
                <h3 className="font-semibold mb-1 flex items-center">
                <Badge variant="secondary" className="mr-2 priority-badge-wont !text-[hsl(var(--moscow-wont-fg))] !bg-transparent !border-[hsl(var(--moscow-wont-fg))]">W</Badge> Won't Have (This Time)
                </h3>
                <p className="text-sm">
                These are things you decide you <span className="font-bold">won't</span> bring on this trip. Maybe they're too heavy, not needed, or you'll bring them next time. Like bringing your whole toy box.
                <br/><em>Example: For a drawing app, maybe adding 3D modeling right now.</em>
                </p>
            </div>

            <p className="text-sm text-muted-foreground pt-2">
                Using MoSCoW helps everyone agree on what's most important to build first, just like packing the essentials before the extras!
            </p>
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Reuse existing badge styles from ChangeLog (ideally move to globals.css later)
const badgeStyles = `
.priority-badge-must { background-color: hsl(var(--moscow-must-bg)); color: hsl(var(--moscow-must-fg)); border: 1px solid hsl(var(--moscow-must-border)); }
.priority-badge-should { background-color: hsl(var(--moscow-should-bg)); color: hsl(var(--moscow-should-fg)); border: 1px solid hsl(var(--moscow-should-border)); }
.priority-badge-could { background-color: hsl(var(--moscow-could-bg)); color: hsl(var(--moscow-could-fg)); border: 1px solid hsl(var(--moscow-could-border)); }
.priority-badge-wont { background-color: hsl(var(--moscow-wont-bg)); color: hsl(var(--moscow-wont-fg)); border: 1px solid hsl(var(--moscow-wont-border)); }
`;

// Inject styles (consider a better approach for larger apps)
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
