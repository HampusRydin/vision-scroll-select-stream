
import { useState, useRef, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Play, Pause, Camera, CameraOff, Send } from "lucide-react";
import { FeedData } from "@/pages/Index";
import { Button } from "@/components/ui/button";

interface VideoFeedProps {
  feed: FeedData;
  onChangeDetectionMode: (feedId: string, modeId: string, prompt?: string) => void;
}

const VideoFeed = ({ feed, onChangeDetectionMode }: VideoFeedProps) => {
  const [promptInput, setPromptInput] = useState(feed.prompts?.[feed.detectionMode] || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoFeed, setIsVideoFeed] = useState(true);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
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

  useEffect(() => {
    // Reset video state when feed changes
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
          setIsPlaying(false);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [feed.id, isPlaying]);

  useEffect(() => {
    // Determine if the current URL is a video source or IP camera stream
    const url = feed.url.toLowerCase();
    
    // Check for common video file extensions
    const isVideoFile = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || 
                       url.endsWith('.avi') || url.endsWith('.mkv');
    
    // Check for streaming protocols and IP camera patterns
    const isStream = url.includes('rtsp://') || url.includes('rtmp://') || 
                    url.includes('http://') || url.includes('https://') ||
                    url.includes('stream') || 
                    (url.match(/\d+\.\d+\.\d+\.\d+/) !== null); // Fix: Check if match returns non-null
                    
    // Set state based on the type of feed
    setIsVideoFeed(isVideoFile || isStream);
    setIsLiveStream(isStream && !isVideoFile);
    
    // Auto-play IP camera streams when loaded
    if (isStream && !isVideoFile && videoRef.current) {
      setIsPlaying(true);
      videoRef.current.play().catch(error => {
        console.error("Error playing stream:", error);
        setIsPlaying(false);
      });
    }
  }, [feed.url]);

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

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      }
      setIsPlaying(!isPlaying);
    }
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

      {/* Video display */}
      <div className="flex-1 relative">
        {isVideoFeed ? (
          <>
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              src={feed.url}
              playsInline
              muted
              loop={!isLiveStream} // Only loop if not a live stream
            />
            <Button 
              variant="secondary" 
              size="icon"
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
            
            {isLiveStream && (
              <div className="absolute top-12 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                LIVE
              </div>
            )}
          </>
        ) : (
          <div 
            className="w-full h-full video-feed"
            style={{ 
              backgroundImage: `url(${feed.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <Button 
              variant="secondary" 
              size="icon"
              className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70"
              onClick={() => {}}
              disabled
            >
              <CameraOff className="h-5 w-5" />
            </Button>
          </div>
        )}
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
