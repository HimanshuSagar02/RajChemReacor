# How to Run the Frontend

## Prerequisites
- Node.js (v16 or higher recommended)
- npm or yarn package manager

## Steps to Run

### 1. Navigate to Frontend Directory
```bash
cd frontend
```

### 2. Install Dependencies (First Time Only)
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (default Vite port)

## Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_SERVER_URL=http://localhost:8000
# OR for production:
# VITE_SERVER_URL=https://rajchemreactor.onrender.com
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### Port Already in Use
If port 5173 is already in use, Vite will automatically use the next available port (5174, 5175, etc.)

### Connection Errors
1. Check if backend server is running
2. Verify `VITE_SERVER_URL` in `.env` file
3. Check browser console for detailed error messages
4. Ensure CORS is properly configured on backend

### Network Errors
- Check your internet connection
- Verify server URL is correct
- Check if backend server is accessible
- Review browser console for detailed error messages

## Development Tips

- Hot Module Replacement (HMR) is enabled - changes reflect immediately
- Check browser console (F12) for debugging information
- Network tab shows all API requests and responses

