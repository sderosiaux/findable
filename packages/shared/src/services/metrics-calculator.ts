/**
 * Metrics Calculator Service
 * Calculates findability metrics from query results
 */

export interface RunResult {
  id: string;
  queryText: string;
  responseText: string;
  citations: string[];
  extractedSnippets: string[];
  mentions: string[];
  executionTimeMs: number;
  surface: string;
  model: {
    name: string;
    provider: string;
  };
}

export interface Project {
  id: string;
  name: string;
  domain?: string;
  competitors: string[];
  keywords: string[];
}

export interface MetricResult {
  metricType: 'presence' | 'pick_rate' | 'snippet_health' | 'citations';
  value: number;
  metadata: Record<string, any>;
}

export class MetricsCalculator {
  /**
   * Calculate presence score - how often the project is mentioned in responses
   */
  static calculatePresenceScore(
    results: RunResult[],
    project: Project
  ): MetricResult {
    if (results.length === 0) {
      return {
        metricType: 'presence',
        value: 0,
        metadata: { totalResults: 0, mentions: 0 }
      };
    }

    const projectMentions = this.findProjectMentions(results, project);
    const presenceScore = projectMentions.length / results.length;

    return {
      metricType: 'presence',
      value: Math.min(presenceScore, 1),
      metadata: {
        totalResults: results.length,
        mentions: projectMentions.length,
        mentionRate: presenceScore
      }
    };
  }

  /**
   * Calculate pick rate - how often the project is recommended/chosen
   */
  static calculatePickRate(
    results: RunResult[],
    project: Project
  ): MetricResult {
    if (results.length === 0) {
      return {
        metricType: 'pick_rate',
        value: 0,
        metadata: { totalResults: 0, recommendations: 0 }
      };
    }

    const recommendations = results.filter(result =>
      this.isProjectRecommended(result, project)
    );

    const pickRate = recommendations.length / results.length;

    return {
      metricType: 'pick_rate',
      value: Math.min(pickRate, 1),
      metadata: {
        totalResults: results.length,
        recommendations: recommendations.length,
        pickRate
      }
    };
  }

  /**
   * Calculate snippet health - quality of information about the project
   */
  static calculateSnippetHealth(
    results: RunResult[],
    project: Project
  ): MetricResult {
    if (results.length === 0) {
      return {
        metricType: 'snippet_health',
        value: 0,
        metadata: { totalResults: 0, healthySnippets: 0 }
      };
    }

    const healthySnippets = results.filter(result => {
      const hasProjectMention = this.findProjectMentions([result], project).length > 0;
      const hasQualityInfo = result.extractedSnippets.length > 0 ||
                            result.responseText.length > 100;
      const hasRelevantKeywords = project.keywords.some(keyword =>
        result.responseText.toLowerCase().includes(keyword.toLowerCase())
      );

      return hasProjectMention && hasQualityInfo && hasRelevantKeywords;
    });

    const healthScore = healthySnippets.length / results.length;

    return {
      metricType: 'snippet_health',
      value: Math.min(healthScore, 1),
      metadata: {
        totalResults: results.length,
        healthySnippets: healthySnippets.length,
        healthScore
      }
    };
  }

  /**
   * Calculate citation coverage - how often the project is cited with sources
   */
  static calculateCitationCoverage(
    results: RunResult[],
    project: Project
  ): MetricResult {
    if (results.length === 0) {
      return {
        metricType: 'citations',
        value: 0,
        metadata: { totalResults: 0, withCitations: 0 }
      };
    }

    const resultsWithProjectMentions = results.filter(result =>
      this.findProjectMentions([result], project).length > 0
    );

    if (resultsWithProjectMentions.length === 0) {
      return {
        metricType: 'citations',
        value: 0,
        metadata: { totalResults: results.length, withCitations: 0, projectMentions: 0 }
      };
    }

    const citedMentions = resultsWithProjectMentions.filter(result => {
      const hasValidCitations = result.citations.length > 0;
      const hasDomainCitation = project.domain &&
        result.citations.some(citation =>
          citation.includes(this.extractDomain(project.domain!))
        );

      return hasValidCitations || hasDomainCitation;
    });

    const citationCoverage = citedMentions.length / resultsWithProjectMentions.length;

    return {
      metricType: 'citations',
      value: Math.min(citationCoverage, 1),
      metadata: {
        totalResults: results.length,
        projectMentions: resultsWithProjectMentions.length,
        withCitations: citedMentions.length,
        citationCoverage
      }
    };
  }

