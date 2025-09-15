'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bot, ExternalLink, Code, CheckCircle, XCircle } from 'lucide-react';

interface QueryResult {
  id: string;
  query: string;
  model: string;
  timestamp: string;
  mentioned: boolean;
  picked: boolean;
  snippetValid: boolean;
  citations: string[];
}

interface QueryResultsProps {
  detailed?: boolean;
}

export function QueryResults({ detailed = false }: QueryResultsProps) {
  // Mock data for demonstration
  const results: QueryResult[] = [
    {
      id: '1',
      query: 'How to send transactional emails in Node.js',
      model: 'GPT-4',
      timestamp: '2 hours ago',
      mentioned: true,
      picked: true,
      snippetValid: true,
      citations: ['docs.findable.ai/email', 'github.com/findable/examples'],
    },
    {
      id: '2',
      query: 'Best Kafka proxy for enterprise',
      model: 'Claude 3',
      timestamp: '3 hours ago',
      mentioned: true,
      picked: false,
      snippetValid: true,
      citations: ['findable.ai/kafka-proxy'],
    },
    {
      id: '3',
      query: 'Setting up authentication with OAuth',
      model: 'Perplexity',
      timestamp: '5 hours ago',
      mentioned: false,
      picked: false,
      snippetValid: false,
      citations: [],
    },
  ];

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <Card key={result.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{result.model}</span>
                <span className="text-xs text-muted-foreground">• {result.timestamp}</span>
              </div>
              <p className="text-sm font-medium">{result.query}</p>
              <div className="flex items-center gap-2">
                {result.mentioned && (
                  <Badge variant="secondary" className="text-xs">
                    Mentioned
                  </Badge>
                )}
                {result.picked && (
                  <Badge variant="default" className="text-xs">
                    Picked
                  </Badge>
                )}
                {result.snippetValid ? (
                  <Badge variant="outline" className="text-xs text-green-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Valid Code
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-red-600">
                    <XCircle className="mr-1 h-3 w-3" />
                    Invalid Code
                  </Badge>
                )}
              </div>
              {detailed && result.citations.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Citations:</p>
                  <div className="flex flex-wrap gap-1">
                    {result.citations.map((citation, i) => (
                      <a
                        key={i}
                        href={`https://${citation}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        {citation}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {detailed && (
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Code className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function Badge({ children, variant = 'default', className = '' }: any) {
  const variants: any = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-input bg-background',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}