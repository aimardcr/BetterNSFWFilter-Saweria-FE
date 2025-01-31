import { useEffect, useRef } from 'react';

function AudioPlayer({ src, onEnd, onProgress }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (audioElement) {
      // Set up event listeners
      audioElement.addEventListener('ended', handleEnd);
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      
      // Attempt autoplay
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Autoplay failed:", error);
        });
      }

      // Clean up
      return () => {
        audioElement.removeEventListener('ended', handleEnd);
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  const handleEnd = () => {
    if (onEnd) {
      onEnd();
    }
  };

  const handleTimeUpdate = () => {
    if (onProgress && audioRef.current) {
      onProgress(
        audioRef.current.currentTime,
        audioRef.current.duration
      );
    }
  };

  return (
    <div className="media-player">
      <div className="audio-player">
        <audio
          ref={audioRef}
          src={`data:audio/mp3;base64,${src}`}
          autoPlay
          controls={false}
        />
        <div className="audio-visualizer">
          <div className="audio-icon">
            🎵
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer; 