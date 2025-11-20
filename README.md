# Teable Find and Replace Plugin

A [Teable](https://teable.ai) plugin for efficient search and replace operations on table records with multiple search modes and batch processing capabilities.

## ✨ Features

- 🔍 **Multiple Search Modes** - Simple text, regex, and dictionary-based search
- 🎯 **Field Selection** - Flexible field selection for targeted search operations
- 📊 **View Filtering** - Limit search scope to specific table views
- 🔄 **Batch Processing** - Replace all matches or individual replacements
- 🎨 **Theme Support** - Full light/dark mode compatibility with automatic theme detection
- 🌍 **Internationalization** - Complete i18n support (English/Chinese)
- 📱 **Responsive Design** - Optimized for all screen sizes
- ⚡ **Performance Optimized** - Built with React Query for efficient data fetching
- 🛡️ **Error Handling** - Comprehensive error reporting and user feedback
- 🔌 **Teable Integration** - Seamless integration with Teable tables and fields
- 🔍 **Regex Tester** - Built-in regex pattern testing tool
- 📝 **Dictionary Editor** - Visual dictionary editor for batch replacements

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14.2.14** - React full-stack framework with App Router
- **React 18.2.0** - UI library with modern React features
- **TypeScript 5** - Type-safe JavaScript superset (strict mode enabled)

### Teable Ecosystem
- `@teable/sdk` - Plugin bridge and UI configuration
- `@teable/openapi` - API client and type definitions
- `@teable/core` - Core type definitions and utilities
- `@teable/ui-lib` - Teable official UI component library (shadcn/ui based)
- `@teable/next-themes` - Theme switching support
- `@teable/icons` - Teable icon library

### UI & Styling
- **Tailwind CSS 3.4.1** - Atomic CSS framework with Teable UI configuration
- **Lucide React** - Icon library for modern interfaces
- **Sonner** - Toast notification library

### State Management & Data
- `@tanstack/react-query 4.36.1` - Server state management, caching, and synchronization
- `react-i18next 14.1.0` - Internationalization framework
- `i18next 23.10.1` - Core internationalization library

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Teable account with plugin access

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Visit [http://localhost:3001](http://localhost:3001) to view the plugin.

### 3. Build for Production
```bash
npm run build
```

### 4. Start Production Server
```bash
npm start
```

### 5. Code Quality Checks
```bash
npm run lint          # Run ESLint
npm run analyze       # Analyze bundle size
```

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Main app entry with i18n and theme setup
│   ├── Main.tsx                 # Theme and QueryClient integration
│   ├── layout.tsx               # Root layout component
│   └── globals.css              # Global styles and CSS variables
├── components/
│   ├── FindAndReplacePages.tsx  # Main find and replace interface component
│   ├── ErrorBoundary.tsx        # Error boundary component
│   ├── context/                 # React Context providers
│   │   ├── EnvProvider.tsx      # Environment variable injection
│   │   ├── I18nProvider.tsx     # Internationalization provider
│   │   ├── getQueryClient.ts    # React Query client setup
│   │   └── types.ts             # TypeScript type definitions
│   ├── find-replace/            # Find and replace specific components
│   │   ├── FieldSelector.tsx    # Field selection component
│   │   ├── ViewSelector.tsx     # View selection component
│   │   ├── ModeSelector.tsx     # Search mode selection
│   │   ├── SimpleModeInput.tsx  # Simple text search input
│   │   ├── RegexModeInput.tsx   # Regex pattern input
│   │   ├── RegexTester.tsx      # Regex pattern testing tool
│   │   ├── DictionaryModeInput.tsx # Dictionary mode input
│   │   ├── DictionaryEditor.tsx # Dictionary editor component
│   │   ├── SearchResults.tsx     # Search results display
│   │   └── PreviewTable.tsx     # Preview table component
│   └── ui/                      # UI utility components
│       └── Icons.tsx            # Icon components
├── hooks/                       # Custom React hooks
│   ├── useInitApi.ts           # API initialization
│   ├── useFields.ts            # Field data fetching
│   ├── useViews.ts             # View data fetching
│   ├── useFieldMap.ts          # Field mapping utilities
│   ├── useFindReplaceState.ts  # Find and replace state management
│   ├── useGlobalUrlParams.ts   # URL parameter management
│   ├── useToast.ts             # Toast notifications
│   └── useAsyncError.ts        # Async error handling
├── lib/                         # Business logic and utilities
│   └── api.ts                  # API client utilities
├── utils/                       # Utility functions
│   └── findReplace/            # Find and replace utilities
│       ├── searchAlgorithms.ts # Search algorithm implementations
│       └── ReplaceHandler.ts    # Replace operation handlers
├── types/                       # Global type definitions
│   └── index.ts                # Type exports
├── locales/                     # Internationalization files
│   ├── en.json                 # English translations
│   └── zh.json                 # Chinese translations
└── styles/                      # Additional styles
    └── custom-enhancements.css # Custom CSS enhancements
```

## 🔧 Configuration

### Plugin Parameters
The plugin reads configuration from URL parameters via `EnvProvider.tsx`:

- `baseId` - Teable base identifier
- `pluginId` - Plugin identifier
- `pluginInstallId` - Plugin installation ID
- `tableId` - Target table for find and replace operations
- `viewId` - Optional view ID to limit search scope
- `shareId`, `positionId`, `positionType` - UI positioning
- `lang`, `theme` - Localization and theme settings

### API Configuration

The plugin supports two deployment modes with automatic authentication handling:

#### 1. Same-Origin Mode (Default)
- **Use case**: Plugin and Teable are on the same domain
- **Configuration**: No additional setup required
- **Authentication**: Browser automatically sends cookies
- **API URL**: Uses current domain (`${window.location.origin}/api`)

#### 2. Cross-Origin Mode
- **Use case**: Plugin and Teable are on different domains
- **Configuration**: Set environment variable `NEXT_PUBLIC_TEABLE_HOST`
- **Authentication**: Uses bridge.getSelfTempToken() for Bearer token
- **API URL**: Uses configured host (`${NEXT_PUBLIC_TEABLE_HOST}/api`)

##### Environment Variable Setup

Create a `.env.local` file in the project root:

```bash
# Cross-Origin Configuration
NEXT_PUBLIC_TEABLE_HOST=https://teable.yourdomain.com
```

**Examples:**
```bash
# Development: Plugin on localhost:3001, Teable on localhost:3000
NEXT_PUBLIC_TEABLE_HOST=http://localhost:3000

# Production: Plugin on different subdomain
NEXT_PUBLIC_TEABLE_HOST=https://teable.yourdomain.com
```

For detailed configuration examples, see [.env.example](.env.example).

### Search Modes

The plugin supports three search modes:

#### Simple Mode
- Basic text search and replace
- Case-sensitive and whole word options
- Direct text matching

#### Regex Mode
- Regular expression pattern matching
- Support for capture groups ($1, $2, etc.)
- Built-in regex tester for pattern validation
- Common regex patterns included

#### Dictionary Mode
- Batch search and replace operations
- JSON-based dictionary format
- Visual dictionary editor
- Support for escape characters

## 🎨 Styling & Theming

### CSS Architecture
- **CSS Variables** - Comprehensive theme system with HSL color values
- **Responsive Design** - Mobile-first approach with breakpoints
- **Component Isolation** - Scoped styles for custom components
- **Dark Mode Support** - Automatic theme detection and switching

### UI Components
- **Shadcn/ui Components** - Modern, accessible UI components
- **Teable UI Integration** - Consistent with Teable design system
- **Form Controls** - Custom form elements for search configuration

## 🌍 Internationalization

Supported languages:
- English (en)
- Chinese (zh)

### Adding New Languages
1. Create translation file in `src/locales/[lang].json`
2. Update `I18nProvider.tsx` resources configuration
3. Add language-specific content to components

## 🔌 Teable Integration

### Plugin Bridge Usage
```typescript
import { usePluginBridge } from '@teable/sdk';

const bridge = usePluginBridge();

// Listen for configuration changes
bridge.on('syncUIConfig', handleConfigChange);

// Get temporary token for API calls
const token = await bridge.getSelfTempToken();
```

### API Integration
The plugin uses Teable's OpenAPI with automatic authentication:
```typescript
import { openApi } from '@teable/openapi';

// All API calls are automatically authenticated
const fields = await openApi.getFields(tableId);
const records = await openApi.getTableRecords(tableId, viewId);
```

## 🔍 Search Algorithms

The plugin implements three search algorithms:

### Simple Search
```typescript
// Direct text matching with optional case sensitivity
// Supports whole word matching
```

### Regex Search
```typescript
// Full regex pattern matching with capture groups
// Example: (\d{3})-(\d{4}) → $1-$2
```

### Dictionary Search
```typescript
// Batch replacements using key-value pairs
// Format: { "find": "replace", "hello": "world" }
```

## 🚀 Deployment

### Build Process
```bash
# Build for production
npm run build

# Build with optimization
npm run build:optimized
```

### Plugin Installation
1. Build the plugin: `npm run build`
2. Deploy to your hosting service
3. Configure in Teable with proper URL parameters
4. Test plugin functionality in Teable environment

## 🧪 Development

### Code Quality
- **TypeScript Strict Mode** - Full type safety enabled
- **ESLint** - Code quality and style enforcement
- **Prettier** - Consistent code formatting

### Performance Features
- **React Query** - Efficient data fetching and caching
- **React.memo** - Component optimization
- **useMemo/useCallback** - Hook optimization
- **Code Splitting** - Optimized bundle loading

## 📝 Usage Examples

### Simple Text Search
1. Select a field to search
2. Choose "Simple" mode
3. Enter search text
4. Enter replacement text
5. Click "Find" to search
6. Review results and replace

### Regex Search
1. Select a field to search
2. Choose "Regex" mode
3. Enter regex pattern
4. Use regex tester to validate pattern
5. Enter replacement text (use $1, $2 for groups)
6. Click "Find" to search
7. Review results and replace

### Dictionary Search
1. Select a field to search
2. Choose "Dictionary" mode
3. Add key-value pairs in dictionary editor
4. Click "Find" to search
5. Review results and replace

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Write comprehensive TypeScript types
- Add English JSDoc comments for all public functions
- Follow the existing code style and patterns
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
