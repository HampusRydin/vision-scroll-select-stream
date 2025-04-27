
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FeedData, DetectionMode } from "@/pages/Index";

interface VideoFeedProps {
  feed: FeedData;
  detectionModes: DetectionMode[];
  onChangeDetectionMode: (feedId: string, modeId: string) => void;
}

const VideoFeed = ({ feed, detectionModes, onChangeDetectionMode }: VideoFeedProps) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Video display */}
      <div 
        className="flex-1 video-feed"
        style={{ 
          backgroundImage: `url(${feed.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* This would be a real video in production */}
        <div className="p-3 bg-black/50 text-white text-sm w-fit">
          {feed.name}
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-3 bg-card flex items-center justify-between">
        <span className="text-sm font-medium">Detection Mode:</span>
        <Select
          value={feed.detectionMode}
          onValueChange={(value) => onChangeDetectionMode(feed.id, value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {detectionModes.map((mode) => (
              <SelectItem key={mode.id} value={mode.id}>
                {mode.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
};

export default VideoFeed;
