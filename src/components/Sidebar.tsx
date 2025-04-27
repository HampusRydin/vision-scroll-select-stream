
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FeedData } from "@/pages/Index";

interface SidebarProps {
  feeds: FeedData[];
  activeFeeds: string[];
  onToggleFeed: (id: string) => void;
}

const Sidebar = ({ feeds, activeFeeds, onToggleFeed }: SidebarProps) => {
  return (
    <div className="w-full md:w-64 bg-secondary p-4">
      <h2 className="text-xl font-bold mb-4">Camera Feeds</h2>
      
      <div className="space-y-3">
        {feeds.map((feed) => (
          <Card key={feed.id} className="p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`feed-${feed.id}`} className="cursor-pointer">
                {feed.name}
              </Label>
              <Switch
                id={`feed-${feed.id}`}
                checked={activeFeeds.includes(feed.id)}
                onCheckedChange={() => onToggleFeed(feed.id)}
              />
            </div>
          </Card>
        ))}
      </div>
      
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Active feeds: {activeFeeds.length}/5</p>
      </div>
    </div>
  );
};

export default Sidebar;
