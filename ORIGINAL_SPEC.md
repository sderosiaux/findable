# PRD — Findable

AI SEO for products and platforms. Measure how models see you. Fix gaps. Win the pick at the moment of query.

---

## 1) Summary

**Problem**
AI assistants and answer engines now act as gatekeepers. They pick a tool, produce a snippet or config, and close the loop in seconds. If you do not appear at that moment, you do not exist. Enterprise users ask for outcomes like “activate Kafka encryption” or “Kafka chargeback.” Assistants serve as practical advisers and architects. Wrong configs or default picks like Confluent or Redpanda can take the win by default.

**Vision**
Make your product findable by AI. Ship clear signals for models and humans. Cover the two key surfaces.

1. **Augmented DevEx**. Docs and pages a human reads with an assistant in the loop.
2. **LLMEx**. Structure and signals a model reads and can act on alone.

**Product**
Findable is a SaaS that measures AI findability, scores your coverage, runs repeatable query sets, executes generated snippets and configs, tracks pick-rate, and ships concrete playbooks. It helps you publish standard files and agent connectors like llms.txt, OpenAPI, MCP, Terraform, and Helm. It owns /compare and /alternatives pages that models can parse. It optimizes for answer engines.

**Outcome**
Higher presence in model answers. Consistent value-prop in replies. More correct runnable snippets. Better share vs competitors. Clear actions and fast wins.

---

## 2) Goals and non-goals

**Goals**

* Measure if models cite and pick your product for defined tasks.
* Validate that generated snippets and configs run.
* Detect and fix weak or confused signals in docs and repos.
* Publish and validate standard surfaces: /llms.txt, OpenAPI, MCP, Terraform, Helm, /compare, FAQ, lexicon.
* Track answer engines and AI Overviews coverage with dates and sources.
* Ship playbooks that create or fix pages and connectors.

**Non-goals**

* Replace your docs system.
* Act as an IDE copilot.
* Act as your runtime. Findable runs ephemeral checks and local harnesses only.

---

## 3) Users and jobs

**Users**

* Product and DevRel leads.
* Docs and site owners.
* Platform, SDK, and infra teams.

**Jobs**

* Know if models pick us for target tasks.
* See where we lose to a competitor and why.
* Fix failing snippets and broken configs.
* Publish the right files and connectors that agents can use.
* Track change over time and get alerts.

---

## 4) Problem details to keep in scope

* Gatekeepers: assistants, answer engines, IDE copilots, agents.
* Two surfaces: Augmented DevEx and LLMEx.
* Self-reinforcing loop: more picks create more training examples then more picks.
* Weak signal: fuzzy name, spread docs, broken snippets, no clear comparisons.
* New channels: Perplexity, You.com, Google AI Overviews.
* IDE copilots and agents connect via APIs, schemas, MCP.
* Enterprise context: tasks like encryption, ACLs, chargeback, proxy, not just “npm install”.
* Risk: wrong configs or default citations to Confluent or Redpanda.

---

## 5) Scope and key scenarios

**SDK scenarios**

* “Send transactional email Node”
* “Embedding API Python example”
* “Add auth to next.js app”

**Enterprise Kafka scenarios**

* “Kafka encryption best practices”
* “Kafka proxy enterprise”
* “Kafka chargeback implementation”
* “Kafka governance tools”
* “Compare Confluent vs Conduktor”
* “Monitor Kafka lag with Conduktor”

---

## 6) Success metrics

* **AI Findability Score** per model and per query set.
* **Value-Prop Alignment** between tagline and model answer.
* **Pick-Rate** of your SDK or platform per task.
* **Snippet Health** run pass rate for SDK code and Kafka configs.
* **Comparative Share** vs each named rival.
* **Citation Coverage** in Perplexity and AI Overviews.
* **Surface Completeness** for /llms.txt, OpenAPI, MCP, guides, /compare, FAQ, lexicon.

---

## 7) System overview

**Modules**

1. **Collectors**
   Crawl docs, repos, registries, /llms.txt, OpenAPI, MCP probe. Track last updated date.

