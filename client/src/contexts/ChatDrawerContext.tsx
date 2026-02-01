import { createContext, useContext, type ReactNode } from "react";

type ChatDrawerContextValue = {
  openDrawer: () => void;
  isOpen: boolean;
};

const ChatDrawerContext = createContext<ChatDrawerContextValue | null>(null);

export function ChatDrawerProvider({
  children,
  openDrawer,
  isOpen,
}: {
  children: ReactNode;
  openDrawer: () => void;
  isOpen: boolean;
}) {
  return (
    <ChatDrawerContext.Provider value={{ openDrawer, isOpen }}>
      {children}
    </ChatDrawerContext.Provider>
  );
}

export function useChatDrawer(): ChatDrawerContextValue | null {
  return useContext(ChatDrawerContext);
}
