/**
 * Daily Reflection Tree — Engine
 * Deterministic tree-walking agent with state management,
 * signal accumulation, and text interpolation.
 */

class ReflectionEngine {
  constructor(treeData) {
    this.meta = treeData.meta;
    this.nodes = new Map();
    this.summaryTemplates = treeData.summaryTemplates;
    treeData.nodes.forEach(n => this.nodes.set(n.id, n));

    this.answers = {};
    this.confidences = {}; // Store confidence levels per answer
    this.signals = {
      axis1: { internal: 0, external: 0 },
      axis2: { contribution: 0, entitlement: 0 },
      axis3: { self: 0, others: 0 }
    };
    this.path = [];
    this.currentNodeId = null;
    this.sessionStartTime = new Date();
  }

  start() {
    this.currentNodeId = 'START';
    this.path.push('START');
    return this.getCurrentNode();
  }

  getCurrentNode() {
    const node = this.nodes.get(this.currentNodeId);
    if (!node) return null;
    return { ...node, text: this.interpolate(node.text) };
  }

  submitAnswer(answer, confidence = 1.0) {
    const current = this.nodes.get(this.currentNodeId);
    if (!current || current.type !== 'question') return null;
    
    // Store answer with confidence (0-1 range)
    const confValue = Math.max(0, Math.min(1, confidence / 100));
    this.answers[this.currentNodeId] = answer;
    this.confidences[this.currentNodeId] = confValue;
    
    if (current.signal) this.accumulateSignal(current.signal, confValue);
    return this.advance(current);
  }

  continue() {
    const current = this.nodes.get(this.currentNodeId);
    if (!current) return null;
    return this.advance(current);
  }

  advance(fromNode) {
    let nextId = null;
    if (fromNode.type === 'decision') {
      nextId = this.evaluateDecision(fromNode);
    } else if (fromNode.target) {
      nextId = fromNode.target;
    } else {
      nextId = this.findChild(fromNode.id);
    }
    if (!nextId) return null;

    this.currentNodeId = nextId;
    this.path.push(nextId);
    const nextNode = this.getCurrentNode();
    if (!nextNode) return null;

    if (nextNode.signal && nextNode.type !== 'question') {
      // Non-question nodes use full confidence (1.0)
      this.accumulateSignal(nextNode.signal, 1.0);
    }
    if (nextNode.type === 'decision') {
      return this.advance(this.nodes.get(nextId));
    }
    return nextNode;
  }

  evaluateDecision(node) {
    if (!node.rules) return node.target;
    for (const rule of node.rules) {
      if (rule.condition && rule.condition.dominant) {
        const dc = rule.condition.dominant;
        let match = true;
        for (const [axis, pole] of Object.entries(dc)) {
          if (this.getDominant(axis) !== pole) { match = false; break; }
        }
        if (match) return rule.target;
        continue;
      }
      if (rule.condition === 'default') return rule.target;
      if (rule.condition && rule.condition.nodeId) {
        const ans = this.answers[rule.condition.nodeId];
        if (ans && rule.condition.answers.includes(ans)) return rule.target;
      }
    }
    return null;
  }

  findChild(parentId) {
    for (const [id, node] of this.nodes) {
      if (node.parentId === parentId) return id;
    }
    return null;
  }

  accumulateSignal(signal, confidence = 1.0) {
    const [axis, pole] = signal.split(':');
    if (this.signals[axis] && this.signals[axis][pole] !== undefined) {
      // Weight signal by confidence (0-1, where 0.5 = 50% confidence = +0.5 signal)
      this.signals[axis][pole] += confidence;
    }
  }

  getDominant(axis) {
    const s = this.signals[axis];
    if (!s) return 'unknown';
    const entries = Object.entries(s);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  interpolate(text) {
    if (!text) return text;
    text = text.replace(/\{(\w+)\.answer\}/g, (m, nid) => this.answers[nid] || m);
    text = text.replace(/\{(axis\d)\.dominant\}/g, (m, ax) => this.getDominant(ax));
    text = text.replace(/\{(axis\d)_summary\}/g, (m, ax) => {
      const d = this.getDominant(ax);
      return (this.summaryTemplates && this.summaryTemplates[ax] && this.summaryTemplates[ax][d]) || m;
    });
    return text;
  }

  getSessionState() {
    return {
      timestamp: this.sessionStartTime.toISOString(),
      answers: { ...this.answers },
      confidences: { ...this.confidences },
      signals: JSON.parse(JSON.stringify(this.signals)),
      dominants: { axis1: this.getDominant('axis1'), axis2: this.getDominant('axis2'), axis3: this.getDominant('axis3') },
      path: [...this.path],
      durationMs: new Date() - this.sessionStartTime,
      signalStrengths: this.getSignalStrengths()
    };
  }

  saveSession() {
    const state = this.getSessionState();
    const sessions = JSON.parse(localStorage.getItem('reflection-sessions') || '[]');
    sessions.push(state);
    localStorage.setItem('reflection-sessions', JSON.stringify(sessions));
    return state;
  }

  static getSessions() {
    return JSON.parse(localStorage.getItem('reflection-sessions') || '[]');
  }

  static clearSessions() {
    localStorage.removeItem('reflection-sessions');
  }

  getSignalStrengths() {
    // Calculate signal strength (0-100) for radar chart
    const strengths = {};
    for (const [axis, poles] of Object.entries(this.signals)) {
      const total = Object.values(poles).reduce((a, b) => a + b, 0);
      const dominant = this.getDominant(axis);
      strengths[axis] = total > 0 ? Math.round((poles[dominant] / total) * 100) : 0;
    }
    return strengths;
  }

  getProgress() {
    const id = this.currentNodeId || '';
    if (id === 'START') return 0;
    if (id === 'OPENING_Q' || id === 'OPENING_D') return 0.08;
    if (id.startsWith('A1')) return 0.2;
    if (id === 'BRIDGE_1_2') return 0.33;
    if (id.startsWith('A2')) return 0.5;
    if (id === 'BRIDGE_2_3') return 0.66;
    if (id.startsWith('A3')) return 0.8;
    if (id.startsWith('SUMMARY') || id === 'END') return 1.0;
    return 0;
  }

  getCurrentAxisLabel() {
    const id = this.currentNodeId || '';
    if (id === 'START' || id.startsWith('OPENING')) return 'Opening';
    if (id.startsWith('A1') || id === 'BRIDGE_1_2') return 'Locus of Control';
    if (id.startsWith('A2') || id === 'BRIDGE_2_3') return 'Contribution vs Entitlement';
    if (id.startsWith('A3')) return 'Radius of Concern';
    if (id.startsWith('SUMMARY') || id === 'END') return 'Reflection Summary';
    return '';
  }
}
