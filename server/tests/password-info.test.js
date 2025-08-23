const { test, before } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const request = require('supertest');
const { newDb } = require('pg-mem');

process.env.BCRYPT_ROUNDS = '1';
process.env.JWT_SECRET = 'testsecret';
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_chars!!';

const db = newDb();
const pg = db.adapters.createPg();
require.cache[require.resolve('pg')] = { exports: pg };

const app = express();
app.use(express.json());
app.use('/api/utenti', require('../routes/utenti'));
app.use('/api/password-info', require('../routes/password-info'));

let token;
let infoId;

before(async () => {
  await request(app).post('/api/utenti/register').send({
    nome: 'Admin',
    cognome: 'User',
    email: 'admin@example.com',
    password: 'Password123',
    ruolo: 'Amministratore'
  });

  const res = await request(app).post('/api/utenti/login').send({
    email: 'admin@example.com',
    password: 'Password123'
  });
  token = res.body.token;
});

test('creazione di un record password valido', async () => {
  const res = await request(app)
    .post('/api/password-info')
    .set('Authorization', `Bearer ${token}`)
    .send({
      titolo: 'Email Aziendale',
      categoria: 'Email',
      url: 'https://mail.example.com',
      username: 'admin',
      email: 'admin@example.com',
      password: 'Secret123',
      codici: 'pin',
      descrizione: 'Casella di posta',
      note: 'Nessuna'
    });

  assert.equal(res.status, 201);
  assert.ok(res.body.infoId);
  infoId = res.body.infoId;
});

test('lista delle password con mascheramento', async () => {
  const res = await request(app)
    .get('/api/password-info')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.passwordInfo));
  assert.equal(res.body.passwordInfo[0].passwordmascherata, '••••••••');
});

test('dettaglio della password con valore decifrato', async () => {
  const res = await request(app)
    .get(`/api/password-info/${infoId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.passwordInfo.passwordDecifrata, 'Secret123');
});

test('aggiornamento di un record password', async () => {
  const res = await request(app)
    .put(`/api/password-info/${infoId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      titolo: 'Email Aggiornata',
      categoria: 'Email',
      url: 'https://mail.example.com',
      username: 'admin',
      email: 'admin@example.com',
      password: 'NewSecret456',
      codici: 'pin',
      descrizione: 'Casella aggiornata',
      note: 'Agg'
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.passwordInfo.titolo, 'Email Aggiornata');
});

test('statistiche password per categoria', async () => {
  const res = await request(app)
    .get('/api/password-info/stats')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.total >= 1);
});

test('importazione CSV di password', async () => {
  const res = await request(app)
    .post('/api/password-info/import-csv')
    .set('Authorization', `Bearer ${token}`)
    .send({
      csvData: [
        {
          titolo: 'Portale Fornitori',
          categoria: 'Fornitori',
          url: 'https://fornitori.example.com',
          username: 'forn',
          email: 'forn@example.com',
          password: 'Pwd123'
        }
      ]
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.imported, 1);
});

test('eliminazione di un record password', async () => {
  const res = await request(app)
    .delete(`/api/password-info/${infoId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);

  const check = await request(app)
    .get(`/api/password-info/${infoId}`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(check.status, 404);
});

