#!/usr/bin/env node

/**
 * Cleanup Port 3001
 * 
 * Kills any lingering Node.js processes listening on port 3001
 * to prevent EADDRINUSE errors when starting tauri-dev.
 * 
 * This handles Windows, Linux, and macOS environments.
 */

const { exec, execSync } = require('child_process');
const os = require('os');

const PORT = 3001;
const isWindows = os.platform() === 'win32';

/**
 * Windows: Use netstat to find processes on port 3001
 */
function cleanupWindows() {
  try {
    console.log(`🔍 Checking for processes on port ${PORT} (Windows)...`);
    
    // Use netstat to find the PID listening on port 3001
    const output = execSync(
      `netstat -ano | findstr :${PORT}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    
    if (!output) {
      console.log(`✅ Port ${PORT} is free. No cleanup needed.`);
      return;
    }
    
    // Extract PID from netstat output
    // Format: TCP 0.0.0.0:3001 0.0.0.0:0 LISTENING 12345
    const lines = output.split('\n').filter(line => line.includes('LISTENING'));
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trimRight().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && !isNaN(pid) && pid !== '0') {
        pids.add(pid);
      }
    });
    
    if (pids.size === 0) {
      console.log(`✅ Port ${PORT} is free. No cleanup needed.`);
      return;
    }
    
    // Kill each process
    pids.forEach(pid => {
      try {
        console.log(`🔪 Killing process ${pid}...`);
        execSync(`taskkill /PID ${pid} /F`, { timeout: 5000 });
        console.log(`✅ Process ${pid} terminated.`);
      } catch (err) {
        if (err.message.includes('not found') || err.message.includes('No such process')) {
          console.log(`⚠️  Process ${pid} not found (already terminated).`);
        } else {
          console.error(`⚠️  Failed to kill process ${pid}:`, err.message);
        }
      }
    });
    
  } catch (err) {
    if (err.status === 1 && err.message.includes('findstr')) {
      // Port not in use - this is expected
      console.log(`✅ Port ${PORT} is free. No cleanup needed.`);
      return;
    }
    console.error(`⚠️  Error checking port ${PORT}:`, err.message);
    // Don't fail the build - this is a cleanup utility
  }
}

/**
 * Unix/Linux/macOS: Use lsof to find processes on port 3001
 */
function cleanupUnix() {
  try {
    console.log(`🔍 Checking for processes on port ${PORT} (Unix-like)...`);
    
    // Use lsof to find the PID listening on port 3001
    const output = execSync(
      `lsof -i :${PORT} -t`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
    
    if (!output) {
      console.log(`✅ Port ${PORT} is free. No cleanup needed.`);
      return;
    }
    
    const pids = output.split('\n').filter(line => line.trim());
    
    if (pids.length === 0) {
      console.log(`✅ Port ${PORT} is free. No cleanup needed.`);
      return;
    }
    
    // Kill each process
    pids.forEach(pid => {
      try {
        console.log(`🔪 Killing process ${pid}...`);
        execSync(`kill -9 ${pid}`, { timeout: 5000 });
        console.log(`✅ Process ${pid} terminated.`);
      } catch (err) {
        if (err.message.includes('not found') || err.message.includes('No such process')) {
          console.log(`⚠️  Process ${pid} not found (already terminated).`);
        } else {
          console.error(`⚠️  Failed to kill process ${pid}:`, err.message);
        }
      }
    });
    
  } catch (err) {
    if (err.status === 1) {
      // Port not in use - this is expected
      console.log(`✅ Port ${PORT} is free. No cleanup needed.`);
      return;
    }
    console.error(`⚠️  Error checking port ${PORT}:`, err.message);
    // Don't fail the build - this is a cleanup utility
  }
}

// Run appropriate cleanup based on OS
console.log(`\n📦 BIOME Port ${PORT} Cleanup Utility\n`);

if (isWindows) {
  cleanupWindows();
} else {
  cleanupUnix();
}

console.log('\n✨ Cleanup complete. Ready to start development.\n');
