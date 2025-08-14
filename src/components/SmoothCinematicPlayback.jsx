import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/MinimalCinematicPlayback.css';

const SmoothCinematicPlayback = ({ isPlaying, speed, onStepChange }) => {
  const { commits, fetchFileContent, fetchDiff } = useGitData();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileOperations, setFileOperations] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);
  const [displayContent, setDisplayContent] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [targetContent, setTargetContent] = useState('');
  const contentRef = useRef(null);
  const typewriterRef = useRef(null);
  const scrollRef = useRef(null);

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
      if (typewriterRef.current) cancelAnimationFrame(typewriterRef.current);
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

      // Duration based on content length and speed
      const baseDuration = operation.type === 'create' ? 4000 : 2500;
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, baseDuration / speed);
    };

    processStep();
  }, [currentStep, isPlaying, fileOperations, speed]);

  // Typewriter effect
  useEffect(() => {
    if (!targetContent || !isPlaying) {
      setDisplayContent(targetContent);
      return;
    }

    let currentIndex = 0;
    const charsPerFrame = Math.ceil(targetContent.length / (60 * (2 / speed))); // Complete in ~2 seconds adjusted by speed
    
    const typeNextChars = () => {
      if (currentIndex < targetContent.length) {
        currentIndex = Math.min(currentIndex + charsPerFrame, targetContent.length);
        setDisplayContent(targetContent.substring(0, currentIndex));
        
        // Smooth scroll
        if (contentRef.current) {
          const lines = targetContent.substring(0, currentIndex).split('\n').length;
          if (lines > 20) {
            const scrollTarget = (lines - 20) * 24;
            contentRef.current.scrollTop = scrollTarget;
          }
        }
        
        typewriterRef.current = requestAnimationFrame(typeNextChars);
      }
    };
    
    typewriterRef.current = requestAnimationFrame(typeNextChars);
    
    return () => {
      if (typewriterRef.current) cancelAnimationFrame(typewriterRef.current);
    };
  }, [targetContent, isPlaying, speed]);

  const displayFileOperation = async (operation) => {
    try {
      const response = await fetchFileContent(operation.commit.hash, operation.path);
      const content = response.content || '';
      
      setTargetContent(content);
      setDisplayContent('');
      setCurrentCharIndex(0);
    } catch (error) {
      console.error('Error displaying file:', error);
      setTargetContent('// File content unavailable');
      setDisplayContent('// File content unavailable');
    }
  };

  if (!currentOperation) {
    return (
      <div className="minimal-playback empty">
        <span className="faint">waiting to start...</span>
      </div>
    );
  }

  const { type, file, commit } = currentOperation;
  const lines = displayContent.split('\n');

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
          {lines.map((_, index) => (
            <div key={index} className="line-number">{index + 1}</div>
          ))}
        </div>
        <div className="file-content">
          {lines.map((line, index) => (
            <div key={index} className="code-line">
              {line || '\u00A0'}
            </div>
          ))}
          {isPlaying && displayContent.length < targetContent.length && (
            <span className="typing-cursor">|</span>
          )}
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

export default SmoothCinematicPlayback;