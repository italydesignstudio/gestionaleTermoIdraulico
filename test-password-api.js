#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'https://gestionale-termoidraulico-api.onrender.com/api';

async function testAPI() {
  console.log('🧪 Test API Password Info');
  console.log('📡 URL:', API_BASE_URL);
  
  try {
    // Test GET senza token (dovrebbe dare 401)
    console.log('\n1. Test GET /password-info senza token:');
    try {
      const response = await axios.get(`${API_BASE_URL}/password-info`);
      console.log('❌ Non dovrebbe funzionare senza token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correttamente rifiutato (401):', error.response.data.error);
      } else {
        console.log('⚠️  Errore inaspettato:', error.response?.data || error.message);
      }
    }

    // Test health endpoint
    console.log('\n2. Test GET /health:');
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
      console.log('✅ Health check:', response.data);
    } catch (error) {
      console.log('❌ Errore health check:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

testAPI();
