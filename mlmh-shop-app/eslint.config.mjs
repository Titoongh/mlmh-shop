import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

// eslint-config-next 16 ships a native flat config (array), so we spread it
// directly. Using FlatCompat here breaks with a circular-structure error.
const eslintConfig = [
    ...nextCoreWebVitals,
    {
        ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
    },
    {
        rules: {
            'no-html-link-for-pages': 'off',
            // New, stricter react-hooks rule (eslint-plugin-react-hooks 6 /
            // React Compiler era). Flags pre-existing setState-in-effect
            // patterns that need behaviour-preserving refactors — surfaced as
            // warnings for now, to be addressed in the UI/cleanup phase.
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
]

export default eslintConfig
