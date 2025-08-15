# Build Diary - Git Project Visualizer

## Project Goal
Build web-based visualization for AI writers' room repo evolution with synchronized timeline, directory tree, diffs, commits, and conversations.

## Build Log

### Entry 1 - Project Setup
- Created build diary and todo list
- Tech stack: React, D3.js, Node backend for git operations
- Next: Set up project structure

### Entry 2 - Backend Server
- Created Express server with git operations via simple-git
- API endpoints: branches, commits, file history, diffs, tree structure, conversations
- WebSocket for real-time file watching
- Next: React frontend components

### Entry 3 - Frontend Complete
- Built all React components: Timeline, DirectoryTree, DiffViewer, CommitGraph, ConversationHistory
- Added PlaybackControls for time-based navigation
- Created RepoSelector for repository/branch selection
- Implemented GitDataContext for state management
- Added full CSS styling with dark theme
- Next: Install dependencies and test

### Entry 4 - Project Complete
- Successfully installed all dependencies
- Created comprehensive README with usage instructions
- System ready for testing with any git repository
- Run `npm run dev` to start both server and client

### Entry 5 - Cinematic Mode Implementation
- User requested continuous flow without timeline gaps
- Created AutoPlayDiffViewer and CinematicPlayback components
- Added typewriter effects and smooth scrolling
- Animated directory tree expansion

### Entry 6 - Japanese Minimalist Redesign
- Implemented dark mode with monochrome palette
- Removed playful elements, focused on typography
- Created MinimalDirectoryTree, MinimalPlaybackControls
- Added purposeful animations and negative space

### Entry 7 - Epic Process Visualizer
- Built dramatic animations with pulsing rings
- Added file cards and sophisticated effects
- User feedback: too playful with emojis

### Entry 8 - Zen Process Visualizer
- Created serious, powerful aesthetic
- No emojis, sharp minimal design
- Fixed text cutoff and jumping issues
- Implemented step-based playback

### Entry 9 - August 15, 2025 - Bug Fixes and Enhancements

#### Issues Fixed:

1. **Directory Tree Cut Off by Divider**
   - Problem: Tree was being cut off by panel dividing line
   - Solution: Removed border, made background transparent, added padding-right

2. **File Statistics Showing Zero**
   - Problem: Completion stats showed 0 files created/modified
   - Solution: Rewrote calculation to track unique files across operations
   - First occurrence = created, subsequent = modified

3. **Visualization Looping Infinitely**
   - Problem: Playback restarted after last commit
   - Solution: Added onComplete callback, stop at end with completion screen

4. **Commits Playing in Reverse**
   - Problem: Playing newest to oldest
   - Solution: Added .reverse() to commits array

5. **Ladrona Branch Including Extra Commits**
   - Problem: Showed 21 commits instead of 11 Ladrona-specific
   - Solution: Created standalone repository at /Users/cp/Documents/ladrona-clean

#### Features Added:

- **Ghost Directory Tree**: Auto-expanding with real-time animations
- **CREATE/MODIFY Badges**: Visual indicators for file operations
- **Scanning Effects**: Shows AI "thinking" process
- **Completion Statistics**: Accurate count of commits, files, operations
- **Non-looping Playback**: Stops at end with summary screen