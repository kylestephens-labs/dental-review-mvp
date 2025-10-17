# 🔧 **TDD Enhancement Technical Specification**

## **System Architecture**

### **Phase Detection System**

#### **Multi-Source Phase Detection**
```typescript
interface TddPhaseDetector {
  detectPhase(context: ProveContext): Promise<'red' | 'green' | 'refactor' | 'unknown'>;
  extractFromCommitMessage(message: string): 'red' | 'green' | 'refactor' | 'unknown';
  analyzeTestEvidence(evidence: TestEvidence[]): 'red' | 'green' | 'refactor' | 'unknown';
  detectRefactoringEvidence(changes: GitChanges): 'refactor' | 'unknown';
}

// Implementation
export async function detectTddPhase(context: ProveContext): Promise<'red' | 'green' | 'refactor' | 'unknown'> {
  // 1. Check commit message for TDD phase marker
  const commitPhase = extractPhaseFromCommitMessage(context.git.commitMessage);
  if (commitPhase !== 'unknown') return commitPhase;
  
  // 2. Check for test failure evidence in recent commits
  const testFailureEvidence = await checkTestFailureEvidence(context);
  if (testFailureEvidence) return 'red';
  
  // 3. Check for test success evidence
  const testSuccessEvidence = await checkTestSuccessEvidence(context);
  if (testSuccessEvidence) return 'green';
  
  // 4. Check for refactoring evidence
  const refactorEvidence = await checkRefactoringEvidence(context);
  if (refactorEvidence) return 'refactor';
  
  return 'unknown';
}
```

#### **Evidence Sources**
1. **Commit Message Markers**: `[TDD:red|green|refactor]`
2. **Test Execution Evidence**: Pass/fail patterns and timestamps
3. **Code Analysis**: Refactoring indicators and quality metrics
4. **File Modification Times**: Test-first validation

### **Phase Validation System**

#### **Red Phase Validation**
```typescript
interface RedPhaseValidator {
  validateTestFirst(changes: GitChanges): ValidationResult;
  validateTestQuality(tests: TestFile[]): ValidationResult;
  validateTestCoverage(coverage: CoverageReport): ValidationResult;
}

export async function checkTddRedPhase(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();
  
  // Validate test-first development
  const testFirstValidation = await validateTestFirst(context.git.changedFiles);
  if (!testFirstValidation.ok) {
    return {
      id: 'tdd-red-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Tests must be written before implementation',
      details: testFirstValidation.details
    };
  }
  
  // Validate test quality
  const testQualityValidation = await validateTestQuality(context.git.changedFiles);
  if (!testQualityValidation.ok) {
    return {
      id: 'tdd-red-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Test quality does not meet requirements',
      details: testQualityValidation.details
    };
  }
  
  return {
    id: 'tdd-red-phase',
    ok: true,
    ms: Date.now() - startTime,
    details: { testFirstValidation, testQualityValidation }
  };
}
```

#### **Green Phase Validation**
```typescript
interface GreenPhaseValidator {
  validateTestsPass(testResults: TestResults): ValidationResult;
  validateImplementationComplete(changes: GitChanges): ValidationResult;
  validateCoverageThreshold(coverage: CoverageReport): ValidationResult;
}

export async function checkTddGreenPhase(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();
  
  // First, run the existing test check
  const testResult = await checkTests(context);
  
  if (!testResult.ok) {
    return {
      id: 'tdd-green-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Tests must pass in Green phase',
      details: testResult.details
    };
  }
  
  // Validate implementation completeness
  const implementationValidation = await validateImplementationComplete(context.git.changedFiles);
  if (!implementationValidation.ok) {
    return {
      id: 'tdd-green-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Implementation must be complete in Green phase',
      details: implementationValidation.details
    };
  }
  
  // Validate coverage threshold
  const coverageValidation = await validateCoverageThreshold(context);
  if (!coverageValidation.ok) {
    return {
      id: 'tdd-green-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Coverage threshold not met in Green phase',
      details: coverageValidation.details
    };
  }
  
  return {
    id: 'tdd-green-phase',
    ok: true,
    ms: Date.now() - startTime,
    details: { testResult, implementationValidation, coverageValidation }
  };
}
```