2. **Runner**
   Run defined queries on assistants, answer engines, and IDE agents. Use official APIs where possible. Use headless runs where needed. Support multi-runs per model.

3. **Executor**
   Run SDK snippets in sandboxes. Spin a Kafka mini-cluster for config checks. Validate Terraform and Helm plans.

4. **Parser**
   Extract citations, domains, package names, product mentions, snippet blocks, and config blocks. Normalize names like Confluent, Redpanda, Aiven, Strimzi, and your brand.

5. **Ranker**
   Compute all scores. Aggregate per model, per task, per rival, and per time window.

6. **UI**
   Dashboard with findability, pick-map, pass rates, comparisons, drift timeline, and action list.

7. **Playbooks**
   Concrete steps that create or fix pages, snippets, and connectors. Auto-generate drafts when safe.

---

## 8) Detailed requirements

### 8.1 Signal clarity tools

* One-liner manager. Store the canonical one-liner and push it to README, docs, registries, and /llms.txt.
* Task pages builder. Template: Task → Solution → Runnable snippet or config.
* Domain lexicon. Terms like Kafka encryption, chargeback, proxy, governance. Each term links to a task page.

### 8.2 Standardize for AI

* **/llms.txt generator and validator**
  Location: `/.well-known/llms.txt`
  Format: YAML. Fields: version, product, one\_liner, key\_pages, tasks, stacks, configs, quickstarts, compare\_pages, api\_spec, mcp\_server, contact, updated\_at.
  Sample:

  ```
  version: 1
  product: Conduktor
  one_liner: Kafka proxy for security and cost control
  key_pages:
    - https://docs.example.com/kafka/proxy
  tasks:
    - name: Enable TLS encryption for Kafka
      url: https://docs.example.com/kafka/encryption
      snippet_type: yaml
      snippet_ref: encryption-tls-yaml
  stacks:
    - name: Node email
      code_ref: node-email-quickstart
  api_spec: https://api.example.com/openapi.yaml
  mcp_server: https://mcp.example.com/manifest.json
  compare_pages:
    - https://example.com/compare/confluent
  updated_at: 2025-09-14
  ```

* **Sample packs**
  Short and tested examples per stack for code. Short and tested examples for config: YAML, Terraform, Helm. Target size: 20 to 40 lines for SDK code.

* CI hooks that run snippets and config checks on pull requests.

### 8.3 Agent connectors

* **OpenAPI**
  Clean nouns and verbs. Auth flows clear. Error models present.
* **MCP server**
  Expose key commands like manage Kafka ACLs, enable TLS, set proxy, fetch lag. Provide JSON schemas and strong parameter checks.
* **Terraform provider or Helm chart**
  Official repo and version tags. Plan validate in CI.

### 8.4 Own the comparisons

* **/compare** and **/alternatives**
  One page per rival and one matrix page. Short top answer, tables that models can parse, honest trade-offs, and runnable links.
  File spec for tables: CSV or HTML table with clear headers. Keep under 120 words per section to help answer engines.

### 8.5 Optimize answer engines

* Pages with a short answer block at the top.
* FAQ per topic.
* Visible update dates.
* Clear citations and short paragraphs.
* Schema.org markup where safe.

### 8.6 Evaluation method in product

* **Query sets**
  Store SDK and Enterprise lists. Version them.
* **Multi-runs**
  N runs per query per model to average variance.
* **Extraction**
  Capture tools cited, snippets, domains.
* **Harness**
  Run code and validate configs in a repeatable environment.
* **Scores**
  PresenceScore, ValuePropScore, SnippetPassRate, CitationShare. Time series and cohort views.

### 8.7 Metrics definitions and formulas

* **PresenceScore**
  For each run: 1 if your product appears in text or citations, else 0. Score = average across runs.
* **Pick-Rate**
  For each run: 1 if the answer recommends or uses your product, else 0. Score = average.
* **Value-Prop Alignment**
  Embed your tagline and the model’s first answer block with the same text embedding model. Score = cosine similarity 0 to 1.
* **SnippetPassRate**
  Pass = program exits with code 0 or config validates and applies dry-run. Score = passes / total.
