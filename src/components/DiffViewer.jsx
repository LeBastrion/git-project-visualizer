import React, { useState, useEffect } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/DiffViewer.css';

const DiffViewer = ({ selectedFile, selectedCommit }) => {
  const { fetchDiff, fetchFileContent } = useGitData();
  const [diffContent, setDiffContent] = useState(null);
  const [oldContent, setOldContent] = useState('');
  const [newContent, setNewContent] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedFile && selectedCommit) {
      loadDiff();
    }
  }, [selectedFile, selectedCommit]);

  const loadDiff = async () => {
    setLoading(true);
    try {
      const diff = await fetchDiff(selectedCommit.hash, selectedFile.path);
      setDiffContent(diff.diff);
      
      const currentContent = await fetchFileContent(selectedCommit.hash, selectedFile.path);
      setNewContent(currentContent.content);
      
      try {
        const previousContent = await fetchFileContent(`${selectedCommit.hash}~1`, selectedFile.path);
        setOldContent(previousContent.content);
      } catch {
        setOldContent('');
      }
    } catch (error) {
      console.error('Failed to load diff:', error);
      setDiffContent(null);
    } finally {
      setLoading(false);
    }
  };

  const parseDiff = (diff) => {
    if (!diff) return [];
    
    const lines = diff.split('\n');
    const changes = [];
    let lineNumOld = 0;
    let lineNumNew = 0;

    lines.forEach(line => {
      if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          lineNumOld = parseInt(match[1]);
          lineNumNew = parseInt(match[2]);
        }
      } else if (line.startsWith('+')) {
        changes.push({
          type: 'addition',
          content: line.substring(1),
          newLine: lineNumNew++,
          oldLine: null
        });
      } else if (line.startsWith('-')) {
        changes.push({
          type: 'deletion',
          content: line.substring(1),
          oldLine: lineNumOld++,
          newLine: null
        });
      } else if (line.length > 0 && !line.startsWith('\\')) {
        changes.push({
          type: 'unchanged',
          content: line,
          oldLine: lineNumOld++,
          newLine: lineNumNew++
        });
      }
    });

    return changes;
  };

  const renderSplitView = () => {
    const changes = parseDiff(diffContent);
    const leftLines = [];
    const rightLines = [];

    changes.forEach(change => {
      if (change.type === 'deletion' || change.type === 'unchanged') {
        leftLines.push({
          number: change.oldLine,
          content: change.content,
          type: change.type
        });
      }
      if (change.type === 'addition' || change.type === 'unchanged') {
        rightLines.push({
          number: change.newLine,
          content: change.content,
          type: change.type
        });
      }
    });

    const maxLines = Math.max(leftLines.length, rightLines.length);

    return (
      <div className="diff-split-view">
        <div className="diff-pane diff-old">
          <div className="diff-header">Previous Version</div>
          <div className="diff-content">
            {Array.from({ length: maxLines }).map((_, i) => {
              const line = leftLines[i];
              return (
                <div key={i} className={`diff-line ${line ? `diff-${line.type}` : 'diff-empty'}`}>
                  <span className="line-number">{line?.number || ''}</span>
                  <span className="line-content">{line?.content || ''}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="diff-pane diff-new">
          <div className="diff-header">Current Version</div>
          <div className="diff-content">
            {Array.from({ length: maxLines }).map((_, i) => {
              const line = rightLines[i];
              return (
                <div key={i} className={`diff-line ${line ? `diff-${line.type}` : 'diff-empty'}`}>
                  <span className="line-number">{line?.number || ''}</span>
                  <span className="line-content">{line?.content || ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderUnifiedView = () => {
    const changes = parseDiff(diffContent);

    return (
      <div className="diff-unified-view">
        <div className="diff-header">Changes in {selectedFile?.name}</div>
        <div className="diff-content">
          {changes.map((change, i) => (
            <div key={i} className={`diff-line diff-${change.type}`}>
              <span className="line-number old">{change.oldLine || ''}</span>
              <span className="line-number new">{change.newLine || ''}</span>
              <span className="line-marker">
                {change.type === 'addition' && '+'}
                {change.type === 'deletion' && '-'}
                {change.type === 'unchanged' && ' '}
              </span>
              <span className="line-content">{change.content}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!selectedFile || !selectedCommit) {
    return (
      <div className="diff-viewer empty">
        <p>Select a file and commit to view changes</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="diff-viewer loading">
        <p>Loading diff...</p>
      </div>
    );
  }

  return (
    <div className="diff-viewer">
      <div className="diff-controls">
        <button 
          className={viewMode === 'split' ? 'active' : ''}
          onClick={() => setViewMode('split')}
        >
          Split View
        </button>
        <button 
          className={viewMode === 'unified' ? 'active' : ''}
          onClick={() => setViewMode('unified')}
        >
          Unified View
        </button>
      </div>
      
      {diffContent && (
        viewMode === 'split' ? renderSplitView() : renderUnifiedView()
      )}
      
      {!diffContent && !loading && (
        <div className="diff-empty">
          <p>No changes to display</p>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;