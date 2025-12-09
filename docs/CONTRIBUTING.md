# Contributing to MobileLifestyle

## Code of Conduct

- Be respectful and inclusive
- Help others learn
- Report issues constructively

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/MobileLifestyle.git`
3. Create a feature branch: `git checkout -b feature/my-feature`
4. Make changes
5. Commit with clear messages: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feature/my-feature`
7. Create a Pull Request

## Development Setup

See `docs/SETUP.md` for detailed instructions.

## Code Style

### TypeScript
- Use strict type checking
- Define interfaces for data shapes
- Avoid `any` type

### Naming Conventions
```typescript
// Components: PascalCase
function HomeScreen() { }

// Functions/variables: camelCase
const handleSendMessage = () => { }

// Constants: UPPER_SNAKE_CASE
const API_ENDPOINTS = { }

// Interfaces: PascalCase
interface Message { }
```

### Component Structure
```typescript
// 1. Imports
import { View } from "react-native";
import { useAuth } from "@/src/contexts/auth-context";

// 2. Types
interface Props {
  title: string;
}

// 3. Component
export default function MyComponent({ title }: Props) {
  // Hooks
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(false);
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handlePress = () => {
    // ...
  };
  
  // Render
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}

// 4. Styles
const styles = StyleSheet.create({
  // ...
});
```

## File Structure

When adding new features:

```
feature/
├── screens/          (if UI)
│   └── MyScreen.tsx
├── hooks/            (if custom hook)
│   └── useMyFeature.ts
├── services/         (if API calls)
│   └── myApi.ts
├── types/            (if new types)
│   └── my-types.ts
└── utils/            (if utilities)
    └── my-utils.ts
```

## Testing

Write tests for:
- Utility functions
- Custom hooks
- Complex logic

```typescript
// Example test
describe("formatDateVN", () => {
  it("should format date correctly", () => {
    const date = new Date("2025-12-09");
    expect(formatDateVN(date)).toBe("09/12/2025");
  });
});
```

## Commit Messages

Use conventional commits:
```
feat: add voice recording feature
fix: resolve chat streaming bug
docs: update API documentation
refactor: reorganize folder structure
test: add unit tests for formatting
chore: update dependencies
```

## Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Branch is up-to-date with main

## Branch Naming

```
feature/feature-name       # New feature
fix/bug-description       # Bug fix
docs/update-docs          # Documentation
refactor/reorganize       # Code refactoring
test/add-tests            # Tests
chore/update-deps         # Maintenance
```

## Documentation

Update relevant docs:
- `docs/ARCHITECTURE.md` - if changing structure
- `docs/API.md` - if adding/changing API calls
- `README.md` - if user-facing changes
- Component comments - for complex logic

## Performance Guidelines

- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Optimize FlatList with keyExtractor and getItemLayout
- Lazy load routes with Expo Router
- Compress images before shipping

## Security

- Never commit `.env.local` with real keys
- Use environment variables for secrets
- Validate user input
- Sanitize data before display
- Use HTTPS for API calls

## Questions?

- Check existing issues
- Read `docs/` folder
- Ask in discussions

## Recognition

Contributors will be listed in:
- `CONTRIBUTORS.md`
- GitHub contributors page

Thank you for contributing! 🎉
