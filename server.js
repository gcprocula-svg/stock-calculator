const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'portfolios.json');

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 데이터 파일 초기화
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // 파일이 없으면 빈 배열로 초기화
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2));
  }
}

// 데이터 읽기
async function readPortfolios() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading portfolios:', error);
    return [];
  }
}

// 데이터 쓰기
async function writePortfolios(portfolios) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(portfolios, null, 2));
  } catch (error) {
    console.error('Error writing portfolios:', error);
    throw error;
  }
}

// API 엔드포인트

// 포트폴리오 저장 (POST /api/portfolios)
app.post('/api/portfolios', async (req, res) => {
  try {
    const portfolios = await readPortfolios();
    const newPortfolio = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    portfolios.push(newPortfolio);
    await writePortfolios(portfolios);
    
    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: newPortfolio
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 포트폴리오 조회 (GET /api/portfolios)
app.get('/api/portfolios', async (req, res) => {
  try {
    const portfolios = await readPortfolios();
    
    res.status(200).json({
      success: true,
      message: 'Portfolios retrieved successfully',
      data: portfolios,
      count: portfolios.length
    });
  } catch (error) {
    console.error('Error retrieving portfolios:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 포트폴리오 삭제 (DELETE /api/portfolios/:id)
app.delete('/api/portfolios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const portfolios = await readPortfolios();
    
    const portfolioIndex = portfolios.findIndex(portfolio => portfolio.id === id);
    
    if (portfolioIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    const deletedPortfolio = portfolios.splice(portfolioIndex, 1)[0];
    await writePortfolios(portfolios);
    
    res.status(200).json({
      success: true,
      message: 'Portfolio deleted successfully',
      data: deletedPortfolio
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio API Server',
    version: '1.0.0',
    endpoints: {
      'POST /api/portfolios': 'Create a new portfolio',
      'GET /api/portfolios': 'Get all portfolios',
      'DELETE /api/portfolios/:id': 'Delete a portfolio by ID'
    }
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// 서버 시작
async function startServer() {
  try {
    await initializeDataFile();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📁 Data will be stored in: ${DATA_FILE}`);
      console.log('📋 Available endpoints:');
      console.log('  POST   /api/portfolios     - Create portfolio');
      console.log('  GET    /api/portfolios     - Get all portfolios');
      console.log('  DELETE /api/portfolios/:id - Delete portfolio');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

