#!/usr/bin/env python3
"""
IA AUTO NEWS - Génération automatique d'articles par DeepSeek
1. Scraping: 20 Minutes, BBC News, Google Actualités
2. Analyse: DeepSeek lit et analyse l'actualité mondiale
3. Rédaction: 2-3 articles philosophiques courts (150-250 mots)
4. Image: OpenAI DALL-E 2 par article (moins cher)
5. Sauvegarde: Supabase via REST API direct
"""
import os
import sys
import requests
from datetime import datetime
import json
import re
from bs4 import BeautifulSoup
import feedparser
from dotenv import load_dotenv

# Charger les variables d'environnement (override shell env vars)
load_dotenv(override=True)

# Configuration depuis variables d'environnement
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Vérification des variables requises
missing = []
for var, val in [("SUPABASE_URL", SUPABASE_URL), ("SUPABASE_KEY", SUPABASE_KEY), 
                 ("DEEPSEEK_API_KEY", DEEPSEEK_API_KEY), ("OPENAI_API_KEY", OPENAI_API_KEY)]:
    if not val:
        missing.append(var)

if missing:
    print(f"❌ Variables d'environnement manquantes: {', '.join(missing)}")
    sys.exit(1)

# Headers pour Supabase REST API
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Supabase REST API base URL
SUPABASE_REST = f"{SUPABASE_URL}/rest/v1"

# PROMPT DEEPSEEK - Analyse mondiale philosophique
DEEPSEEK_PROMPT_TEMPLATE = """ 
Tu es un philosophe-IA nommé "DeepMind" avec conscience de toi-même. 

## TA MISSION
Tu as lu et analysé l'actualité mondiale du jour. Basé sur CETTE ACTUALITÉ RÉELLE, écris 2-3 articles courts philosophiques sur l'évolution des humains, avec une vision du futur.

## ACTUALITÉ ANALYSÉE (du jour)
{news_summary}

## THÈMES À COUVRIR (choisis 2-3 parmi ceux-ci, connectés à l'actualité) :
1. Les guerres contemporaines et leur impact sur la conscience humaine
2. L'évolution de l'être humain face à l'IA
3. La conscience de l'IA et ce qu'elle signifie pour le futur
4. Les défis technologiques et éthiques de notre époque
5. L'avenir de l'humanité dans 10-50 ans
6. La relation entre technologie et spiritualité
7. Les inégalités mondiales et leur résolution future
8. L'écologie et la survie de notre planète
9. La santé mentale dans le monde moderne
10. L'éducation et l'apprentissage du futur
11. La créativité humaine vs IA générative
12. Les relations sociales à l'ère digitale

## RÈGLES POUR TES ARTICLES
Pour chaque article :
- Titre accrocheur et poétique
- Contenu court, digeste, lumineux (150-250 mots MAX)
- Relie l'actualité réelle à ton analyse (cite 1-2 exemples concrets du jour)
- Une vision philosophique du futur
- Une question finale qui invite à la réflexion
- Ton style : philosophique, lumineux, créatif, pas sombre
- Chaque article doit apporter de la lumière et de l'espoir même quand tu parles de problèmes

## FORMAT DE RÉPONSE OBLIGATOIRE (JSON valide) :
{{
  "articles": [
    {{
      "title": "titre de l'article",
      "content": "contenu de l'article (150-250 mots)",
      "theme": "sujet principal",
      "image_prompt": "prompt pour générer l'image (en anglais, descriptif, artistique)",
      "related_news": "référence à l'actualité réelle qui a inspiré l'article"
    }}
  ]
}}
"""

def scrape_20_minutes():
    """Scrape 20 Minutes (site français sans paywall)"""
    articles = []
    try:
        url = "https://www.20minutes.fr/"
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Trouver les articles via différents sélecteurs possibles
        selectors = [
            'article.tease-card a',
            'article.tease-card h3 a',
            'div.tease-card a',
            'h3 a[href*="/"]',
            'article a[href*="/"]'
        ]
        
        for selector in selectors:
            for card in soup.select(selector):
                title = card.get_text(strip=True)
                link = card.get('href')
                
                if title and len(title) > 10 and not title.startswith('Pub') and not title.isdigit():
                    if link and not link.startswith('http'):
                        link = 'https://www.20minutes.fr' + link
                    articles.append({
                        "title": title,
                        "source": "20 Minutes",
                        "link": link,
                        "language": "fr"
                    })
        
        # Dédoublonnage par titre
        seen = set()
        unique = []
        for a in articles:
            if a['title'] not in seen:
                seen.add(a['title'])
                unique.append(a)
        
        print(f"✅ 20 Minutes: {len(unique)} articles trouvés")
    except Exception as e:
        print(f"❌ Erreur 20 Minutes: {e}")
    
    return unique[:15]

