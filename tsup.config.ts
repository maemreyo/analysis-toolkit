// tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react/index.ts',
    templates: 'src/templates/index.ts'
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [
    'react',
    'react-dom',
    '@matthew.ngo/ai-toolkit'
  ],
  noExternal: [
    'natural',
    'sentiment',
    'compromise',
    'franc',
    'handlebars',
    'marked',
    'turndown',
    'js-yaml',
    'sanitize-html',
    'highlight.js',
    'zod',
    'lru-cache',
    'uuid',
    'lodash'
  ],
  esbuildOptions(options) {
    options.platform = 'node'
    options.target = 'node16'
  },
  onSuccess: 'echo "✅ Build completed successfully!"'
})