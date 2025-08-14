import React from 'react';
import '../styles/MinimalPlaybackControls.css';

const MinimalPlaybackControls = ({ 
  isPlaying, 
  onPlayPause, 
  speed, 
  onSpeedChange 
}) => {
  return (
    <div className="minimal-playback-controls">
      <button 
        className="play-control"
        onClick={onPlayPause}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '||' : '▶'}
      </button>
      
      <div className="speed-control">
        <span className="speed-label">speed</span>
        <select 
          value={speed} 
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="speed-select"
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={5}>5×</option>
        </select>
      </div>
    </div>
  );
};

export default MinimalPlaybackControls;