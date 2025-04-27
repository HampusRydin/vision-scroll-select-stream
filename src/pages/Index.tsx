import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import VideoFeed from "@/components/VideoFeed";
import Terminal from "@/components/Terminal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export interface FeedData {
  id: string;
  name: string;
  url: string;
  active: boolean;
  detectionMode: string;
}

export interface DetectionMode {
  id: string;
  name: string;
  description: string;
}

const Index = () => {
  const [feeds, setFeeds] = useState<FeedData[]>([]);
  const [detectionModes, setDetectionModes] = useState<DetectionMode[]>([]);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [activeFeeds, setActiveFeeds] = useState<string[]>([]);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const { toast } = useToast();

  // Fetch available feeds and detection modes on component mount
  useEffect(() => {
    // Simulating API calls for now, replace with actual API calls
    const mockDetectionModes: DetectionMode[] = [
      { id: "none", name: "None", description: "No detection" },
      { id: "motion", name: "Motion Detection", description: "Detects movement in the frame" },
      { id: "person", name: "Person Detection", description: "Identifies people in the frame" },
      { id: "vehicle", name: "Vehicle Detection", description: "Identifies vehicles in the frame" },
      { id: "object", name: "Object Detection", description: "Identifies various objects in the frame" },
    ];
    
    setDetectionModes(mockDetectionModes);
    setActiveFeeds(["1"]);

    // Add initial terminal message
    addTerminalMessage("System initialized. Ready for detection.");

    // Simulate receiving new feed connections from backend
    // In a real implementation, this would be a WebSocket or SSE connection
    const mockBackendUpdates = [
      { id: "1", name: "Front Door", url: "/placeholder.svg", active: true, detectionMode: "none" },
      { id: "2", name: "Back Yard", url: "/placeholder.svg", active: false, detectionMode: "none" },
    ];

    mockBackendUpdates.forEach((feed, index) => {
      setTimeout(() => {
        handleNewFeed(feed);
      }, index * 1000); // Simulate feeds connecting at different times
    });
  }, []);

  // Function to handle new feed connections
  const handleNewFeed = (newFeed: FeedData) => {
    setFeeds(prevFeeds => {
      const feedExists = prevFeeds.some(feed => feed.id === newFeed.id);
      if (!feedExists) {
        addTerminalMessage(`New camera feed connected: ${newFeed.name}`);
        toast({
          title: "New Camera Connected",
          description: `${newFeed.name} has been added to available feeds.`,
        });
        return [...prevFeeds, newFeed];
      }
      return prevFeeds;
    });
  };

  const updateFeedName = (id: string, newName: string) => {
    setFeeds(prevFeeds =>
      prevFeeds.map(feed =>
        feed.id === id
          ? { ...feed, name: newName }
          : feed
      )
    );
    addTerminalMessage(`Camera feed ${id} renamed to: ${newName}`);
  };

  const addTerminalMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalOutput(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const toggleFeed = (id: string) => {
    if (activeFeeds.includes(id)) {
      // Don't allow deactivating the last active feed
      if (activeFeeds.length === 1) {
        toast({
          title: "Cannot deactivate",
          description: "At least one feed must be active",
          variant: "destructive",
        });
        return;
      }
      setActiveFeeds(prev => prev.filter(feedId => feedId !== id));
    } else {
      // Don't allow more than 5 feeds
      if (activeFeeds.length >= 5) {
        toast({
          title: "Maximum feeds reached",
          description: "You can have a maximum of 5 active feeds",
          variant: "destructive",
        });
        return;
      }
      setActiveFeeds(prev => [...prev, id]);
    }
    
    // Reset current feed index
    setCurrentFeedIndex(0);
  };

  const changeDetectionMode = async (feedId: string, modeId: string) => {
    try {
      // This would normally be an API call to change the detection mode
      // For now, we'll just simulate it
      
      // In a real implementation, you would do something like:
      // await fetch(`/api/feeds/${feedId}/detection-mode`, {
      //   method: 'PUT',
      //   body: JSON.stringify({ modeId }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      
      setFeeds(prev => 
        prev.map(feed => 
          feed.id === feedId 
            ? { ...feed, detectionMode: modeId } 
            : feed
        )
      );

      const mode = detectionModes.find(mode => mode.id === modeId);
      const feed = feeds.find(feed => feed.id === feedId);
      
      if (mode && feed) {
        addTerminalMessage(`Set detection mode for ${feed.name} to ${mode.name}`);
        
        // Simulate detection results after a short delay
        if (modeId !== 'none') {
          setTimeout(() => {
            const detections = ["person (87%)", "backpack (63%)"];
            addTerminalMessage(`Detection results for ${feed.name}: ${detections.join(", ")}`);
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error changing detection mode:", error);
      toast({
        title: "Error",
        description: "Failed to change detection mode",
        variant: "destructive",
      });
    }
  };

  const handleNextFeed = () => {
    if (activeFeeds.length > 1) {
      setCurrentFeedIndex((prev) => (prev + 1) % activeFeeds.length);
    }
  };

  const handlePrevFeed = () => {
    if (activeFeeds.length > 1) {
      setCurrentFeedIndex((prev) => (prev - 1 + activeFeeds.length) % activeFeeds.length);
    }
  };

  const displayedFeed = feeds.find(feed => feed.id === activeFeeds[currentFeedIndex]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar for feed selection */}
      <Sidebar 
        feeds={feeds}
        activeFeeds={activeFeeds}
        onToggleFeed={toggleFeed}
        onUpdateFeedName={updateFeedName}
      />
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col md:flex-row p-4 gap-4">
          {/* Video feed section */}
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 min-h-[300px]">
              {/* Navigation buttons */}
              {activeFeeds.length > 1 && (
                <>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60"
                    onClick={handlePrevFeed}
                  >
                    <ChevronLeft />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/60"
                    onClick={handleNextFeed}
                  >
                    <ChevronRight />
                  </Button>
                </>
              )}

              {/* Current feed */}
              {displayedFeed && (
                <VideoFeed 
                  feed={displayedFeed}
                  detectionModes={detectionModes}
                  onChangeDetectionMode={changeDetectionMode}
                />
              )}

              {/* Pagination indicator */}
              {activeFeeds.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {activeFeeds.map((_, index) => (
                    <div 
                      key={index} 
                      className={`w-2 h-2 rounded-full ${
                        index === currentFeedIndex ? 'bg-primary' : 'bg-gray-500'
                      }`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Terminal section */}
          <Card className="w-full md:w-96 flex flex-col">
            <Terminal messages={terminalOutput} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
