const { test, before } = require('node:test');
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

let token;
let clienteId;

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

test('creazione di un cliente valido', async () => {
  const res = await request(app)
    .post('/api/clienti')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Giuseppe',
      cognome: 'Verdi',
      email: 'giuseppe.verdi@example.com',
      telefono: '123 456 7890',
      indirizzo: 'Via Roma 1',
      citta: 'Roma',
      cap: '00100',
      provincia: 'RM',
      provenienzaContatto: 'Google',
      consensoPrivacy: true,
      consensoMarketing: false,
      note: 'Cliente test'
    });

  assert.equal(res.status, 201);
  assert.ok(res.body.clienteId);
  clienteId = res.body.clienteId;
});

test('rifiuto di un valore di provenienzaContatto non valido', async () => {
  const res = await request(app)
    .post('/api/clienti')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Luigi',
      cognome: 'Bianchi',
      email: 'luigi.bianchi@example.com',
      telefono: '123 456 7890',
      provenienzaContatto: 'InvalidSource',
      consensoPrivacy: true
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'VALIDATION_ERROR');
});

test('aggiornamento di un cliente esistente', async () => {
  const res = await request(app)
    .put(`/api/clienti/${clienteId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Giuseppe',
      cognome: 'Verdi',
      email: 'giuseppe.verdi@example.com',
      telefono: '+39 123 456 7890',
      indirizzo: 'Via Milano 2',
      citta: 'Milano',
      cap: '20100',
      provincia: 'MI',
      provenienzaContatto: 'Google',
      consensoPrivacy: true,
      consensoMarketing: true,
      note: 'Aggiornato'
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.cliente.clienteId, clienteId);
  assert.equal(res.body.cliente.citta, 'Milano');
});

test('gestione dell\u2019errore "Email gi\u00e0 registrata"', async () => {
  const res = await request(app)
    .post('/api/clienti')
    .set('Authorization', `Bearer ${token}`)
    .send({
      nome: 'Altro',
      cognome: 'Cliente',
      email: 'giuseppe.verdi@example.com',
      telefono: '123 456 7890',
      provenienzaContatto: 'Google',
      consensoPrivacy: true
    });

  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'EMAIL_EXISTS');
});
