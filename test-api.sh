#!/bin/bash

echo "Testing API Endpoints..."

# Test health check
echo -e "\n1. Testing health check:"
curl -s https://gestionale-termoidraulico-api.onrender.com/health | jq

# Test CORS preflight
echo -e "\n2. Testing CORS preflight:"
curl -X OPTIONS \
  -H "Origin: https://gestionale-termoidraulico-frontend.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -s -o /dev/null -w "Status: %{http_code}\n" \
  https://gestionale-termoidraulico-api.onrender.com/api/utenti/login

# Test login with correct credentials
echo -e "\n3. Testing login with correct credentials:"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://gestionale-termoidraulico-frontend.onrender.com" \
  -d '{"email":"admin@gestionale.local","password":"admin123"}' \
  -s https://gestionale-termoidraulico-api.onrender.com/api/utenti/login | jq

# Test login with wrong credentials
echo -e "\n4. Testing login with wrong credentials:"
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://gestionale-termoidraulico-frontend.onrender.com" \
  -d '{"email":"admin@gestionale.local","password":"wrong"}' \
  -s https://gestionale-termoidraulico-api.onrender.com/api/utenti/login | jq

echo -e "\nTest completed!"
