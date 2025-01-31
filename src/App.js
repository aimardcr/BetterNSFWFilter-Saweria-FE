import { useState, useEffect } from 'react';
import YouTubePlayer from './components/YouTubePlayer';
import TikTokPlayer from './components/TikTokPlayer';
import InstagramPlayer from './components/InstagramPlayer';
import AudioPlayer from './components/AudioPlayer';
import './App.css';
import axios from 'axios';

function App() {
  const checkVideo = async (mediaType, videoId) => {
    try {
      let url;
      if (mediaType === 'youtube') {
        url = `https://youtube.com/watch?v=${videoId}`;
      } else if (mediaType === 'tiktok') {
        url = `https://www.tiktok.com/@user/video/${videoId}`;
      } else if (mediaType === 'instagram') {
        url = `https://www.instagram.com/reel/${videoId}`;
      }

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/check-video`, {
        url: url
      });

      return response.data;
    } catch (error) {
      console.error('Error checking video:', error);
      return null;
    }
  };

  const getMediaType = (type) => {
    switch (type) {
      case 'yt':
        return 'youtube';
      case 'reels':
        return 'instagram';
      case 'voice_note':
        return 'audio';
      default:
        return type;
    }
  };

  const [currentMedia, setCurrentMedia] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [template, setTemplate] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const streamKey = urlParams.get('streamKey');

    fetch(`${process.env.REACT_APP_API_URL}/get-mediashare-template`, {
      headers: {
        'stream-key': streamKey
      },
    })
      .then(res => res.json())
      .then(data => setTemplate(data.data))
      .catch(err => console.error('Error fetching template:', err));

    const socket = new WebSocket(`wss://events.saweria.co/stream?streamKey=${streamKey}`);

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      
      if (response.type === 'donation') {
        response.data.forEach(donation => {
          if (donation.media && donation.media?.tag !== 'picture') {
            setQueue(prevQueue => [...prevQueue, {
              id: Date.now(),
              type: getMediaType(donation.media.type),
              videoId: donation.media.id,
              src: donation.media.src,
              start: donation.media.start || 0,
              end: donation.media.end,
              duration: (donation.media.end - donation.media.start) || 30,
              donator: donation.donator,
              amount: donation.amount,
              currency: donation.currency,
              message: donation.message,
              is_replay: donation.is_replay || false
            }]);
          }
        });
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (queue.length > 0 && !currentMedia) {
      const processNextMedia = async () => {
        const nextMedia = queue[0];
        let timer;
        
        const videoCheck = await checkVideo(nextMedia.type, nextMedia.videoId);
        
        if (videoCheck && videoCheck.is_nsfw && !nextMedia.is_replay) {
          setIsVisible(true);
          setCurrentMedia({
            ...nextMedia,
            isNSFW: true,
            nsfwConfidence: videoCheck.max_confidence,
            duration: 10
          });
          setQueue(prevQueue => prevQueue.slice(1));
          
          timer = setTimeout(() => {
            setIsVisible(false);
            setCurrentMedia(null);
          }, 5000);
        } else {
          setIsVisible(true);
          setCurrentMedia(nextMedia);
          setQueue(prevQueue => prevQueue.slice(1));

          timer = setTimeout(() => {
            setIsVisible(false);
            setCurrentMedia(null);
          }, nextMedia.duration * 1000);
        }

        return () => {
          if (timer) clearTimeout(timer);
        };
      };

      processNextMedia();
    }
  }, [queue, currentMedia]);

  const handleMediaEnd = () => {
    setIsVisible(false);
    setCurrentMedia(null);
  };

  const renderMedia = () => {
    if (!currentMedia) return null;

    if (currentMedia.isNSFW) {
      return (
        <div className="nsfw-message">
          Media ini {currentMedia.nsfwConfidence}% kemungkinan adalah konten NSFW. <br />
          Silahkan gunakan fitur Replay untuk memunculkan media ini.
        </div>
      );
    }

    switch (currentMedia.type) {
      case 'youtube':
        return (
          <YouTubePlayer
            videoId={currentMedia.videoId}
            start={currentMedia.start}
            end={currentMedia.end}
            onEnd={handleMediaEnd}
            onProgress={(current, total) => setProgress({ current, total })}
          />
        );
      case 'tiktok':
        return (
          <TikTokPlayer
            videoId={currentMedia.videoId}
            start={currentMedia.start}
            end={currentMedia.end}
            onEnd={handleMediaEnd}
          />
        );
      case 'instagram':
        return (
          <InstagramPlayer
            videoId={currentMedia.videoId}
            start={currentMedia.start}
            end={currentMedia.end}
            onEnd={handleMediaEnd}
            onProgress={(current, total) => setProgress({ current, total })}
          />
        );
      case 'audio':
        return (
          <AudioPlayer
            src={currentMedia.src}
            onEnd={handleMediaEnd}
            onProgress={(current, total) => setProgress({ current, total })}
          />
        );
      default:
        return null;
    }
  };

  const formatDonationMessage = (donator, amount, currency) => {
    if (!template?.tts_template) return `Donated by: ${donator} (${amount} ${currency})`;
    
    return (
      <>
        <span style={{ color: template.text2_color }}>{donator}</span> &nbsp;
        <span style={{ color: template.text1_color }}> {template.tts_template} </span> &nbsp;
        <span style={{ color: template.text2_color }}>{currency}{amount}</span>
      </>
    );
  };

  if (!isVisible) return null;

  const donationInfoStyle = template ? {
    backgroundColor: template.background_color || 'rgba(0, 0, 0, 0.7)',
    fontFamily: template.text1_font || 'inherit',
    fontWeight: template.text1_weight || 'bold',
    border: template.no_border ? 'none' : '2px solid ' + (template.highlight_color || 'transparent')
  } : {};

  const messageStyle = template ? {
    color: template.text1_color || '#ffffff',
    fontFamily: template.text1_font || 'inherit',
    fontWeight: template.text1_weight || 'normal',
  } : {};

  return (
    <div className="media-overlay">
      <div className="media-container">
        {renderMedia()}
        {(currentMedia?.type === 'youtube' || currentMedia?.type === 'instagram') && (
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: progress.total ? `${(progress.current / progress.total) * 100}%` : '0%'
              }}
            />
          </div>
        )}
        <div className="donation-container" style={donationInfoStyle}>
          <div className="donation-content">
            {currentMedia && (
              <>
                <div className="donation-text">
                  {formatDonationMessage(
                    currentMedia.donator,
                    currentMedia.amount,
                    currentMedia.currency
                  )}
                </div>
                {currentMedia.message && (
                  <div 
                    className="message" 
                    style={{
                      ...messageStyle,
                      '--length': currentMedia.message.length / 15
                    }}
                  >
                    {currentMedia.message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
