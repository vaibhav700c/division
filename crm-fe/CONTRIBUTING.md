# Contributing Guide

## Code of Conduct
Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Start development: `npm run dev`

## Development Workflow

### Before Starting
- Check existing issues and PRs
- Create an issue for your feature/bug
- Get feedback before starting work

### While Developing
- Follow the existing code style
- Write tests for new features
- Keep commits atomic and descriptive
- Update documentation as needed

### Before Submitting PR
1. Run tests: `npm run test`
2. Check TypeScript: `npm run type-check`
3. Format code: `npm run format`
4. Update CHANGELOG.md
5. Create descriptive PR title and description

## Code Style

### TypeScript
- Use strict mode
- Define types explicitly
- Avoid `any` type
- Use interfaces for object shapes

### React
- Use functional components
- Use hooks for state management
- Keep components focused and small
- Use meaningful component names

### Naming Conventions
- Components: PascalCase (e.g., `TaskCard`)
- Functions: camelCase (e.g., `getTaskStatus`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_TASKS`)
- Files: kebab-case (e.g., `task-card.tsx`)

## Testing

### Write Tests For
- Custom hooks
- Utility functions
- Complex components
- API interactions

### Test Structure
\`\`\`typescript
describe("ComponentName", () => {
  it("should do something", () => {
    // Arrange
    // Act
    // Assert
  })
})
\`\`\`

## Commit Messages

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/dependencies

Example:
\`\`\`
feat: add task filtering by priority
fix: resolve approval status update bug
docs: update API reference
\`\`\`

## Pull Request Process

1. Update your branch: `git pull origin main`
2. Push your changes: `git push origin feature/your-feature`
3. Create PR on GitHub
4. Fill out PR template
5. Wait for review
6. Address feedback
7. Merge when approved

## Reporting Issues

Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/logs if applicable
- Environment details

## Questions?

- Check existing documentation
- Search closed issues
- Ask in discussions
- Contact maintainers

Thank you for contributing!