  /**
   * Calculate all metrics for a project
   */
  static calculateAllMetrics(
    results: RunResult[],
    project: Project
  ): MetricResult[] {
    return [
      this.calculatePresenceScore(results, project),
      this.calculatePickRate(results, project),
      this.calculateSnippetHealth(results, project),
      this.calculateCitationCoverage(results, project),
    ];
  }

  /**
   * Calculate competitor analysis
   */
  static calculateCompetitorMetrics(
    results: RunResult[],
    project: Project
  ) {
    const competitorStats = project.competitors.map(competitor => {
      const competitorMentions = results.filter(result =>
        result.mentions.some(mention =>
          mention.toLowerCase().includes(competitor.toLowerCase()) ||
          result.responseText.toLowerCase().includes(competitor.toLowerCase())
        )
      );

      const recommendations = competitorMentions.filter(result =>
        this.isCompetitorRecommended(result, competitor)
      );

      return {
        name: competitor,
        mentions: competitorMentions.length,
        recommendations: recommendations.length,
        pickRate: results.length > 0 ? recommendations.length / results.length : 0,
        mentionRate: results.length > 0 ? competitorMentions.length / results.length : 0
      };
    });

    return competitorStats;
  }

  /**
   * Find project mentions in results
   */
  private static findProjectMentions(results: RunResult[], project: Project): RunResult[] {
    const projectNames = this.getProjectNames(project);

    return results.filter(result => {
      const text = result.responseText.toLowerCase();
      const mentions = result.mentions.map(m => m.toLowerCase());

      return projectNames.some(name =>
        text.includes(name) || mentions.includes(name)
      );
    });
  }

  /**
   * Check if project is recommended in the result
   */
  private static isProjectRecommended(result: RunResult, project: Project): boolean {
    const projectNames = this.getProjectNames(project);
    const text = result.responseText.toLowerCase();

    const recommendationIndicators = [
      'recommend', 'suggest', 'try', 'use', 'consider', 'best',
      'top choice', 'preferred', 'excellent', 'great option'
    ];

    return projectNames.some(name => {
      const nameIndex = text.indexOf(name);
      if (nameIndex === -1) return false;

      // Check for recommendation keywords near the project name
      const surroundingText = text.substring(
        Math.max(0, nameIndex - 100),
        Math.min(text.length, nameIndex + name.length + 100)
      );

      return recommendationIndicators.some(indicator =>
        surroundingText.includes(indicator)
      );
    });
  }

  /**
   * Check if competitor is recommended in the result
   */
  private static isCompetitorRecommended(result: RunResult, competitor: string): boolean {
    const text = result.responseText.toLowerCase();
    const competitorName = competitor.toLowerCase();

    const recommendationIndicators = [
      'recommend', 'suggest', 'try', 'use', 'consider', 'best',
      'top choice', 'preferred', 'excellent', 'great option'
    ];

    const nameIndex = text.indexOf(competitorName);
    if (nameIndex === -1) return false;

    const surroundingText = text.substring(
      Math.max(0, nameIndex - 100),
      Math.min(text.length, nameIndex + competitorName.length + 100)
    );

    return recommendationIndicators.some(indicator =>
      surroundingText.includes(indicator)
    );
  }

  /**
   * Get various forms of project names
   */
  private static getProjectNames(project: Project): string[] {
    const names = [project.name.toLowerCase()];

    if (project.domain) {
      const domain = this.extractDomain(project.domain).toLowerCase();
      if (domain && !names.includes(domain)) {
        names.push(domain);
      }
    }

    // Add variations without common suffixes
    const nameWithoutSuffixes = project.name
      .replace(/\s+(app|api|platform|service|tool|software)$/i, '')
      .toLowerCase();

    if (!names.includes(nameWithoutSuffixes)) {
      names.push(nameWithoutSuffixes);
    }

    return names;
  }

  /**
   * Extract domain name from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace('www.', '');
    }
  }
}