/**
 * K'UHUL Action Words Registry
 * Professional coding action words for resume building and context framing
 */

// ============================================================================
// Action Word Types
// ============================================================================

export interface ActionWord {
  word: string;
  meaning: string;
  context: string;
  example: string;
  category: ActionWordCategory;
  strength: 'strong' | 'moderate' | 'standard';
  keywords: string[];
}

export type ActionWordCategory =
  | 'creation'
  | 'optimization'
  | 'debugging'
  | 'collaboration'
  | 'integration'
  | 'leadership'
  | 'analysis'
  | 'documentation'
  | 'security'
  | 'automation';

// ============================================================================
// Action Words Registry
// ============================================================================

export const ACTION_WORDS: Record<string, ActionWord> = {
  engineered: {
    word: 'engineered',
    meaning: 'created a new solution or system',
    context: 'projects, frameworks, tools',
    example: 'Engineered a real-time collaboration platform serving 10K+ concurrent users',
    category: 'creation',
    strength: 'strong',
    keywords: ['built', 'created', 'designed', 'developed'],
  },

  optimized: {
    word: 'optimized',
    meaning: 'improved efficiency or performance',
    context: 'algorithms, databases, networks',
    example: 'Optimized API response times by 300% through query optimization and caching',
    category: 'optimization',
    strength: 'strong',
    keywords: ['improved', 'enhanced', 'accelerated', 'streamlined'],
  },

  debugged: {
    word: 'debugged',
    meaning: 'resolved issues or errors',
    context: 'production systems, legacy code',
    example: 'Debugged race conditions in distributed system reducing errors by 95%',
    category: 'debugging',
    strength: 'moderate',
    keywords: ['fixed', 'resolved', 'troubleshot', 'diagnosed'],
  },

  collaborated: {
    word: 'collaborated',
    meaning: 'worked in teams effectively',
    context: 'cross-functional teams, open source',
    example: 'Collaborated with designers and product managers on UX improvements',
    category: 'collaboration',
    strength: 'moderate',
    keywords: ['partnered', 'coordinated', 'teamed', 'worked with'],
  },

  integrated: {
    word: 'integrated',
    meaning: 'combined different systems/components',
    context: 'APIs, services, libraries',
    example: 'Integrated payment gateway with existing e-commerce platform',
    category: 'integration',
    strength: 'strong',
    keywords: ['connected', 'unified', 'merged', 'combined'],
  },

  built: {
    word: 'built',
    meaning: 'created applications or systems',
    context: 'from scratch, MVP, prototypes',
    example: 'Built a machine learning pipeline for fraud detection',
    category: 'creation',
    strength: 'standard',
    keywords: ['created', 'developed', 'constructed', 'assembled'],
  },

  managed: {
    word: 'managed',
    meaning: 'led projects or teams',
    context: 'agile teams, product development',
    example: 'Managed a team of 5 developers through 3 product cycles',
    category: 'leadership',
    strength: 'moderate',
    keywords: ['led', 'oversaw', 'directed', 'supervised'],
  },

  analyzed: {
    word: 'analyzed',
    meaning: 'examined and interpreted data',
    context: 'metrics, logs, user behavior',
    example: 'Analyzed performance bottlenecks using profiling tools',
    category: 'analysis',
    strength: 'moderate',
    keywords: ['examined', 'evaluated', 'assessed', 'investigated'],
  },

  spearheaded: {
    word: 'spearheaded',
    meaning: 'took initiative and led',
    context: 'new initiatives, technical direction',
    example: 'Spearheaded migration from monolithic to microservices architecture',
    category: 'leadership',
    strength: 'strong',
    keywords: ['led', 'pioneered', 'initiated', 'championed'],
  },

  delivered: {
    word: 'delivered',
    meaning: 'successfully completed projects',
    context: 'on time, under budget, meeting specs',
    example: 'Delivered a full-stack application 2 weeks ahead of schedule',
    category: 'creation',
    strength: 'moderate',
    keywords: ['completed', 'shipped', 'launched', 'released'],
  },

  architected: {
    word: 'architected',
    meaning: 'designed system architecture',
    context: 'scalable systems, cloud infrastructure',
    example: 'Architected a serverless data processing pipeline handling 1M events/day',
    category: 'creation',
    strength: 'strong',
    keywords: ['designed', 'structured', 'planned', 'blueprinted'],
  },

  implemented: {
    word: 'implemented',
    meaning: 'wrote and deployed code',
    context: 'features, fixes, improvements',
    example: 'Implemented responsive design across all application views',
    category: 'creation',
    strength: 'standard',
    keywords: ['coded', 'developed', 'built', 'programmed'],
  },

  refactored: {
    word: 'refactored',
    meaning: 'restructured existing code',
    context: 'legacy systems, technical debt',
    example: 'Refactored authentication system to support OAuth2 and SAML',
    category: 'optimization',
    strength: 'moderate',
    keywords: ['restructured', 'reorganized', 'modernized', 'cleaned'],
  },

  automated: {
    word: 'automated',
    meaning: 'created automated processes',
    context: 'testing, deployment, monitoring',
    example: 'Automated CI/CD pipeline reducing deployment time by 80%',
    category: 'automation',
    strength: 'strong',
    keywords: ['scripted', 'streamlined', 'systematized', 'mechanized'],
  },

  secured: {
    word: 'secured',
    meaning: 'implemented security measures',
    context: 'authentication, authorization, data protection',
    example: 'Secured REST API against OWASP Top 10 vulnerabilities',
    category: 'security',
    strength: 'strong',
    keywords: ['protected', 'hardened', 'fortified', 'safeguarded'],
  },

  documented: {
    word: 'documented',
    meaning: 'created technical documentation',
    context: 'APIs, systems, processes',
    example: 'Documented entire codebase with comprehensive API reference',
    category: 'documentation',
    strength: 'standard',
    keywords: ['wrote', 'recorded', 'detailed', 'cataloged'],
  },

  mentored: {
    word: 'mentored',
    meaning: 'guided other developers',
    context: 'junior developers, code reviews',
    example: 'Mentored 3 junior developers on best practices and design patterns',
    category: 'leadership',
    strength: 'moderate',
    keywords: ['coached', 'trained', 'guided', 'taught'],
  },

  researched: {
    word: 'researched',
    meaning: 'explored new technologies/methods',
    context: 'proof of concepts, tech stack decisions',
    example: 'Researched and recommended GraphQL adoption for API layer',
    category: 'analysis',
    strength: 'moderate',
    keywords: ['investigated', 'explored', 'evaluated', 'studied'],
  },

  scaled: {
    word: 'scaled',
    meaning: 'grew system capacity',
    context: 'infrastructure, user growth',
    example: 'Scaled platform from 1K to 100K daily active users',
    category: 'optimization',
    strength: 'strong',
    keywords: ['expanded', 'grew', 'enlarged', 'extended'],
  },

  migrated: {
    word: 'migrated',
    meaning: 'moved systems or data',
    context: 'cloud migration, database upgrades',
    example: 'Migrated legacy Oracle database to PostgreSQL with zero downtime',
    category: 'integration',
    strength: 'moderate',
    keywords: ['transferred', 'moved', 'transitioned', 'converted'],
  },

  orchestrated: {
    word: 'orchestrated',
    meaning: 'coordinated complex processes',
    context: 'deployments, releases, workflows',
    example: 'Orchestrated multi-region deployment across 5 data centers',
    category: 'leadership',
    strength: 'strong',
    keywords: ['coordinated', 'arranged', 'organized', 'managed'],
  },

  streamlined: {
    word: 'streamlined',
    meaning: 'simplified and improved efficiency',
    context: 'workflows, processes, code',
    example: 'Streamlined onboarding flow reducing user drop-off by 40%',
    category: 'optimization',
    strength: 'moderate',
    keywords: ['simplified', 'optimized', 'refined', 'improved'],
  },

  pioneered: {
    word: 'pioneered',
    meaning: 'introduced new approaches',
    context: 'innovation, new technologies',
    example: 'Pioneered adoption of containerization strategy company-wide',
    category: 'leadership',
    strength: 'strong',
    keywords: ['introduced', 'initiated', 'started', 'launched'],
  },

  transformed: {
    word: 'transformed',
    meaning: 'fundamentally changed systems',
    context: 'digital transformation, modernization',
    example: 'Transformed monolithic application into event-driven microservices',
    category: 'optimization',
    strength: 'strong',
    keywords: ['converted', 'changed', 'revolutionized', 'modernized'],
  },
};