#### **Refactor Phase Validation**
```typescript
interface RefactorPhaseValidator {
  validateQualityImprovement(before: CodeMetrics, after: CodeMetrics): ValidationResult;
  validateBehaviorPreservation(testResults: TestResults): ValidationResult;
  validateRefactoringOccurred(changes: GitChanges): ValidationResult;
}

export async function checkTddRefactorPhase(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();
  
  // Validate that refactoring actually happened
  const refactorValidation = await validateRefactoringOccurred(context.git.changedFiles);
  if (!refactorValidation.ok) {
    return {
      id: 'tdd-refactor-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Refactoring must have occurred in Refactor phase',
      details: refactorValidation.details
    };
  }
  
  // Validate quality improvements
  const qualityValidation = await validateQualityImprovement(context);
  if (!qualityValidation.ok) {
    return {
      id: 'tdd-refactor-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Code quality must improve in Refactor phase',
      details: qualityValidation.details
    };
  }
  
  // Validate behavior preservation
  const behaviorValidation = await validateBehaviorPreservation(context);
  if (!behaviorValidation.ok) {
    return {
      id: 'tdd-refactor-phase',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'Behavior must be preserved in Refactor phase',
      details: behaviorValidation.details
    };
  }
  
  return {
    id: 'tdd-refactor-phase',
    ok: true,
    ms: Date.now() - startTime,
    details: { refactorValidation, qualityValidation, behaviorValidation }
  };
}
```

### **Process Sequence Validation**

#### **Sequence Validation System**
```typescript
interface ProcessSequenceValidator {
  validateSequence(phases: TddPhase[]): ValidationResult;
  detectSkippedPhases(phases: TddPhase[]): SkippedPhase[];
  provideGuidance(violations: SequenceViolation[]): Guidance[];
}

export async function checkTddProcessSequence(context: ProveContext): Promise<CheckResult> {
  const startTime = Date.now();
  
  // Analyze recent commits for TDD sequence
  const recentCommits = await getRecentCommits(context, 5);
  const tddPhases = recentCommits.map(commit => 
    detectTddPhase({ ...context, git: { ...context.git, commitMessage: commit.message } })
  );
  
  // Validate Red→Green→Refactor sequence
  const isValidSequence = validateTddSequence(tddPhases);
  
  if (!isValidSequence) {
    const skippedPhases = detectSkippedPhases(tddPhases);
    const guidance = provideGuidance(tddPhases);
    
    return {
      id: 'tdd-process-sequence',
      ok: false,
      ms: Date.now() - startTime,
      reason: 'TDD process must follow Red→Green→Refactor sequence',
      details: { 
        phases: tddPhases, 
        expected: ['red', 'green', 'refactor'],
        skippedPhases,
        guidance
      }
    };
  }
  
  return {
    id: 'tdd-process-sequence',
    ok: true,
    ms: Date.now() - startTime,
    details: { phases: tddPhases, sequence: 'valid' }
  };
}
```

---

## **Data Flow Architecture**

### **Phase Detection Flow**
```
Commit Message → Phase Marker Extraction
Test Evidence → Evidence Analysis
Code Changes → Refactoring Detection
File Times → Test-First Validation
                ↓
            Phase Detection
                ↓
            Phase Validation
```

### **Validation Flow**
```
Phase Detection → Phase-Specific Validation
Test Execution → Evidence Capture
Code Analysis → Quality Metrics
Sequence Check → Process Validation
                ↓
            Validation Results
                ↓
            Error Messages & Guidance
```

---

## **File Structure**

```
tools/prove/checks/
├── tddChangedHasTests.ts     # Enhanced existing check
├── tddPhaseDetection.ts      # Phase detection check
├── tddRedPhase.ts           # Red phase validation
├── tddGreenPhase.ts         # Green phase validation
├── tddRefactorPhase.ts      # Refactor phase validation
├── tddProcessSequence.ts    # Process sequence validation
└── utils/
    ├── tddPhaseDetection.ts # Phase detection utilities
    ├── tddValidation.ts     # Validation utilities
    ├── testEvidence.ts      # Test evidence capture
    └── refactorAnalysis.ts  # Refactoring analysis
```

---

## **Configuration Schema**

### **TDD Configuration**
```typescript
interface TddConfig {
  enabled: boolean;
  requirePhaseMarkers: boolean;
  phases: {
    red: {
      requireTestFirst: boolean;
      requireTestQuality: boolean;
      minTestCoverage: number;
    };
    green: {
      requireTestsPass: boolean;
      requireImplementationValidation: boolean;
      minCoverageThreshold: number;
    };
    refactor: {
      requireQualityImprovement: boolean;
      requireBehaviorPreservation: boolean;
      qualityMetrics: string[];
    };
  };
  sequence: {
    requireRedGreenRefactor: boolean;
    maxCommitsToAnalyze: number;
  };
}

// Default configuration
export const defaultTddConfig: TddConfig = {
  enabled: true,
  requirePhaseMarkers: true,
  phases: {
    red: {
      requireTestFirst: true,
      requireTestQuality: true,
      minTestCoverage: 0.8
    },
    green: {
      requireTestsPass: true,
      requireImplementationValidation: true,
      minCoverageThreshold: 85
    },
    refactor: {
      requireQualityImprovement: true,
      requireBehaviorPreservation: true,
      qualityMetrics: ['complexity', 'duplication', 'maintainability']
    }
  },
  sequence: {
    requireRedGreenRefactor: true,
    maxCommitsToAnalyze: 5
  }
};
```

