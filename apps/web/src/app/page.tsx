import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Code2,
  Sparkles,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              <span className="gradient-text">AI SEO</span> for the
              <br />
              AI-First World
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
              Measure how AI models see you. Fix gaps. Win the pick at the moment of query.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" variant="outline">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {[
              'ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Copilot'
            ].map((model) => (
              <div
                key={model}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium shadow-sm dark:bg-gray-800"
              >
                {model}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Everything you need to win AI mindshare
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              Comprehensive tools to measure, optimize, and dominate AI responses
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">AI Findability Score</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track how often your product appears in AI responses across models and queries
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Code2 className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Code Validation</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Automatically validate that AI-generated code snippets actually work
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Competitive Analysis</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitor how you rank against competitors in AI recommendations
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <Bot className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Multi-Model Support</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Test across ChatGPT, Claude, Perplexity, and more AI models
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 dark:bg-pink-900">
                <Sparkles className="h-6 w-6 text-pink-600 dark:text-pink-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Playbook Generation</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Get AI-powered recommendations for improving your findability
              </p>
            </Card>

            <Card className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Surface Monitoring</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Track standard files like llms.txt, OpenAPI specs, and MCP servers
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to make your product findable?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join leading companies optimizing for AI discovery
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="mt-8">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}