// ============================================================================
// Action Words Helper Functions
// ============================================================================

/**
 * Get all action words
 */
export function getAllActionWords(): ActionWord[] {
  return Object.values(ACTION_WORDS);
}

/**
 * Get action words by category
 */
export function getActionWordsByCategory(category: ActionWordCategory): ActionWord[] {
  return Object.values(ACTION_WORDS).filter(aw => aw.category === category);
}

/**
 * Get action words by strength
 */
export function getActionWordsByStrength(strength: 'strong' | 'moderate' | 'standard'): ActionWord[] {
  return Object.values(ACTION_WORDS).filter(aw => aw.strength === strength);
}

/**
 * Find action word by keyword
 */
export function findActionWordByKeyword(keyword: string): ActionWord | undefined {
  const lowerKeyword = keyword.toLowerCase();
  return Object.values(ACTION_WORDS).find(
    aw => aw.word === lowerKeyword || aw.keywords.includes(lowerKeyword)
  );
}

/**
 * Extract action words from text
 */
export function extractActionWords(text: string): ActionWord[] {
  const lowerText = text.toLowerCase();
  const found: ActionWord[] = [];

  for (const aw of Object.values(ACTION_WORDS)) {
    if (lowerText.includes(aw.word)) {
      found.push(aw);
    } else {
      // Check keywords
      for (const kw of aw.keywords) {
        if (lowerText.includes(kw)) {
          found.push(aw);
          break;
        }
      }
    }
  }

  return found;
}

