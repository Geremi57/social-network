import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/mockApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/AppNav";
import { Send, Smile, Paperclip, Phone, Video, Info, ArrowLeft, Search, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import type { Conversation, Message } from "@/types";
import { relTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Pulse" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const params = useParams({ strict: false }) as { id?: string };
  return <Layout selectedId={params.id} />;
}

function Layout({ selectedId }: { selectedId?: string }) {
  const { data: convos = [] } = useQuery({ queryKey: ["conversations"], queryFn: () => chatService.listConversations() });
  const navigate = useNavigate();
  const showThread = !!selectedId;
  return (
    <div className="min-h-dvh flex bg-background">
      <Sidebar />
      <div className="flex-1 flex h-dvh overflow-hidden">
        <aside className={cn("w-full md:w-80 lg:w-96 shrink-0 border-r flex flex-col", showThread && "hidden md:flex")}>
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input placeholder="Search conversations" className="h-9 w-full rounded-full border bg-muted/40 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {convos.map((c) => (
              <ConvRow key={c.id} c={c} selected={c.id === selectedId} onClick={() => navigate({ to: "/messages/$id", params: { id: c.id } })} />
            ))}
          </div>
          <button className="m-3 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90">
            <Plus className="h-4 w-4" /> New message
          </button>
        </aside>

        <section className={cn("flex-1 flex flex-col min-w-0", !showThread && "hidden md:flex")}>
          {selectedId ? <Thread id={selectedId} /> : <EmptyThread />}
        </section>
      </div>
    </div>
  );
}

function ConvRow({ c, selected, onClick }: { c: Conversation; selected: boolean; onClick: () => void }) {
  const participants = chatService.getParticipants(c);
  const me = useAuthStore((s) => s.user);
  const other = participants.find((p) => p.id !== me?.id) ?? participants[0];
  const title = c.title ?? other?.name ?? "Conversation";
  const avatar = c.icon ?? other?.avatar;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-l-2",
        selected ? "bg-accent border-primary" : "border-transparent hover:bg-accent/60",
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={avatar} alt={title} />
          <AvatarFallback>{title[0]}</AvatarFallback>
        </Avatar>
        {c.kind === "dm" && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-success" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm truncate">{title}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">{c.lastMessage && relTime(c.lastMessage.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("text-xs truncate", c.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
            {c.lastMessage?.text}
          </span>
          {c.unread > 0 && <span className="shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold grid place-items-center">{c.unread}</span>}
        </div>
      </div>
    </button>
  );
}

function EmptyThread() {
  return (
    <div className="flex-1 grid place-items-center p-8 text-center">
      <div>
        <div className="mx-auto h-14 w-14 rounded-full bg-muted grid place-items-center mb-3">
          <Send className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-lg">Your messages</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">Send a message to start a conversation. Pick a contact from the sidebar.</p>
      </div>
    </div>
  );
}

function Thread({ id }: { id: string }) {
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: conv } = useQuery({ queryKey: ["conversation", id], queryFn: () => chatService.getConversation(id) });
  const { data: messages = [] } = useQuery({ queryKey: ["messages", id], queryFn: () => chatService.getMessages(id) });
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = chatService.subscribe(id, (msg) => {
      qc.invalidateQueries({ queryKey: ["messages", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (msg.authorId !== me?.id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 300);
      }
    });
    return () => { unsub(); };
  }, [id, qc, me?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typing]);

  const send = useMutation({
    mutationFn: (text: string) => chatService.sendMessage(id, text),
    onMutate: () => setTyping(true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages", id] }),
  });

  const handleSend = () => {
    const v = draft.trim();
    if (!v) return;
    send.mutate(v);
    setDraft("");
  };

  if (!conv) return <EmptyThread />;
  const participants = chatService.getParticipants(conv);
  const other = participants.find((p) => p.id !== me?.id) ?? participants[0];
  const title = conv.title ?? other?.name ?? "Conversation";
  const avatar = conv.icon ?? other?.avatar;

  return (
    <>
      <header className="h-14 border-b flex items-center gap-3 px-3 md:px-4">
        <button className="md:hidden p-1.5 -ml-1.5 rounded hover:bg-accent" onClick={() => navigate({ to: "/messages" })}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar} alt={title} />
          <AvatarFallback>{title[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate">{title}</div>
          <div className="text-xs text-muted-foreground">{conv.kind === "group" ? `${participants.length} members` : "Active now"}</div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button className="p-2 rounded-full hover:bg-accent" aria-label="Call"><Phone className="h-4 w-4" /></button>
          <button className="p-2 rounded-full hover:bg-accent" aria-label="Video"><Video className="h-4 w-4" /></button>
          <button className="p-2 rounded-full hover:bg-accent" aria-label="Info"><Info className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 md:px-6 py-4 space-y-1">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => {
            const mine = m.authorId === me?.id;
            const prev = messages[i - 1];
            const grouped = prev && prev.authorId === m.authorId;
            return <Bubble key={m.id} m={m} mine={mine} grouped={!!grouped} />;
          })}
        </AnimatePresence>
        {typing && (
          <div className="flex items-end gap-1.5 px-2 py-1 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.15s]" />
            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.3s]" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex items-end gap-2">
        <button className="p-2 rounded-full hover:bg-accent text-muted-foreground" aria-label="Attach"><Paperclip className="h-4 w-4" /></button>
        <button className="p-2 rounded-full hover:bg-accent text-muted-foreground" aria-label="Emoji"><Smile className="h-4 w-4" /></button>
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          className="flex-1 max-h-32 resize-none rounded-2xl border bg-muted/40 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <Button size="icon" className="h-9 w-9 rounded-full" onClick={handleSend} disabled={!draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

function Bubble({ m, mine, grouped }: { m: Message; mine: boolean; grouped: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn("flex", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-3")}
    >
      <div className={cn(
        "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-snug",
        mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md",
      )}>
        {m.text}
        <div className={cn("text-[10px] mt-1 opacity-70", mine ? "text-right" : "text-left")}>
          {relTime(m.createdAt)}
        </div>
      </div>
    </motion.div>
  );
}
