"""
Web Scraping and Analysis Engine
Scrapes search results and social media for AI model context
"""

import asyncio
import aiohttp
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin, urlparse
import structlog
from datetime import datetime

logger = structlog.get_logger()


class WebScraper:
    """Web scraper for search results and social media content"""

    def __init__(self):
        self.session = None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers=self.headers,
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def scrape_search_results(
        self,
        query: str,
        max_results: int = 10
    ) -> List[Dict[str, Any]]:
        """Scrape search results for a query"""
        try:
            # Use DuckDuckGo for search results (respects robots.txt)
            search_url = f"https://duckduckgo.com/html/?q={query.replace(' ', '+')}"

            async with self.session.get(search_url) as response:
                if response.status != 200:
                    logger.warning(f"Search request failed: {response.status}")
                    return []

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                results = []
                result_elements = soup.find_all('div', class_='result__body')[:max_results]

                for element in result_elements:
                    try:
                        title_elem = element.find('a', class_='result__a')
                        snippet_elem = element.find('a', class_='result__snippet')

                        if title_elem and snippet_elem:
                            title = title_elem.get_text().strip()
                            url = title_elem.get('href', '')
                            snippet = snippet_elem.get_text().strip()

                            results.append({
                                'title': title,
                                'url': url,
                                'snippet': snippet,
                                'source': 'search',
                                'scraped_at': datetime.utcnow().isoformat(),
                            })
                    except Exception as e:
                        logger.warning(f"Failed to parse search result: {e}")
                        continue

                return results

        except Exception as e:
            logger.error(f"Failed to scrape search results for '{query}': {e}")
            return []

    async def scrape_page_content(
        self,
        url: str,
        max_length: int = 2000
    ) -> Optional[Dict[str, Any]]:
        """Scrape content from a specific page"""
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return None

                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')

                # Remove script and style elements
                for script in soup(["script", "style"]):
                    script.decompose()

                # Extract title
                title = soup.find('title')
                title_text = title.get_text().strip() if title else ''

                # Extract meta description
                meta_desc = soup.find('meta', attrs={'name': 'description'})
                description = meta_desc.get('content', '') if meta_desc else ''

                # Extract main content
                content_selectors = [
                    'main', 'article', '.content', '#content',
                    '.post-content', '.entry-content', 'body'
                ]

                content = ''
                for selector in content_selectors:
                    element = soup.select_one(selector)
                    if element:
                        content = element.get_text().strip()
                        break

                # Clean and truncate content
                content = re.sub(r'\s+', ' ', content)
                if len(content) > max_length:
                    content = content[:max_length] + '...'

                return {
                    'url': url,
                    'title': title_text,
                    'description': description,
                    'content': content,
                    'scraped_at': datetime.utcnow().isoformat(),
                }

        except Exception as e:
            logger.error(f"Failed to scrape page {url}: {e}")
            return None

    async def analyze_competitor_presence(
        self,
        queries: List[str],
        competitors: List[str],
        project_domain: str
    ) -> Dict[str, Any]:
        """Analyze competitor presence in search results"""
        try:
            competitor_analysis = {
                'queries_analyzed': len(queries),
                'competitors': {},
                'project_mentions': 0,
                'total_results': 0,
            }

            project_name = self._extract_domain_name(project_domain)

            for query in queries:
                search_results = await self.scrape_search_results(query)
                competitor_analysis['total_results'] += len(search_results)

                # Check for project mentions
                for result in search_results:
                    if self._contains_mention(result, project_name):
                        competitor_analysis['project_mentions'] += 1

                # Check for competitor mentions
                for competitor in competitors:
                    if competitor not in competitor_analysis['competitors']:
                        competitor_analysis['competitors'][competitor] = {
                            'mentions': 0,
                            'queries_found_in': [],
                            'top_results': [],
                        }

                    for i, result in enumerate(search_results):
                        if self._contains_mention(result, competitor):
                            competitor_analysis['competitors'][competitor]['mentions'] += 1
                            if query not in competitor_analysis['competitors'][competitor]['queries_found_in']:
                                competitor_analysis['competitors'][competitor]['queries_found_in'].append(query)

                            # Track top 3 results
                            if i < 3:
                                competitor_analysis['competitors'][competitor]['top_results'].append({
                                    'query': query,
                                    'position': i + 1,
                                    'title': result['title'],
                                    'url': result['url'],
                                })

            return competitor_analysis

        except Exception as e:
            logger.error(f"Failed to analyze competitor presence: {e}")
            return {}

    def _contains_mention(
        self,
        result: Dict[str, Any],
        entity_name: str
    ) -> bool:
        """Check if a search result mentions an entity"""
        text = f"{result.get('title', '')} {result.get('snippet', '')}".lower()
        entity_lower = entity_name.lower()

        # Direct mention
        if entity_lower in text:
            return True

        # Domain mention (for URLs)
        if 'url' in result:
            url_domain = self._extract_domain_name(result['url'])
            if url_domain and entity_lower in url_domain.lower():
                return True

        return False

    def _extract_domain_name(self, url: str) -> str:
        """Extract clean domain name from URL"""
        try:
            if not url.startswith('http'):
                url = f"https://{url}"

            parsed = urlparse(url)
            domain = parsed.netloc.replace('www.', '')

            # Remove TLD for brand matching
            domain_parts = domain.split('.')
            if len(domain_parts) > 1:
                return domain_parts[0]

            return domain
        except Exception:
            return url


