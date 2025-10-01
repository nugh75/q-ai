#!/bin/bash

echo "🔍 Test Setup Applicazione Questionari AI"
echo "========================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verifica Docker
echo "1. Verifica Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker non trovato${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker installato${NC}"

# 2. Verifica Docker Compose
echo "2. Verifica Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose non trovato${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose installato${NC}"

# 3. Verifica file Excel
echo "3. Verifica file Excel..."
if [ ! -f "dati/Studenti - Questionario -CNR.xlsx" ]; then
    echo -e "${RED}❌ File studenti non trovato${NC}"
    exit 1
fi
if [ ! -f "dati/Insegnati - Questionario - CNR.xlsx" ]; then
    echo -e "${RED}❌ File insegnanti non trovato${NC}"
    exit 1
fi
echo -e "${GREEN}✓ File Excel presenti${NC}"

# 4. Verifica struttura directory
echo "4. Verifica struttura..."
if [ ! -d "backend/app" ]; then
    echo -e "${RED}❌ Directory backend/app non trovata${NC}"
    exit 1
fi
if [ ! -d "frontend/src" ]; then
    echo -e "${RED}❌ Directory frontend/src non trovata${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Struttura directory corretta${NC}"

# 5. Verifica Dockerfile
echo "5. Verifica Dockerfile..."
if [ ! -f "backend/Dockerfile" ]; then
    echo -e "${RED}❌ Backend Dockerfile non trovato${NC}"
    exit 1
fi
if [ ! -f "frontend/Dockerfile" ]; then
    echo -e "${RED}❌ Frontend Dockerfile non trovato${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dockerfile presenti${NC}"

# 6. Verifica docker-compose.yml
echo "6. Verifica docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml non trovato${NC}"
    exit 1
fi
echo -e "${GREEN}✓ docker-compose.yml presente${NC}"

echo ""
echo -e "${GREEN}🎉 Setup verificato con successo!${NC}"
echo ""
echo "Prossimi passi:"
echo "1. Avvia l'applicazione:    ${YELLOW}docker-compose up -d${NC}"
echo "2. Verifica lo stato:       ${YELLOW}docker-compose ps${NC}"
echo "3. Apri il browser su:      ${YELLOW}http://localhost:5173${NC}"
echo "4. API documentation:       ${YELLOW}http://localhost:8000/docs${NC}"
echo ""
echo "Per vedere i log:           ${YELLOW}docker-compose logs -f${NC}"
echo "Per fermare:                ${YELLOW}docker-compose down${NC}"
