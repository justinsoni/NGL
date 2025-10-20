#!/usr/bin/env node

/**
 * Backend Server Startup Script
 * This script helps start the backend server with automatic port detection
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Football League Hub Backend Server...');
console.log('📍 Automatic port detection enabled');
console.log('🔍 If port 5000 is busy, the server will automatically use the next available port');
console.log('');

// Start the server
const serverProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname),
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
});
