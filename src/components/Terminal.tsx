
import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TerminalProps {
  messages: string[];
}

const Terminal = ({ messages }: TerminalProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Use setTimeout to ensure scrolling happens after render
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-black text-white p-2 font-medium">
        Detection Output
      </div>
      <div className="flex-1 bg-black overflow-hidden">
        <ScrollArea className="h-[calc(100%-2.5rem)]">
          <div 
            ref={scrollRef} 
            className="p-3 terminal-text text-green-400 max-h-full"
            style={{ minHeight: "100%" }}
          >
            {messages.length > 0 ? (
              messages.map((message, index) => (
                <div key={index} className="py-1">
                  {message}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground">No detection data available</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Terminal;
