"""
Response Parser for AI Model Outputs
Extracts mentions, citations, and snippets from AI responses
"""

import re
from typing import Dict, List, Any
import structlog
from urllib.parse import urlparse

logger = structlog.get_logger()


class ResponseParser:
    """Parser for AI model responses to extract structured data"""

    def __init__(self):
        # Common URL patterns
        self.url_pattern = re.compile(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        )

        # Citation patterns (various formats)
        self.citation_patterns = [
            re.compile(r'\[(\d+)\]'),  # [1], [2], etc.
            re.compile(r'\((\d+)\)'),  # (1), (2), etc.
            re.compile(r'Source:\s*(.+?)(?:\n|$)', re.IGNORECASE),
            re.compile(r'Reference:\s*(.+?)(?:\n|$)', re.IGNORECASE),
        ]

        # Brand/product mention patterns
        self.mention_indicators = [
            r'\b(?:use|uses|using|with|via|through|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:is|was|are|were|can|could|will|would)\b',
            r'\b(?:try|consider|recommend|suggest)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b',
        ]

    def parse(self, response_text: str) -> Dict[str, Any]:
        """Parse AI response and extract structured data"""
        try:
            citations = self._extract_citations(response_text)
            mentions = self._extract_mentions(response_text)
            snippets = self._extract_snippets(response_text, mentions)

            return {
                "citations": citations,
                "mentions": mentions,
                "snippets": snippets,
                "metadata": {
                    "word_count": len(response_text.split()),
                    "character_count": len(response_text),
                    "has_urls": len(citations) > 0,
                    "mention_count": len(mentions)
                }
            }
        except Exception as e:
            logger.error(f"Error parsing response: {e}")
            return {
                "citations": [],
                "mentions": [],
                "snippets": [],
                "metadata": {"error": str(e)}
            }

    def _extract_citations(self, text: str) -> List[str]:
        """Extract URLs and citations from text"""
        citations = []

        # Extract URLs
        urls = self.url_pattern.findall(text)
        for url in urls:
            # Clean and validate URL
            cleaned_url = url.strip('.,!?;)')
            try:
                parsed = urlparse(cleaned_url)
                if parsed.netloc:
                    citations.append(cleaned_url)
            except Exception:
                continue

        # Extract citation references
        for pattern in self.citation_patterns:
            matches = pattern.findall(text)
            for match in matches:
                if match not in citations:
                    citations.append(match)

        return list(set(citations))  # Remove duplicates

    def _extract_mentions(self, text: str) -> List[str]:
        """Extract brand/product mentions from text"""
        mentions = []

        # Look for capitalized words that might be brands/products
        for pattern in self.mention_indicators:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Clean up the match
                cleaned = re.sub(r'[^\w\s]', '', match).strip()
                if len(cleaned) >= 2 and cleaned not in ['The', 'This', 'That', 'These', 'Those']:
                    mentions.append(cleaned)

        # Look for common SaaS/tech product patterns
        tech_patterns = [
            r'\b([A-Z][a-z]+(?:ly|io|app|AI|API|SDK))\b',  # Grammarly, Notion, OpenAI, etc.
            r'\b([A-Z][a-z]*[A-Z][a-z]*)\b',  # CamelCase products
            r'\b([A-Z]+[a-z]*)\s+(?:platform|service|tool|software|app)\b'
        ]

        for pattern in tech_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                if len(match) >= 3:
                    mentions.append(match)

        return list(set(mentions))  # Remove duplicates

    def _extract_snippets(self, text: str, mentions: List[str]) -> List[str]:
        """Extract relevant snippets containing mentions"""
        snippets = []
        sentences = re.split(r'[.!?]+', text)

        for mention in mentions:
            for sentence in sentences:
                if mention.lower() in sentence.lower():
                    # Clean up the sentence
                    cleaned = sentence.strip()
                    if len(cleaned) > 20 and cleaned not in snippets:
                        snippets.append(cleaned)

        return snippets[:10]  # Limit to 10 snippets

    def extract_project_mentions(self, text: str, project_domain: str, competitors: List[str]) -> Dict[str, Any]:
        """Extract mentions specific to a project and its competitors"""
        try:
            # Extract domain from project domain
            project_name = self._extract_domain_name(project_domain)

            # Look for project mentions
            project_mentions = []
            competitor_mentions = []

            # Check for project mentions
            if project_name:
                pattern = re.compile(rf'\b{re.escape(project_name)}\b', re.IGNORECASE)
                if pattern.search(text):
                    project_mentions.append(project_name)

            # Check for competitor mentions
            for competitor in competitors:
                competitor_name = self._extract_domain_name(competitor)
                if competitor_name:
                    pattern = re.compile(rf'\b{re.escape(competitor_name)}\b', re.IGNORECASE)
                    if pattern.search(text):
                        competitor_mentions.append(competitor_name)

            return {
                "project_mentions": project_mentions,
                "competitor_mentions": competitor_mentions,
                "total_mentions": len(project_mentions) + len(competitor_mentions)
            }
        except Exception as e:
            logger.error(f"Error extracting project mentions: {e}")
            return {
                "project_mentions": [],
                "competitor_mentions": [],
                "total_mentions": 0
            }

    def _extract_domain_name(self, domain: str) -> str:
        """Extract brand name from domain"""
        try:
            if domain.startswith('http'):
                parsed = urlparse(domain)
                domain = parsed.netloc

            # Remove www. and TLD
            domain = re.sub(r'^www\.', '', domain)
            domain = re.sub(r'\.[a-z]+$', '', domain)

            # Capitalize first letter
            return domain.capitalize() if domain else ""
        except Exception:
            return ""