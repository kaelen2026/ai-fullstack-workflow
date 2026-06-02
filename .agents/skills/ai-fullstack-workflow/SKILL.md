```markdown
# ai-fullstack-workflow Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill covers the core development patterns and conventions used in the `ai-fullstack-workflow` TypeScript codebase. It documents file naming, import/export styles, commit message conventions, and testing patterns. While no explicit workflows were detected, this guide provides best practices and suggested commands for efficient development.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `userProfile.ts`, `dataFetcher.ts`

### Import Style
- Use **relative imports** for referencing modules within the project.
  - Example:
    ```typescript
    import { fetchData } from './apiClient';
    ```

### Export Style
- Use **named exports** for functions, types, and constants.
  - Example:
    ```typescript
    // In userService.ts
    export function getUser(id: string) { ... }
    export const USER_ROLE = 'admin';

    // In another file
    import { getUser, USER_ROLE } from './userService';
    ```

### Commit Messages
- Follow **Conventional Commits**.
- Use prefixes such as `feat` for features and `docs` for documentation.
- Keep commit messages concise (average 51 characters).
  - Example:
    ```
    feat: add user authentication module
    docs: update README with setup instructions
    ```

## Workflows

_No explicit workflows detected in the repository. Below are suggested workflows for common tasks._

### Add a New Feature
**Trigger:** When implementing a new functionality  
**Command:** `/add-feature`

1. Create a new TypeScript file using camelCase naming.
2. Implement the feature using named exports.
3. Add or update tests in a corresponding `*.test.*` file.
4. Commit changes with a `feat:` prefix.
5. Push to the repository.

### Update Documentation
**Trigger:** When documentation needs to be added or updated  
**Command:** `/update-docs`

1. Edit or create documentation files as needed.
2. Commit changes with a `docs:` prefix.
3. Push to the repository.

### Run Tests
**Trigger:** Before pushing or merging code  
**Command:** `/run-tests`

1. Identify all files matching the `*.test.*` pattern.
2. Run the project's test command (framework unknown; check project scripts).
3. Review and fix any failing tests.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `userService.test.ts`).
- Testing framework is **unknown**; check project scripts or dependencies.
- Place tests alongside implementation files or in a dedicated test directory.
- Example test file structure:
  ```typescript
  // userService.test.ts
  import { getUser } from './userService';

  describe('getUser', () => {
    it('returns user data for a valid ID', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-feature   | Scaffold and commit a new feature            |
| /update-docs   | Update project documentation                 |
| /run-tests     | Run all test files before pushing or merging |
```
