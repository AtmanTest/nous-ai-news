# TNR — Test de Non Régression

## P0 — Core (must pass before any deploy)

| ID | Test | Type |
|----|------|------|
| TNR-P0-01 | Homepage loads (200, content visible) | Auto |
| TNR-P0-02 | Article page loads by slug | Auto |
| TNR-P0-03 | Search returns results for "AI" | Auto |
| TNR-P0-04 | Trending page loads | Auto |
| TNR-P0-05 | Login page renders | Auto |
| TNR-P0-06 | Register page renders | Auto |

## P1 — Major

| ID | Test | Type |
|----|------|------|
| TNR-P1-01 | Bookmarks page loads (logged in) | Auto |
| TNR-P1-02 | Search filters work (category, sort) | Auto |
| TNR-P1-03 | Profile page loads (logged in) | Auto |
| TNR-P1-04 | Social signals API returns data | Auto |
| TNR-P1-05 | Sitemap.xml is valid XML | Auto |
| TNR-P1-06 | Robots.txt returns correct content | Auto |
| TNR-P1-07 | Breadcrumb navigation works | Manual |

## P2 — Secondary

| ID | Test | Type |
|----|------|------|
| TNR-P2-01 | Empty search shows proper message | Auto |
| TNR-P2-02 | Mobile nav menu opens/closes | Manual |
| TNR-P2-03 | Dark mode toggle works | Manual |
| TNR-P2-04 | Bookmark icon toggles | Manual |
