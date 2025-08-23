const { test, before } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const { newDb } = require('pg-mem');

process.env.BCRYPT_ROUNDS = '1';
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';

const db = newDb();
const pg = db.adapters.createPg();
require.cache[require.resolve('pg')] = { exports: pg };

const app = express();
app.use(express.json());
app.use('/api/utenti', require('../routes/utenti'));

let adminToken;
let adminId;
let operatorToken;
let operatorId;

before(async () => {
  const regRes = await request(app).post('/api/utenti/register').send({
    nome: 'Admin',
    cognome: 'User',
    email: 'admin@example.com',
    password: 'Password123',
    ruolo: 'Amministratore'
  });
  adminId = regRes.body.utenteId;

  const loginRes = await request(app).post('/api/utenti/login').send({
    email: 'admin@example.com',
    password: 'Password123'
  });
  adminToken = loginRes.body.token;
});

test('registrazione nuovo utente operatore', async () => {
  const res = await request(app).post('/api/utenti/register').send({
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario@example.com',
    password: 'Password123'
  });
  assert.equal(res.status, 201);
  assert.ok(res.body.utenteId);
  operatorId = res.body.utenteId;
});

test('registrazione con email esistente', async () => {
  const res = await request(app).post('/api/utenti/register').send({
    nome: 'Mario',
    cognome: 'Rossi',
    email: 'mario@example.com',
    password: 'Password123'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'EMAIL_EXISTS');
});

test('login con credenziali valide', async () => {
  const res = await request(app).post('/api/utenti/login').send({
    email: 'mario@example.com',
    password: 'Password123'
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  operatorToken = res.body.token;
});

test('login con password errata', async () => {
  const res = await request(app).post('/api/utenti/login').send({
    email: 'mario@example.com',
    password: 'WrongPwd'
  });
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'INVALID_CREDENTIALS');
});

test('profilo utente corrente con token valido', async () => {
  const res = await request(app)
    .get('/api/utenti/me')
    .set('Authorization', `Bearer ${operatorToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.user.email, 'mario@example.com');
});

test('profilo utente corrente senza token', async () => {
  const res = await request(app).get('/api/utenti/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.code, 'TOKEN_REQUIRED');
});

test('lista utenti accessibile solo agli amministratori', async () => {
  const res = await request(app)
    .get('/api/utenti')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.users));
  assert.ok(res.body.total >= 2);
});

test('lista utenti negata a operatore', async () => {
  const res = await request(app)
    .get('/api/utenti')
    .set('Authorization', `Bearer ${operatorToken}`);
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'ADMIN_REQUIRED');
});

test('operatore non può modificare ruoli', async () => {
  const res = await request(app)
    .put(`/api/utenti/${operatorId}/ruolo`)
    .set('Authorization', `Bearer ${operatorToken}`)
    .send({ ruolo: 'Amministratore' });
  assert.equal(res.status, 403);
  assert.equal(res.body.code, 'ADMIN_REQUIRED');
});

test('admin modifica ruolo di un altro utente', async () => {
  const res = await request(app)
    .put(`/api/utenti/${operatorId}/ruolo`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ ruolo: 'Amministratore' });
  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Ruolo aggiornato con successo');

  const list = await request(app)
    .get('/api/utenti')
    .set('Authorization', `Bearer ${adminToken}`);
  const updated = list.body.users.find(u => u.utenteId === operatorId);
  assert.equal(updated.ruolo, 'Amministratore');
});

test('admin non può modificare il proprio ruolo', async () => {
  const res = await request(app)
    .put(`/api/utenti/${adminId}/ruolo`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ ruolo: 'Operatore' });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'CANNOT_MODIFY_OWN_ROLE');
});

