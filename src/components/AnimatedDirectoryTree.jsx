import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/AnimatedDirectoryTree.css';

const AnimatedDirectoryTree = ({ currentOperation }) => {
  const { fetchFileTree } = useGitData();
  const [treeStructure, setTreeStructure] = useState({});
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [highlightedPath, setHighlightedPath] = useState('');
  const [newFiles, setNewFiles] = useState(new Set());
  const [modifiedFiles, setModifiedFiles] = useState(new Set());
  const animationTimeoutRef = useRef(null);

  useEffect(() => {
    if (!currentOperation) return;
    
    updateTreeForOperation(currentOperation);
  }, [currentOperation]);

  const updateTreeForOperation = async (operation) => {
    try {
      // Fetch current tree state
      const tree = await fetchFileTree(operation.commit.hash);
      setTreeStructure(tree);
      
      // Highlight the current file
      setHighlightedPath(operation.path);
      
      // Mark as new or modified
      if (operation.type === 'create') {
        setNewFiles(prev => new Set([...prev, operation.path]));
        animatePathExpansion(operation.path);
      } else {
        setModifiedFiles(prev => new Set([...prev, operation.path]));
      }
      
      // Clear highlight after animation
      animationTimeoutRef.current = setTimeout(() => {
        setHighlightedPath('');
      }, 3000);
    } catch (error) {
      console.error('Error updating tree:', error);
    }
  };

  const animatePathExpansion = (filePath) => {
    const parts = filePath.split('/');
    const paths = [];
    
    // Build all parent paths
    for (let i = 1; i <= parts.length - 1; i++) {
      paths.push(parts.slice(0, i).join('/'));
    }
    
    // Progressively expand each level
    paths.forEach((path, index) => {
      setTimeout(() => {
        setExpandedPaths(prev => new Set([...prev, path]));
      }, index * 200); // Stagger the expansion
    });
  };

  const renderNode = (name, node, path = '', depth = 0) => {
    const fullPath = path ? `${path}/${name}` : name;
    const isDirectory = node.type === 'directory';
    const isExpanded = expandedPaths.has(fullPath);
    const isHighlighted = highlightedPath === fullPath || highlightedPath === node.path;
    const isNew = newFiles.has(fullPath) || newFiles.has(node.path);
    const isModified = modifiedFiles.has(fullPath) || modifiedFiles.has(node.path);
    
    const nodeClass = `tree-node 
      ${isHighlighted ? 'highlighted' : ''} 
      ${isNew ? 'new-file' : ''} 
      ${isModified ? 'modified-file' : ''}
      ${isDirectory ? 'directory' : 'file'}`;
    
    const getIcon = () => {
      if (isDirectory) {
        return isExpanded ? '📂' : '📁';
      }
      
      const ext = name.split('.').pop().toLowerCase();
      const icons = {
        md: '📝',
        json: '📊',
        js: '🟨',
        jsx: '⚛️',
        txt: '📄',
        yaml: '⚙️',
        yml: '⚙️',
        py: '🐍',
        html: '🌐',
        css: '🎨'
      };
      return icons[ext] || '📄';
    };
    
    return (
      <div key={fullPath} className={nodeClass} style={{ paddingLeft: `${depth * 20}px` }}>
        <div className="node-content">
          <span className="node-icon">{getIcon()}</span>
          <span className="node-name">{name}</span>
          {isNew && <span className="badge new">NEW</span>}
          {isModified && !isNew && <span className="badge modified">MODIFIED</span>}
        </div>
        
        {isDirectory && isExpanded && node.children && (
          <div className="node-children">
            {Object.entries(node.children).map(([childName, childNode]) => 
              renderNode(childName, childNode, fullPath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animated-directory-tree">
      <div className="tree-header">
        <h3>📁 Project Structure</h3>
        <div className="tree-stats">
          <span className="stat-new">{newFiles.size} new</span>
          <span className="stat-modified">{modifiedFiles.size} modified</span>
        </div>
      </div>
      <div className="tree-container">
        {Object.entries(treeStructure).map(([name, node]) => 
          renderNode(name, node)
        )}
      </div>
    </div>
  );
};

export default AnimatedDirectoryTree;