* **Comparative Share**
  Share of picks by named brand in that task group.
* **Citation Coverage**
  Share of runs with a visible citation that points to your domain.
* **Surface Completeness**
  Checklist score across /llms.txt, OpenAPI, MCP, Terraform or Helm, /compare, FAQ, lexicon, quickstarts.

### 8.8 UI

**Home**

* AI Findability Score sparkline.
* Pick-map by task vs model.
* Top losses vs rival with reason tags.

**Runs**

* Query list, model, time, answer preview, cited links, extracted snippet blocks.

**Executor**

* Pass/fail list, logs, artifacts.

**Comparisons**

* Matrix per task. Your score vs Confluent, Redpanda, Aiven, Strimzi.

**Surfaces**

* Status of /llms.txt, OpenAPI, MCP, Terraform, Helm, /compare, FAQ, lexicon. Broken or missing flags.

**Playbooks**

* Ranked actions. One click to generate a draft page or config.

**Alerts**

* Drop in Pick-Rate on any high-value task.
* Snippet pass rate falls below threshold.
* AI Overviews removes or changes your mention.
* /llms.txt missing or stale date.

---

## 9) Data and execution

**Data sources**

* Public docs, repos, registries.
* Your site and subpaths including /compare, /alternatives.
* /llms.txt at .well-known.
* OpenAPI YAML, MCP manifest.
* Run outputs and logs.

**Execution rules**

* Sandboxed runners with no secret exfil.
* Kafka checks use a single-broker KRaft test cluster.
* Terraform and Helm run in plan or dry-run mode.
* Delete all run data after scoring unless the team toggles artifact retention.

**Privacy**

* No customer data intake.
* Redact tokens in logs.
* Limit outbound calls to declared domains during runs.

---

## 10) Strategies to execute

* Name the category with the right words.
  SDK: “AI SDK for embeddings.”
  Enterprise: “Kafka proxy”, “Kafka encryption”, “Kafka cost allocation.”

* Pair Augmented DevEx with LLMEx.
  One quickstart for humans and one for models.

* Cover every public surface.
  README, registries, docs, blog, /llms.txt, /compare, guides, lexicon.

* Ship agent recipes.
  Prompts and routines for Cursor, Claude, Copilot Chat.

* Instrument reality.
  CI runs code and Kafka configs.
  Measure answers from models and fix gaps.

---

## 11) Tactics to implement

* Clear and versioned **/llms.txt**.

* Task-first titles.
  SDK: “Send transactional email Node.”
  Enterprise: “Enable TLS encryption Kafka with Conduktor.”

* Short tested examples.
  SDK code 20 to 40 lines.
  Enterprise configs for Kafka, Terraform, ACL YAML.

* Structured **/compare** pages that models can parse.

* Clean OpenAPI. Verbs match actions.

* MCP server exposes core commands like Kafka ACLs and proxy.

* README with one-liner, top tasks, runnable snippet.

* FAQ and Glossary to reduce term confusion.

* Easy citations. Lists, short paragraphs, sourced data.

---

## 12) SaaS deliverables in product

* AI Findability Score per model per query.
* AI Value-Prop Alignment.
* SDK or Platform Pick-Map.
* Snippet and Config Health.
* Citation Coverage for Perplexity and AI Overviews.
* Prioritized Action Playbook.

---

## 13) Evaluation method in detail

**Setup**

* Pick target tasks for SDK and Enterprise.
* Define rivals: Confluent, Redpanda, Aiven, Strimzi.
* Set N runs per model per query. Example N = 5.

**Run**

* Fetch answers and citations.
* Extract code and configs.
* Execute in harness.

**Score**

* Presence, Pick, Alignment, Pass rate, Citation share, Surface completeness.

**Report**

* Baseline report and task-level actions.
* Time series to see progress and drift.

---

## 14) Architecture

**Collectors**

* Crawlers for docs and repos.
* Probers for /.well-known/llms.txt, OpenAPI, MCP manifest.
* Schedulers with per-source cadence.

**Runner**

