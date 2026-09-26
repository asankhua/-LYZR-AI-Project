"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function ShareModal({
  open,
  onOpenChange,
  projectName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
}) {
  const [email, setEmail] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Share {projectName}</DialogTitle>
        <p className="mt-2 text-sm text-text-muted">Invites are mocked. Presence shows you are viewing this project.</p>
        <p className="mt-3 text-sm">Viewing now: You</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            toast(`Invite noted for ${email}. No email is sent.`);
            setEmail("");
          }}
        >
          <label className="sr-only" htmlFor="invite-email">
            Email
          </label>
          <input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@acme.com"
            className="h-9 flex-1 rounded-sm border border-border bg-surface px-3 text-sm outline-none"
          />
          <Button type="submit" size="sm" variant="outline">
            Invite
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
