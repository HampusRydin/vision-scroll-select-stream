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
import { Play, Pause, Camera, CameraOff, Send, AlertTriangle, Info } from "lucide-react";
import { FeedData } from "@/pages/Index";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface VideoFeedProps {
  feed: FeedData;
  onChangeDetectionMode: (feedId: string, modeId: string, prompt?: string) => void;
}

const VideoFeed = ({ feed, onChangeDetectionMode }: VideoFeedProps) => {
  const [promptInput, setPromptInput] = useState(feed.prompts?.[feed.detectionMode] || "");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoFeed, setIsVideoFeed] = useState(true);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
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
    // Reset video state and error state when feed changes or on retry
    setHasError(false);
    setErrorDetails("");
    setIsLoading(true);
    
    if (videoRef.current) {
      videoRef.current.load(); // Force reload of video element with new source
      
      if (isPlaying || isLiveStream) {
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Error playing video:", error);
            setIsPlaying(false);
            
            // If autoplay fails due to browser policy
            if (error.name === "NotAllowedError") {
              console.log("Autoplay prevented by browser policy");
              setErrorDetails("Browser prevented autoplay. Click play to start the stream.");
              setHasError(false); // This is a minor issue, not a full error
            } else {
              setHasError(true);
              setErrorDetails(getErrorMessage(error));
            }
          });
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [feed.id, feed.url, retryCount]);

  // Enhanced error message function with more specific diagnostics
  const getErrorMessage = (error: any): string => {
    if (error?.name === "NotSupportedError") {
      return "The video format is not supported by your browser, or the stream might be offline.";
    } else if (error?.name === "SecurityError") {
      return "Security error: Camera access might be blocked due to CORS. Try enabling CORS on your camera server.";
    } else if (error?.name === "NetworkError" || error?.message?.includes("network")) {
      return "Network error: Unable to connect to the camera stream. Check that the IP address is correct and accessible from your current network.";
    } else if (error?.name === "NotAllowedError") {
      return "Permission denied: Browser prevented autoplay.";
    } else if (error?.code === 2) {
      return "Network error: The camera might be on a different network or behind a firewall.";
    } else if (error?.code === 3) {
      return "Decoding error: The video format might not be compatible with your browser.";
    } else if (error?.code === 4) {
      return "Format not supported: The camera stream format is not compatible or the URL might be incorrect.";
    }
    return error?.message || "Unknown error loading camera feed. Check that the camera is powered on and the URL is correct.";
  };

  useEffect(() => {
    // Determine if the current URL is a video source or IP camera stream
    const url = feed.url.toLowerCase();
    
    // Check for common video file extensions
    const isVideoFile = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || 
                       url.endsWith('.avi') || url.endsWith('.mkv');
    
    // Check for streaming protocols and IP camera patterns
    const isStream = url.includes('rtsp://') || url.includes('rtmp://') || 
                    url.includes('http://') || url.includes('https://') ||
                    url.includes('stream') || url.includes('video_feed') ||
                    /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]+)?(?:\/[\w\/\.\_\-\~\:\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]*)?$/.test(url);
                    
    // Set state based on the type of feed
    setIsVideoFeed(isVideoFile || isStream);
    setIsLiveStream(isStream && !isVideoFile);
    
    console.log("Feed URL:", url);
    console.log("Is live stream:", isStream && !isVideoFile);
    
    // Auto-play IP camera streams when loaded
    if (isStream && !isVideoFile && videoRef.current) {
      setIsPlaying(true);
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Error playing stream:", error);
          setIsPlaying(false);
          setHasError(true);
          setErrorDetails(getErrorMessage(error));
        });
      }
    }
  }, [feed.url]);

  const handleVideoLoaded = () => {
    setIsLoading(false);
    setHasError(false);
    setErrorDetails("");
    console.log("Video loaded successfully:", feed.url);
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setIsLoading(false);
    setHasError(true);
    // Get detailed error information if possible
    const videoElement = e.target as HTMLVideoElement;
    const errorCode = videoElement.error?.code;
    const errorMessage = videoElement.error?.message;
    
    console.error("Video error:", {
      code: errorCode,
      message: errorMessage,
      url: feed.url
    });
    
    let detailedError = "Failed to load camera feed";
    
    switch (errorCode) {
      case 1: // MEDIA_ERR_ABORTED
        detailedError = "Loading was aborted";
        break;
      case 2: // MEDIA_ERR_NETWORK
        detailedError = "Network error: The camera might be on a different network or the URL is incorrect";
        break;
      case 3: // MEDIA_ERR_DECODE
        detailedError = "Video decoding error or unsupported format";
        break;
      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        detailedError = "Video format not supported or camera stream unavailable. Check if the URL endpoint returns a valid video stream.";
        break;
      default:
        detailedError = errorMessage || "Unknown error loading video";
    }
    
    setErrorDetails(detailedError);
    console.error("Video failed to load:", feed.url, detailedError);
  };

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
        setIsPlaying(false);
      } else {
        setIsLoading(true); // Show loading state when attempting to play
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setHasError(false);
              setErrorDetails("");
            })
            .catch(error => {
              console.error("Error playing video:", error);
              setIsPlaying(false);
              setHasError(true);
              setErrorDetails(getErrorMessage(error));
            });
        }
      }
    }
  };

  const retryLoading = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
    setErrorDetails("");
  };

  const renderVideoContent = () => {
    if (hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 bg-muted/20">
          <Alert variant="destructive" className="max-w-md mb-4 bg-destructive/10">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <AlertDescription>
              Failed to load camera feed
            </AlertDescription>
          </Alert>
          {errorDetails && (
            <Alert className="max-w-md mb-4 bg-muted/50">
              <Info className="h-5 w-5 mr-2" />
              <AlertDescription className="text-sm whitespace-pre-wrap">
                {errorDetails}
              </AlertDescription>
            </Alert>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            For IP cameras, check that the endpoint returns a valid video stream
          </p>
          <div className="w-full h-48 mt-6 bg-muted rounded-md flex items-center justify-center">
            <img 
              src="https://images.unsplash.com/photo-1518770660439-4636190af475" 
              alt="Camera error" 
              className="max-h-full max-w-full object-contain opacity-30"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={retryLoading}
            >
              <Play className="h-4 w-4 mr-2" /> Try Again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open feed URL in new tab for manual testing
                window.open(feed.url, '_blank');
              }}
            >
              Test URL
            </Button>
          </div>
        </div>
      );
    }

    if (isVideoFeed) {
      return (
        <>
          <video 
            ref={videoRef}
            className="w-full h-full object-cover"
            src={feed.url}
            playsInline
            muted
            loop={!isLiveStream} // Only loop if not a live stream
            onLoadedData={handleVideoLoaded}
            onError={handleVideoError}
            crossOrigin="anonymous"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-white ml-3">Connecting...</p>
            </div>
          )}
          <Button 
            variant="secondary" 
            size="icon"
            className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          
          {isLiveStream && !hasError && !isLoading && (
            <div className="absolute top-12 right-4 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              LIVE
            </div>
          )}
        </>
      );
    }

    return (
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
    );
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
        {renderVideoContent()}
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
