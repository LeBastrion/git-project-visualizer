import React, { useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/PlaybackControls.css';

const PlaybackControls = ({ 
  isPlaying, 
  onPlayPause, 
  speed, 
  onSpeedChange, 
  currentTime, 
  onTimeChange 
}) => {
  const { commits } = useGitData();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying && commits.length > 0) {
      const minTime = Math.min(...commits.map(c => new Date(c.date).getTime()));
      const maxTime = Math.max(...commits.map(c => new Date(c.date).getTime()));
      const duration = maxTime - minTime;
      const increment = (duration / 1000) * speed;

      intervalRef.current = setInterval(() => {
        onTimeChange(prevTime => {
          const newTime = (prevTime || minTime) + increment;
          if (newTime >= maxTime) {
            onPlayPause();
            return maxTime;
          }
          return newTime;
        });
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, speed, commits]);

  const handleScrub = (e) => {
    if (commits.length === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const minTime = Math.min(...commits.map(c => new Date(c.date).getTime()));
    const maxTime = Math.max(...commits.map(c => new Date(c.date).getTime()));
    const newTime = minTime + (maxTime - minTime) * percent;
    
    onTimeChange(newTime);
  };

  const getProgress = () => {
    if (commits.length === 0 || !currentTime) return 0;
    
    const minTime = Math.min(...commits.map(c => new Date(c.date).getTime()));
    const maxTime = Math.max(...commits.map(c => new Date(c.date).getTime()));
    
    return ((currentTime - minTime) / (maxTime - minTime)) * 100;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="playback-controls">
      <div className="controls-main">
        <button 
          className="play-button"
          onClick={onPlayPause}
          disabled={commits.length === 0}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <div className="speed-controls">
          <label>Speed:</label>
          <select value={speed} onChange={(e) => onSpeedChange(Number(e.target.value))}>
            <option value={0.25}>0.25x (Slow)</option>
            <option value={0.5}>0.5x</option>
            <option value={1}>1x (Normal)</option>
            <option value={2}>2x (Fast)</option>
            <option value={5}>5x (Demo)</option>
            <option value={10}>10x (Quick)</option>
          </select>
        </div>
        
        <div className="time-display">
          {formatTime(currentTime)}
        </div>
      </div>
      
      <div className="scrubber" onClick={handleScrub}>
        <div className="scrubber-track">
          <div 
            className="scrubber-progress" 
            style={{ width: `${getProgress()}%` }}
          />
          <div 
            className="scrubber-handle" 
            style={{ left: `${getProgress()}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default PlaybackControls;