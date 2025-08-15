import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/EpicProcessVisualizer.css';

const EpicProcessVisualizer = ({ isPlaying, speed, onStepChange }) => {
  const { commits, fetchFileContent, fetchDiff } = useGitData();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileOperations, setFileOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [displayMode, setDisplayMode] = useState('overview');
  const [diffLines, setDiffLines] = useState([]);
  const [visibleDiffLines, setVisibleDiffLines] = useState(0);
  const [afterContent, setAfterContent] = useState([]);
  const [visibleContentLines, setVisibleContentLines] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (commits.length === 0) return;
    
    const operations = [];
    commits.forEach((commit, idx) => {
      if (commit.files && commit.files.length > 0) {
        operations.push({
          type: 'commit',
          commit: commit,
          files: commit.files,
          index: idx
        });
      }
    });
    
    setFileOperations(operations);
  }, [commits]);

  useEffect(() => {
    if (!isPlaying || fileOperations.length === 0) return;

    const processStep = async () => {
      if (currentStep >= fileOperations.length) {
        setCurrentStep(0);
        return;
      }

      const operation = fileOperations[currentStep];
      setCurrentOperation(operation);
      
      if (onStepChange) onStepChange(operation);

      // Show impressive commit overview with longer hold time
      setDisplayMode('overview');
      setCurrentFileIndex(0);
      await new Promise(resolve => setTimeout(resolve, 4000 / speed)); // Hold longer on commit message

      // Process each file with animations
      for (let i = 0; i < operation.files.length; i++) {
        setCurrentFileIndex(i);
        await displayFileChange(operation.commit, operation.files[i]);
        await new Promise(resolve => setTimeout(resolve, 3500 / speed));
      }

      setCurrentStep(prev => prev + 1);
    };

    processStep();
  }, [currentStep, isPlaying, fileOperations, speed]);

  const displayFileChange = async (commit, file) => {
    try {
      if (file.deletions === 0 && file.insertions > 0) {
        // New file creation with dramatic reveal
        setDisplayMode('creating');
        const content = await fetchFileContent(commit.hash, file.file);
        const lines = (content.content || '').split('\n').slice(0, 50); // Show first 50 lines
        setAfterContent(lines);
        setVisibleContentLines(0);
        
        // Animate lines appearing
        animateContentReveal(lines.length);
      } else {
        // File modification with sophisticated diff animation
        setDisplayMode('modifying');
        const diff = await fetchDiff(commit.hash, file.file);
        if (diff && diff.diff) {
          const parsed = parseDiff(diff.diff);
          setDiffLines(parsed);
          setVisibleDiffLines(0);
          
          // Animate diff lines
          animateDiffReveal(parsed.length);
        }
      }
    } catch (error) {
      console.error('Error displaying file:', error);
    }
  };

  const animateContentReveal = (totalLines) => {
    let currentLine = 0;
    const animate = () => {
      if (currentLine <= totalLines && isPlaying) {
        setVisibleContentLines(currentLine);
        currentLine += 2; // Reveal 2 lines at a time for smooth effect
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const animateDiffReveal = (totalChunks) => {
    let currentChunk = 0;
    const animate = () => {
      if (currentChunk <= totalChunks && isPlaying) {
        setVisibleDiffLines(currentChunk);
        currentChunk++;
        setTimeout(() => {
          animationRef.current = requestAnimationFrame(animate);
        }, 300); // Delay between chunks for dramatic effect
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const parseDiff = (diff) => {
    const lines = diff.split('\n');
    const changes = [];
    let currentChanges = [];
    
    lines.forEach(line => {
      if (line.startsWith('@@')) {
        if (currentChanges.length > 0) {
          changes.push(currentChanges);
          currentChanges = [];
        }
      } else if (line.startsWith('+')) {
        currentChanges.push({ type: 'add', content: line.substring(1) });
      } else if (line.startsWith('-')) {
        currentChanges.push({ type: 'remove', content: line.substring(1) });
      } else if (line.length > 0 && !line.startsWith('\\')) {
        currentChanges.push({ type: 'context', content: line });
      }
    });
    
    if (currentChanges.length > 0) {
      changes.push(currentChanges);
    }
    
    return changes;
  };

  const renderOverview = () => {
    if (!currentOperation) return null;
    const { commit, files } = currentOperation;
    
    return (
      <div className="epic-overview">
        <div className="commit-backdrop">
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
        
        <div className="commit-content">
          <div className="commit-label">COMMIT #{currentStep + 1}</div>
          
          <div className="commit-title">
            {commit.message.split('\n')[0]}
          </div>
          
          {commit.message.split('\n').length > 1 && (
            <div className="commit-description">
              {commit.message.split('\n').slice(1).join(' ')}
            </div>
          )}
          
          <div className="commit-metadata">
            <span className="author">{commit.author}</span>
            <span className="separator">•</span>
            <span className="timestamp">{new Date(commit.date).toLocaleDateString()}</span>
          </div>
          
          <div className="files-grid">
            {files.map((file, idx) => (
              <div 
                key={idx} 
                className={`file-card ${idx === currentFileIndex ? 'active' : ''}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="file-card-icon">
                  {file.deletions === 0 ? '✨' : '⚡'}
                </div>
                <div className="file-card-name">{file.file.split('/').pop()}</div>
                <div className="file-card-stats">
                  <span className="stat-add">+{file.insertions}</span>
                  <span className="stat-del">-{file.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCreation = () => {
    if (!currentOperation) return null;
    const file = currentOperation.files[currentFileIndex];
    
    return (
      <div className="epic-creation">
        <div className="creation-header">
          <div className="action-badge new">
            <span className="badge-icon">✨</span>
            <span className="badge-text">CREATING</span>
          </div>
          <div className="file-info">
            <div className="file-path">{file.file}</div>
            <div className="file-impact">{file.insertions} lines of new code</div>
          </div>
        </div>
        
        <div className="code-container">
          <div className="code-glow"></div>
          <pre className="code-content">
            {afterContent.slice(0, visibleContentLines).map((line, idx) => (
              <div 
                key={idx} 
                className="code-line appearing"
                style={{ animationDelay: `${idx * 0.02}s` }}
              >
                <span className="line-num">{idx + 1}</span>
                <span className="line-text">{line || '\u00A0'}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  };

  const renderModification = () => {
    if (!currentOperation) return null;
    const file = currentOperation.files[currentFileIndex];
    
    return (
      <div className="epic-modification">
        <div className="modification-header">
          <div className="action-badge modify">
            <span className="badge-icon">⚡</span>
            <span className="badge-text">MODIFYING</span>
          </div>
          <div className="file-info">
            <div className="file-path">{file.file}</div>
            <div className="file-impact">
              <span className="impact-add">+{file.insertions}</span>
              <span className="impact-del">-{file.deletions}</span>
              <span className="impact-text">lines changed</span>
            </div>
          </div>
        </div>
        
        <div className="diff-visualization">
          {diffLines.slice(0, visibleDiffLines).map((chunk, chunkIdx) => (
            <div 
              key={chunkIdx} 
              className="diff-chunk appearing"
              style={{ animationDelay: `${chunkIdx * 0.2}s` }}
            >
              {chunk.map((change, changeIdx) => (
                <div 
                  key={changeIdx} 
                  className={`diff-line ${change.type}`}
                >
                  {change.type === 'add' && (
                    <>
                      <span className="diff-indicator add">+</span>
                      <span className="diff-text">{change.content}</span>
                      <span className="diff-glow"></span>
                    </>
                  )}
                  {change.type === 'remove' && (
                    <>
                      <span className="diff-indicator remove">-</span>
                      <span className="diff-text">{change.content}</span>
                    </>
                  )}
                  {change.type === 'context' && (
                    <>
                      <span className="diff-indicator context"> </span>
                      <span className="diff-text">{change.content}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!currentOperation) {
    return (
      <div className="epic-visualizer empty">
        <div className="empty-animation">
          <div className="orbit orbit-1"></div>
          <div className="orbit orbit-2"></div>
          <div className="orbit orbit-3"></div>
          <div className="center-dot"></div>
        </div>
        <div className="empty-text">READY TO VISUALIZE</div>
      </div>
    );
  }

  return (
    <div className="epic-visualizer">
      <div className="visualizer-stage">
        {displayMode === 'overview' && renderOverview()}
        {displayMode === 'creating' && renderCreation()}
        {displayMode === 'modifying' && renderModification()}
      </div>
      
      <div className="progress-indicator">
        <div className="progress-track">
          <div 
            className="progress-glow"
            style={{ width: `${((currentStep + 1) / fileOperations.length) * 100}%` }}
          />
          <div 
            className="progress-bar"
            style={{ width: `${((currentStep + 1) / fileOperations.length) * 100}%` }}
          />
        </div>
        <div className="progress-label">
          {currentStep + 1} / {fileOperations.length}
        </div>
      </div>
    </div>
  );
};

export default EpicProcessVisualizer;