import React, { useState, useEffect } from 'react';
import MinimalDirectoryTree from './components/MinimalDirectoryTree';
import ZenProcessVisualizer from './components/ZenProcessVisualizer';
import MinimalPlaybackControls from './components/MinimalPlaybackControls';
import MinimalRepoSelector from './components/MinimalRepoSelector';
import { GitDataProvider, useGitData } from './context/GitDataContext';
import './styles/minimalist.css';

function MinimalAppContent() {
  const [repoPath, setRepoPath] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);
  const [currentOperation, setCurrentOperation] = useState(null);
  const { fetchCommits } = useGitData();

  useEffect(() => {
    if (selectedBranch) {
      console.log('Fetching commits for branch:', selectedBranch);
      fetchCommits(selectedBranch);
    }
  }, [selectedBranch]);

  return (
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
              <ZenProcessVisualizer 
                isPlaying={isPlaying}
                speed={playbackSpeed}
                onStepChange={setCurrentOperation}
              />
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
  );
}

function MinimalApp() {
  return (
    <GitDataProvider>
      <MinimalAppContent />
    </GitDataProvider>
  );
}

export default MinimalApp;