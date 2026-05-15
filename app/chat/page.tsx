"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectWorkspace } from "@/components/project-workspace";
import { ComposioChatbot } from "@/components/ai/composio-chat";

function ChatPageInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project");

  if (projectId) {
    return <ProjectWorkspace projectId={projectId} />;
  }
  return <ComposioChatbot />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-[#080810] flex items-center justify-center">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}