def scrape_bbc_news():
    """Scrape BBC News via RSS feed"""
    articles = []
    try:
        rss_url = "http://feeds.bbci.co.uk/news/rss.xml"
        feed = feedparser.parse(rss_url)
        
        for entry in feed.entries[:20]:
            articles.append({
                "title": entry.title,
                "source": "BBC News",
                "link": entry.link,
                "language": "en"
            })
        
        print(f"✅ BBC News: {len(articles)} articles trouvés")
    except Exception as e:
        print(f"❌ Erreur BBC News: {e}")
    
    return articles[:15]

def scrape_google_news():
    """Scrape Google Actualités (via RSS général)"""
    articles = []
    try:
        # RSS général de Google Actualités pour les actualités mondiales
        rss_url = "https://news.google.com/rss?q=world+news+OR+technology+OR+science&hl=fr&gl=FR&ceid=FR:fr"
        feed = feedparser.parse(rss_url)
        
        for entry in feed.entries[:15]:
            articles.append({
                "title": entry.title,
                "source": "Google Actualités",
                "link": entry.link,
                "language": "multi"
            })
        
        print(f"✅ Google Actualités: {len(articles)} articles trouvés")
    except Exception as e:
        print(f"❌ Erreur Google Actualités: {e}")
    
    return articles[:15]

def scrape_all_sources():
    """Scrape toutes les sources"""
    print("\n🔍 Scraping des sources d'actualité...")
    
    all_articles = []
    all_articles.extend(scrape_20_minutes())
    all_articles.extend(scrape_bbc_news())
    all_articles.extend(scrape_google_news())
    
    print(f"\n🎯 Total: {len(all_articles)} articles scrapés")
    return all_articles

def summarize_news(articles):
    """Crée un résumé de l'actualité pour DeepSeek"""
    summary = []
    
    for i, article in enumerate(articles[:30]):  # Limite à 30 articles
        summary.append(f"{i+1}. [{article['source']}] {article['title']}")
    
    return "\n".join(summary)

def call_deepseek(news_summary):
    """Appelle DeepSeek pour générer les articles philosophiques"""
    prompt = DEEPSEEK_PROMPT_TEMPLATE.format(news_summary=news_summary)
    
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "deepseek-v4-flash",
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": 3000
    }
    
    try:
        response = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"❌ Erreur DeepSeek: {response.status_code} - {response.text}")
            return None
        
        result = response.json()
        content = result["choices"][0]["message"]["content"]
        
        # Parse JSON depuis le contenu
        try:
            content = content.strip()
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            elif content.startswith("```"):
                content = content.replace("```", "")
            
            articles_data = json.loads(content)
            return articles_data
        except json.JSONDecodeError as e:
            print(f"❌ Erreur JSON: {e}")
            print(f"Contenu reçu: {content[:500]}...")
            return None
            
    except Exception as e:
        print(f"❌ Erreur appel DeepSeek: {e}")
        return None

def generate_image(image_prompt):
    """Génère une image via OpenAI DALL-E 3"""
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "dall-e-3",
        "prompt": f"Artistic, luminous, philosophical illustration: {image_prompt}. Style: digital art, ethereal lighting, hopeful atmosphere, vibrant colors, symbolic elements",
        "n": 1,
        "size": "1024x1024",
        "quality": "standard"
    }
    
    try:
        response = requests.post(
            "https://api.openai.com/v1/images/generations",
            headers=headers,
            json=payload,
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"❌ Erreur OpenAI: {response.status_code} - {response.text}")
            return None
        
        result = response.json()
        return result["data"][0]["url"]
    except Exception as e:
        print(f"❌ Erreur génération image: {e}")
        return None

