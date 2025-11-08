import express from 'express';
import path from 'path';

const app = express();
// Enable CORS manually
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
app.use(express.json());

// Mock data
const mockBiomes = [
  {
    id: 1,
    name: 'Forest Biome',
    description: 'A lush green forest with towering trees',
    backgroundSprite: null,
  },
  {
    id: 2,
    name: 'Desert Biome',
    description: 'A vast sandy desert with scorching sun',
    backgroundSprite: null,
  },
  {
    id: 3,
    name: 'Ocean Biome',
    description: 'Deep blue waters with mysterious creatures',
    backgroundSprite: null,
  },
];

const mockSprites = [
  {
    id: 1,
    filename: 'platform1.png',
    category: 'biome-platform',
    name: 'Grass Platform',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
  },
  {
    id: 2,
    filename: 'platform2.png',
    category: 'biome-platform',
    name: 'Stone Platform',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
  },
  {
    id: 3,
    filename: 'obstacle1.png',
    category: 'biome-obstacle',
    name: 'Rock',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
  },
  {
    id: 4,
    filename: 'obstacle2.png',
    category: 'biome-obstacle',
    name: 'Tree',
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    mimeType: 'image/png',
  },
];

const levelObjects: { [key: number]: any[] } = {
  1: [],
  2: [],
  3: [],
};

// API endpoints
app.get('/api/game/biomes', (req, res) => {
  res.json(mockBiomes);
});

app.get('/api/biomes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const biome = mockBiomes.find(b => b.id === id);
  if (biome) {
    res.json(biome);
  } else {
    res.status(404).json({ error: 'Biome not found' });
  }
});

app.get('/api/biomes/:id/level-objects', (req, res) => {
  const biomeId = parseInt(req.params.id);
  res.json(levelObjects[biomeId] || []);
});

app.post('/api/biomes/:id/level-objects/batch', (req, res) => {
  const biomeId = parseInt(req.params.id);
  levelObjects[biomeId] = req.body;
  res.json({ success: true, count: req.body.length });
});

app.get('/api/sprites', (req, res) => {
  res.json(mockSprites);
});

app.get('/api/sprites/file/:filename', (req, res) => {
  const sprite = mockSprites.find(s => s.filename === req.params.filename);
  if (sprite) {
    res.redirect(sprite.data);
  } else {
    res.status(404).send('Sprite not found');
  }
});

// Auth endpoints (mock)
app.get('/api/auth/me', (req, res) => {
  res.json({ username: 'testuser' });
});

// Serve static files from the client build
const clientPath = path.join(process.cwd(), 'dist/public');
app.use(express.static(clientPath));

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(clientPath, 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Client build not found. Please run: npm run build');
  }
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => {
  console.log(`[mock-server] Server running at http://localhost:${PORT}`);
  console.log('[mock-server] API endpoints available:');
  console.log('  GET  /api/game/biomes');
  console.log('  GET  /api/biomes/:id');
  console.log('  GET  /api/biomes/:id/level-objects');
  console.log('  POST /api/biomes/:id/level-objects/batch');
  console.log('  GET  /api/sprites');
  console.log('  GET  /api/sprites/file/:filename');
  console.log('[mock-server] Navigate to http://localhost:5173/game/admin to test the Level Editor');
});