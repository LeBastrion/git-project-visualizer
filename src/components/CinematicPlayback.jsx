import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/CinematicPlayback.css';

const CinematicPlayback = ({ isPlaying, speed, onStepChange }) => {
  const { commits, fetchFileContent, fetchDiff } = useGitData();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileOperations, setFileOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [displayContent, setDisplayContent] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollIntervalRef = useRef(null);
  const stepTimeoutRef = useRef(null);

  // Build a list of all file operations from commits
  useEffect(() => {
    if (commits.length === 0) return;
    
    const operations = [];
    commits.forEach((commit, commitIndex) => {
      if (commit.files && commit.files.length > 0) {
        commit.files.forEach(file => {
          operations.push({
            id: `${commit.hash}-${file.file}`,
            type: file.deletions === 0 && file.insertions > 0 ? 'create' : 'modify',
            commit: commit,
            file: file,
            commitIndex: commitIndex,
            path: file.file
          });
        });
      }
    });
    
    setFileOperations(operations);
  }, [commits]);

  // Handle step progression
  useEffect(() => {
    if (!isPlaying || fileOperations.length === 0) {
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      return;
    }

    const processStep = async () => {
      if (currentStep >= fileOperations.length) {
        setCurrentStep(0); // Loop back to beginning
        return;
      }

      const operation = fileOperations[currentStep];
      setCurrentOperation(operation);
      
      // Notify parent of current step
      if (onStepChange) {
        onStepChange(operation);
      }

      // Load and display file content
      await displayFileOperation(operation);

      // Move to next step after delay
      const baseDelay = operation.type === 'create' ? 4000 : 2500;
      const adjustedDelay = baseDelay / speed;
      
      stepTimeoutRef.current = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, adjustedDelay);
    };

    processStep();

    return () => {
      if (stepTimeoutRef.current) clearTimeout(stepTimeoutRef.current);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [currentStep, isPlaying, fileOperations, speed]);

  const displayFileOperation = async (operation) => {
    try {
      const content = await fetchFileContent(operation.commit.hash, operation.path);
      const fileContent = content.content || '';
      
      if (operation.type === 'create') {
        // For new files, show content with scroll effect
        await animateFileCreation(fileContent);
      } else {
        // For modifications, show diff
        await animateFileModification(operation, fileContent);
      }
    } catch (error) {
      console.error('Error displaying file:', error);
      setDisplayContent('// Unable to load file content');
    }
  };

  const animateFileCreation = async (content) => {
    setDisplayContent('');
    setScrollPosition(0);
    setIsScrolling(true);
    
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    // Progressive reveal with automatic scrolling
    let revealedLines = 0;
    const revealSpeed = Math.max(50, 1000 / speed); // Adjust based on playback speed
    
    scrollIntervalRef.current = setInterval(() => {
      revealedLines = Math.min(revealedLines + 2, totalLines);
      const visibleContent = lines.slice(0, revealedLines).join('\n');
      setDisplayContent(visibleContent);
      
      // Auto-scroll to show new content
      if (revealedLines > 20) {
        setScrollPosition((revealedLines - 20) * 24); // 24px per line approximately
      }
      
      if (revealedLines >= totalLines) {
        clearInterval(scrollIntervalRef.current);
        setIsScrolling(false);
      }
    }, revealSpeed);
  };

  const animateFileModification = async (operation, currentContent) => {
    try {
      const diff = await fetchDiff(operation.commit.hash, operation.path);
      setDisplayContent(formatDiffForDisplay(diff.diff));
      setIsScrolling(false);
      
      // Auto-scroll through diff
      const scrollDiff = () => {
        let currentScroll = 0;
        const maxScroll = 1000; // Approximate max scroll
        const scrollSpeed = 50 / speed;
        
        scrollIntervalRef.current = setInterval(() => {
          currentScroll += 20;
          setScrollPosition(currentScroll);
          
          if (currentScroll >= maxScroll) {
            clearInterval(scrollIntervalRef.current);
          }
        }, scrollSpeed);
      };
      
      setTimeout(scrollDiff, 500); // Start scrolling after a brief pause
    } catch (error) {
      setDisplayContent(currentContent); // Fallback to showing current content
    }
  };

  const formatDiffForDisplay = (diff) => {
    if (!diff) return '';
    
    return diff.split('\n').map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return `✨ ${line.substring(1)}`;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        return `⚡ ${line.substring(1)}`;
      }
      return line;
    }).join('\n');
  };

  const getOperationDescription = () => {
    if (!currentOperation) return 'Initializing...';
    
    const { type, file, commit } = currentOperation;
    const action = type === 'create' ? '✨ Creating' : '📝 Modifying';
    const stats = `+${file.insertions || 0} -${file.deletions || 0}`;
    
    return {
      action,
      path: file.file,
      message: commit.message,
      author: commit.author,
      stats
    };
  };

  const progress = fileOperations.length > 0 
    ? ((currentStep + 1) / fileOperations.length) * 100 
    : 0;

  const description = getOperationDescription();

  return (
    <div className="cinematic-playback">
      <div className="playback-header">
        <div className="operation-info">
          <span className="operation-action">{description.action}</span>
          <span className="operation-path">{description.path}</span>
        </div>
        <div className="operation-meta">
          <span className="operation-message">{description.message}</span>
          <span className="operation-stats">{description.stats}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      
      <div className="content-viewport" 
           style={{ transform: `translateY(-${scrollPosition}px)` }}>
        <pre className={`file-content ${isScrolling ? 'scrolling' : ''}`}>
          <code>{displayContent}</code>
        </pre>
      </div>
      
      <div className="step-indicator">
        Step {currentStep + 1} of {fileOperations.length}
      </div>
    </div>
  );
};

export default CinematicPlayback;