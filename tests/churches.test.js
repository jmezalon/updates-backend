const request = require('supertest');
const express = require('express');
const churchesRouter = require('../routes/churches');

const app = express();
app.use(express.json());
app.use('/churches', churchesRouter);

describe('Churches API', () => {
  it('should list all churches', async () => {
    const res = await request(app).get('/churches');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should return 404 for non-existent church', async () => {
    const res = await request(app).get('/churches/99999');
    expect(res.statusCode).toBe(404);
  });

  // Add more tests for POST, PUT, DELETE as needed
});
