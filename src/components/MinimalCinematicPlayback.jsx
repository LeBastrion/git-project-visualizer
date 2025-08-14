import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/MinimalCinematicPlayback.css';

const MinimalCinematicPlayback = ({ isPlaying, speed, onStepChange }) => {
  const { commits, fetchFileContent, fetchDiff } = useGitData();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileOperations, setFileOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [displayLines, setDisplayLines] = useState([]);
  const [visibleLineCount, setVisibleLineCount] = useState(0);
  const contentRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (commits.length === 0) return;
    
    const operations = [];
    commits.forEach(commit => {
      if (commit.files && commit.files.length > 0) {
        commit.files.forEach(file => {
          operations.push({
            type: file.deletions === 0 && file.insertions > 0 ? 'create' : 'modify',
            commit: commit,
            file: file,
            path: file.file
          });
        });
      }
    });
    
    setFileOperations(operations);
  }, [commits]);

  useEffect(() => {
    if (!isPlaying || fileOperations.length === 0) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    const processStep = async () => {
      if (currentStep >= fileOperations.length) {
        setCurrentStep(0);
        return;
      }

      const operation = fileOperations[currentStep];
      setCurrentOperation(operation);
      
      if (onStepChange) onStepChange(operation);

      await displayFileOperation(operation);

      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, (operation.type === 'create' ? 5000 : 3000) / speed);
    };

    processStep();
  }, [currentStep, isPlaying, fileOperations, speed]);

  const displayFileOperation = async (operation) => {
    try {
      const content = await fetchFileContent(operation.commit.hash, operation.path);
      const lines = (content.content || '').split('\n');
      
      setDisplayLines(lines);
      setVisibleLineCount(0);
      
      // Animate line reveal
      let currentLine = 0;
      const revealLines = () => {
        if (currentLine < lines.length && isPlaying) {
          setVisibleLineCount(currentLine + 1);
          currentLine++;
          
          // Smooth scroll
          if (contentRef.current && currentLine > 10) {
            contentRef.current.scrollTop = (currentLine - 10) * 24;
          }
          
          animationRef.current = requestAnimationFrame(revealLines);
        }
      };
      
      animationRef.current = requestAnimationFrame(revealLines);
    } catch (error) {
      console.error('Error displaying file:', error);
    }
  };

  if (!currentOperation) {
    return (
      <div className="minimal-playback empty">
        <span className="faint">Waiting to start...</span>
      </div>
    );
  }

  const { type, file, commit } = currentOperation;

  return (
    <div className="minimal-playback">
      <div className="playback-meta">
        <div className="file-path">
          <span className={`operation-type ${type}`}>
            {type === 'create' ? '+' : '~'}
          </span>
          <span className="path-text">{file.file}</span>
        </div>
        <div className="commit-info">
          <span className="commit-message">{commit.message}</span>
          <span className="commit-stats">
            <span className="additions">+{file.insertions || 0}</span>
            {' '}
            <span className="deletions">-{file.deletions || 0}</span>
          </span>
        </div>
      </div>
      
      <div className="content-area" ref={contentRef}>
        <div className="line-numbers">
          {displayLines.slice(0, visibleLineCount).map((_, index) => (
            <div key={index} className="line-number">{index + 1}</div>
          ))}
        </div>
        <div className="file-content">
          {displayLines.slice(0, visibleLineCount).map((line, index) => (
            <div key={index} className="code-line">
              {line || '\u00A0'}
            </div>
          ))}
        </div>
      </div>
      
      <div className="progress-indicator">
        <span className="step-count">{currentStep + 1}/{fileOperations.length}</span>
        <div className="progress-line">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / fileOperations.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default MinimalCinematicPlayback;