/**
 * Suggest stronger action words
 */
export function suggestStrongerWords(text: string): ActionWord[] {
  const found = extractActionWords(text);
  const suggestions: ActionWord[] = [];

  for (const aw of found) {
    if (aw.strength !== 'strong') {
      // Find stronger alternatives in same category
      const stronger = getActionWordsByCategory(aw.category)
        .filter(a => a.strength === 'strong' && a.word !== aw.word);
      suggestions.push(...stronger);
    }
  }

  return [...new Set(suggestions)];
}

/**
 * Format action word for resume
 */
export function formatForResume(actionWord: ActionWord, context: string): string {
  return `${actionWord.word.charAt(0).toUpperCase() + actionWord.word.slice(1)} ${context}`;
}

/**
 * Get random action words by category
 */
export function getRandomActionWords(category: ActionWordCategory, count: number = 3): ActionWord[] {
  const words = getActionWordsByCategory(category);
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ============================================================================
// Category Descriptions
// ============================================================================

export const ACTION_WORD_CATEGORIES: Record<ActionWordCategory, { name: string; description: string }> = {
  creation: {
    name: 'Creation',
    description: 'Building new systems, features, or products',
  },
  optimization: {
    name: 'Optimization',
    description: 'Improving performance, efficiency, or quality',
  },
  debugging: {
    name: 'Debugging',
    description: 'Finding and fixing issues or problems',
  },
  collaboration: {
    name: 'Collaboration',
    description: 'Working with teams and stakeholders',
  },
  integration: {
    name: 'Integration',
    description: 'Connecting systems, services, or components',
  },
  leadership: {
    name: 'Leadership',
    description: 'Leading teams, projects, or initiatives',
  },
  analysis: {
    name: 'Analysis',
    description: 'Researching, evaluating, or investigating',
  },
  documentation: {
    name: 'Documentation',
    description: 'Creating technical documentation',
  },
  security: {
    name: 'Security',
    description: 'Implementing security measures',
  },
  automation: {
    name: 'Automation',
    description: 'Automating processes and workflows',
  },
};