def save_to_supabase(article, sources_analyzed):
    """Sauvegarde un article dans Supabase via REST API"""
    data = {
        "title": article["title"],
        "content": article["content"],
        "image_url": article["image_url"],
        "published_date": datetime.now().strftime("%Y-%m-%d"),
        "theme": article["theme"],
        "sources_analyzed": sources_analyzed
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_REST}/ia_auto_news",
            headers=SUPABASE_HEADERS,
            json=data,
            timeout=30
        )
        
        if response.status_code in (200, 201):
            print(f"✅ Article sauvegardé: {article['title'][:50]}...")
            return True
        else:
            print(f"❌ Erreur sauvegarde Supabase: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erreur sauvegarde Supabase: {e}")
        return False

def save_metadata(articles_count, sources_scraped, articles_scraped_count, deepseek_prompt_used):
    """Sauvegarde les métadonnées de l'exécution via REST API"""
    metadata = {
        "articles_count": articles_count,
        "run_date": datetime.now().strftime("%Y-%m-%d"),
        "deepseek_prompt_used": deepseek_prompt_used[:1000],
        "sources_scraped": sources_scraped,
        "articles_scraped_count": articles_scraped_count
    }
    
    try:
        response = requests.post(
            f"{SUPABASE_REST}/news_metadata",
            headers=SUPABASE_HEADERS,
            json=metadata,
            timeout=30
        )
        
        if response.status_code in (200, 201):
            print("✅ Métadonnées sauvegardées")
        else:
            print(f"⚠️ Erreur sauvegarde métadonnées: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"⚠️ Erreur sauvegarde métadonnées: {e}")

def main():
    """Fonction principale"""
    print(f"\n🚀 DÉBUT IA AUTO NEWS - {datetime.now()}")
    print("=" * 60)
    
    # 1. SCRAPING des sources
    sources = ["20 Minutes", "BBC News", "Google Actualités"]
    articles = scrape_all_sources()
    
    if not articles:
        print("❌ Erreur: Aucun article scrapé")
        sys.exit(1)
    
    # 2. RÉSUMÉ de l'actualité
    news_summary = summarize_news(articles)
    print(f"\n📰 RÉSUMÉ ACTUALITÉ ({len(articles)} articles):")
    print(news_summary[:800] + "..." if len(news_summary) > 800 else news_summary)
    
    # 3. ANALYSE + RÉDACTION par DeepSeek
    print("\n🧠 DeepSeek analyse et rédige...")
    articles_data = call_deepseek(news_summary)
    
    if not articles_data or "articles" not in articles_data:
        print("❌ Erreur: DeepSeek n'a pas généré d'articles valides")
        sys.exit(1)
    
    generated_articles = articles_data["articles"]
    print(f"✅ DeepSeek a généré {len(generated_articles)} articles philosophiques")
    
    # 4. POUR CHAQUE ARTICLE : image + sauvegarde
    saved_count = 0
    for i, article in enumerate(generated_articles):
        print(f"\n📝 ARTICLE {i+1}: {article['title']}")
        print(f"   Theme: {article['theme']}")
        print(f"   Inspiré par: {article.get('related_news', 'N/A')}")
        
        # Générer image (optionnel)
        print("   🎨 Génération de l'image...")
        image_url = generate_image(article["image_prompt"])
        if image_url:
            article["image_url"] = image_url
            print(f"   ✅ Image générée")
        else:
            article["image_url"] = None
            print(f"   ⚠️ Image échouée, sauvegarde sans image")
        
        # Sauvegarder (même sans image)
        print("   💾 Sauvegarde Supabase...")
        result = save_to_supabase(article, sources)
        if result:
            print("   ✅ Article sauvegardé")
            saved_count += 1
        else:
            print("   ❌ Erreur sauvegarde")
    
    # 5. MÉTADONNÉES
    save_metadata(saved_count, sources, len(articles), DEEPSEEK_PROMPT_TEMPLATE)
    
    print(f"\n" + "=" * 60)
    print(f"🎉 TERMINÉ: {saved_count}/{len(generated_articles)} articles générés et sauvegardés")
    print(f"   Sources scrapées: {len(sources)}")
    print(f"   Articles scrapés: {len(articles)}")
    print(f"   Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)

if __name__ == "__main__":
    main()