import React, { useState, useEffect, useRef } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/GhostDirectoryTree.css';

const GhostDirectoryTree = ({ currentOperation }) => {
  const { fetchFileTree } = useGitData();
  const [treeStructure, setTreeStructure] = useState({});
  const [expandedPaths, setExpandedPaths] = useState(new Set());
  const [activePath, setActivePath] = useState('');
  const [pulsingPaths, setPulsingPaths] = useState(new Set());
  const [creatingPaths, setCreatingPaths] = useState(new Set());
  const [modifyingPaths, setModifyingPaths] = useState(new Set());
  const [scanningPath, setScanningPath] = useState('');
  const timeoutsRef = useRef([]);

  // Auto-expand all directories on mount and tree updates
  useEffect(() => {
    if (Object.keys(treeStructure).length > 0) {
      const allDirs = findAllDirectories(treeStructure);
      setExpandedPaths(new Set(allDirs));
    }
  }, [treeStructure]);

  useEffect(() => {
    if (!currentOperation) return;
    updateTreeForOperation(currentOperation);
    
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current = [];
    };
  }, [currentOperation]);

  const findAllDirectories = (tree, path = '') => {
    const dirs = [];
    Object.entries(tree).forEach(([name, node]) => {
      const fullPath = path ? `${path}/${name}` : name;
      if (node.type === 'directory') {
        dirs.push(fullPath);
        if (node.children) {
          dirs.push(...findAllDirectories(node.children, fullPath));
        }
      }
    });
    return dirs;
  };

  const updateTreeForOperation = async (operation) => {
    try {
      const tree = await fetchFileTree(operation.commit.hash);
      setTreeStructure(tree);
      
      if (operation.files && operation.files.length > 0) {
        // Simulate scanning through directories
        operation.files.forEach((file, index) => {
          const delay = index * 500;
          const filePath = file.file || file.path || '';
          
          // Show scanning effect
          const scanTimeout = setTimeout(() => {
            const pathParts = filePath.split('/');
            let currentPath = '';
            
            pathParts.forEach((part, partIndex) => {
              setTimeout(() => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                setScanningPath(currentPath);
              }, partIndex * 100);
            });
          }, delay);
          
          // Activate the file
          const activateTimeout = setTimeout(() => {
            setActivePath(filePath);
            setScanningPath('');
            
            // Determine operation type
            const isNew = file.changes && (
              file.changes.includes('new file') || 
              file.insertions > 0 && file.deletions === 0
            );
            
            if (isNew) {
              setCreatingPaths(prev => new Set([...prev, filePath]));
              // Pulse effect for new files
              setPulsingPaths(prev => new Set([...prev, filePath]));
            } else {
              setModifyingPaths(prev => new Set([...prev, filePath]));
              // Quick flash for modifications
              setPulsingPaths(prev => new Set([...prev, filePath]));
            }
          }, delay + 300);
          
          // Clear effects
          const clearTimeout = setTimeout(() => {
            setPulsingPaths(prev => {
              const next = new Set(prev);
              next.delete(filePath);
              return next;
            });
            setCreatingPaths(prev => {
              const next = new Set(prev);
              next.delete(filePath);
              return next;
            });
            setModifyingPaths(prev => {
              const next = new Set(prev);
              next.delete(filePath);
              return next;
            });
            if (index === operation.files.length - 1) {
              setActivePath('');
            }
          }, delay + 2000);
          
          timeoutsRef.current.push(scanTimeout, activateTimeout, clearTimeout);
        });
      }
    } catch (error) {
      console.error('Error updating tree:', error);
    }
  };

  const renderNode = (name, node, path = '', depth = 0) => {
    const fullPath = path ? `${path}/${name}` : name;
    const isDirectory = node.type === 'directory';
    const isExpanded = expandedPaths.has(fullPath);
    const isActive = activePath === fullPath || activePath === node.path;
    const isPulsing = pulsingPaths.has(fullPath) || pulsingPaths.has(node.path);
    const isCreating = creatingPaths.has(fullPath) || creatingPaths.has(node.path);
    const isModifying = modifyingPaths.has(fullPath) || modifyingPaths.has(node.path);
    const isScanning = scanningPath && fullPath.startsWith(scanningPath);
    
    const getNodeClasses = () => {
      const classes = ['node-line'];
      if (isActive) classes.push('active');
      if (isPulsing) classes.push('pulsing');
      if (isCreating) classes.push('creating');
      if (isModifying) classes.push('modifying');
      if (isScanning) classes.push('scanning');
      if (isDirectory) classes.push('directory');
      return classes.join(' ');
    };
    
    const getIndicator = () => {
      if (isDirectory) return '>';
      if (isCreating) return '+';
      if (isModifying) return '~';
      return '-';
    };
    
    return (
      <div key={fullPath} className="tree-node">
        <div 
          className={getNodeClasses()}
          style={{ 
            paddingLeft: `${depth * 1.2}rem`,
            animationDelay: `${depth * 30}ms`
          }}
        >
          <span className="node-indicator">{getIndicator()}</span>
          <span className="node-name">
            {name}
            {isActive && <span className="ghost-cursor">_</span>}
          </span>
          {isCreating && <span className="operation-tag">CREATE</span>}
          {isModifying && !isCreating && <span className="operation-tag">MODIFY</span>}
        </div>
        
        {isDirectory && isExpanded && node.children && (
          <div className="node-children">
            {Object.entries(node.children)
              .sort(([a], [b]) => {
                // Directories first, then files
                const aIsDir = node.children[a].type === 'directory';
                const bIsDir = node.children[b].type === 'directory';
                if (aIsDir && !bIsDir) return -1;
                if (!aIsDir && bIsDir) return 1;
                return a.localeCompare(b);
              })
              .map(([childName, childNode]) => 
                renderNode(childName, childNode, fullPath, depth + 1)
              )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ghost-directory-tree">
      <div className="tree-header">
        <span className="tree-title">DIRECTORY</span>
        {activePath && (
          <span className="tree-status">
            <span className="status-indicator"></span>
            PROCESSING
          </span>
        )}
      </div>
      
      <div className="tree-content">
        {Object.entries(treeStructure)
          .sort(([a], [b]) => {
            // Root directories first
            const aIsDir = treeStructure[a].type === 'directory';
            const bIsDir = treeStructure[b].type === 'directory';
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
          })
          .map(([name, node]) => 
            renderNode(name, node)
          )}
      </div>
      
      {scanningPath && (
        <div className="ghost-terminal">
          <span className="terminal-prompt">›</span>
          <span className="terminal-text">scanning: {scanningPath}</span>
        </div>
      )}
    </div>
  );
};

export default GhostDirectoryTree;