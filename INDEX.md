# CaineonJS Project Index

Complete documentation index for CaineonJS Caido workflow integration and HTTP history processing.

---

## 📋 Start Here

### For Everyone
- **[QUICKSTART.md](QUICKSTART.md)** ← Start here! (5 minutes)
  - Quick setup guide
  - Step-by-step instructions
  - Common troubleshooting

### For Detailed Learning
- **[WORKFLOW_SETUP.md](WORKFLOW_SETUP.md)** (20 minutes)
  - Complete setup instructions
  - Configuration options
  - Credential types
  - Troubleshooting guide

### For Developers
- **[examples/caido-integration-guide.md](examples/caido-integration-guide.md)** (30 minutes)
  - In-depth integration guide
  - API reference
  - Advanced usage patterns
  - Multi-workflow setups

---

## 📚 Documentation Structure

### Project Overview
| Document | Purpose | Read Time |
|----------|---------|-----------|
| [README.md](README.md) | Project overview and architecture | 10 min |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | What's implemented and features | 15 min |
| [INDEX.md](INDEX.md) | This file - navigation | 5 min |

### Getting Started
| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup | Everyone | 5 min |
| [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md) | Complete setup guide | Everyone | 20 min |
| [workflows/README.md](workflows/README.md) | Workflow descriptions | Testers | 15 min |

### Examples & References
| Document | Purpose | Audience | Read Time |
|----------|---------|----------|-----------|
| [examples/workflow-examples.md](examples/workflow-examples.md) | Practical examples | Practitioners | 20 min |
| [examples/caido-integration-guide.md](examples/caido-integration-guide.md) | Complete guide | Developers | 30 min |
| [examples/http-history-quick-reference.md](examples/http-history-quick-reference.md) | Function reference | Developers | 15 min |
| [examples/basic-usage.md](examples/basic-usage.md) | Basic setup | Beginners | 10 min |
| [examples/advanced-config.md](examples/advanced-config.md) | Advanced configuration | Advanced | 20 min |
| [examples/setup-guide.md](examples/setup-guide.md) | Setup instructions | Beginners | 15 min |

---

## 🗂️ File Organization

```
CaineonJS/
│
├─ 📄 README.md                          Project overview
├─ 📄 QUICKSTART.md                      ← START HERE (5 min)
├─ 📄 WORKFLOW_SETUP.md                  Complete setup guide
├─ 📄 IMPLEMENTATION_SUMMARY.md          Features and architecture
├─ 📄 INDEX.md                           This file
│
├─ 📦 package.json                       Package configuration
│
├─ 📁 workflows/                         Ready-to-use Caido workflows
│   ├─ 📄 README.md                      Workflow descriptions
│   ├─ 📄 combined-workflow.js           Single request auto-detect
│   ├─ 📄 batch-history-workflow.js      NEW: Batch processing
│   ├─ 📄 m1-workflow.js                 M1 (read) specific
│   └─ 📄 m2-workflow.js                 M2 (write) specific
│
├─ 📁 src/                               Source code modules
│   ├─ 📁 core/
│   │   ├─ m1.js                         M1 test generator
│   │   ├─ m2.js                         M2 test generator
│   │   └─ executor.js                   Test execution engine
│   ├─ 📁 config/
│   │   └─ credentials.js                Credential management
│   └─ 📁 utils/
│       ├─ comparator.js                 Response comparison
│       └─ history-handler.js            NEW: HTTP history processing
│
└─ 📁 examples/                          Documentation & examples
    ├─ 📄 caido-integration-guide.md      Comprehensive integration guide
    ├─ 📄 http-history-quick-reference.md Function reference (quick lookup)
    ├─ 📄 workflow-examples.md            Practical examples & scenarios
    ├─ 📄 basic-usage.md                  Basic setup guide
    ├─ 📄 advanced-config.md              Advanced configuration
    └─ 📄 setup-guide.md                  Setup instructions
```

---

## 🎯 Quick Navigation

### "I want to..."

#### ...get started in 5 minutes
→ Read [QUICKSTART.md](QUICKSTART.md)

#### ...understand the complete setup
→ Read [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md)

#### ...see practical examples
→ Read [examples/workflow-examples.md](examples/workflow-examples.md)

#### ...find a specific function
→ Read [examples/http-history-quick-reference.md](examples/http-history-quick-reference.md)

#### ...learn about workflows
→ Read [workflows/README.md](workflows/README.md)

#### ...understand the implementation
→ Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

#### ...see advanced configurations
→ Read [examples/advanced-config.md](examples/advanced-config.md)

