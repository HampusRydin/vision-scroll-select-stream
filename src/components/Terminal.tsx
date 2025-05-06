
import { useRef, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface TerminalProps {
  messages: string[];
}

const Terminal = ({ messages }: TerminalProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [apiEndpoint, setApiEndpoint] = useState<string>("/detection_output");
  
  // This effect will handle scrolling to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Setup the detection event listener and fetch override
  useEffect(() => {
    const originalFetch = window.fetch;
    
    console.log("Setting up detection event listener for endpoint:", apiEndpoint);
    
    // Override fetch to intercept specific endpoints
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // For debugging - log all fetch requests
      console.log("Fetch intercepted:", url, init?.method);
      
      // Fix: Compare only the path portion of the URL
      const fullEndpoint = `${window.location.origin}${apiEndpoint}`;
      const urlObj = new URL(url.startsWith('http') ? url : `${window.location.origin}${url}`);
      const endpointObj = new URL(fullEndpoint);
      
      // Check if paths match (ignoring origin)
      console.log("Comparing paths:", urlObj.pathname, "vs", endpointObj.pathname);
      
      if (urlObj.pathname === endpointObj.pathname && init?.method === 'POST') {
        console.log("Detection endpoint matched! Processing request...");
        try {
          // Get the JSON data from the request
          const body = init.body;
          if (typeof body === 'string') {
            const data = JSON.parse(body);
            console.log("Received detection data:", data);
            
            // Create a custom event with the data
            const event = new CustomEvent('detectionEvent', { 
              detail: { data } 
            });
            
            // Dispatch the event
            document.dispatchEvent(event);
            
            // Show a toast notification
            const eventType = data.event || 'Detection event';
            toast({
              title: eventType,
              description: `Feed ID: ${data.feedId || 'Unknown'} - ${data.timestamp || new Date().toLocaleTimeString()}`,
            });
            
            // Return a mock successful response
            const successResponse = new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
            
            console.log("Returning mock response:", successResponse);
            return Promise.resolve(successResponse);
          } else {
            console.error("Request body is not a string:", body);
          }
        } catch (error) {
          console.error("Error processing detection data:", error);
        }
      }
      
      // For all other requests, use the original fetch
      return originalFetch.apply(window, [input, init]);
    };
    
    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [apiEndpoint, toast]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-black text-white p-2 font-medium flex justify-between items-center">
        <span>Detection Output</span>
        <div className="text-xs text-gray-400">
          Endpoint: {window.location.origin}{apiEndpoint}
        </div>
      </div>
      <div 
        className="flex-1 bg-black overflow-auto" 
        style={{ maxHeight: "calc(100vh - 200px)" }}
        ref={scrollAreaRef}
      >
        <div className="p-3 terminal-text text-green-400 min-h-[200px]">
          {messages.length > 0 ? (
            messages.map((message, index) => (
              <div key={index} className="py-1">
                {message}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">
              <p>No detection data available</p>
              <p className="mt-2 text-xs">
                Send JSON data to this endpoint to see detection events:
                <code className="block mt-1 p-2 bg-gray-800 rounded">
                  POST {window.location.origin}{apiEndpoint}
                </code>
              </p>
              <div className="mt-2 p-2 bg-gray-800 rounded overflow-auto text-xs">
                Example payload:
                <pre className="mt-1">
{`{
  "event": "Person detected",
  "timestamp": "14:35:22",
  "feedId": "1",
  "confidence": 0.95
}`}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Terminal;
