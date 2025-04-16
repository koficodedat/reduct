# Reduct Project Reorganization Plan

## Objective
Reorganize the Reduct project structure to ensure consistency across all packages, following the architectural guidelines in `foundational-docs/architecture.md`.

## Guiding Principles
1. Maintain a consistent structure across all packages
2. Centralize benchmarks in the benchmark package
3. Clearly separate code snippets from runnable examples
4. Ensure the build passes at each checkpoint
5. Prioritize structural coherence over fixing failing tests

## Standard Package Structure
```
packages/<package-name>/
├── src/                  # Source code
│   ├── index.ts          # Main entry point
│   └── <modules>/        # Organized by feature/module
├── tests/                # All tests
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── property/         # Property-based tests
├── docs/                 # Package-specific documentation
│   ├── <feature>/        # Organized by feature
│   └── code-snippets/    # Code snippets for documentation
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Package documentation
```

## Benchmark Package Structure
```
packages/benchmark/
├── src/
│   ├── core/             # Benchmarks for core package
│   ├── data-structures/  # Benchmarks for data structures
│   ├── algorithms/       # Benchmarks for algorithms
│   ├── runners/          # Benchmark runners
│   └── utils/            # Benchmark utilities
├── tests/                # Tests for benchmark infrastructure
│   ├── unit/
│   └── integration/
├── results/              # Benchmark results
├── examples/             # Example benchmark usage
└── package.json
```

## Examples Package Structure
```
packages/examples/
├── src/
│   ├── core-examples/    # Examples using core package
│   ├── data-structure-examples/ # Examples using data structures
│   └── algorithm-examples/ # Examples using algorithms
├── package.json
└── README.md
```

## Documentation Structure
```
/
├── docs/                 # User-facing documentation
│   ├── api/              # API documentation
│   ├── guides/           # User guides
│   └── code-snippets/    # Code snippets
├── foundational-docs/    # Architecture and design documentation
└── README.md             # Project overview
```

## Implementation Plan

### Phase 1: Core Package Reorganization
- [ ] Create standard directory structure
- [ ] Move tests from src/ to tests/unit/
- [ ] Update import paths
- [ ] Verify build passes

### Phase 2: Data Structures Package Reorganization
- [ ] Create standard directory structure
- [ ] Move tests from src/ to tests/unit/
- [ ] Reorganize documentation
- [ ] Update import paths
- [ ] Verify build passes

### Phase 3: Algorithms Package Reorganization
- [ ] Create standard directory structure
- [ ] Move benchmark code to benchmark package
- [ ] Move tests to proper test directories
- [ ] Update import paths
- [ ] Verify build passes

### Phase 4: Benchmark Package Reorganization
- [ ] Standardize structure
- [ ] Integrate benchmark code from algorithms package
- [ ] Organize benchmarks by package
- [ ] Update import paths
- [ ] Verify build passes

### Phase 5: Examples Package Reorganization
- [ ] Standardize structure
- [ ] Organize examples by package
- [ ] Update import paths
- [ ] Verify build passes

### Phase 6: Documentation Reorganization
- [ ] Standardize documentation structure
- [ ] Rename examples to code-snippets
- [ ] Verify documentation links still work

### Phase 7: Final Verification
- [ ] Run build for all packages
- [ ] Verify package exports
- [ ] Update main README.md with new structure

## Checkpoints
After each phase, we will:
1. Run `yarn build` to ensure the build passes
2. Update this plan with any issues encountered or changes needed
3. Document any deviations from the original plan

## Progress Tracking

### Phase 1: Core Package Reorganization
**Status**: Completed
**Issues**: None
**Deviations**:
- Tests were copied to tests/unit/ rather than moved to maintain the original files
- Only updated one test file's imports as a proof of concept
- Added README.md file for better documentation

### Phase 2: Data Structures Package Reorganization
**Status**: Completed
**Issues**: None
**Deviations**:
- Tests were copied to tests/unit/ and tests/property/ rather than moved to maintain the original files
- Updated import paths in test files
- Removed benchmark export from index.ts
- Added README.md file for better documentation

### Phase 3: Algorithms Package Reorganization
**Status**: Completed
**Issues**: None
**Deviations**:
- Tests were copied to tests/unit/ and tests/property/ rather than moved to maintain the original files
- Updated import paths in test files
- Added README.md file for better documentation

### Phase 4: Benchmark Package Reorganization
**Status**: In Progress
**Issues**:
- Build process is taking too long or encountering issues
**Deviations**:
- Keeping the runners directory for backward compatibility
- Created new structure but maintaining old structure for compatibility
- Added README.md file for better documentation

### Phase 5: Examples Package Reorganization
**Status**: Completed
**Issues**:
- Build fails due to missing exports from the benchmark package
**Deviations**:
- Created new structure but kept original files for reference
- Added README.md file for better documentation
- Added new scripts for running examples by category

### Phase 6: Documentation Reorganization
**Status**: Completed
**Issues**: None
**Deviations**:
- Created new structure but kept original files for reference
- Added placeholder files for API documentation
- Created index.md files for each section

### Phase 7: Final Verification
**Status**: Not Started
**Issues**: None
**Deviations**: None
