# Daily Reflection Tree — Assignment Submission

This submission contains a complete, deterministic end-of-day reflection tool. The tool uses a structured decision tree to guide employees through self-reflection across three psychological axes: **Locus of Control**, **Contribution vs Entitlement**, and **Radius of Concern**.

**Key principle:** The tree itself contains zero LLM calls at runtime. It is fully deterministic — given identical answers, any user gets identical reflections.

---

## Part A: Design Artifacts (Mandatory)

### 1. Tree Data Structure
**File:** [`tree/reflection-tree.json`](tree/reflection-tree.json)

A complete, auditable JSON representation of the tree with 47 nodes covering:
- **19 question nodes** (min required: 8) across 3 axes with 3-5 fixed options each
- **12 decision nodes** (min required: 4) for branching logic
- **9 reflection nodes** (min required: 4) with reframes specific to each path
- **2 bridge nodes** connecting axes
- **3 summary nodes** with three routing paths (positive, growth-oriented, mixed)
- **1 start node + 1 end node**

**Structure:**
- `meta`: Axis definitions, psychological sources, version info
- `nodes[]`: Complete node list with parentage, type, text, options, routing rules
- `summaryTemplates`: Template text for interpolation into generic summaries

**How to read it:**
1. Start at node `START`
2. Follow `target` field to advance through linear sequences
3. At `decision` nodes, evaluate `rules[]` against accumulated state and prior answers
4. Signal nodes accumulate to `signals.axis{1,2,3}.{pole}` 
5. Text interpolation: `{OPENING_Q.answer}` is replaced with the user's answer to OPENING_Q
6. All paths are deterministic — no randomness, no generation

### 2. Tree Diagram
**File:** [`tree/tree-diagram.md`](tree/tree-diagram.md)

A visual Mermaid flowchart showing the complete branching structure. The diagram illustrates:
- Node progression through the three axes
- Decision points and their branching rules
- Reflection nodes that close each branch
- Summary routing (3-way split based on dominants)

This diagram is readable without running code—it's data you can trace by eye.

### 3. Design Write-Up
**File:** [`write-up.md`](write-up.md)  
**Length:** ~150 lines (~2.5 pages)

Covers the four required sections:

1. **Why These Questions**
   - Opening principle: surface what employees already know but haven't articulated
   - Per-axis design rationale for Locus (Rotter + Dweck), Contribution (Organ + Campbell), Radius (Maslow + Batson)
   - How options are designed to be plausible self-descriptions, not compliance-quiz bait

2. **Branching Design & Trade-Offs**
   - Depth vs Breadth: 2-question minimum per axis, 8-12 question range per session
   - Fixed Options vs Free Text: why constraints force design discipline
   - Summary Routing: three-way split (positive, growth, mixed) with "mixed" as default

3. **Psychological Sources**
   - Citation table: 6 frameworks mapped to specific design choices
   - Grounding in 15+ years of peer-reviewed research

4. **What I'd Improve With More Time**
   - Adaptive difficulty (hardening questions for consistent patterns)
   - Multi-session continuity (cross-session comparison)
   - Team-level pattern aggregation
   - Weighted signal scoring (confidence-aware)
   - Inter-axis branching (Axis 1 outcome influences Axis 2 questions)

---

## Part B: Working Implementation (Bonus)

### 4. Web Agent
**Files:** 
- [`agent/index.html`](agent/index.html)
- [`agent/engine.js`](agent/engine.js)
- [`agent/style.css`](agent/style.css)

**How to run:**
1. Open a local HTTP server in the `agent/` directory:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (npx)
   npx http-server
   ```
2. Open `http://localhost:8000` in a browser
3. The agent loads the tree from `../tree/reflection-tree.json` (no hardcoding)
4. Navigate through the tree by selecting options
5. Progress bar shows which axis you're in
6. At the end, view your personalized summary

**Technical details:**
- `ReflectionEngine` class: Walks the tree deterministically, accumulates signals, interpolates text
- `submitAnswer(answer)`: Records answer, triggers signal tally, advances to next node
- `evaluateDecision(node)`: Routes based on accumulated dominant poles or prior answers
- `interpolate(text)`: Replaces `{OPENING_Q.answer}`, `{axis1.dominant}`, and summary templates
- State management: Session state can be exported via `getSessionState()`

### 5. Sample Transcripts
**Files:**
- [`transcripts/persona-1-transcript.md`](transcripts/persona-1-transcript.md) — **Victim / Entitled / Self-Centric**
- [`transcripts/persona-2-transcript.md`](transcripts/persona-2-transcript.md) — **Victor / Contributing / Altrocentric**

Each transcript shows:
- The exact dialogue with all questions and selected options
- Signal accumulation at each step
- Node-by-node branching decisions
- Final summary and routing outcome

