import React, { useState, useEffect } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/MinimalDirectoryTree.css';

const MinimalDirectoryTree = ({ currentOperation }) => {
  const { fetchFileTree } = useGitData();
  const [treeStructure, setTreeStructure] = useState({});
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [highlightedPath, setHighlightedPath] = useState('');
  const [recentPaths, setRecentPaths] = useState(new Set());

  useEffect(() => {
    if (!currentOperation) return;
    updateTreeForOperation(currentOperation);
  }, [currentOperation]);

  const updateTreeForOperation = async (operation) => {
    try {
      const tree = await fetchFileTree(operation.commit.hash);
      setTreeStructure(tree);
      
      setHighlightedPath(operation.path);
      
      // Track recent changes
      setRecentPaths(prev => new Set([...prev, operation.path]));
      
      // Auto-expand path
      const parts = operation.path.split('/');
      const paths = [];
      for (let i = 1; i <= parts.length - 1; i++) {
        paths.push(parts.slice(0, i).join('/'));
      }
      
      paths.forEach((path, index) => {
        setTimeout(() => {
          setExpandedPaths(prev => new Set([...prev, path]));
        }, index * 100);
      });
      
      // Clear highlight after animation
      setTimeout(() => {
        setHighlightedPath('');
      }, 2000);
    } catch (error) {
      console.error('Error updating tree:', error);
    }
  };

  const renderNode = (name, node, path = '', depth = 0) => {
    const fullPath = path ? `${path}/${name}` : name;
    const isDirectory = node.type === 'directory';
    const isExpanded = expandedPaths.has(fullPath);
    const isHighlighted = highlightedPath === fullPath || highlightedPath === node.path;
    const isRecent = recentPaths.has(fullPath) || recentPaths.has(node.path);
    
    // Minimalist file icons - just text
    const getPrefix = () => {
      if (isDirectory) return isExpanded ? '−' : '+';
      return '·';
    };
    
    return (
      <div key={fullPath} className="tree-node">
        <div 
          className={`node-line ${isHighlighted ? 'highlighted' : ''} ${isRecent ? 'recent' : ''}`}
          style={{ paddingLeft: `${depth * 1.2}rem` }}
        >
          <span className="node-prefix">{getPrefix()}</span>
          <span className="node-name">{name}</span>
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
    <div className="minimal-directory-tree">
      <div className="tree-header">
        <span className="tree-title">Structure</span>
        <span className="tree-count">{recentPaths.size}</span>
      </div>
      
      <div className="tree-content">
        {Object.entries(treeStructure).map(([name, node]) => 
          renderNode(name, node)
        )}
      </div>
    </div>
  );
};

export default MinimalDirectoryTree;