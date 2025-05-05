
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { FeedData } from "@/pages/Index";
import { Button } from "@/components/ui/button";

interface VideoFeedProps {
  feed: FeedData;
  onChangeDetectionMode: (feedId: string, modeId: string, prompt?: string) => void;
}

const VideoFeed = ({ feed, onChangeDetectionMode }: VideoFeedProps) => {
  const [promptInput, setPromptInput] = useState(feed.prompts?.[feed.detectionMode] || "");
  
  const detectionModes = [
    { id: "none", name: "None", prompt: false },
    { id: "object", name: "Object Detection", prompt: true },
    { id: "motion", name: "Motion Detection", prompt: true },
    { id: "object-motion", name: "Object-specific Motion Detection", prompt: true },
    { 
      id: "no-go", 
      name: "No-go Zones",
      children: [
        { id: "entrance", name: "Entrance Detection", prompt: true },
        { id: "floor", name: "Floor Detection", prompt: true }
      ]
    }
  ];

  const getCurrentModeName = () => {
    for (const mode of detectionModes) {
      if (mode.id === feed.detectionMode) return mode.name;
      if (mode.children) {
        const child = mode.children.find(child => child.id === feed.detectionMode);
        if (child) return child.name;
      }
    }
    return "None";
  };

  const shouldShowPrompt = () => {
    const mode = detectionModes.find(mode => mode.id === feed.detectionMode) ||
                detectionModes.find(mode => mode.children?.some(child => child.id === feed.detectionMode));
    return mode?.prompt || mode?.children?.find(child => child.id === feed.detectionMode)?.prompt;
  };

  const handleModeChange = (value: string) => {
    onChangeDetectionMode(feed.id, value);
    // Reset prompt input when mode changes
    setPromptInput(feed.prompts?.[value] || "");
  };

  const handleSendPrompt = () => {
    onChangeDetectionMode(feed.id, feed.detectionMode, promptInput);
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Pagination indicator moved to top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {feed.totalFeeds > 1 && Array.from({ length: feed.totalFeeds }).map((_, index) => (
          <div 
            key={index} 
            className={`w-2 h-2 rounded-full ${
              index === feed.feedIndex ? 'bg-primary' : 'bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Camera feed display using img tag instead of video */}
      <div className="flex-1 relative">
        <img 
          src={feed.url}
          alt={`${feed.name} camera feed`}
          className="w-full h-full object-cover"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute top-0 left-0 p-3 bg-black/50 text-white text-sm w-fit">
          {feed.name}
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-3 bg-card flex items-center justify-between">
        <Select
          value={feed.detectionMode}
          onValueChange={handleModeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {detectionModes.map((mode) => (
              mode.children ? (
                <SelectItem key={mode.id} value={mode.id} disabled>
                  <div className="flex items-center gap-2">
                    {mode.name}
                  </div>
                  {mode.children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <div className="flex items-center gap-2">
                        {child.name}
                        {feed.prompts?.[child.id] && (
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectItem>
              ) : (
                <SelectItem key={mode.id} value={mode.id}>
                  <div className="flex items-center gap-2">
                    {mode.name}
                    {feed.prompts?.[mode.id] && (
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    )}
                  </div>
                </SelectItem>
              )
            ))}
          </SelectContent>
        </Select>

        {shouldShowPrompt() && (
          <div className="flex items-center gap-2">
            <Input
              className="w-[200px]"
              placeholder={`Enter ${getCurrentModeName().toLowerCase()} prompt...`}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSendPrompt();
                }
              }}
            />
            <Button 
              size="icon"
              onClick={handleSendPrompt}
              variant="secondary"
            >
              <Send size={16} />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VideoFeed;