#### ...test a real API
→ Read [examples/workflow-examples.md#real-world-scenarios](examples/workflow-examples.md#real-world-scenarios)

#### ...troubleshoot an issue
→ Read [WORKFLOW_SETUP.md#troubleshooting](WORKFLOW_SETUP.md#troubleshooting)

---

## 📖 Learning Paths

### Path 1: Quick Start (15 minutes)
1. [QUICKSTART.md](QUICKSTART.md) (5 min)
2. Copy a workflow to Caido (5 min)
3. Configure credentials (5 min)
4. Run your first test! ✅

### Path 2: Complete Learning (1 hour)
1. [QUICKSTART.md](QUICKSTART.md) (5 min)
2. [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md) (20 min)
3. [examples/workflow-examples.md](examples/workflow-examples.md) (20 min)
4. [workflows/README.md](workflows/README.md) (15 min)
5. Start testing! ✅

### Path 3: Developer Deep Dive (2 hours)
1. [README.md](README.md) (10 min)
2. [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md) (20 min)
3. [examples/caido-integration-guide.md](examples/caido-integration-guide.md) (30 min)
4. [examples/http-history-quick-reference.md](examples/http-history-quick-reference.md) (20 min)
5. [examples/workflow-examples.md](examples/workflow-examples.md) (20 min)
6. Start building custom workflows! ✅

### Path 4: Advanced Integration (Custom)
1. Complete Path 3
2. [examples/advanced-config.md](examples/advanced-config.md) (20 min)
3. Review source code in `src/`
4. Build custom workflows
5. Integrate with your pipeline! ✅

---

## 🔍 By Use Case

### Single Endpoint Authorization Testing
1. Read: [workflows/README.md](workflows/README.md#1-combined-workflowjs--recommended-starting-point)
2. Workflow: `workflows/combined-workflow.js`
3. Result: ✅ or 🚨 verdict per endpoint

### Complete API Security Audit
1. Read: [QUICKSTART.md](QUICKSTART.md)
2. Read: [workflows/README.md](workflows/README.md#2-batch-history-workflowjs--new-batch-processing)
3. Workflow: `workflows/batch-history-workflow.js`
4. Result: Comprehensive vulnerability report

### IDOR Detection
1. Read: [examples/workflow-examples.md#example-1-idor-specific-filtering](examples/workflow-examples.md#example-1-idor-specific-filtering)
2. Workflow: Custom batch (filter IDOR patterns)
3. Result: List of IDOR vulnerabilities

### Regression Testing
1. Read: [examples/workflow-examples.md#scenario-2-api-security-regression-testing](examples/workflow-examples.md#scenario-2-api-security-regression-testing)
2. Workflow: Custom batch (known endpoints)
3. Result: Pass/fail on known issues

### Multi-Tenant Isolation
1. Read: [examples/workflow-examples.md#scenario-1-pentest-multi-tenant-saas](examples/workflow-examples.md#scenario-1-pentest-multi-tenant-saas)
2. Workflow: Custom batch (cross-tenant test)
3. Result: Tenant breach detection

---

## 🛠️ Component Reference

### Workflows
| File | Purpose | Best For |
|------|---------|----------|
| `combined-workflow.js` | Single request auto-detect | Quick checks |
| `batch-history-workflow.js` | Batch with prioritization | API audits |
| `m1-workflow.js` | Read operations only | Data access |
| `m2-workflow.js` | Write operations only | Mutations |

### Modules
| File | Purpose | Exports |
|------|---------|---------|
| `src/core/m1.js` | M1 test generation | M1(), isM1Candidate() |
| `src/core/m2.js` | M2 test generation | M2(), isM2Candidate() |
| `src/core/executor.js` | Test execution | executeTest(), executeBatch() |
| `src/config/credentials.js` | Credential handling | createBearerCredentials(), ... |
| `src/utils/comparator.js` | Response comparison | compareResponseBodies() |
| `src/utils/history-handler.js` | HTTP history processing | filterHistory(), sortHistory(), ... |

### Examples
| File | Content | Level |
|------|---------|-------|
| `basic-usage.md` | Basic setup | Beginner |
| `setup-guide.md` | Step-by-step | Beginner |
| `advanced-config.md` | Advanced options | Advanced |
| `caido-integration-guide.md` | Complete guide | Intermediate |
| `http-history-quick-reference.md` | Function reference | Intermediate |
| `workflow-examples.md` | Real-world examples | All levels |

---

## 📊 Features By Component

### HTTP History Handler (`src/utils/history-handler.js`)
- ✅ Filter requests (method, path, auth, status)
- ✅ Sort by severity, path, method, etc.
- ✅ Group by method, path, test type
- ✅ Deduplicate requests
- ✅ Intelligent recommendation scoring
- ✅ Batch analysis and reporting
- ✅ Metadata extraction

### Batch Workflow (`workflows/batch-history-workflow.js`)
- ✅ Process 20-50+ requests
- ✅ Intelligent filtering
- ✅ Severity-based sorting
- ✅ Auto M1/M2 detection
- ✅ Comprehensive reporting
- ✅ Safety controls
- ✅ Detailed console output

### Single Workflow (`workflows/combined-workflow.js`)
- ✅ Auto-detect M1 vs M2
- ✅ Real-time execution
- ✅ Detailed verdict
- ✅ Response comparison
- ✅ Critical alerts
- ✅ Verbose logging

---

## 🚀 Getting Started Checklist

- [ ] Read [QUICKSTART.md](QUICKSTART.md) (5 min)
- [ ] Get two auth tokens
- [ ] Open Caido
- [ ] Create new JavaScript workflow
- [ ] Copy workflow content
- [ ] Update credentials
- [ ] Send a test request
- [ ] Review results
- [ ] Try batch workflow
- [ ] Read [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md) for details

---

## 📞 Find Answers

| Question | Answer Location |
|----------|-----------------|
| How do I get started? | [QUICKSTART.md](QUICKSTART.md) |
| Where's the setup guide? | [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md) |
| What are the workflows? | [workflows/README.md](workflows/README.md) |
| How do I filter requests? | [examples/http-history-quick-reference.md](examples/http-history-quick-reference.md) |
| What's an example? | [examples/workflow-examples.md](examples/workflow-examples.md) |
| How does it work? | [examples/caido-integration-guide.md](examples/caido-integration-guide.md) |
| What was implemented? | [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) |
| I have an error | [WORKFLOW_SETUP.md#troubleshooting](WORKFLOW_SETUP.md#troubleshooting) |

---

## 📝 Document Purposes

### QUICKSTART.md
**Purpose:** Get running in 5 minutes
**Contains:** Step-by-step, troubleshooting, tips
**Best For:** First-time users

### WORKFLOW_SETUP.md
**Purpose:** Complete setup and configuration
**Contains:** All options, credential types, filters, examples
**Best For:** Full understanding before setup

### IMPLEMENTATION_SUMMARY.md
**Purpose:** What's been built
**Contains:** Features, architecture, use cases
**Best For:** Project overview

### workflows/README.md
**Purpose:** Workflow descriptions
**Contains:** What each workflow does, when to use
**Best For:** Choosing the right workflow

### examples/caido-integration-guide.md
**Purpose:** In-depth integration guide
**Contains:** Theory, advanced patterns, architecture
**Best For:** Deep understanding

### examples/http-history-quick-reference.md
**Purpose:** Function reference
**Contains:** All functions, parameters, examples
**Best For:** Looking up how to use functions

### examples/workflow-examples.md
**Purpose:** Practical real-world examples
**Contains:** Scenarios, code snippets, patterns
**Best For:** Learning by example

---

## ✨ Key Concepts

### M1 (Cross-Account Read)
Tests if User 2 can read User 1's data
- Method: GET, HEAD, OPTIONS
- Risk: Data disclosure

### M2 (Cross-Account Write)
Tests if User 2 can modify User 1's data
- Method: POST, PUT, PATCH, DELETE
- Risk: Data modification/deletion

### Severity Score (0-100)
Auto-calculated priority based on:
- Operation type (mutation = higher)
- HTTP method (DELETE = highest)
- Pattern detection (ID patterns = IDOR candidate)

### Batch Processing
Tests multiple requests intelligently:
1. Filter (remove non-relevant)
2. Sort (by severity)
3. Limit (default 20)
4. Execute (auto M1/M2)
5. Report (grouped results)

### Credential Types
Multiple auth schemes:
- Bearer (JWT, OAuth)
- Cookie (Session)
- API Key (Custom header)
- Basic (Base64)

---

## 🎓 Recommended Reading Order

1. **First time?** → [QUICKSTART.md](QUICKSTART.md)
2. **Want details?** → [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md)
3. **Learning by example?** → [examples/workflow-examples.md](examples/workflow-examples.md)
4. **Need reference?** → [examples/http-history-quick-reference.md](examples/http-history-quick-reference.md)
5. **Deep dive?** → [examples/caido-integration-guide.md](examples/caido-integration-guide.md)

---

## 📞 Support Resources

- **Quick answers:** [examples/http-history-quick-reference.md](examples/http-history-quick-reference.md)
- **How to use:** [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md)
- **Troubleshooting:** [WORKFLOW_SETUP.md#troubleshooting](WORKFLOW_SETUP.md#troubleshooting)
- **Examples:** [examples/workflow-examples.md](examples/workflow-examples.md)
- **Integration:** [examples/caido-integration-guide.md](examples/caido-integration-guide.md)

---

## ✅ What's Included

✅ Complete Caido workflow integration
✅ HTTP history processing module
✅ Batch testing workflow
✅ Single request workflow
✅ All credential types
✅ Comprehensive documentation
✅ Practical examples
✅ Quick reference guide
✅ Troubleshooting guide
✅ Real-world scenarios

---

## 🚀 Next Steps

1. Pick your reading: [QUICKSTART.md](QUICKSTART.md) or [WORKFLOW_SETUP.md](WORKFLOW_SETUP.md)
2. Choose your workflow: Single or Batch
3. Get your credentials
4. Import to Caido
5. Start testing!

---

**Status:** Production-ready
**Version:** 1.1.0
**Last Updated:** 2026-09-26

**Ready to test?** Start with [QUICKSTART.md](QUICKSTART.md) →
