const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const { newDb } = require('pg-mem');

// Configure environment for tests
process.env.BCRYPT_ROUNDS = '1';
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

// Setup in-memory PostgreSQL and override 'pg'
const db = newDb();
const pg = db.adapters.createPg();
require.cache[require.resolve('pg')] = { exports: pg };

// Build express app using routes
const app = express();
app.use(express.json());
app.use('/api/utenti', require('../routes/utenti'));
app.use('/api/clienti', require('../routes/clienti'));

before(async () => {
  // Create test admin user
  await request(app).post('/api/utenti/register').send({
    nome: 'Admin',
    cognome: 'Test',
    email: 'info@italydesignstudio.com',
    password: 'MilanoSantana<3',
    ruolo: 'Amministratore'
  });
});

describe('Autenticazione', () => {
  test('Login con credenziali valide', async () => {
    const response = await request(app)
      .post('/api/utenti/login')
      .send({
        email: 'info@italydesignstudio.com',
        password: 'MilanoSantana<3'
      });

    assert.strictEqual(response.status, 200);
    assert.ok(response.body.token);
    assert.strictEqual(response.body.user.email, 'info@italydesignstudio.com');
  });

  test('Login con credenziali non valide', async () => {
    const response = await request(app)
      .post('/api/utenti/login')
      .send({
        email: 'test@example.com',
        password: 'password_sbagliata'
      });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    assert.strictEqual(response.status, 401);
    assert.ok(response.body.error || response.body.message);
  });

  test('Accesso a endpoint protetto senza token', async () => {
    const response = await request(app)
      .get('/api/clienti');

    assert.strictEqual(response.status, 401);
  });
});
