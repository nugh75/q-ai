#!/bin/bash
echo "🧪 Test Cloudflare Q-AI"
echo "======================"
echo ""

echo "1️⃣ Test Backend Health..."
HEALTH=$(curl -s https://api-ai-q-2.ai4educ.org/health | jq -r .status 2>/dev/null || curl -s https://api-ai-q-2.ai4educ.org/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$HEALTH" = "healthy" ]; then
    echo "   ✅ Backend healthy"
else
    echo "   ❌ Backend NON risponde correttamente"
    echo "   Response: $HEALTH"
    exit 1
fi

echo ""
echo "2️⃣ Test Frontend HTTP..."
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" https://ai-q-2.ai4educ.org)
if [ "$FRONTEND" = "200" ]; then
    echo "   ✅ Frontend accessibile (HTTP $FRONTEND)"
else
    echo "   ❌ Frontend NON accessibile (HTTP $FRONTEND)"
    exit 1
fi

echo ""
echo "3️⃣ Test CORS..."
CORS=$(curl -s -H "Origin: https://ai-q-2.ai4educ.org" -I https://api-ai-q-2.ai4educ.org/health 2>/dev/null | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
    echo "   ✅ CORS configurato: $CORS"
else
    echo "   ❌ CORS NON configurato"
    exit 1
fi

echo ""
echo "4️⃣ Test Variabile Container..."
VITE_URL=$(docker exec questionnaire_frontend printenv VITE_API_URL 2>/dev/null)
if [[ "$VITE_URL" == *"api-ai-q-2.ai4educ.org"* ]]; then
    echo "   ✅ Container usa Cloudflare URL: $VITE_URL"
elif [ -z "$VITE_URL" ]; then
    echo "   ⚠️  Container non risponde (potrebbe essere in avvio)"
else
    echo "   ❌ Container usa IP locale: $VITE_URL"
    echo "   Esegui: docker-compose restart frontend"
    exit 1
fi

echo ""
echo "5️⃣ Test Cloudflared..."
if pgrep -f cloudflared > /dev/null; then
    echo "   ✅ Cloudflared attivo (PID: $(pgrep -f cloudflared))"
else
    echo "   ❌ Cloudflared NON attivo"
    echo "   Esegui: sudo systemctl start cloudflared"
    exit 1
fi

echo ""
echo "6️⃣ Test Database..."
DB_COUNT=$(curl -s https://api-ai-q-2.ai4educ.org/health 2>/dev/null | grep -o '"student_responses":[0-9]*' | grep -o '[0-9]*')
if [ -n "$DB_COUNT" ] && [ "$DB_COUNT" -gt 0 ]; then
    echo "   ✅ Database connesso ($DB_COUNT studenti)"
else
    echo "   ⚠️  Database potrebbe avere problemi"
fi

echo ""
echo "🎉 TUTTI I TEST PRINCIPALI SUPERATI!"
echo ""
echo "📋 Test Manuale Finale:"
echo "   1. Disconnettiti dalla VPN"
echo "   2. Apri browser: https://ai-q-2.ai4educ.org"
echo "   3. Verifica che i dati vengano caricati"
echo "   4. Apri console (F12) e verifica che non ci siano errori"
echo ""
echo "✅ Il sistema è configurato correttamente per Cloudflare"