### **Enhanced Prove Context**
```typescript
interface ProveContext {
  // ... existing context
  tdd: {
    phase: 'red' | 'green' | 'refactor' | 'unknown';
    evidence: TestEvidence[];
    sequence: TddPhase[];
    validation: PhaseValidationResults;
  };
}

interface TestEvidence {
  phase: 'red' | 'green' | 'refactor';
  timestamp: string;
  testResults: TestResults;
  changedFiles: string[];
  commitHash: string;
}

interface PhaseValidationResults {
  red: ValidationResult;
  green: ValidationResult;
  refactor: ValidationResult;
  sequence: ValidationResult;
}
```

---

## **Error Handling System**

### **Phase Detection Errors**
```typescript
interface PhaseDetectionError {
  type: 'COMMIT_MESSAGE_INVALID' | 'EVIDENCE_INSUFFICIENT' | 'PHASE_AMBIGUOUS';
  message: string;
  guidance: string;
  suggestedAction: string;
}

// Error handling implementation
export function handlePhaseDetectionError(error: PhaseDetectionError): CheckResult {
  return {
    id: 'tdd-phase-detection',
    ok: false,
    reason: error.message,
    details: {
      type: error.type,
      guidance: error.guidance,
      suggestedAction: error.suggestedAction
    }
  };
}
```

### **Validation Errors**
```typescript
interface PhaseValidationError {
  phase: 'red' | 'green' | 'refactor';
  type: 'TEST_FIRST_VIOLATION' | 'TESTS_FAIL' | 'QUALITY_REGRESSION';
  message: string;
  details: ValidationDetails;
  fix: string;
}

// Error handling implementation
export function handlePhaseValidationError(error: PhaseValidationError): CheckResult {
  return {
    id: `tdd-${error.phase}-phase`,
    ok: false,
    reason: error.message,
    details: {
      phase: error.phase,
      type: error.type,
      details: error.details,
      fix: error.fix
    }
  };
}
```

### **Sequence Errors**
```typescript
interface SequenceError {
  type: 'SKIPPED_PHASE' | 'INVALID_ORDER' | 'MISSING_PHASE';
  expected: TddPhase[];
  actual: TddPhase[];
  guidance: string;
}

// Error handling implementation
export function handleSequenceError(error: SequenceError): CheckResult {
  return {
    id: 'tdd-process-sequence',
    ok: false,
    reason: 'TDD process sequence violation',
    details: {
      type: error.type,
      expected: error.expected,
      actual: error.actual,
      guidance: error.guidance
    }
  };
}
```

---

## **Performance Considerations**

### **Caching Strategy**
```typescript
interface TddCache {
  phaseDetection: Map<string, TddPhase>;
  evidence: Map<string, TestEvidence[]>;
  qualityMetrics: Map<string, CodeMetrics>;
}

// Cache implementation
export class TddCacheManager {
  private cache: TddCache = {
    phaseDetection: new Map(),
    evidence: new Map(),
    qualityMetrics: new Map()
  };
  
  getPhaseDetection(key: string): TddPhase | undefined {
    return this.cache.phaseDetection.get(key);
  }
  
  setPhaseDetection(key: string, phase: TddPhase): void {
    this.cache.phaseDetection.set(key, phase);
  }
  
  // ... other cache methods
}
```

### **Optimization Techniques**
- **Incremental Analysis**: Only analyze changed files and commits
- **Parallel Processing**: Run phase detection and validation in parallel
- **Lazy Loading**: Load evidence and metrics only when needed
- **Memory Management**: Limit evidence storage to recent commits

---

## **Testing Strategy**

### **Unit Tests**
```typescript
// Phase detection tests
describe('TddPhaseDetection', () => {
  it('should detect red phase from commit message', async () => {
    const context = createMockContext({
      commitMessage: 'feat: add feature [T-2024-01-15-001] [MODE:F] [TDD:red]'
    });
    
    const phase = await detectTddPhase(context);
    expect(phase).toBe('red');
  });
  
  it('should detect green phase from test evidence', async () => {
    const context = createMockContext({
      evidence: [{ phase: 'green', timestamp: '2024-01-15T10:00:00Z' }]
    });
    
    const phase = await detectTddPhase(context);
    expect(phase).toBe('green');
  });
});

// Phase validation tests
describe('TddPhaseValidation', () => {
  it('should validate red phase requirements', async () => {
    const context = createMockContext({ phase: 'red' });
    const result = await checkTddRedPhase(context);
    expect(result.ok).toBe(true);
  });
  
  it('should validate green phase requirements', async () => {
    const context = createMockContext({ phase: 'green' });
    const result = await checkTddGreenPhase(context);
    expect(result.ok).toBe(true);
  });
});
```

