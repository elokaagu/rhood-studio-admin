"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  findOrCreateApplicationThread,
  hasApplicationConversationAccess,
  listThreadMessages,
  sendThreadMessage,
  type ApplicationChatMessage,
} from "@/lib/messages/application-conversation";
import { MessageSquare, Send } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicantUserId: string | null;
  applicantName: string;
};

export function ApplicantConversationDialog({
  open,
  onOpenChange,
  applicantUserId,
  applicantName,
}: Props) {
  const [myId, setMyId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ApplicationChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      setMessages([]);
      setThreadId(null);

      const { data: sessionData } = await supabase.auth.getUser();
      const uid = sessionData.user?.id ?? null;
      if (!uid || !applicantUserId) {
        if (!cancelled) {
          setError("Sign in to message this DJ.");
          setLoading(false);
        }
        return;
      }
      if (!cancelled) setMyId(uid);

      const allowed = await hasApplicationConversationAccess(applicantUserId);
      if (!allowed) {
        if (!cancelled) {
          setError(
            "Couldn't open this chat. Sign in as the brand that posted the opportunity, then try again."
          );
          setLoading(false);
        }
        return;
      }

      const id = await findOrCreateApplicationThread(uid, applicantUserId);
      if (!id) {
        if (!cancelled) {
          setError("Couldn't start the conversation. Try again.");
          setLoading(false);
        }
        return;
      }

      const rows = await listThreadMessages(id);
      if (!cancelled) {
        setThreadId(id);
        setMessages(rows);
        setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [open, applicantUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadId || !myId || !draft.trim() || sending) return;
    const content = draft.trim();
    setDraft("");
    setSending(true);
    const sent = await sendThreadMessage(threadId, myId, content);
    if (sent) {
      setMessages((prev) => [...prev, sent]);
    } else {
      setDraft(content);
    }
    setSending(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-brand-green font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message {applicantName || "DJ"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This chat is the same thread they see in the R/HOOD app. You can
            talk before accepting the application.
          </DialogDescription>
        </DialogHeader>

        <div className="h-80 overflow-y-auto px-6 space-y-3 border-t border-border">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Loading conversation…
            </p>
          ) : error ? (
            <p className="text-sm text-red-400 py-8 text-center">{error}</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No messages yet. Ask anything you need before you accept.
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === myId;
              return (
                <div
                  key={m.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      mine
                        ? "bg-brand-green text-brand-black"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        mine ? "text-brand-black/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={onSend}
          className="flex items-center gap-2 px-6 py-4 border-t border-border"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            maxLength={500}
            disabled={loading || !!error || !threadId || sending}
            className="bg-secondary border-border"
          />
          <Button
            type="submit"
            disabled={loading || !!error || !threadId || sending || !draft.trim()}
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