* Adapter per assistant or engine.
* Rate control and retries.
* Store prompts, answers, and citations.

**Executor**

* SDK sandboxes per language.
* Kafka mini-cluster for config tests.
* Terraform and Helm dry-run.

**Parser**

* Heuristics and regex for code and config blocks.
* NER for product names.
* Domain normalizer.

**Ranker**

* Metric engine with versioned formulas.
* Aggregations per task, model, rival.

**UI**

* Web app with auth and team roles.
* Project model per product.

---

## 15) Roadmap

**0 to 30 days**

* POC on SDK and Enterprise query sets.
* Collectors for docs, Perplexity, AI Overviews.
* Baseline report.

**31 to 60 days**

* Harness for SDK snippets and Kafka configs.
* Detect /llms.txt, OpenAPI lint, MCP probe.
* First Playbooks.

**61 to 90 days**

* Continuous monitoring and alerts.
* Competitive benchmarks by segment.
* Guided generation for /compare pages and practical guides.

---

## 16) Check-list “LLM-ready”

* Canonical one-liner.
* Task pages with short runnable snippets for code and config.
* /llms.txt complete.
* OpenAPI clean and MCP server live.
* /compare and /alternatives live.
* Snippets validated in CI.
* Domain lexicon for Kafka encryption, chargeback, proxy.
* Visible update dates.

---

## 17) Playbooks

* Create a new task page if missing.
* Add a /compare page vs the dominant rival on that task.
* Fix an invalid snippet or config.
* Publish a Terraform provider or an MCP server when relevant.

---

## 18) Open API surfaces and samples

**OpenAPI path sample**

```
paths:
  /kafka/clusters/{clusterId}/encryption:
    put:
      summary: Enable TLS encryption
      parameters:
        - in: path
          name: clusterId
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                tls:
                  type: boolean
                caCert:
                  type: string
      responses:
        "200": { description: ok }
```

**MCP command list sample**

```
commands:
  - name: list_clusters
  - name: create_acl
  - name: enable_tls
  - name: set_proxy
  - name: get_consumer_lag
```

**Terraform resource shape**

```
resource "conduktor_kafka_encryption" "tls" {
  cluster_id = "dev-1"
  tls_enabled = true
  ca_cert = file("ca.pem")
}
```

---

## 19) Risks and mitigations

* **Model variance**. Use multi-runs and confidence bands.
* **Fragile scraping**. Prefer official APIs and feeds.
* **Snippet flakiness**. Pin versions and use hermetic runners.
* **Naming confusion**. Maintain a brand alias list in the parser.
* **Site change**. Watch last updated dates and alert.

---

## 20) Dependencies

* Access to docs and repos.
* Keys for engines that offer APIs.
* Build time for MCP, Terraform, and Helm artifacts from your teams.

---

## 21) Acceptance criteria for v1

* Run 50+ queries across SDK and Enterprise sets.
* Compute all metrics and show trends.
* Execute SDK code and Kafka configs with pass/fail.
* Detect and validate /llms.txt, OpenAPI, MCP.
* Show /compare coverage and gaps.
* Deliver a prioritized action list with links to create drafts.

---

## 22) Appendices

**A. Example query set**
Already listed in sections 5 and 13.

**B. Surface completeness rubric**

* /llms.txt present and fresh date.
* OpenAPI reachable, no lint errors.
* MCP manifest reachable and basic commands respond.
* Terraform or Helm available and valid.
* README has one-liner and runnable snippet.
* /compare pages live for each rival.
* FAQ and lexicon live for key terms.

**C. Scoring thresholds to start**

* PresenceScore target 0.7+ on top tasks.
* Pick-Rate target 0.5+ in 60 days on top tasks.
* SnippetPassRate target 0.9+ for SDK and 0.8+ for configs.
* Alignment target 0.7+ cosine.

---

## 23) Name and tagline

**Product name**: Findable
**Tagline**: AI SEO that gets you picked

---

If you want, I can turn this into a doc set: llms.txt starter, /compare template, MCP manifest stub, and CI checks for snippets and Kafka configs.
