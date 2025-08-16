import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/BrutalistCodeCanvas.css';

const BrutalistCodeCanvas = ({ isPlaying, speed, onStepChange, onComplete }) => {
  const { commits, fetchFileContent, fetchDiff } = useGitData();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileOperations, setFileOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [displayMode, setDisplayMode] = useState('overview');
  const [fileContent, setFileContent] = useState([]);
  const [visibleLines, setVisibleLines] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [diffContent, setDiffContent] = useState([]);
  const [visibleDiffLines, setVisibleDiffLines] = useState(0);
  const animationRef = useRef(null);

  // Process commits into operations
  useEffect(() => {
    if (commits.length === 0) return;
    
    // Reverse for chronological order
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

  // Playback controller
  useEffect(() => {
    if (!isPlaying || fileOperations.length === 0) return;
    
    // Reset if completed and playing again
    if (isComplete && currentStep >= fileOperations.length) {
      setCurrentStep(0);
      setIsComplete(false);
      setDisplayMode('overview');
    }

    const processStep = async () => {
      if (currentStep >= fileOperations.length) {
        setIsComplete(true);
        setDisplayMode('complete');
        if (onComplete) onComplete();
        return;
      }

      const operation = fileOperations[currentStep];
      setCurrentOperation(operation);
      
      if (onStepChange) onStepChange(operation);

      // Show overview
      setDisplayMode('overview');
      setCurrentFileIndex(0);
      await new Promise(resolve => setTimeout(resolve, 3000 / speed));

      // Process each file
      for (let i = 0; i < operation.files.length; i++) {
        setCurrentFileIndex(i);
        const currentFile = operation.files[i];
        
        // Update directory tree
        if (onStepChange) {
          onStepChange({
            ...operation,
            path: currentFile.file,
            type: (currentFile.deletions === 0 && currentFile.insertions > 0) ? 'create' : 'modify',
            files: operation.files
          });
        }
        
        await displayFileOperation(operation.commit, currentFile);
        await new Promise(resolve => setTimeout(resolve, 3000 / speed));
      }

      setCurrentStep(prev => prev + 1);
    };

    processStep();
  }, [currentStep, isPlaying, fileOperations, speed]);

  const displayFileOperation = async (commit, file) => {
    try {
      // Check if this is the first commit or if file has no deletions
      const isFirstCommit = currentStep === 0;
      const isCreation = file.deletions === 0 && file.insertions > 0;
      
      // For modifications with no actual changes, show the file content
      if (file.insertions === 0 && file.deletions === 0) {
        setDisplayMode('creating');
        const content = await fetchFileContent(commit.hash, file.file);
        console.log(`Fetched content for ${file.file}, length: ${content.length}`);
        const lines = content ? content.split('\n') : ['[CONTENT UNAVAILABLE]'];
        setFileContent(lines);
        
        // Show content immediately for empty changes
        setVisibleLines(Math.min(lines.length, 50));
        return;
      }
      
      if (isCreation || isFirstCommit) {
        setDisplayMode('creating');
        const content = await fetchFileContent(commit.hash, file.file);
        console.log(`Creating ${file.file}, content length: ${content.length}`);
        const lines = content ? content.split('\n') : ['[CONTENT UNAVAILABLE]'];
        setFileContent(lines);
        
        // Typewriter effect
        setVisibleLines(0);
        for (let i = 0; i <= Math.min(lines.length, 50); i++) {
          await new Promise(resolve => {
            animationRef.current = setTimeout(resolve, 30 / speed);
          });
          setVisibleLines(i);
        }
      } else {
        setDisplayMode('modifying');
        const diff = await fetchDiff(commit.hash, file.file);
        
        // If diff is empty or invalid, show file content instead
        if (!diff || diff === '') {
          setDisplayMode('creating');
          const content = await fetchFileContent(commit.hash, file.file);
          console.log(`No diff, showing content for ${file.file}, length: ${content.length}`);
          const lines = content ? content.split('\n') : ['[CONTENT UNAVAILABLE]'];
          setFileContent(lines);
          setVisibleLines(Math.min(lines.length, 50));
          return;
        }
        
        const parsedDiff = parseDiff(diff);
        setDiffContent(parsedDiff);
        
        // Line by line reveal
        setVisibleDiffLines(0);
        for (let i = 0; i <= Math.min(parsedDiff.length, 30); i++) {
          await new Promise(resolve => {
            animationRef.current = setTimeout(resolve, 50 / speed);
          });
          setVisibleDiffLines(i);
        }
      }
    } catch (error) {
      console.error('Error displaying file:', error);
      // Fallback to showing file content on error
      try {
        setDisplayMode('creating');
        const content = await fetchFileContent(commit.hash, file.file);
        const lines = content ? content.split('\n') : ['[ERROR LOADING FILE]'];
        setFileContent(lines);
        setVisibleLines(Math.min(lines.length, 50));
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setFileContent(['[CONTENT UNAVAILABLE]']);
        setVisibleLines(1);
      }
    }
  };

  const parseDiff = (diffText) => {
    const lines = diffText.split('\n');
    const parsed = [];
    let lineNum = 0;
    
    lines.forEach(line => {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          lineNum = parseInt(match[2]);
        }
        return;
      }
      
      if (line.startsWith('+++') || line.startsWith('---')) return;
      
      if (line.startsWith('+')) {
        parsed.push({
          type: 'add',
          line: lineNum++,
          content: line.substring(1)
        });
      } else if (line.startsWith('-')) {
        parsed.push({
          type: 'remove',
          line: lineNum,
          content: line.substring(1)
        });
      } else if (line.length > 0) {
        parsed.push({
          type: 'context',
          line: lineNum++,
          content: line.substring(1)
        });
      }
    });
    
    return parsed;
  };

  const renderHeader = () => {
    if (!currentOperation) return null;
    
    const totalFiles = fileOperations.reduce((acc, op) => acc + op.files.length, 0);
    const processedFiles = fileOperations.slice(0, currentStep).reduce((acc, op) => acc + op.files.length, 0) + currentFileIndex;
    const progress = (processedFiles / totalFiles) * 100;
    
    return (
      <div className="canvas-header">
        <div className="header-line-1">
          COMMIT {String(currentStep + 1).padStart(2, '0')} OF {String(fileOperations.length).padStart(2, '0')}
        </div>
        <div className="header-line-2">
          {currentOperation.commit.message.split('\n')[0]}
        </div>
        <div className="header-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    if (!currentOperation) return null;
    
    return (
      <div className="canvas-overview">
        <div className="overview-title">FILES TO PROCESS</div>
        
        <div className="files-list">
          {currentOperation.files.map((file, idx) => (
            <div 
              key={idx} 
              className={`file-row ${idx === currentFileIndex ? 'current' : ''}`}
            >
              <span className="file-index">{String(idx + 1).padStart(3, '0')}</span>
              <span className="file-operation">
                {file.deletions === 0 ? 'CREATE' : 'MODIFY'}
              </span>
              <span className="file-path">{file.file}</span>
              <span className="file-stats">
                {file.insertions > 0 && <span className="stat-add">+{file.insertions}</span>}
                {file.deletions > 0 && <span className="stat-del">-{file.deletions}</span>}
              </span>
              {idx === currentFileIndex && (
                <span className="current-indicator">▲ CURRENT</span>
              )}
            </div>
          ))}
        </div>
        
        <div className="overview-footer">
          TOTAL OPERATIONS: {currentOperation.files.length}
        </div>
      </div>
    );
  };

  const renderCreation = () => {
    if (!currentOperation) return null;
    const file = currentOperation.files[currentFileIndex];
    
    return (
      <div className="canvas-creation">
        <div className="operation-label">CREATE</div>
        <div className="operation-path">{file.file}</div>
        <div className="operation-divider"></div>
        
        <div className="code-display">
          {fileContent.slice(0, visibleLines).map((line, idx) => (
            <div key={idx} className="code-line">
              <span className="line-number">{String(idx + 1).padStart(4, ' ')}</span>
              <span className="line-content">{line || '\u00A0'}</span>
              {idx === visibleLines - 1 && <span className="cursor">_</span>}
            </div>
          ))}
        </div>
        
        <div className="operation-footer">
          LINES: {visibleLines} OF {file.insertions}
        </div>
      </div>
    );
  };

  const renderModification = () => {
    if (!currentOperation) return null;
    const file = currentOperation.files[currentFileIndex];
    
    return (
      <div className="canvas-modification">
        <div className="operation-label">MODIFY</div>
        <div className="operation-path">{file.file}</div>
        <div className="operation-divider"></div>
        
        <div className="diff-display">
          {diffContent.slice(0, visibleDiffLines).map((line, idx) => (
            <div key={idx} className={`diff-line ${line.type}`}>
              <span className="line-number">
                {String(line.line || '').padStart(4, ' ')}
              </span>
              <span className="diff-marker">
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span className="line-content">{line.content}</span>
            </div>
          ))}
        </div>
        
        <div className="operation-footer">
          CHANGES: +{file.insertions} -{file.deletions}
        </div>
      </div>
    );
  };

  const renderComplete = () => {
    const totalFiles = new Set();
    let createdCount = 0;
    let modifiedCount = 0;
    
    fileOperations.forEach(op => {
      op.files.forEach(file => {
        const filepath = file.file;
        if (!totalFiles.has(filepath)) {
          createdCount++;
          totalFiles.add(filepath);
        } else {
          modifiedCount++;
        }
      });
    });
    
    return (
      <div className="canvas-complete">
        <div className="complete-label">COMPLETE</div>
        
        <div className="stats-grid">
          <div className="stat-row">
            <span className="stat-label">COMMITS PROCESSED</span>
            <span className="stat-value">{fileOperations.length}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">FILES CREATED</span>
            <span className="stat-value">{createdCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">FILES MODIFIED</span>
            <span className="stat-value">{modifiedCount}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">TOTAL OPERATIONS</span>
            <span className="stat-value">{createdCount + modifiedCount}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!currentOperation && !isComplete) {
    return (
      <div className="brutalist-canvas empty">
        <div className="empty-label">READY</div>
      </div>
    );
  }

  return (
    <div className="brutalist-canvas">
      {renderHeader()}
      
      <div className="canvas-content">
        {displayMode === 'overview' && renderOverview()}
        {displayMode === 'creating' && renderCreation()}
        {displayMode === 'modifying' && renderModification()}
        {displayMode === 'complete' && renderComplete()}
      </div>
    </div>
  );
};

export default BrutalistCodeCanvas;