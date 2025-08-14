import React, { useState } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/MinimalRepoSelector.css';

const MinimalRepoSelector = ({ onRepoSelect, onBranchSelect }) => {
  const [repoPath, setRepoPath] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const { setRepository, fetchBranches, branches } = useGitData();

  const handleSetRepo = async () => {
    if (!repoPath) return;
    
    try {
      const result = await setRepository(repoPath);
      if (result.success) {
        onRepoSelect(repoPath);
        const branchData = await fetchBranches();
        if (branchData.current) {
          setSelectedBranch(branchData.current);
          onBranchSelect(branchData.current);
          setIsConfigured(true);
        }
      }
    } catch (err) {
      console.error('Failed to set repository:', err);
    }
  };

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    onBranchSelect(branch);
  };

  if (isConfigured) {
    return (
      <div className="minimal-repo-selector configured">
        <span className="repo-name">{repoPath.split('/').pop()}</span>
        <span className="separator">/</span>
        <select 
          value={selectedBranch} 
          onChange={(e) => handleBranchChange(e.target.value)}
          className="branch-select"
        >
          {branches.all?.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
        </select>
        <button onClick={() => setIsConfigured(false)} className="change-btn">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="minimal-repo-selector">
      <input
        type="text"
        placeholder="repository path"
        value={repoPath}
        onChange={(e) => setRepoPath(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSetRepo()}
        className="repo-input"
      />
      <button onClick={handleSetRepo} className="set-btn">
        →
      </button>
    </div>
  );
};

export default MinimalRepoSelector;