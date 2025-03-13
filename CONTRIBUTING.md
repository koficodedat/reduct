# Contributing to Reduct

Thank you for your interest in contributing to Reduct! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to keep our community respectful and inclusive.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn (v1.22+)
- TypeScript (v5.0+)

### Setup

1. Fork the repository on GitHub
2. Clone your fork locally
   ```bash
   git clone https://github.com/YOUR-USERNAME/reduct.git
   cd reduct
   ```
3. Add the original repository as upstream
   ```bash
   git remote add upstream https://github.com/reduct/reduct.git
   ```
4. Install dependencies
   ```bash
   yarn install
   ```

### Development Workflow

1. Create a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests

   ```bash
   yarn test
   ```

4. Run linting

   ```bash
   yarn lint
   ```

5. Build the project

   ```bash
   yarn build
   ```

6. Commit your changes using conventional commits

   ```bash
   git commit -m "feat: add new functionality"
   ```

7. Push to your fork

   ```bash
   git push origin feature/your-feature-name
   ```

8. Create a Pull Request from your fork to the main repository

## Project Structure

Reduct is organized as a monorepo with multiple packages:

```
reduct/
├── packages/
│   ├── core/            # Core functional utilities
│   ├── data-structures/ # Immutable data structures
│   ├── algorithms/      # Algorithm implementations
│   └── examples/        # Usage examples
├── docs/                # Documentation
└── tools/               # Development tools
```

## Coding Guidelines

### TypeScript

- Use strict mode
- Provide comprehensive type definitions
- Minimize use of `any` and `unknown`
- Prefer type inference where appropriate

### Functional Programming

- Functions should be pure (no side effects)
- Data structures should be immutable
- Prefer composition over inheritance
- Favor declarative over imperative code

### Documentation

- Document all public APIs
- Include examples in JSDoc comments
- Explain complex algorithms with comments
- Update README.md when adding significant features

### Testing

- Write tests for all new functionality
- Ensure existing tests pass
- Aim for 100% code coverage
- Include edge cases in test scenarios

## Pull Request Process

1. Update documentation if needed
2. Add or update tests for your changes
3. Ensure your code passes linting and tests
4. Make sure your commit messages follow the [Conventional Commits](https://www.conventionalcommits.org/) format
5. If you're adding new functionality, consider adding examples

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

Example:

```
feat(data-structures): add balanced binary tree implementation
```

## Development Practices

### Performance Considerations

- Include Big O complexity analysis in comments
- Be mindful of memory usage
- Consider optimization opportunities
- Document performance characteristics

### Immutability

- Never modify input arguments
- Always return new instances
- Use techniques like structural sharing where appropriate
- Document immutability guarantees

## Release Process

1. Update version numbers according to [Semantic Versioning](https://semver.org/)
2. Update CHANGELOG.md with changes since last release
3. Create a tagged release
4. Publish to npm

## Questions?

If you have questions or need help, please:

1. Check existing issues
2. Open a new issue
3. Reach out to maintainers

Thank you for contributing to Reduct!
