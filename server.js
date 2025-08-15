const express = require('express');
const cors = require('cors');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;
const { WebSocketServer } = require('ws');
const { createReadStream } = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let repoPath = '';
let git = null;

app.post('/api/set-repo', async (req, res) => {
  const { path: requestedPath } = req.body;
  
  try {
    repoPath = requestedPath;
    git = simpleGit(repoPath);
    
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return res.status(400).json({ error: 'Not a git repository' });
    }
    
    res.json({ success: true, path: repoPath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/branches', async (req, res) => {
  if (!git) return res.status(400).json({ error: 'No repository set' });
  
  try {
    const branches = await git.branch();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/commits/:branch', async (req, res) => {
  if (!git) return res.status(400).json({ error: 'No repository set' });
  
  try {
    const { branch } = req.params;
    await git.checkout(branch);
    
    const log = await git.log(['--all', '--decorate', '--oneline', '--graph']);
    const detailedLog = await git.log(['--name-status']);
    
    const commits = detailedLog.all.map(commit => ({
      hash: commit.hash,
      date: commit.date,
      message: commit.message,
      author: commit.author_name,
      email: commit.author_email,
      files: commit.diff?.files || [],
      stats: {
        insertions: commit.insertions,
        deletions: commit.deletions
      }
    }));
    
    res.json(commits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/file-history/:filepath', async (req, res) => {
  if (!git) return res.status(400).json({ error: 'No repository set' });
  
  try {
    const { filepath } = req.params;
    const log = await git.log(['--follow', '--', filepath]);
    res.json(log.all);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/diff/:commit/*', async (req, res) => {
  if (!git) return res.status(400).json({ error: 'No repository set' });
  
  try {
    const { commit } = req.params;
    const filepath = req.params[0];
    const diff = await git.diff([`${commit}~1`, commit, '--', filepath]);
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tree/:commit', async (req, res) => {
  if (!git) return res.status(400).json({ error: 'No repository set' });
  
  try {
    const { commit } = req.params;
    const tree = await git.raw(['ls-tree', '-r', '--name-only', commit]);
    const files = tree.split('\n').filter(f => f);
    
    const treeStructure = {};
    files.forEach(file => {
      const parts = file.split('/');
      let current = treeStructure;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = { type: 'file', path: file };
        } else {
          if (!current[part]) {
            current[part] = { type: 'directory', children: {} };
          }
          current = current[part].children;
        }
      });
    });
    
    res.json(treeStructure);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/conversations', async (req, res) => {
  if (!repoPath) return res.status(400).json({ error: 'No repository set' });
  
  try {
    const conversationsPath = path.join(repoPath, 'conversations');
    const files = await fs.readdir(conversationsPath).catch(() => []);
    
    const conversations = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(conversationsPath, file), 'utf-8');
        conversations.push(JSON.parse(content));
      }
    }
    
    conversations.sort((a, b) => a.timestamp - b.timestamp);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/file-content/:commit/*', async (req, res) => {
  if (!git) return res.status(400).json({ error: 'No repository set' });
  
  const { commit } = req.params;
  const filepath = req.params[0];
  
  try {
    // Handle files with or without extensions
    const content = await git.raw(['show', `${commit}:${filepath}`]);
    res.json({ content: content || '' });
  } catch (error) {
    console.error(`Error fetching file ${filepath} at commit ${commit}:`, error.message);
    // Return empty content for missing files instead of error
    res.json({ content: '' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'watch' && repoPath) {
      const watcher = require('fs').watch(repoPath, { recursive: true }, (eventType, filename) => {
        ws.send(JSON.stringify({
          type: 'file-change',
          eventType,
          filename,
          timestamp: Date.now()
        }));
      });
      
      ws.on('close', () => {
        watcher.close();
      });
    }
  });
});