.PHONY: help build up down restart logs clean test health import

help:
	@echo "📊 Analisi Questionari AI - Comandi Disponibili"
	@echo ""
	@echo "  make build    - Costruisci le immagini Docker"
	@echo "  make up       - Avvia tutti i servizi"
	@echo "  make down     - Ferma tutti i servizi"
	@echo "  make restart  - Riavvia tutti i servizi"
	@echo "  make logs     - Visualizza i log"
	@echo "  make clean    - Rimuovi containers, volumi e immagini"
	@echo "  make test     - Verifica setup"
	@echo "  make health   - Controlla stato servizi"
	@echo "  make import   - Importa dati Excel"
	@echo ""

build:
	@echo "🔨 Costruzione immagini Docker..."
	docker-compose build

up:
	@echo "🚀 Avvio servizi..."
	docker-compose up -d
	@echo "✅ Servizi avviati!"
	@echo ""
	@echo "📡 URLs disponibili:"
	@echo "   Frontend:  http://localhost:5180"
	@echo "   Backend:   http://localhost:8118"
	@echo "   API Docs:  http://localhost:8118/docs"

down:
	@echo "⏹️  Arresto servizi..."
	docker-compose down

restart:
	@echo "🔄 Riavvio servizi..."
	docker-compose restart

logs:
	docker-compose logs -f

clean:
	@echo "🧹 Pulizia completa..."
	docker-compose down -v
	docker system prune -f

test:
	@./test-setup.sh

health:
	@echo "🏥 Controllo stato servizi..."
	@docker-compose ps
	@echo ""
	@echo "🔍 Health check API..."
	@curl -s http://localhost:8118/health | python3 -m json.tool || echo "❌ Backend non raggiungibile"

import:
	@echo "📥 Importazione dati..."
	@curl -X POST http://localhost:8118/api/import
	@echo ""
	@echo "✅ Importazione completata!"