class SERPAnalyzer:
    """Analyzes Search Engine Results Pages for AI context"""

    def __init__(self):
        self.scraper = WebScraper()

    async def analyze_query_context(
        self,
        query: str,
        project_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze search context for a specific query"""
        async with self.scraper as scraper:
            # Get search results
            search_results = await scraper.scrape_search_results(query, max_results=20)

            # Analyze results
            analysis = {
                'query': query,
                'total_results': len(search_results),
                'project_presence': 0,
                'competitor_presence': {},
                'top_domains': [],
                'content_themes': [],
                'recommended_context': '',
            }

            if not search_results:
                return analysis

            # Count project presence
            project_name = project_info.get('name', '')
            project_domain = project_info.get('domain', '')

            for result in search_results:
                if self._mentions_project(result, project_name, project_domain):
                    analysis['project_presence'] += 1

            # Count competitor presence
            competitors = project_info.get('competitors', [])
            for competitor in competitors:
                count = sum(1 for result in search_results
                           if competitor.lower() in result.get('snippet', '').lower() or
                              competitor.lower() in result.get('title', '').lower())
                if count > 0:
                    analysis['competitor_presence'][competitor] = count

            # Extract top domains
            domains = {}
            for result in search_results:
                domain = self._extract_domain(result.get('url', ''))
                if domain:
                    domains[domain] = domains.get(domain, 0) + 1

            analysis['top_domains'] = sorted(domains.items(), key=lambda x: x[1], reverse=True)[:5]

            # Generate context for AI models
            analysis['recommended_context'] = self._generate_ai_context(
                query, search_results, project_info, analysis
            )

            return analysis

    def _mentions_project(
        self,
        result: Dict[str, Any],
        project_name: str,
        project_domain: str
    ) -> bool:
        """Check if result mentions the project"""
        text = f"{result.get('title', '')} {result.get('snippet', '')}".lower()

        if project_name.lower() in text:
            return True

        if project_domain:
            domain = self._extract_domain(project_domain)
            if domain and domain.lower() in text:
                return True

        return False

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            return parsed.netloc.replace('www.', '')
        except Exception:
            return ''

    def _generate_ai_context(
        self,
        query: str,
        search_results: List[Dict[str, Any]],
        project_info: Dict[str, Any],
        analysis: Dict[str, Any]
    ) -> str:
        """Generate context information for AI models"""
        context_parts = []

        # Query intent
        context_parts.append(f"User query: '{query}'")

        # Market landscape
        if analysis['competitor_presence']:
            competitors = list(analysis['competitor_presence'].keys())[:3]
            context_parts.append(f"Main competitors mentioned in results: {', '.join(competitors)}")

        # Top domains
        if analysis['top_domains']:
            top_3_domains = [domain for domain, count in analysis['top_domains'][:3]]
            context_parts.append(f"Top domains in results: {', '.join(top_3_domains)}")

        # Project context
        project_name = project_info.get('name', '')
        if project_name:
            context_parts.append(f"User's product: {project_name}")

            keywords = project_info.get('keywords', [])
            if keywords:
                context_parts.append(f"Product keywords: {', '.join(keywords[:5])}")

        # Current presence
        if analysis['project_presence'] > 0:
            context_parts.append(f"Product appears in {analysis['project_presence']} of {analysis['total_results']} results")
        else:
            context_parts.append("Product not currently appearing in search results")

        return " | ".join(context_parts)