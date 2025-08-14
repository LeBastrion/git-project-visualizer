import React, { useState } from 'react';
import MinimalDirectoryTree from './components/MinimalDirectoryTree';
import MinimalCinematicPlayback from './components/MinimalCinematicPlayback';
import MinimalPlaybackControls from './components/MinimalPlaybackControls';
import MinimalRepoSelector from './components/MinimalRepoSelector';
import { GitDataProvider } from './context/GitDataContext';
import './styles/minimalist.css';

function MinimalApp() {
  const [repoPath, setRepoPath] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [currentOperation, setCurrentOperation] = useState(null);

  return (
    <GitDataProvider>
      <div className="app">
        <header className="app-header">
          <h1>visualizer</h1>
          <MinimalRepoSelector 
            onRepoSelect={setRepoPath} 
            onBranchSelect={setSelectedBranch}
          />
        </header>

        {repoPath && selectedBranch && (
          <>
            <div className="main-content">
              <div className="left-panel">
                <MinimalDirectoryTree 
                  currentOperation={currentOperation}
                />
              </div>

              <div className="center-panel">
                <MinimalCinematicPlayback 
                  isPlaying={isPlaying}
                  speed={playbackSpeed}
                  onStepChange={setCurrentOperation}
                />
              </div>

              <div className="right-panel">
                {/* Intentionally empty for now - pure minimalism */}
              </div>
            </div>

            <MinimalPlaybackControls 
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              speed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />
          </>
        )}
      </div>
    </GitDataProvider>
  );
}

export default MinimalApp;