# Git Project Visualizer

A powerful web-based visualization system for tracking the evolution of AI writers' room repositories. Watch as your autonomous agents transform intellectual property into TV show creative documents through an interactive timeline interface.

## Features

- **Timeline Visualization**: Chronological view of all repository changes
- **Directory Tree Evolution**: Animated file system changes with agent-specific colors
- **Diff Viewer**: Side-by-side and unified diff views for tracking content changes
- **Commit Graph**: Visual representation of commit history with agent attribution
- **Conversation History**: Integrated agent dialogue synchronized with code changes
- **Playback Controls**: Play, pause, and scrub through repository history at various speeds
- **Real-time Updates**: WebSocket connection for live file system monitoring

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Git repository to visualize

## Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd git-project-visualizer

# Install dependencies
npm install --legacy-peer-deps
```

## Usage

1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the frontend:
```bash
npm run client
```

3. Or run both simultaneously:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

5. Enter the absolute path to your git repository

6. Select a branch to visualize

## Repository Structure Requirements

For conversation history to work, your repository should have a `conversations/` directory with JSON files containing agent dialogue in this format:

```json
{
  "id": "conv_123",
  "timestamp": 1234567890000,
  "title": "Story Structure Discussion",
  "messages": [
    {
      "agent": "agent_1",
      "timestamp": 1234567890000,
      "content": "Let's discuss the story structure...",
      "relatedFiles": ["docs/outline.md"]
    }
  ]
}
```

## Interface Overview

- **Top Timeline**: Scrub through commit history
- **Left Panel**: Directory tree showing file evolution
- **Center Panel**: Diff viewer for selected files
- **Right Panel**: Agent conversation history
- **Bottom Panel**: Commit graph visualization
- **Playback Controls**: Bottom bar with play/pause and speed controls

## Development

```bash
# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **Frontend**: React, D3.js, Vite
- **Backend**: Node.js, Express, simple-git
- **Real-time**: WebSockets
- **Styling**: Custom CSS with dark theme

## License

MIT