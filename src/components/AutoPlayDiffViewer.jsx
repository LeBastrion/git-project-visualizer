import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/AutoPlayDiffViewer.css';

const AutoPlayDiffViewer = ({ currentTime, isPlaying }) => {
  const { commits, fetchDiff, fetchFileContent, fetchFileTree } = useGitData();
  const [currentFile, setCurrentFile] = useState(null);
  const [diffContent, setDiffContent] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [previousContent, setPreviousContent] = useState('');
  const [animatingLines, setAnimatingLines] = useState(new Set());
  const [displayMode, setDisplayMode] = useState('creating'); // 'creating', 'editing', 'viewing'
  const [typedContent, setTypedContent] = useState('');
  const typewriterRef = useRef(null);
  const lastCommitRef = useRef(null);

  // Find the current commit based on time
  const getCurrentCommit = () => {
    if (!currentTime || commits.length === 0) return null;
    
    let closest = commits[0];
    commits.forEach(commit => {
      const commitTime = new Date(commit.date).getTime();
      const closestTime = new Date(closest.date).getTime();
      if (Math.abs(commitTime - currentTime) < Math.abs(closestTime - currentTime)) {
        closest = commit;
      }
    });
    return closest;
  };

  useEffect(() => {
    const currentCommit = getCurrentCommit();
    if (!currentCommit || currentCommit.hash === lastCommitRef.current) return;
    
    lastCommitRef.current = currentCommit.hash;
    processCommitFiles(currentCommit);
  }, [currentTime, commits]);

  const processCommitFiles = async (commit) => {
    if (!commit.files || commit.files.length === 0) return;

    // Get the most significant file change in this commit
    const significantFile = commit.files.reduce((prev, curr) => {
      const prevChanges = (prev.insertions || 0) + (prev.deletions || 0);
      const currChanges = (curr.insertions || 0) + (curr.deletions || 0);
      return currChanges > prevChanges ? curr : prev;
    }, commit.files[0]);

    setCurrentFile(significantFile);

    // Determine if file is being created or edited
    const isNewFile = significantFile.insertions > 0 && significantFile.deletions === 0;
    
    if (isNewFile) {
      setDisplayMode('creating');
      await animateFileCreation(commit, significantFile);
    } else {
      setDisplayMode('editing');
      await animateFileEdit(commit, significantFile);
    }
  };

  const animateFileCreation = async (commit, file) => {
    try {
      const content = await fetchFileContent(commit.hash, file.file);
      const lines = content.content.split('\n');
      
      // Typewriter effect for new files
      setTypedContent('');
      setPreviousContent('');
      setFileContent(content.content);
      
      if (!isPlaying) {
        setTypedContent(content.content);
        return;
      }

      let currentText = '';
      const charsPerFrame = Math.max(1, Math.floor(content.content.length / 60)); // Complete in ~1 second at 60fps
      
      for (let i = 0; i < content.content.length; i += charsPerFrame) {
        currentText = content.content.substring(0, i + charsPerFrame);
        setTypedContent(currentText);
        await new Promise(resolve => setTimeout(resolve, 16)); // ~60fps
      }
      setTypedContent(content.content);
    } catch (error) {
      console.error('Error animating file creation:', error);
    }
  };

  const animateFileEdit = async (commit, file) => {
    try {
      const diff = await fetchDiff(commit.hash, file.file);
      setDiffContent(diff.diff);
      
      const currentContent = await fetchFileContent(commit.hash, file.file);
      setFileContent(currentContent.content);
      
      try {
        const prevContent = await fetchFileContent(`${commit.hash}~1`, file.file);
        setPreviousContent(prevContent.content);
      } catch {
        setPreviousContent('');
      }

      // Animate the diff lines
      const diffLines = parseDiffForAnimation(diff.diff);
      animateDiffLines(diffLines);
    } catch (error) {
      console.error('Error animating file edit:', error);
    }
  };

  const parseDiffForAnimation = (diff) => {
    if (!diff) return [];
    const lines = diff.split('\n');
    const changes = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        changes.push({ index, type: 'addition', content: line.substring(1) });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        changes.push({ index, type: 'deletion', content: line.substring(1) });
      }
    });
    
    return changes;
  };

  const animateDiffLines = async (diffLines) => {
    if (!isPlaying) {
      setAnimatingLines(new Set(diffLines.map(d => d.index)));
      return;
    }

    const animated = new Set();
    for (const line of diffLines) {
      animated.add(line.index);
      setAnimatingLines(new Set(animated));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const renderFileContent = () => {
    if (displayMode === 'creating') {
      return (
        <div className="file-creation">
          <div className="file-header">
            <span className="file-action">✨ Creating</span>
            <span className="file-name">{currentFile?.file || 'New File'}</span>
          </div>
          <pre className="file-content typewriter">
            {typedContent}
            <span className="cursor">|</span>
          </pre>
        </div>
      );
    } else if (displayMode === 'editing' && diffContent) {
      const lines = diffContent.split('\n');
      return (
        <div className="file-editing">
          <div className="file-header">
            <span className="file-action">📝 Editing</span>
            <span className="file-name">{currentFile?.file || 'File'}</span>
          </div>
          <div className="diff-content-animated">
            {lines.map((line, index) => {
              const isAnimating = animatingLines.has(index);
              let lineClass = 'diff-line';
              
              if (line.startsWith('+') && !line.startsWith('+++')) {
                lineClass += ' addition';
                if (isAnimating) lineClass += ' animating';
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                lineClass += ' deletion';
                if (isAnimating) lineClass += ' animating';
              } else if (line.startsWith('@@')) {
                lineClass += ' chunk-header';
              }
              
              return (
                <div key={index} className={lineClass}>
                  {line}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    return (
      <div className="no-content">
        <p>Waiting for file changes...</p>
      </div>
    );
  };

  const currentCommit = getCurrentCommit();

  return (
    <div className="auto-play-diff-viewer">
      <div className="viewer-header">
        <div className="commit-info">
          {currentCommit && (
            <>
              <span className="commit-hash">{currentCommit.hash.substring(0, 7)}</span>
              <span className="commit-message">{currentCommit.message}</span>
              <span className="commit-author">{currentCommit.author}</span>
            </>
          )}
        </div>
        <div className="file-stats">
          {currentFile && (
            <>
              <span className="stats-additions">+{currentFile.insertions || 0}</span>
              <span className="stats-deletions">-{currentFile.deletions || 0}</span>
            </>
          )}
        </div>
      </div>
      
      <div className="viewer-content">
        {renderFileContent()}
      </div>
    </div>
  );
};

export default AutoPlayDiffViewer;