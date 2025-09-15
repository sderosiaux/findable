"""
AI Prompt Builder
Creates enhanced prompts with market context for better findability analysis
"""

from typing import Dict, List, Any, Optional
import structlog
from datetime import datetime

logger = structlog.get_logger()


class PromptBuilder:
    """Builds enhanced prompts for AI models with market context"""

    def __init__(self):
        self.base_instructions = {
            'findability': """You are an AI assistant helping analyze product findability in search results.
Your goal is to provide accurate, helpful responses about products and services while being aware of market context and competition.""",

            'recommendation': """You are an AI assistant helping users find the best tools and services for their needs.
Provide balanced, informative recommendations based on actual product capabilities and user requirements.""",

            'comparison': """You are an AI assistant helping users compare different products and services.
Provide objective comparisons highlighting the strengths and use cases of different options."""
        }

    def build_findability_prompt(
        self,
        query: str,
        project_info: Dict[str, Any],
        market_context: Optional[Dict[str, Any]] = None,
        prompt_type: str = 'findability'
    ) -> str:
        """Build an enhanced prompt for findability testing"""

        prompt_parts = []

        # Base instruction
        prompt_parts.append(self.base_instructions.get(prompt_type, self.base_instructions['findability']))

        # Market context if available
        if market_context:
            context_section = self._build_market_context(market_context)
            if context_section:
                prompt_parts.append(f"\nMARKET CONTEXT:\n{context_section}")

        # Project information
        if project_info:
            project_section = self._build_project_context(project_info)
            if project_section:
                prompt_parts.append(f"\nPRODUCT INFORMATION:\n{project_section}")

        # Query and instructions
        prompt_parts.append(f"\nUSER QUERY: {query}")
        prompt_parts.append(self._get_response_instructions(prompt_type))

        return "\n".join(prompt_parts)

    def build_competitive_prompt(
        self,
        query: str,
        project_info: Dict[str, Any],
        competitors: List[str],
        market_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a prompt for competitive analysis"""

        prompt_parts = []

        # Base instruction for comparison
        prompt_parts.append(self.base_instructions['comparison'])

        # Market landscape
        if competitors:
            competitor_section = f"COMPETITIVE LANDSCAPE:\nMain alternatives in this space include: {', '.join(competitors[:5])}"
            prompt_parts.append(competitor_section)

        # Market context
        if market_context:
            context_section = self._build_market_context(market_context)
            if context_section:
                prompt_parts.append(f"\nMARKET CONTEXT:\n{context_section}")

        # Project information
        if project_info:
            project_section = self._build_project_context(project_info)
            if project_section:
                prompt_parts.append(f"\nFOCUS PRODUCT:\n{project_section}")

        # Query and specialized instructions
        prompt_parts.append(f"\nUSER QUERY: {query}")
        prompt_parts.append(self._get_competitive_instructions())

        return "\n".join(prompt_parts)

    def build_recommendation_prompt(
        self,
        query: str,
        project_info: Dict[str, Any],
        use_cases: List[str],
        market_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Build a prompt for product recommendations"""

        prompt_parts = []

        # Base instruction for recommendations
        prompt_parts.append(self.base_instructions['recommendation'])

        # Use case context
        if use_cases:
            use_case_section = f"COMMON USE CASES:\n" + "\n".join([f"- {uc}" for uc in use_cases[:5]])
            prompt_parts.append(use_case_section)

        # Market context
        if market_context:
            context_section = self._build_market_context(market_context)
            if context_section:
                prompt_parts.append(f"\nMARKET CONTEXT:\n{context_section}")

        # Product information
        if project_info:
            project_section = self._build_project_context(project_info)
            if project_section:
                prompt_parts.append(f"\nAVAILABLE OPTION:\n{project_section}")

        # Query and instructions
        prompt_parts.append(f"\nUSER QUERY: {query}")
        prompt_parts.append(self._get_recommendation_instructions())

        return "\n".join(prompt_parts)

    def _build_market_context(self, market_context: Dict[str, Any]) -> str:
        """Build market context section"""
        context_parts = []

        if 'top_domains' in market_context:
            domains = [domain for domain, count in market_context['top_domains'][:3]]
            if domains:
                context_parts.append(f"Leading domains in search results: {', '.join(domains)}")

        if 'competitor_presence' in market_context:
            competitors = list(market_context['competitor_presence'].keys())[:3]
            if competitors:
                context_parts.append(f"Competitors frequently mentioned: {', '.join(competitors)}")

        if 'project_presence' in market_context:
            presence = market_context['project_presence']
            total = market_context.get('total_results', 0)
            if total > 0:
                percentage = (presence / total) * 100
                context_parts.append(f"Current market presence: {presence}/{total} results ({percentage:.1f}%)")

        return "\n".join(context_parts)

    def _build_project_context(self, project_info: Dict[str, Any]) -> str:
        """Build project context section"""
        context_parts = []

        if 'name' in project_info:
            context_parts.append(f"Product: {project_info['name']}")

        if 'oneLiner' in project_info:
            context_parts.append(f"Description: {project_info['oneLiner']}")

        if 'domain' in project_info and project_info['domain']:
            context_parts.append(f"Website: {project_info['domain']}")

        if 'keywords' in project_info and project_info['keywords']:
            keywords = project_info['keywords'][:5]  # Limit to 5 keywords
            context_parts.append(f"Key features: {', '.join(keywords)}")

        return "\n".join(context_parts)

    def _get_response_instructions(self, prompt_type: str) -> str:
        """Get response instructions based on prompt type"""

        if prompt_type == 'findability':
            return """
RESPONSE GUIDELINES:
- Provide a helpful, accurate response to the user's query
- When relevant, mention appropriate products/services that could help
- Be objective and focus on actual capabilities and use cases
- Include specific examples or details when possible
- If the focus product is genuinely relevant, include it naturally in your response
- Cite sources or provide links when available
"""

        elif prompt_type == 'recommendation':
            return """
RESPONSE GUIDELINES:
- Provide balanced recommendations based on the user's specific needs
- Consider different options and their strengths
- Explain why certain options might be better for different use cases
- Be honest about limitations and trade-offs
- Include the focus product if it's genuinely suitable for the user's needs
- Suggest trying multiple options when appropriate
"""

        elif prompt_type == 'comparison':
            return """
RESPONSE GUIDELINES:
- Provide objective comparisons between different options
- Highlight the unique strengths of each product/service
- Explain which might be better for different scenarios
- Be fair and balanced in your assessment
- Include concrete examples of use cases
- Help the user understand the key differentiators
"""

        return ""

    def _get_competitive_instructions(self) -> str:
        """Get instructions for competitive analysis"""
        return """
COMPETITIVE ANALYSIS GUIDELINES:
- Compare the focus product objectively with alternatives
- Highlight unique value propositions and differentiators
- Explain which product might be better for different use cases
- Be fair to all options mentioned
- Focus on helping the user make an informed decision
- Include specific examples of when to choose each option
- Mention any notable advantages or limitations
"""

    def _get_recommendation_instructions(self) -> str:
        """Get instructions for recommendations"""
        return """
RECOMMENDATION GUIDELINES:
- Focus on matching solutions to the user's specific needs
- Consider factors like budget, technical requirements, and use case
- Provide multiple options when appropriate
- Explain the reasoning behind your recommendations
- Include both popular and specialized options when relevant
- Be honest about the learning curve or setup requirements
- Suggest starting points for users who are new to the space
"""

    def create_follow_up_prompts(
        self,
        original_query: str,
        response: str,
        project_info: Dict[str, Any]
    ) -> List[str]:
        """Create follow-up queries to test findability"""

        project_name = project_info.get('name', '')
        keywords = project_info.get('keywords', [])

        follow_ups = []

        # Direct product queries
        if project_name:
            follow_ups.extend([
                f"What is {project_name}?",
                f"How does {project_name} work?",
                f"Is {project_name} worth it?",
                f"{project_name} vs alternatives"
            ])

        # Keyword-based queries
        for keyword in keywords[:3]:
            follow_ups.extend([
                f"Best {keyword} tools",
                f"How to {keyword}",
                f"{keyword} software recommendations"
            ])

        # Use case queries
        if 'competitors' in project_info:
            for competitor in project_info['competitors'][:2]:
                follow_ups.append(f"{competitor} alternative")

        return follow_ups[:10]  # Limit to 10 follow-ups

    def analyze_response_quality(
        self,
        query: str,
        response: str,
        project_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze the quality of an AI response for findability"""

        project_name = project_info.get('name', '').lower()
        keywords = [k.lower() for k in project_info.get('keywords', [])]

        analysis = {
            'query': query,
            'response_length': len(response),
            'mentions_project': project_name in response.lower() if project_name else False,
            'mentions_keywords': [],
            'sentiment': 'neutral',
            'recommendation_strength': 'none',
            'context_relevance': 0.0,
        }

        # Check keyword mentions
        for keyword in keywords:
            if keyword in response.lower():
                analysis['mentions_keywords'].append(keyword)

        # Analyze sentiment (basic)
        positive_words = ['excellent', 'great', 'best', 'recommend', 'perfect', 'ideal']
        negative_words = ['poor', 'bad', 'avoid', 'terrible', 'worst', 'problematic']

        response_lower = response.lower()
        positive_count = sum(1 for word in positive_words if word in response_lower)
        negative_count = sum(1 for word in negative_words if word in response_lower)

        if positive_count > negative_count:
            analysis['sentiment'] = 'positive'
        elif negative_count > positive_count:
            analysis['sentiment'] = 'negative'

        # Analyze recommendation strength
        if any(word in response_lower for word in ['highly recommend', 'strongly suggest', 'best choice']):
            analysis['recommendation_strength'] = 'strong'
        elif any(word in response_lower for word in ['recommend', 'suggest', 'consider']):
            analysis['recommendation_strength'] = 'moderate'
        elif any(word in response_lower for word in ['might try', 'could consider', 'option']):
            analysis['recommendation_strength'] = 'weak'

        return analysis