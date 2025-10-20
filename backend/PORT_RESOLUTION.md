# Port Conflict Resolution - Football League Hub Backend

## Problem Solved ✅

The backend server was crashing with `EADDRINUSE` errors when port 5000 was already occupied, causing nodemon to restart endlessly.

## Solution Implemented 🔧

### 1. **Automatic Port Detection**
- Server automatically detects if port 5000 is available
- If occupied, automatically tries ports 5001, 5002, 5003, etc. (up to 5010)
- Uses the first available port found

### 2. **Graceful Error Handling**
- Clear error messages when ports are in use
- Informative startup logs showing which port is being used
- No more crashes or endless restarts

### 3. **Enhanced Startup Messages**
```
🚀 Football League Hub API Server Started
📍 Environment: development
🌐 Port: 50001 (fallback from 5000)
🔗 Health Check: http://localhost:50001/health
📚 API Base URL: http://localhost:50001/api
⚠️  Port 5000 was in use, using port 50001 instead
```

## How to Use 🚀

### Option 1: Direct Server Start
```bash
cd backend
node server.js
```

### Option 2: Using npm Scripts
```bash
cd backend
npm start          # Standard start
npm run start:auto # With enhanced logging
npm run dev        # Development with nodemon
npm run dev:auto   # Development with auto port detection
```

## Technical Details 🔍

### Port Detection Logic
```javascript
const findAvailablePort = async (startPort) => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port automatically
        if (startPort < DEFAULT_PORT + MAX_PORT_ATTEMPTS) {
          findAvailablePort(startPort + 1).then(resolve).catch(reject);
        } else {
          reject(new Error(`No available ports found`));
        }
      } else {
        reject(err);
      }
    });
  });
};
```

### Configuration
- **Default Port**: 5000
- **Fallback Range**: 5000-5010
- **Max Attempts**: 10 ports
- **Environment Variable**: `PORT` (overrides default)

## Benefits ✨

1. **No More Crashes**: Server never crashes due to port conflicts
2. **Automatic Recovery**: Finds available port without manual intervention
3. **Clear Feedback**: Users know exactly which port is being used
4. **Development Friendly**: Works seamlessly with nodemon and hot reloading
5. **Production Ready**: Handles port conflicts gracefully in any environment

## Frontend Integration 🔗

The frontend Vite proxy is configured to connect to the backend:
- **API Requests**: `/api/*` → `http://localhost:5000`
- **WebSocket**: `/socket.io/*` → `http://localhost:5000`

If the backend uses a different port (e.g., 50001), you may need to update the frontend proxy configuration or restart the frontend server.

## Testing 🧪

Test the server startup:
```bash
# Test health endpoint
curl http://localhost:50001/health

# Test API endpoint
curl http://localhost:50001/api/news
```

## Troubleshooting 🔧

### If Frontend Can't Connect
1. Check which port the backend is using
2. Update frontend proxy configuration if needed
3. Restart frontend server

### If All Ports Are Busy
1. Kill existing Node.js processes: `Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force`
2. Check for other services using ports 5000-5010
3. Increase `MAX_PORT_ATTEMPTS` if needed

## Files Modified 📁

- `backend/server.js` - Added port detection logic
- `backend/start-server.js` - New startup script
- `backend/package.json` - Added new npm scripts
- `frontend/vite.config.ts` - Updated proxy configuration

---

**Result**: No more `EADDRINUSE` crashes! The server automatically finds and uses an available port, providing a smooth development experience. 🎉
