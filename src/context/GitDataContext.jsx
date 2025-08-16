import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const GitDataContext = createContext();

export const useGitData = () => {
  const context = useContext(GitDataContext);
  if (!context) {
    throw new Error('useGitData must be used within GitDataProvider');
  }
  return context;
};

export const GitDataProvider = ({ children }) => {
  const [commits, setCommits] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fileTree, setFileTree] = useState({});
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:3001/ws');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      websocket.send(JSON.stringify({ type: 'watch' }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'file-change') {
        console.log('File change detected:', data);
      }
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const setRepository = async (path) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3001/api/set-repo', { path });
      if (response.data.success) {
        await fetchBranches();
      }
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/branches');
      setBranches(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchCommits = async (branch) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/api/commits/${branch}`);
      setCommits(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchFileTree = async (commit) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/tree/${commit}`);
      setFileTree(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const fetchDiff = async (commit, filepath) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/diff/${commit}/${filepath}`
      );
      return response.data.diff || '';
    } catch (err) {
      console.error(`Error fetching diff for ${filepath}:`, err.message);
      setError(err.message);
      return '';
    }
  };

  const fetchFileContent = async (commit, filepath) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/file-content/${commit}/${filepath}`
      );
      return response.data.content || '';
    } catch (err) {
      console.error(`Error fetching content for ${filepath}:`, err.message);
      setError(err.message);
      return '';
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/conversations');
      setConversations(response.data);
      return response.data;
    } catch (err) {
      console.warn('No conversations found:', err.message);
      return [];
    }
  };

  const value = {
    commits,
    branches,
    fileTree,
    conversations,
    loading,
    error,
    setRepository,
    fetchBranches,
    fetchCommits,
    fetchFileTree,
    fetchDiff,
    fetchFileContent,
    fetchConversations
  };

  return (
    <GitDataContext.Provider value={value}>
      {children}
    </GitDataContext.Provider>
  );
};