import YouTube from 'react-youtube';
import { useEffect, useRef } from 'react';

function YouTubePlayer({ videoId, start, end, onEnd, onProgress }) {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  const startProgress = (player) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const totalDuration = end - (start || 0);
    onProgress(0, totalDuration);

    intervalRef.current = setInterval(() => {
      try {
        if (player && player.getCurrentTime) {
          const currentTime = player.getCurrentTime() - (start || 0);
          if (currentTime >= 0 && currentTime <= totalDuration) {
            onProgress(currentTime, totalDuration);
          }
        }
      } catch (error) {
        console.error('Error getting player time:', error);
      }
    }, 100);
  };

  const onReady = (event) => {
    playerRef.current = event.target;
    startProgress(event.target);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      start: start || 0,
      end: end,
      controls: 0,
    },
  };

  return (
    <div className="media-player">
      <div className="youtube-wrapper">
        <YouTube
          videoId={videoId}
          opts={opts}
          onEnd={onEnd}
          onReady={onReady}
          className="youtube-player"
        />
      </div>
    </div>
  );
}

export default YouTubePlayer; 