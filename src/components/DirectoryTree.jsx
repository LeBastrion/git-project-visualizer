import React, { useState, useEffect } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/DirectoryTree.css';

const DirectoryTree = ({ branch, currentTime, onFileSelect }) => {
  const { commits, fetchFileTree } = useGitData();
  const [tree, setTree] = useState({});
  const [expandedDirs, setExpandedDirs] = useState(new Set());
  const [fileChanges, setFileChanges] = useState(new Map());

  useEffect(() => {
    if (commits.length > 0) {
      const currentCommit = findCommitAtTime(currentTime);
      if (currentCommit) {
        loadTreeForCommit(currentCommit);
        trackFileChanges(currentCommit);
      }
    }
  }, [currentTime, commits]);

  const findCommitAtTime = (time) => {
    if (!time || commits.length === 0) return commits[0];
    
    const targetTime = new Date(time).getTime();
    return commits.reduce((closest, commit) => {
      const commitTime = new Date(commit.date).getTime();
      const closestTime = new Date(closest.date).getTime();
      
      if (Math.abs(commitTime - targetTime) < Math.abs(closestTime - targetTime)) {
        return commit;
      }
      return closest;
    }, commits[0]);
  };

  const loadTreeForCommit = async (commit) => {
    try {
      const treeData = await fetchFileTree(commit.hash);
      setTree(treeData);
    } catch (error) {
      console.error('Failed to load tree:', error);
    }
  };

  const trackFileChanges = (commit) => {
    const changes = new Map();
    if (commit.files) {
      commit.files.forEach(file => {
        changes.set(file.file, {
          type: file.changes > 0 ? 'modified' : 'added',
          insertions: file.insertions,
          deletions: file.deletions
        });
      });
    }
    setFileChanges(changes);
  };

  const toggleDirectory = (path) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      md: '📝',
      json: '📊',
      js: '🟨',
      jsx: '⚛️',
      ts: '🔷',
      tsx: '⚛️',
      css: '🎨',
      html: '🌐',
      txt: '📄',
      yaml: '⚙️',
      yml: '⚙️'
    };
    return icons[ext] || '📄';
  };

  const renderTree = (node, path = '', depth = 0) => {
    if (!node || typeof node !== 'object') return null;

    return Object.entries(node).map(([name, value]) => {
      const fullPath = path ? `${path}/${name}` : name;
      const isDirectory = value.type === 'directory';
      const isExpanded = expandedDirs.has(fullPath);
      const changeInfo = fileChanges.get(fullPath);

      return (
        <div key={fullPath} className="tree-node" style={{ paddingLeft: `${depth * 20}px` }}>
          {isDirectory ? (
            <>
              <div 
                className="tree-item directory"
                onClick={() => toggleDirectory(fullPath)}
              >
                <span className="tree-icon">{isExpanded ? '📂' : '📁'}</span>
                <span className="tree-name">{name}</span>
              </div>
              {isExpanded && value.children && (
                <div className="tree-children">
                  {renderTree(value.children, fullPath, depth + 1)}
                </div>
              )}
            </>
          ) : (
            <div 
              className={`tree-item file ${changeInfo ? `file-${changeInfo.type}` : ''}`}
              onClick={() => onFileSelect({ path: value.path, name })}
            >
              <span className="tree-icon">{getFileIcon(name)}</span>
              <span className="tree-name">{name}</span>
              {changeInfo && (
                <span className="change-indicator">
                  {changeInfo.type === 'modified' && '●'}
                  {changeInfo.type === 'added' && '+'}
                </span>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="directory-tree">
      <div className="tree-header">
        <h3>Project Structure</h3>
        <span className="branch-name">{branch}</span>
      </div>
      <div className="tree-content">
        {renderTree(tree)}
      </div>
    </div>
  );
};

export default DirectoryTree;