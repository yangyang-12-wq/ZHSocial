import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

export interface CommentProps {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  createdAt: Date;
  children?: CommentProps[];
  depth?: number;
}

export const Comment: React.FC<CommentProps> = ({
  id,
  author,
  avatar,
  content,
  createdAt,
  children = [],
  depth = 0,
}) => {
  const [showReply, setShowReply] = useState(false);
  const [reply, setReply] = useState("");
  const handleReply = () => {
    if (!reply.trim()) return;
    // For MVP: Just push to local state – real impl will call API
    children.push({
      id: `${id}-${children.length + 1}`,
      author: "You",
      content: reply,
      createdAt: new Date(),
      children: [],
      depth: depth + 1,
    });
    setReply("");
    setShowReply(false);
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? "pl-6 border-l" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatar ?? undefined} alt={author} />
        <AvatarFallback>{author.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{author}</span>
          <span className="text-muted-foreground text-xs">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap">{content}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <Button variant="ghost" size="sm" className="p-0" onClick={() => {}}>
            👍 Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-0"
            onClick={() => setShowReply((v) => !v)}
          >
            💬 Reply
          </Button>
        </div>
        {showReply && (
          <div className="mt-2 space-y-2">
            <Textarea
              value={reply}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReply(e.target.value)}
              placeholder="Write a reply..."
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleReply}>
                Send
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowReply(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {children.length > 0 && (
          <div className="mt-4 space-y-4">
            {children.map((child) => (
              <Comment key={child.id} {...child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment; 