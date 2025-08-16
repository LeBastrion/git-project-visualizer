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

### Entry 10 - August 15, 2025 - Brutalist Code Canvas Implementation

#### Design Philosophy:
- Replaced ZenProcessVisualizer with BrutalistCodeCanvas
- Sharp edges, raw information, no ornament
- Every pixel has purpose - brutalist aesthetic

#### Features Implemented:

1. **Fixed Commit Header**
   - Shows current commit being processed
   - Progress bar for overall completion
   - Persistent across all display states

2. **Three Display States**
   - **Overview**: Grid layout of files to process with current indicator
   - **Creation**: Typewriter effect with blinking cursor
   - **Modification**: Line-by-line diff reveal with +/- indicators

3. **Visual Design**
   - Pure black background (#000000)
   - Monospace throughout, no decorative fonts
   - No rounded corners, shadows, or gradients
   - Grid-based spacing (10px units)

4. **Performance Optimizations**
   - Limited visible lines to prevent memory issues
   - Simple linear transitions, no easing
   - Cleanup of animation timeouts on unmount

#### Technical Details:
- File path breakdown (directories gray, filename white)
- Progress indicators without percentages
- Hard cuts between states, no fades
- Fixed timing intervals for consistency

### Entry 11 - August 15, 2025 - Critical Bugs and Server Issues

#### Current Issues (IN PROGRESS):

1. **Server Not Returning File Data**
   - Problem: git.log() from simple-git doesn't include file information
   - Attempted fix: Switched to parsing raw git output with --name-status
   - Status: Server parsing logic implemented but needs testing

2. **Port 3001 Already in Use**
   - Problem: Server process gets stuck and prevents restart
   - Workaround: Kill process with `lsof -ti:3001 | xargs kill -9`
   - Need permanent fix for clean shutdown

3. **Visualization Not Starting**
   - Problem: After entering repo path, nothing happens
   - Cause: Empty files array in commit data
   - Related to server git log parsing issue

4. **File Content Display Issues**
   - MODIFY operations showing "CHANGES: +0 -0" 
   - Files not displaying actual content
   - Fallback logic added but not fully tested

5. **Directory Tree Width Fluctuation**
   - Fixed: Set to 400px fixed width
   - Prevents pushing right panel around

#### Server Changes Made:
```javascript
// Parsing git log output directly instead of using simple-git
git.raw(['log', '--pretty=format:%H|%an|%ae|%ad|%s', '--name-status', '--date=iso'])
```

#### Known Working State:
- Last working commit: Before BrutalistCodeCanvas implementation
- Components affected: server.js, BrutalistCodeCanvas.jsx

#### TODO:
- Test server parsing with actual repository
- Verify file operations detection (A, D, M, R status codes)
- Ensure proper restart mechanism for server