**Why two personas:**
- **Persona 1** takes every external/entitlement/self-focused branch → Routes to SUMMARY_GROW (growth-mindset framing)
- **Persona 2** takes every internal/contribution/others-focused branch → Routes to SUMMARY_POS (affirmation)
- Demonstrates that the tree produces meaningfully different conversations based on authentic answers
- Shows the signal accumulation and routing system working as designed

---

## Submission Structure

```
/
├── tree/
│   ├── reflection-tree.json        ← Part A: Tree data (47 nodes)
│   ├── tree-diagram.drawio         ← Editable draw.io format
│   └── tree-diagram.md             ← Visual diagram (Mermaid)
├── agent/                           ← Part B: Working implementation
│   ├── index.html
│   ├── engine.js
│   └── style.css
├── transcripts/                     ← Part B: Sample runs
│   ├── persona-1-transcript.md      (victim path)
│   └── persona-2-transcript.md      (victor path)
├── write-up.md                      ← Part A: Design rationale (2.5 pages)
├── DailyReflectionTree.md           ← Assignment brief (reference)
└── README.md                        ← This file
```

---

## Compliance Checklist

### Part A Requirements — All Met ✅

| Requirement | Minimum | Actual | Status |
|-------------|---------|--------|--------|
| Total nodes | 35 | 47 | ✅ |
| Question nodes | 8 | 19 | ✅ |
| Decision nodes | 4 | 12 | ✅ |
| Reflection nodes | 4 | 9 | ✅ |
| Bridge nodes | 2 | 2 | ✅ |
| Axes covered | 3 | 3 (Locus, Contribution, Radius) | ✅ |
| Options per question | 3-5 | 3-5 | ✅ |
| Summary nodes | 1+ | 3 | ✅ |
| Write-up length | ≤3 pages | ~2.5 pages | ✅ |
| Write-up sections | 4 required | 4 delivered | ✅ |
| Tree diagram | Required | ✅ Mermaid + draw.io | ✅ |

### Part B Requirements — All Met ✅

| Requirement | Status |
|-------------|--------|
| Working agent | ✅ HTML/JS implementation with full tree loading |
| Deterministic branching | ✅ No randomness, no LLM calls at runtime |
| Signal accumulation | ✅ Per-axis tallying with dominance calculation |
| Text interpolation | ✅ `{node.answer}` and `{axis.dominant}` replacement |
| Two sample transcripts | ✅ Persona-1 (victim path) + Persona-2 (victor path) |
| Different branching paths shown | ✅ Contrasting outcomes documented |

---

## Design Philosophy

### AI as Tool, Not Product

This submission demonstrates the distinction that DT emphasizes:

- **AI in the workflow**: ChatGPT/Claude used for research (psychology papers), brainstorming (option phrasing), testing (edge cases). These accelerated the design process.
- **Determinism in the product**: Zero LLM calls at runtime. The tree is static, auditable, trustworthy. Every reflection is the result of a human-encoded structure, not a model's hallucination.

The assignment brief states: *"You will use LLMs...as your collaborator to design and build...But the tool itself...must not call any LLM at runtime."* This submission respects that constraint completely.

### Reflection as Reframing

The tree is not a diagnostic. It doesn't label employees as "good" or "bad." Instead, it:
1. **Surfaces patterns** the employee already senses but hasn't articulated
2. **Reframes without moralizing** — external locus gets "growth mindset" language (malleable), not judgment
3. **Widens perspective** — especially in Axis 3, the goal is contextualizing, not blame
4. **Honors complexity** — the "mixed" summary is the default, because most days are

### Structural Thinking

The tree demonstrates core BA/DS skills at DT:
- **Extract structure from psychology**: Rotter → locus questions, Batson → depth-of-empathy questions
- **Design for determinism**: Every answer maps to a known next node
- **Constrain to clarify**: Fixed options forced harder thinking than free-text would allow
- **Trade-off analysis**: Depth vs breadth, breadth vs brevity, signal clarity vs nuance

---

## Next Steps

1. **To review the tree structure**: Open `tree/reflection-tree.json` and trace a few paths. Every node is reachable, every decision rule is evaluable by inspection.

2. **To see the visual design**: View `tree/tree-diagram.md` for the Mermaid flowchart.

3. **To run the agent**: 
   ```bash
   cd agent/
   python -m http.server 8000
   # Open http://localhost:8000
   ```

4. **To understand the design**: Read `write-up.md` for the reasoning behind each choice.

5. **To verify branching logic**: Compare `transcripts/persona-1-transcript.md` and `transcripts/persona-2-transcript.md` to see how different answers produce different paths and reflections.

---

**Version**: 1.0.0  
**Submission Date**: April 28, 2026  
**Status**: Complete (Part A + Part B Bonus)
