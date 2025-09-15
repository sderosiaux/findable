'use client';

import { Card } from '@/components/ui/card';

interface CompetitorAnalysis {
  name: string;
  tasks: {
    task: string;
    ourScore: number;
    theirScore: number;
  }[];
}

export function CompetitorMatrix() {
  // Mock data for demonstration
  const competitors: CompetitorAnalysis[] = [
    {
      name: 'Confluent',
      tasks: [
        { task: 'Kafka setup', ourScore: 0.65, theirScore: 0.85 },
        { task: 'Streaming API', ourScore: 0.72, theirScore: 0.78 },
        { task: 'Event processing', ourScore: 0.80, theirScore: 0.75 },
      ],
    },
    {
      name: 'Redpanda',
      tasks: [
        { task: 'Kafka setup', ourScore: 0.65, theirScore: 0.72 },
        { task: 'Streaming API', ourScore: 0.72, theirScore: 0.68 },
        { task: 'Event processing', ourScore: 0.80, theirScore: 0.70 },
      ],
    },
    {
      name: 'AWS MSK',
      tasks: [
        { task: 'Kafka setup', ourScore: 0.65, theirScore: 0.70 },
        { task: 'Streaming API', ourScore: 0.72, theirScore: 0.75 },
        { task: 'Event processing', ourScore: 0.80, theirScore: 0.82 },
      ],
    },
  ];

  const getScoreColor = (ourScore: number, theirScore: number) => {
    if (ourScore > theirScore) return 'text-green-600 bg-green-50';
    if (ourScore < theirScore) return 'text-red-600 bg-red-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <div className="space-y-4">
      {competitors.map((competitor) => (
        <Card key={competitor.name} className="p-4">
          <h3 className="font-semibold mb-3">{competitor.name}</h3>
          <div className="space-y-2">
            {competitor.tasks.map((task) => (
              <div key={task.task} className="flex items-center justify-between">
                <span className="text-sm font-medium">{task.task}</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Us:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.ourScore > task.theirScore
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {(task.ourScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Them:</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.theirScore > task.ourScore
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {(task.theirScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}