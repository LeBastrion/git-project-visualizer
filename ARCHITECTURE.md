# System Architecture

## Overview

The Git Project Visualizer is a full-stack web application that transforms git repository history into a cinematic visualization experience. It reveals the evolution of code through time, making the development process—particularly AI-driven development—visually comprehensible and compelling.

## Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
├─────────────────────────────────────────────────────────┤
│  React App (Vite)                                       │
│  ├── Visualization Components                           │
│  ├── State Management (Context API)                     │
│  └── WebSocket Client                                   │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
├─────────────────────────────────────────────────────────┤
│  ├── REST API Endpoints                                 │
│  ├── Git Operations (simple-git)                        │
│  └── WebSocket Server                                   │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   Local Git Repository                   │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **React 18** - Component-based UI framework
- **Vite** - Build tool and dev server
- **D3.js** - Data visualization (timeline, graphs)
- **Context API** - State management
- **WebSocket** - Real-time updates

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web server framework
- **simple-git** - Git operations wrapper
- **WebSocket (ws)** - Real-time communication

## Component Architecture

### 1. Data Flow

```
User Input → Repo Path
    ↓
Backend validates & reads git repo
    ↓
Extracts commits, files, diffs
    ↓
Frontend receives data via API
    ↓
Visualization components render
    ↓
Playback controls time progression
```

### 2. Core Components

#### Backend Services

**`server.js`** - Main Express server
- Handles repository connection
- Provides REST API endpoints
- Manages WebSocket connections

**API Endpoints:**
- `POST /api/set-repo` - Initialize repository connection
- `GET /api/branches` - List available branches
- `GET /api/commits/:branch` - Fetch commit history
- `GET /api/tree/:commit` - Get file tree at commit
- `GET /api/diff/:commit/*` - Get file diff
- `GET /api/file-content/:commit/*` - Get file content
- `GET /api/conversations` - Get conversation history (if available)

#### Frontend Components

**`GitDataContext.jsx`** - Central state management
- Manages repository data
- Handles API communication
- Provides data to all components

**`ZenProcessVisualizer.jsx`** - Main visualization engine
- Orchestrates playback sequence
- Manages display modes (overview → creation → modification)
- Controls animation timing

**`MinimalDirectoryTree.jsx`** - File system visualization
- Shows repository structure
- Animates file additions/modifications
- Auto-expands directories as files are added

**`MinimalPlaybackControls.jsx`** - Playback interface
- Play/pause control
- Speed adjustment (0.5x to 10x)
- Positioned top-right for minimal interference

## Visualization Pipeline

### 1. Data Processing

```javascript
Raw Git History → Structured Operations → Timed Sequence → Visual Events
```

The system processes git commits into a sequence of operations:
- **Commit Overview** - Shows commit message, author, file list
- **File Creation** - Displays new files with content streaming
- **File Modification** - Shows diffs with additions/deletions

### 2. Playback System

The playback engine operates on a step-based system:

```javascript
for each commit:
    1. Display commit overview (5 seconds)
    2. for each file in commit:
        - Show file operation header
        - Animate content/diff display (4 seconds)
        - Update directory tree
    3. Progress to next commit
```

### 3. Animation System

Animations are carefully orchestrated for smooth visualization:
- **Line-by-line reveal** for new files
- **Chunk-by-chunk reveal** for diffs
- **Staggered delays** for visual hierarchy
- **No jumping** - fixed viewports prevent layout shifts

## Design Philosophy

### Zen Minimalism
- **Monochrome palette** - Black background, grayscale elements
- **Typography-first** - Text is the primary visual element
- **Grid systems** - Structured, aligned layouts
- **Purposeful animation** - Every motion has meaning

### Visual Hierarchy
1. **Commit message** - Large, centered, holds attention
2. **File operations** - Clear labels (CREATE/MODIFY)
3. **Code content** - Monospace, readable size
4. **Metadata** - Small, subdued, contextual

## Performance Optimizations

### Frontend
- **Viewport limiting** - Only render visible lines
- **Animation frames** - RequestAnimationFrame for smooth motion
- **Lazy loading** - Load file content on demand
- **Debounced updates** - Prevent excessive re-renders

### Backend
- **Streaming responses** - Large files sent in chunks
- **Error resilience** - Graceful handling of missing files
- **Caching** - Git operations cached where possible

## File Structure

```
git-project-visualizer/
├── src/
│   ├── components/           # React components
│   │   ├── ZenProcessVisualizer.jsx
│   │   ├── MinimalDirectoryTree.jsx
│   │   ├── MinimalPlaybackControls.jsx
│   │   └── MinimalRepoSelector.jsx
│   ├── context/              # State management
│   │   └── GitDataContext.jsx
│   ├── styles/               # Component styles
│   │   ├── ZenProcessVisualizer.css
│   │   ├── minimalist.css
│   │   └── ...
│   └── MinimalApp.jsx       # Main app component
├── server.js                 # Express backend
├── index.html               # Entry HTML
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies
```

## Usage Flow

1. **Repository Selection**
   - User enters local repository path
   - System validates it's a git repository
   - Branches are loaded for selection

2. **Data Loading**
   - Selected branch's commits are fetched
   - File operations are extracted from each commit
   - Operations are sequenced for playback

3. **Visualization Playback**
   - User clicks PLAY
   - System steps through each commit
   - Each file change is animated
   - Directory tree updates in real-time
   - Progress bar shows overall completion

4. **Interactive Control**
   - Pause at any time
   - Adjust playback speed
   - Visual feedback for current operation

## Extension Points

### Adding New Visualizations
1. Create component in `src/components/`
2. Add styles in `src/styles/`
3. Integrate with `GitDataContext` for data
4. Add to playback sequence if needed

### Supporting New Data Sources
1. Add API endpoint in `server.js`
2. Create data extraction logic
3. Update `GitDataContext` with new methods
4. Integrate with visualization components

### Customizing Visual Style
1. Modify CSS variables in `minimalist.css`
2. Adjust animation timings in component CSS
3. Update color scheme for different moods
4. Modify typography scales

## Deployment

### Development
```bash
npm install --legacy-peer-deps
npm run dev
```

### Production
```bash
npm run build
npm run preview
```

### Environment Requirements
- Node.js 16+
- Git installed and accessible
- Modern browser with ES6 support
- Local filesystem access (for repository reading)

## Security Considerations

- **Local only** - Reads local repositories only
- **Read-only** - Never modifies repository data
- **Path validation** - Validates repository paths
- **Error boundaries** - Graceful error handling
- **No remote execution** - All git operations are read-only

## Future Enhancements

### Planned Features
- Export visualization as video
- Multiple repository comparison
- Branch diff visualization
- Commit message sentiment analysis
- AI narration of changes
- Collaborative viewing sessions

### Performance Improvements
- Web Worker for git operations
- Virtual scrolling for large files
- Progressive diff loading
- Commit pre-processing cache

## Conclusion

The Git Project Visualizer transforms raw git history into a compelling visual narrative. By focusing on the process rather than just the outcome, it reveals the elegance and complexity of software development—particularly when that development is driven by AI systems. The architecture prioritizes smooth visualization, minimal design, and purposeful animation to create an experience that is both informative and aesthetically powerful.