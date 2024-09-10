import type { Config } from 'tailwindcss'

const shadowX = '4px'
const shadowY = '4px'

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic':
                    'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            boxShadow: {
                base: `${shadowX} ${shadowY} 0px 0px`,
            },
            colors: {
                'white-oldlace': '#FEF2E8',
                orange: '#EF9D00',
                'orange-khaki': '#FFE18D',
                'blue-sky': '#8AE',
                'yellow-khaki': '#FFDC59',
                'red-salmon': '#FF6B6B',
                'green-darkcyan': '#0EB47C',
                'brown-sandy': '#F2B45C',
                'purple-medium': '#A388EE',
                'purple-light': '#E4DFF4',
                'purple-dark': '#4C00FF',
            },
            borderRadius: {
                base: '6px',
            },
            translate: {
                boxShadowX: shadowX,
                boxShadowY: shadowY,
                reverseBoxShadowX: `-${shadowX}`,
                reverseBoxShadowY: `-${shadowY}`,
            },
        },
    },
    plugins: [],
}
export default config
