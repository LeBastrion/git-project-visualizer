import React, { useState } from 'react';
import { useGitData } from '../context/GitDataContext';
import '../styles/RepoSelector.css';

const RepoSelector = ({ onRepoSelect, onBranchSelect }) => {
  const [repoPath, setRepoPath] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const { setRepository, fetchBranches, branches, loading, error } = useGitData();

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

  const handleReset = () => {
    setRepoPath('');
    setSelectedBranch('');
    setIsConfigured(false);
    onRepoSelect('');
    onBranchSelect('');
  };

  if (isConfigured) {
    return (
      <div className="repo-selector configured">
        <div className="repo-info">
          <span className="repo-path" title={repoPath}>
            📁 {repoPath.split('/').pop()}
          </span>
          <select 
            value={selectedBranch} 
            onChange={(e) => handleBranchChange(e.target.value)}
            className="branch-select"
          >
            {branches.all?.map(branch => (
              <option key={branch} value={branch}>
                {branch} {branch === branches.current ? '(current)' : ''}
              </option>
            ))}
          </select>
          <button onClick={handleReset} className="reset-button">
            Change Repo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="repo-selector">
      <input
        type="text"
        placeholder="Enter repository path (e.g., /path/to/repo)"
        value={repoPath}
        onChange={(e) => setRepoPath(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSetRepo()}
        className="repo-input"
      />
      <button 
        onClick={handleSetRepo} 
        disabled={!repoPath || loading}
        className="set-repo-button"
      >
        {loading ? 'Loading...' : 'Set Repository'}
      </button>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default RepoSelector;