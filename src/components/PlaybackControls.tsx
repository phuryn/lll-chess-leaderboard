import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from "lucide-react";

interface PlaybackControlsProps {
  currentMove: number;
  totalMoves: number;
  isPlaying: boolean;
  speed: number;
  onPrevious: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onEnd: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function PlaybackControls({
  currentMove,
  totalMoves,
  isPlaying,
  speed,
  onPrevious,
  onNext,
  onPlay,
  onPause,
  onReset,
  onEnd,
  onSpeedChange,
}: PlaybackControlsProps) {
  return (
    <div className="space-y-4">
      {/* Move indicator */}
      <div className="text-center text-sm text-muted-foreground">
        Move {currentMove} of {totalMoves}
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" size="icon" onClick={onReset} disabled={currentMove === 0}>
          <Rewind className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onPrevious} disabled={currentMove === 0}>
          <SkipBack className="h-4 w-4" />
        </Button>
        {isPlaying ? (
          <Button variant="default" size="icon" onClick={onPause}>
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="default" size="icon" onClick={onPlay} disabled={currentMove === totalMoves}>
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" size="icon" onClick={onNext} disabled={currentMove === totalMoves}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={onEnd} disabled={currentMove === totalMoves}>
          <FastForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Speed control */}
      <div className="flex items-center gap-4 px-4">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Speed:</span>
        <Slider
          value={[speed]}
          min={0.5}
          max={3}
          step={0.5}
          onValueChange={(value) => onSpeedChange(value[0])}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-12">{speed}s</span>
      </div>
    </div>
  );
}
