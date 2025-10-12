# Testing Strategy

## 🎯 **Overview**

Comprehensive testing strategy for the dental practice MVP.

## 🧪 **Test Types**

### **Unit Tests**
- **Framework**: Vitest
- **Coverage**: 80% minimum for functional code
- **Location**: `src/__tests__/`

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage
```

### **Integration Tests**
- **Framework**: Playwright
- **Scope**: End-to-end user flows
- **Location**: `tests/playwright/`

```bash
# Run integration tests
npm run test:e2e

# Run in headed mode
npm run test:e2e:headed
```

## 📋 **Testing Standards**

### **Functional Tasks (TDD)**
1. **RED**: Write failing test
2. **GREEN**: Write minimal code
3. **REFACTOR**: Improve code

### **Test Requirements**
- All new features need tests
- Bug fixes need regression tests
- Critical paths need integration tests

## 🎯 **Test Coverage**

### **Current Coverage**
- **Unit Tests**: 80%+ for functional code
- **Integration Tests**: Critical user flows
- **E2E Tests**: Complete user journeys

### **Coverage Goals**
- **Unit**: 90% for business logic
- **Integration**: 100% for critical paths
- **E2E**: 100% for user flows

## 🚀 **Test Commands**

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# All tests
npm run test:all

# Coverage report
npm run test:coverage
```

## 📊 **Quality Gates**

All code must pass:
- ✅ Unit tests
- ✅ Integration tests
- ✅ Linting
- ✅ Type checking
- ✅ Build verification

## 🎯 **Best Practices**

1. **Write tests first** (TDD)
2. **Test behavior, not implementation**
3. **Keep tests simple and focused**
4. **Use descriptive test names**
5. **Mock external dependencies**
