# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Git Project Visualizer is a cinematic visualization system for git repository evolution, designed specifically to showcase AI-driven development processes. It transforms commit history into a movie-like experience with a Japanese minimalist aesthetic.

## Development Commands

```bash
# Start development (runs both server and client)
npm run dev

# Run server only (port 3001)
npm run server

# Run client only (port 3000)
npm run client

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies (use legacy flag for peer deps)
npm install --legacy-peer-deps
```

## Architecture & Key Components

### Dual-Server Setup
- **Express Server** (port 3001): Handles git operations via `simple-git`, provides REST API
- **Vite Dev Server** (port 3000): Serves React application with hot reload
- **WebSocket**: Real-time updates between server and client

### Core Visualization Flow

1. **ZenProcessVisualizer** (`src/components/ZenProcessVisualizer.jsx`)
   - Main orchestrator that controls playback
   - Reverses commit order for chronological display (oldest first)
   - Three display modes: overview → creating → modifying → complete
   - Manages timing: 5 seconds for commit overview, 4 seconds per file operation
   - Stops at end without looping (no infinite replay)

2. **GhostDirectoryTree** (`src/components/GhostDirectoryTree.jsx`)
   - Shows "ghost in the machine" effect with scanning animations
   - Auto-expands all directories
   - Visual indicators: CREATE (green pulse), MODIFY (yellow flash)
   - Terminal output shows current scanning path
   - Floating design without borders

3. **GitDataContext** (`src/context/GitDataContext.jsx`)
   - Central state management using React Context
   - Handles all API communication
   - WebSocket connection for real-time updates

### API Endpoints (server.js)

- `POST /api/set-repo` - Sets repository path
- `GET /api/commits/:branch` - Returns commits (currently fetches all, not branch-specific)
- `GET /api/tree/:commit` - File tree at specific commit
- `GET /api/file-content/:commit/*` - File content (uses git.raw to handle files without extensions)
- `GET /api/diff/:commit/*` - File diff between commit and parent

### Design System

- **Zen Minimalist**: No emojis, monochrome palette, sharp edges
- **Dark Mode**: Black background (#000000), grayscale elements
- **Typography-first**: Text as primary visual element
- **Animation Timing**: Staggered delays based on tree depth

## Common Issues & Solutions

### File Statistics Showing Zero
Statistics calculation tracks unique files across operations. First occurrence = created, subsequent = modified.

### Commits in Wrong Order
Use `.reverse()` on commits array to play chronologically (oldest to newest).

### Repository Path Issues
- Use absolute paths only (e.g., `/Users/cp/Documents/ladrona-clean`)
- For branch-specific commits, consider creating standalone repository

### Server Crashes with Undefined Filepath
Ensure filepath variable is declared outside try block in server endpoints.

## Testing Repositories

- **Ladrona Standalone**: `/Users/cp/Documents/ladrona-clean` - Clean repository with 11 commits showing AI writers' room evolution
- Original repository may include unwanted base commits

## Performance Considerations

- Viewport limiting for large files (max 2000 lines by default)
- Animation frames managed with setTimeout for smooth playback
- Cleanup of timeouts on component unmount using refs
- Lazy loading of file content on demand