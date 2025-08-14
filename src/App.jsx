import React, { useState, useEffect, useRef } from 'react';
import Timeline from './components/Timeline';
import DirectoryTree from './components/DirectoryTree';
import AutoPlayDiffViewer from './components/AutoPlayDiffViewer';
import CommitGraph from './components/CommitGraph';
import ConversationHistory from './components/ConversationHistory';
import PlaybackControls from './components/PlaybackControls';
import RepoSelector from './components/RepoSelector';
import { GitDataProvider } from './context/GitDataContext';
import './styles/App.css';

function App() {
  const [repoPath, setRepoPath] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  return (
    <GitDataProvider>
      <div className="app">
        <header className="app-header">
          <h1>Git Project Visualizer</h1>
          <RepoSelector 
            onRepoSelect={setRepoPath} 
            onBranchSelect={setSelectedBranch}
          />
        </header>

        {repoPath && selectedBranch && (
          <>
            <div className="timeline-container">
              <Timeline 
                branch={selectedBranch}
                currentTime={currentTime}
                onTimeChange={setCurrentTime}
                onCommitSelect={setSelectedCommit}
              />
            </div>

            <div className="main-content">
              <div className="left-panel">
                <DirectoryTree 
                  branch={selectedBranch}
                  currentTime={currentTime}
                  onFileSelect={setSelectedFile}
                />
              </div>

              <div className="center-panel">
                <AutoPlayDiffViewer 
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                />
              </div>

              <div className="right-panel">
                <ConversationHistory 
                  currentTime={currentTime}
                  selectedCommit={selectedCommit}
                />
              </div>
            </div>

            <div className="bottom-panel">
              <CommitGraph 
                branch={selectedBranch}
                onCommitSelect={setSelectedCommit}
                selectedCommit={selectedCommit}
              />
            </div>

            <PlaybackControls 
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              speed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
              currentTime={currentTime}
              onTimeChange={setCurrentTime}
            />
          </>
        )}
      </div>
    </GitDataProvider>
  );
}

export default App;