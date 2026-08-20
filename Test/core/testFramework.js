/**
 * Universal Test Framework for MoneyMate
 * Compatible with Node.js and Browser environments
 */

class Assertion {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)} (${typeof expected}) but received ${JSON.stringify(this.actual)} (${typeof this.actual})`);
    }
  }

  toEqual(expected) {
    const act = JSON.stringify(this.actual);
    const exp = JSON.stringify(expected);
    if (act !== exp) {
      throw new Error(`Expected deep equality:\nExpected: ${exp}\nReceived: ${act}`);
    }
  }

  toBeGreaterThan(expected) {
    if (!(this.actual > expected)) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected) {
    if (!(this.actual >= expected)) {
      throw new Error(`Expected ${this.actual} to be greater than or equal to ${expected}`);
    }
  }

  toBeLessThan(expected) {
    if (!(this.actual < expected)) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected) {
    if (!(this.actual <= expected)) {
      throw new Error(`Expected ${this.actual} to be less than or equal to ${expected}`);
    }
  }

  toBeCloseTo(expected, precision = 2) {
    const diff = Math.abs(this.actual - expected);
    const tolerance = Math.pow(10, -precision) / 2;
    if (diff > tolerance) {
      throw new Error(`Expected ${this.actual} to be close to ${expected} (within ${tolerance})`);
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected value to be truthy, received ${JSON.stringify(this.actual)}`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected value to be falsy, received ${JSON.stringify(this.actual)}`);
    }
  }

  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected null, received ${JSON.stringify(this.actual)}`);
    }
  }

  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected value to be defined, received undefined`);
    }
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected undefined, received ${JSON.stringify(this.actual)}`);
    }
  }

  toContain(item) {
    if (Array.isArray(this.actual)) {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}, but array has elements: ${JSON.stringify(this.actual)}`);
      }
    } else if (typeof this.actual === 'string') {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected string to contain "${item}", received "${this.actual}"`);
      }
    } else {
      throw new Error(`toContain called on non-array/non-string value: ${typeof this.actual}`);
    }
  }

  toHaveLength(length) {
    const len = this.actual ? this.actual.length : 0;
    if (len !== length) {
      throw new Error(`Expected length ${length}, but actual length was ${len}`);
    }
  }

  toThrow(expectedError) {
    if (typeof this.actual !== 'function') {
      throw new Error('toThrow requires a function');
    }
    let threw = false;
    let thrownError = null;
    try {
      this.actual();
    } catch (e) {
      threw = true;
      thrownError = e;
    }
    if (!threw) {
      throw new Error('Expected function to throw an error, but it did not throw.');
    }
    if (expectedError) {
      const errMsg = thrownError?.message || String(thrownError);
      if (typeof expectedError === 'string' && !errMsg.includes(expectedError)) {
        throw new Error(`Expected error message to include "${expectedError}", but got: "${errMsg}"`);
      } else if (expectedError instanceof RegExp && !expectedError.test(errMsg)) {
        throw new Error(`Expected error message to match ${expectedError}, but got: "${errMsg}"`);
      }
    }
  }
}

export function expect(actual) {
  return new Assertion(actual);
}

class TestSuite {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.cases = [];
  }

  addCase(id, name, fn, metadata = {}) {
    this.cases.push({
      id,
      name,
      fn,
      description: metadata.description || name,
      steps: metadata.steps || [],
      expectedResult: metadata.expectedResult || 'Execution succeeds without error',
      category: metadata.category || this.name,
      status: 'pending', // 'pending' | 'running' | 'passed' | 'failed' | 'skipped'
      duration: 0,
      error: null,
      logs: []
    });
  }
}

class TestFramework {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.listeners = [];
  }

  describe(name, fn, description = '') {
    const suite = new TestSuite(name, description);
    this.suites.push(suite);
    const previousSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = previousSuite;
    }
    return suite;
  }

  test(id, name, fn, metadata = {}) {
    if (!this.currentSuite) {
      this.describe('General', () => {
        this.currentSuite.addCase(id, name, fn, metadata);
      });
    } else {
      this.currentSuite.addCase(id, name, fn, metadata);
    }
  }

  it(id, name, fn, metadata = {}) {
    this.test(id, name, fn, metadata);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event, data) {
    this.listeners.forEach(fn => {
      try {
        fn(event, data);
      } catch (err) {
        console.error('TestFramework listener error:', err);
      }
    });
  }

  getAllCases() {
    const all = [];
    this.suites.forEach(suite => {
      suite.cases.forEach(c => {
        all.push({ ...c, suiteName: suite.name });
      });
    });
    return all;
  }

  getCaseById(id) {
    for (const suite of this.suites) {
      for (const c of suite.cases) {
        if (c.id === id) {
          return { testCase: c, suite };
        }
      }
    }
    return null;
  }

  async runCase(testCase) {
    testCase.status = 'running';
    testCase.error = null;
    testCase.logs = [];
    this.emit('caseStart', testCase);

    const startTime = performance.now();
    try {
      await testCase.fn();
      testCase.status = 'passed';
      testCase.duration = +(performance.now() - startTime).toFixed(2);
      this.emit('casePass', testCase);
    } catch (err) {
      testCase.status = 'failed';
      testCase.duration = +(performance.now() - startTime).toFixed(2);
      testCase.error = {
        message: err.message || String(err),
        stack: err.stack || ''
      };
      this.emit('caseFail', testCase);
    } finally {
      this.emit('caseEnd', testCase);
    }
    return testCase;
  }

  async runSuite(suiteName) {
    const suite = this.suites.find(s => s.name.toLowerCase() === suiteName.toLowerCase());
    if (!suite) throw new Error(`Suite "${suiteName}" not found`);

    this.emit('suiteStart', suite);
    for (const testCase of suite.cases) {
      await this.runCase(testCase);
    }
    this.emit('suiteEnd', suite);
    return suite;
  }

  async runCases(caseIds) {
    const results = [];
    for (const id of caseIds) {
      const match = this.getCaseById(id);
      if (match) {
        results.push(await this.runCase(match.testCase));
      }
    }
    return results;
  }

  async runAll() {
    this.emit('runAllStart', this.suites);
    const summary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      suites: []
    };

    for (const suite of this.suites) {
      this.emit('suiteStart', suite);
      for (const testCase of suite.cases) {
        summary.total++;
        await this.runCase(testCase);
        if (testCase.status === 'passed') summary.passed++;
        else if (testCase.status === 'failed') summary.failed++;
        else summary.skipped++;
      }
      this.emit('suiteEnd', suite);
    }

    summary.endTime = Date.now();
    summary.duration = summary.endTime - summary.startTime;
    this.emit('runAllEnd', summary);
    return summary;
  }

  resetAllStatus() {
    this.suites.forEach(s => {
      s.cases.forEach(c => {
        c.status = 'pending';
        c.error = null;
        c.duration = 0;
        c.logs = [];
      });
    });
    this.emit('reset', this.suites);
  }
}

export const framework = new TestFramework();
export const describe = framework.describe.bind(framework);
export const test = framework.test.bind(framework);
export const it = framework.it.bind(framework);
