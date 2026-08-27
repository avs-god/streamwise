import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CornerDownRight, Flag, MessageCircle, Send, ShieldAlert } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

type Reply = { id: number; parentReplyId: number | null; body: string; containsSpoilers: boolean; contributorName: string | null; createdAt: string | Date };
type ReplyNode = Reply & { children: ReplyNode[] };

function createReplyTree(replies: Reply[]) {
  const nodes = new Map<number, ReplyNode>(replies.map(reply => [reply.id, { ...reply, children: [] }]));
  const roots: ReplyNode[] = [];
  nodes.forEach(node => {
    const parent = node.parentReplyId ? nodes.get(node.parentReplyId) : undefined;
    if (parent && parent.id !== node.id) parent.children.push(node); else roots.push(node);
  });
  return roots;
}

function ReplyBranch({ node, depth, onReply, onReport }: { node: ReplyNode; depth: number; onReply: (id: number) => void; onReport: (id: number) => void }) {
  const indent = Math.min(depth, 3);
  return <article className={`relative rounded-xl border border-[#e0d9cb] bg-white/75 p-3.5 ${indent ? "border-l-4 border-l-[#a8c9b1]" : ""}`} style={{ marginLeft: indent ? `${indent * 0.75}rem` : undefined }}><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-[#476b5b]">{node.contributorName ? `Shared by ${node.contributorName}` : "Anonymous Streamwise member"}</span>{node.containsSpoilers ? <Badge className="bg-[#f5e4d7] text-[#8a4d2f]">Spoilers</Badge> : null}<span className="text-xs text-[#78867f]">{new Date(node.createdAt).toLocaleDateString()}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#51695f]">{node.body}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><button type="button" onClick={() => onReply(node.id)} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[#315c49] underline underline-offset-4"><CornerDownRight className="size-3.5" />Reply</button><button type="button" onClick={() => onReport(node.id)} className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-[#8b4b31] underline underline-offset-4"><Flag className="size-3.5" />Report</button></div>{node.children.length ? <div className="mt-3 space-y-3">{node.children.map(child => <ReplyBranch key={child.id} node={child} depth={depth + 1} onReply={onReply} onReport={onReport} />)}</div> : null}</article>;
}

export default function CommunityThreadDialog({ threadId, open, onOpenChange, replies, loading, onReportReply }: { threadId: number | null; open: boolean; onOpenChange: (open: boolean) => void; replies: Reply[]; loading: boolean; onReportReply: (replyId: number) => void }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [body, setBody] = useState("");
  const [spoilers, setSpoilers] = useState(false);
  const [parentReplyId, setParentReplyId] = useState<number | null>(null);
  const tree = useMemo(() => createReplyTree(replies), [replies]);
  const reply = trpc.community.reply.useMutation({ onSuccess: () => { setBody(""); setParentReplyId(null); utils.community.replies.invalidate(); toast.success("Reply added to the discussion."); }, onError: error => toast.error(error.message) });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] w-[calc(100vw-1rem)] overflow-y-auto border-[#d9d3c4] bg-[#fcfaf4] p-4 sm:max-w-2xl sm:p-6"><DialogHeader><p className="eyebrow">Discussion thread</p><DialogTitle className="serif text-3xl text-[#204a3a]">Read the conversation.</DialogTitle><DialogDescription>Comments are arranged as nested replies. Spoiler labels and private reporting stay available at every level.</DialogDescription></DialogHeader>{user && threadId ? <section className="mt-4 rounded-2xl border border-[#c9d9cd] bg-[#edf5ee] p-3"><Label htmlFor="thread-reply" className="font-semibold text-[#315c49]">{parentReplyId ? "Reply to this comment" : "Add to the conversation"}</Label>{parentReplyId ? <button type="button" onClick={() => setParentReplyId(null)} className="ml-2 text-xs font-semibold text-[#58746a] underline underline-offset-4">Write a top-level reply instead</button> : null}<Textarea id="thread-reply" value={body} onChange={event => setBody(event.target.value)} className="mt-2 min-h-24 bg-white" placeholder="Keep it thoughtful. Flag spoilers where needed." /><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><label className="flex min-h-9 items-center gap-2 text-sm font-semibold text-[#48695b]"><Switch checked={spoilers} onCheckedChange={setSpoilers} />Contains spoilers</label><Button onClick={() => reply.mutate({ threadId, parentReplyId, body: body.trim(), containsSpoilers: spoilers, shareAttribution: false })} disabled={reply.isPending || body.trim().length < 2} className="min-h-10 bg-[#1e4a3a] text-[#fbf8ee]"><Send className="size-4" />{reply.isPending ? "Posting…" : "Post reply"}</Button></div></section> : <section className="mt-4 rounded-xl border border-[#d8cfb8] bg-[#fffaf0] p-3 text-sm leading-6 text-[#695b3e]">Sign in to add a reply, reply to a comment, or submit a private moderation report.</section>}<section className="mt-5"><div className="flex items-center gap-2"><MessageCircle className="size-4 text-[#3d6a55]" /><h3 className="font-semibold text-[#315c49]">Comments and replies</h3></div>{loading ? <Skeleton className="mt-3 h-28" /> : tree.length ? <div className="mt-3 space-y-3">{tree.map(node => <ReplyBranch key={node.id} node={node} depth={0} onReply={id => setParentReplyId(id)} onReport={onReportReply} />)}</div> : <p className="mt-3 rounded-xl bg-[#edf3ed] p-4 text-sm text-[#5f746a]">No visible replies yet. Start the conversation thoughtfully.</p>}</section><aside className="mt-5 flex gap-2 rounded-xl border border-[#ead8b6] bg-[#fff9ed] p-3 text-xs leading-5 text-[#705c37]"><ShieldAlert className="mt-0.5 size-4 shrink-0" />Community discussion is public context. It does not change verified offers, personal alerts, or subscription decisions.</aside></DialogContent></Dialog>;
}