### **Integration Tests**
```typescript
// End-to-end TDD workflow tests
describe('TddWorkflow', () => {
  it('should validate complete red-green-refactor cycle', async () => {
    const context = createMockContext({
      phases: ['red', 'green', 'refactor']
    });
    
    const result = await checkTddProcessSequence(context);
    expect(result.ok).toBe(true);
  });
  
  it('should catch skipped phases', async () => {
    const context = createMockContext({
      phases: ['red', 'refactor'] // Missing green
    });
    
    const result = await checkTddProcessSequence(context);
    expect(result.ok).toBe(false);
    expect(result.details.skippedPhases).toContain('green');
  });
});
```

### **Performance Tests**
```typescript
// Performance and scalability tests
describe('TddPerformance', () => {
  it('should detect phases within acceptable time limits', async () => {
    const startTime = Date.now();
    const context = createMockContext();
    
    await detectTddPhase(context);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // 1 second limit
  });
  
  it('should handle large codebases efficiently', async () => {
    const context = createMockContext({
      changedFiles: Array(1000).fill('src/file.ts')
    });
    
    const result = await checkTddRedPhase(context);
    expect(result.ok).toBe(true);
  });
});
```

---

## **Monitoring and Observability**

### **Metrics Collection**
```typescript
interface TddMetrics {
  phaseDetectionAccuracy: number;
  validationSuccessRate: number;
  averageExecutionTime: number;
  developerAdoption: number;
}

// Metrics implementation
export class TddMetricsCollector {
  private metrics: TddMetrics = {
    phaseDetectionAccuracy: 0,
    validationSuccessRate: 0,
    averageExecutionTime: 0,
    developerAdoption: 0
  };
  
  recordPhaseDetection(phase: TddPhase, accuracy: number): void {
    this.metrics.phaseDetectionAccuracy = accuracy;
  }
  
  recordValidation(success: boolean): void {
    // Update validation success rate
  }
  
  recordExecutionTime(duration: number): void {
    // Update average execution time
  }
}
```

### **Logging System**
```typescript
interface TddLogEntry {
  timestamp: string;
  phase: 'red' | 'green' | 'refactor' | 'unknown';
  action: 'detection' | 'validation' | 'error';
  details: Record<string, unknown>;
  duration?: number;
}

// Logging implementation
export function logTddEvent(entry: TddLogEntry): void {
  logger.info('TDD Event', {
    timestamp: entry.timestamp,
    phase: entry.phase,
    action: entry.action,
    details: entry.details,
    duration: entry.duration
  });
}
```

---

## **Security Considerations**

### **Input Validation**
```typescript
// Input validation functions
export function validateCommitMessage(message: string): boolean {
  const pattern = /^(feat|fix|chore|refactor):\s+.+\s+\[T-\d{4}-\d{2}-\d{2}-\d{3}\]\s+\[MODE:[FN]\]\s*(\[TDD:(red|green|refactor)\])?$/;
  return pattern.test(message);
}

export function validateFilePaths(paths: string[]): boolean {
  return paths.every(path => !path.includes('..') && path.startsWith('src/'));
}

export function validateTestEvidence(evidence: TestEvidence): boolean {
  return evidence.phase in ['red', 'green', 'refactor'] && 
         evidence.timestamp && 
         evidence.commitHash;
}
```

### **Access Control**
```typescript
// Access control implementation
export class TddAccessControl {
  canAccessPhaseDetection(user: string): boolean {
    // Implement access control logic
    return true;
  }
  
  canAccessEvidence(user: string, evidence: TestEvidence): boolean {
    // Implement evidence access control
    return true;
  }
  
  canModifyConfiguration(user: string): boolean {
    // Implement configuration modification control
    return true;
  }
}
```

---

## **Future Enhancements**

### **Advanced Features**
- **Machine Learning**: Use ML to improve phase detection accuracy
- **IDE Integration**: Real-time TDD phase feedback in IDEs
- **Analytics Dashboard**: TDD process analytics and insights
- **Custom Rules**: Allow teams to define custom TDD rules

### **Scalability Improvements**
- **Distributed Processing**: Process large codebases across multiple workers
- **Cloud Integration**: Integrate with cloud-based development tools
- **API Extensions**: Provide APIs for external TDD tool integration

---

## **Conclusion**

The TDD Enhancement Technical Specification provides a comprehensive, scalable, and maintainable solution for enforcing Test-Driven Development practices. The modular design allows for incremental implementation and future enhancements while maintaining compatibility with the existing Prove Quality Gates system.

The specification includes detailed implementation guidance, error handling strategies, performance considerations, and testing approaches to ensure the system is robust, reliable, and maintainable.
