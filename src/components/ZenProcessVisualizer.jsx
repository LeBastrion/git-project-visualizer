import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/ZenProcessVisualizer.css';

const ZenProcessVisualizer = ({ isPlaying, speed, onStepChange, onComplete }) => {
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
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    if (commits.length === 0) return;
    
    // Reverse commits to play chronologically (oldest first)
    const chronologicalCommits = [...commits].reverse();
    
    const operations = [];
    chronologicalCommits.forEach((commit, idx) => {
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
    
    // Reset completion state when starting playback
    if (isComplete && currentStep >= fileOperations.length) {
      setCurrentStep(0);
      setIsComplete(false);
      setDisplayMode('overview');
    }

    const processStep = async () => {
      if (currentStep >= fileOperations.length) {
        // Stop playback at the end instead of looping
        setIsComplete(true);
        setDisplayMode('complete');
        if (onComplete) onComplete();
        return;
      }

      const operation = fileOperations[currentStep];
      setCurrentOperation(operation);
      
      if (onStepChange) onStepChange(operation);

      // Show commit overview with proper timing
      setDisplayMode('overview');
      setCurrentFileIndex(0);
      await new Promise(resolve => setTimeout(resolve, 5000 / speed));

      // Process each file
      for (let i = 0; i < operation.files.length; i++) {
        setCurrentFileIndex(i);
        const currentFile = operation.files[i];
        
        // Update the operation with current file info for directory tree
        if (onStepChange) {
          onStepChange({
            ...operation,
            path: currentFile.file,
            type: (currentFile.deletions === 0 && currentFile.insertions > 0) ? 'create' : 'modify',
            files: operation.files
          });
        }
        
        await displayFileChange(operation.commit, currentFile);
        await new Promise(resolve => setTimeout(resolve, 4000 / speed));
      }

      setCurrentStep(prev => prev + 1);
    };

    processStep();
  }, [currentStep, isPlaying, fileOperations, speed]);

  const displayFileChange = async (commit, file) => {
    try {
      if (file.deletions === 0 && file.insertions > 0) {
        setDisplayMode('creating');
        const content = await fetchFileContent(commit.hash, file.file);
        const lines = (content.content || '').split('\n').slice(0, 40);
        setAfterContent(lines);
        setVisibleContentLines(0);
        
        // Smooth line reveal
        let currentLine = 0;
        const animate = () => {
          if (currentLine <= lines.length && isPlaying) {
            setVisibleContentLines(currentLine);
            currentLine += 1;
            setTimeout(() => {
              animationRef.current = requestAnimationFrame(animate);
            }, 30);
          }
        };
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayMode('modifying');
        const diff = await fetchDiff(commit.hash, file.file);
        if (diff && diff.diff) {
          const parsed = parseDiff(diff.diff);
          setDiffLines(parsed);
          setVisibleDiffLines(0);
          
          // Smooth diff reveal
          let currentChunk = 0;
          const animate = () => {
            if (currentChunk <= parsed.length && isPlaying) {
              setVisibleDiffLines(currentChunk);
              currentChunk++;
              setTimeout(() => {
                animationRef.current = requestAnimationFrame(animate);
              }, 200);
            }
          };
          animationRef.current = requestAnimationFrame(animate);
        }
      }
    } catch (error) {
      console.error('Error displaying file:', error);
    }
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
      <div className="zen-overview">
        <div className="commit-structure">
          <div className="commit-index">
            {String(currentStep + 1).padStart(2, '0')}
          </div>
          
          <div className="commit-core">
            <div className="commit-title">
              {commit.message.split('\n')[0]}
            </div>
            
            {commit.message.split('\n').length > 1 && (
              <div className="commit-detail">
                {commit.message.split('\n').slice(1).join(' ').trim()}
              </div>
            )}
            
            <div className="commit-meta">
              <span className="meta-author">{commit.author}</span>
              <span className="meta-date">{new Date(commit.date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="files-manifest">
          {files.map((file, idx) => (
            <div 
              key={idx} 
              className={`file-entry ${idx === currentFileIndex ? 'active' : ''}`}
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <div className="file-indicator">
                {file.deletions === 0 ? 'NEW' : 'MOD'}
              </div>
              <div className="file-name">{file.file}</div>
              <div className="file-metrics">
                <span className="metric-add">+{file.insertions}</span>
                <span className="metric-del">-{file.deletions}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCreation = () => {
    if (!currentOperation) return null;
    const file = currentOperation.files[currentFileIndex];
    
    return (
      <div className="zen-creation">
        <div className="operation-header">
          <div className="operation-type">CREATE</div>
          <div className="operation-target">{file.file}</div>
          <div className="operation-scale">{file.insertions} lines</div>
        </div>
        
        <div className="code-viewport">
          <div className="code-lines">
            {afterContent.slice(0, visibleContentLines).map((line, idx) => (
              <div 
                key={idx} 
                className="code-line"
                style={{ animationDelay: `${idx * 0.01}s` }}
              >
                <span className="line-number">{idx + 1}</span>
                <span className="line-content">{line || '\u00A0'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderModification = () => {
    if (!currentOperation) return null;
    const file = currentOperation.files[currentFileIndex];
    
    return (
      <div className="zen-modification">
        <div className="operation-header">
          <div className="operation-type">MODIFY</div>
          <div className="operation-target">{file.file}</div>
          <div className="operation-scale">
            <span className="scale-add">+{file.insertions}</span>
            <span className="scale-del">-{file.deletions}</span>
          </div>
        </div>
        
        <div className="diff-viewport">
          {diffLines.slice(0, visibleDiffLines).map((chunk, chunkIdx) => (
            <div 
              key={chunkIdx} 
              className="diff-chunk"
              style={{ animationDelay: `${chunkIdx * 0.1}s` }}
            >
              {chunk.map((change, changeIdx) => (
                <div 
                  key={changeIdx} 
                  className={`diff-line ${change.type}`}
                >
                  <span className="diff-marker">
                    {change.type === 'add' ? '+' : change.type === 'remove' ? '-' : ' '}
                  </span>
                  <span className="diff-content">{change.content}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComplete = () => {
    // Calculate actual statistics
    const totalFiles = new Set();
    let createdCount = 0;
    let modifiedCount = 0;
    
    fileOperations.forEach(op => {
      op.files.forEach(file => {
        const filepath = file.file || file.path;
        if (!totalFiles.has(filepath)) {
          // First time seeing this file - it's being created
          createdCount++;
          totalFiles.add(filepath);
        } else {
          // File already exists - it's being modified
          modifiedCount++;
        }
      });
    });
    
    return (
      <div className="zen-complete">
        <div className="complete-indicator">COMPLETE</div>
        <div className="complete-stats">
          <div className="stat-line">
            <span className="stat-label">COMMITS PROCESSED</span>
            <span className="stat-value">{fileOperations.length}</span>
          </div>
          <div className="stat-line">
            <span className="stat-label">FILES CREATED</span>
            <span className="stat-value">{createdCount}</span>
          </div>
          <div className="stat-line">
            <span className="stat-label">FILES MODIFIED</span>
            <span className="stat-value">{modifiedCount}</span>
          </div>
          <div className="stat-line">
            <span className="stat-label">TOTAL OPERATIONS</span>
            <span className="stat-value">{createdCount + modifiedCount}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!currentOperation && !isComplete) {
    return (
      <div className="zen-visualizer empty">
        <div className="empty-message">READY</div>
      </div>
    );
  }

  return (
    <div className="zen-visualizer">
      <div className="visualization-stage">
        {displayMode === 'overview' && renderOverview()}
        {displayMode === 'creating' && renderCreation()}
        {displayMode === 'modifying' && renderModification()}
        {displayMode === 'complete' && renderComplete()}
      </div>
      
      <div className="progress-track">
        <div 
          className="progress-line"
          style={{ width: `${((currentStep + 1) / fileOperations.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ZenProcessVisualizer;