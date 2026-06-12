#!/bin/bash
# Setup cron job pour IA AUTO NEWS
# Exécution quotidienne à 6:00 AM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/generate_ia_auto_news.py"
LOG_FILE="$PROJECT_ROOT/logs/ia_auto_news.log"

# Vérifier que le script Python existe
if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "❌ Script Python non trouvé: $PYTHON_SCRIPT"
    exit 1
fi

# Créer le dossier logs s'il n'existe pas
mkdir -p "$PROJECT_ROOT/logs"

# Rendre le script exécutable
chmod +x "$PYTHON_SCRIPT"

# Configuration cron : 6:00 AM tous les jours
CRON_TIME="0 6 * * *"
CRON_CMD="cd $PROJECT_ROOT && /usr/bin/python3 $PYTHON_SCRIPT >> $LOG_FILE 2>&1"

# Vérifier si le cron existe déjà
if crontab -l 2>/dev/null | grep -q "generate_ia_auto_news.py"; then
    echo "⚠️  Cron job déjà existant pour IA AUTO NEWS"
    echo "   Suppression de l'ancien..."
    crontab -l 2>/dev/null | grep -v "generate_ia_auto_news.py" | crontab -
fi

# Ajouter le nouveau cron
(crontab -l 2>/dev/null; echo "$CRON_TIME $CRON_CMD") | crontab -

echo "✅ Cron configuré avec succès!"
echo "   ⏰ Heure: 6:00 AM quotidien"
echo "   📝 Script: $PYTHON_SCRIPT"
echo "   📋 Logs: $LOG_FILE"
echo ""
echo "🔍 Pour vérifier: crontab -l"
echo "📋 Pour voir les logs: tail -f $LOG_FILE"
echo ""
echo "💡 Pour tester maintenant:"
echo "   python3 $PYTHON_SCRIPT"