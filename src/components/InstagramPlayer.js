import { useRef, useEffect } from 'react';

function InstagramPlayer({ videoId, onEnd, onProgress, start = 0, end }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement) {
      // Set up event listeners
      videoElement.addEventListener('ended', handleEnd);
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('loadedmetadata', () => {
        // Set start time when video loads
        videoElement.currentTime = start;
      });
      
      // Attempt autoplay with sound
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            videoElement.muted = false;
          })
          .catch(error => {
            console.error("Autoplay failed:", error);
          });
      }

      // Clean up
      return () => {
        videoElement.removeEventListener('ended', handleEnd);
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [start]);

  const handleEnd = () => {
    if (onEnd) {
      onEnd();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime - start;
      const duration = (end || videoRef.current.duration) - start;

      if (end && videoRef.current.currentTime >= end) {
        handleEnd();
        return;
      }

      if (onProgress) {
        onProgress(currentTime, duration);
      }
    }
  };

  return (
    <div className="media-player">
      <video
        ref={videoRef}
        className="instagram-video"
        src={`${process.env.REACT_APP_API_URL}/reels/${videoId}`}
        autoPlay
        playsInline
        controls={false}
        style={{
          width: '100%',
          height: '100%',
          maxWidth: 'calc((80vh - 20px) * 9/16)',
          objectFit: 'contain',
          background: 'transparent',
          position: 'relative',
          zIndex: 1
        }}
      />
    </div>
  );
}

export default InstagramPlayer; 