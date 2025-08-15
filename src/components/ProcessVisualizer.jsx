import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/ProcessVisualizer.css';

const ProcessVisualizer = ({ isPlaying, speed, onStepChange }) => {
  const { commits, fetchFileContent, fetchDiff } = useGitData();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileOperations, setFileOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [displayMode, setDisplayMode] = useState('overview'); // overview, creating, modifying
  const [diffLines, setDiffLines] = useState([]);
  const [beforeContent, setBeforeContent] = useState([]);
  const [afterContent, setAfterContent] = useState([]);
  const contentRef = useRef(null);

  useEffect(() => {
    if (commits.length === 0) return;
    
    // Group operations by commit for better storytelling
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

      // Show commit overview first
      setDisplayMode('overview');
      await new Promise(resolve => setTimeout(resolve, 2000 / speed));

      // Then show each file change
      for (const file of operation.files) {
        await displayFileChange(operation.commit, file);
        await new Promise(resolve => setTimeout(resolve, 3000 / speed));
      }

      setCurrentStep(prev => prev + 1);
    };

    processStep();
  }, [currentStep, isPlaying, fileOperations, speed]);

  const displayFileChange = async (commit, file) => {
    try {
      if (file.deletions === 0 && file.insertions > 0) {
        // New file creation
        setDisplayMode('creating');
        const content = await fetchFileContent(commit.hash, file.file);
        const lines = (content.content || '').split('\n');
        setAfterContent(lines);
        setBeforeContent([]);
      } else {
        // File modification
        setDisplayMode('modifying');
        const diff = await fetchDiff(commit.hash, file.file);
        if (diff && diff.diff) {
          const parsed = parseDiff(diff.diff);
          setDiffLines(parsed);
          
          // Get before/after for side-by-side
          try {
            const after = await fetchFileContent(commit.hash, file.file);
            setAfterContent((after.content || '').split('\n'));
            
            const before = await fetchFileContent(`${commit.hash}~1`, file.file);
            setBeforeContent((before.content || '').split('\n'));
          } catch {
            setBeforeContent([]);
          }
        }
      }
    } catch (error) {
      console.error('Error displaying file:', error);
    }
  };

  const parseDiff = (diff) => {
    const lines = diff.split('\n');
    const changes = [];
    let currentHunk = null;
    
    lines.forEach(line => {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@(.*)/);
        if (match) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            newStart: parseInt(match[2]),
            context: match[3] || '',
            changes: []
          };
          changes.push(currentHunk);
        }
      } else if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.changes.push({ type: 'add', content: line.substring(1) });
        } else if (line.startsWith('-')) {
          currentHunk.changes.push({ type: 'remove', content: line.substring(1) });
        } else if (line.length > 0) {
          currentHunk.changes.push({ type: 'context', content: line });
        }
      }
    });
    
    return changes;
  };

  const renderOverview = () => {
    if (!currentOperation) return null;
    const { commit, files } = currentOperation;
    
    return (
      <div className="overview-display">
        <div className="commit-header">
          <div className="commit-number">Commit #{currentStep + 1}</div>
          <div className="commit-message">{commit.message}</div>
          <div className="commit-author">by {commit.author}</div>
        </div>
        
        <div className="files-summary">
          <div className="summary-title">Changes in this commit:</div>
          {files.map((file, idx) => (
            <div key={idx} className="file-summary">
              <span className={`file-icon ${file.deletions === 0 ? 'new' : 'modified'}`}>
                {file.deletions === 0 ? '✨' : '📝'}
              </span>
              <span className="file-path">{file.file}</span>
              <span className="file-stats">
                <span className="additions">+{file.insertions}</span>
                <span className="deletions">-{file.deletions}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCreation = () => {
    return (
      <div className="creation-display">
        <div className="creation-header">
          <span className="action-icon">✨</span>
          <span className="action-text">Creating new file</span>
        </div>
        <div className="content-preview">
          {afterContent.slice(0, 30).map((line, idx) => (
            <div key={idx} className="code-line new">
              <span className="line-number">{idx + 1}</span>
              <span className="line-content">{line || '\u00A0'}</span>
            </div>
          ))}
          {afterContent.length > 30 && (
            <div className="more-indicator">... {afterContent.length - 30} more lines</div>
          )}
        </div>
      </div>
    );
  };

  const renderModification = () => {
    return (
      <div className="modification-display">
        <div className="diff-header">
          <span className="action-icon">📝</span>
          <span className="action-text">Modifying file</span>
        </div>
        
        <div className="diff-container">
          {diffLines.map((hunk, hunkIdx) => (
            <div key={hunkIdx} className="diff-hunk">
              <div className="hunk-header">{hunk.context}</div>
              {hunk.changes.map((change, changeIdx) => (
                <div key={changeIdx} className={`diff-line ${change.type}`}>
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

  if (!currentOperation) {
    return (
      <div className="process-visualizer empty">
        <div className="empty-state">
          <div className="empty-icon">⏸</div>
          <div className="empty-text">Press play to begin</div>
        </div>
      </div>
    );
  }

  return (
    <div className="process-visualizer">
      <div className="visualizer-content" ref={contentRef}>
        {displayMode === 'overview' && renderOverview()}
        {displayMode === 'creating' && renderCreation()}
        {displayMode === 'modifying' && renderModification()}
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentStep + 1) / fileOperations.length) * 100}%` }}
        />
        <div className="progress-text">
          Step {currentStep + 1} of {fileOperations.length}
        </div>
      </div>
    </div>
  );
};

export default ProcessVisualizer;