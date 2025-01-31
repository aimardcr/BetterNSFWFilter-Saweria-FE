import { useEffect, useRef, useState } from 'react';

function TikTokPlayer({ videoId, onEnd, start = 0, end }) {
  const iframeRef = useRef(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'onMute') {
        setIsPlayerReady(true);
      }
      if (event.data.type === 'onStateChange' && event.data.value === 0) {
        onEnd();
      }
    };

    window.addEventListener('message', handleMessage);

    const duration = end ? (end - start) * 1000 : 30000;
    const timer = setTimeout(() => {
      onEnd();
    }, duration);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [onEnd, start, end]);

  useEffect(() => {
    if (isPlayerReady) {    
      unMute();
      if (start > 0 && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: "seekTo",
          value: start,
          "x-tiktok-player": true
        }, '*');
      }
    }
  }, [isPlayerReady, start]);

  const unMute = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: "unMute",
        value: true,
        "x-tiktok-player": true
      }, '*');
    }
  };

  return (
    <div className="media-player">
      <iframe
        ref={iframeRef}
        className="tiktok-embed"
        src={`https://www.tiktok.com/player/v1/${videoId}?&music_info=0&description=0&autoplay=1&control=0&progress_bar=0&timestamp=0&rel=0&native_context_menu=0&start=${start}&end=${end || ''}`}
        allow="autoplay; fullscreen"
        title="TikTok"
      />
    </div>
  );
}

export default TikTokPlayer; 