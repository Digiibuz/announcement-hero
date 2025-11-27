
import type { Config } from "tailwindcss";

export default {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		fontFamily: {
			sans: ['Nunito', 'sans-serif'],
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				digibuz: {
					navy: '#0C1646',
					yellow: '#FEC403',
					light: '#FBF4EF',
					gray: '#8E9196',
					accent: '#4A5568',
					success: '#48BB78',
					warning: '#ED8936',
					error: '#E53E3E',
					info: '#4299E1'
				},
				'brand-orange': '#FEC403',
			},
			backgroundColor: {
				'brand-orange': '#FEC403',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': { 
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': { 
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': { 
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': { 
						opacity: '0',
						transform: 'translateY(10px)'
					}
				},
				'scale-in': {
					'0%': { 
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': { 
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'slide-in': {
					'0%': { 
						transform: 'translateX(-100%)'
					},
					'100%': { 
						transform: 'translateX(0)'
					}
				},
				'pulse-subtle': {
					'0%, 100%': { 
						opacity: '1'
					},
					'50%': { 
						opacity: '0.8'
					}
				},
				'float': {
					'0%, 100%': { 
						transform: 'translateY(0px) rotate(0deg)' 
					},
					'50%': { 
						transform: 'translateY(-20px) rotate(10deg)' 
					}
				},
				'float-delayed': {
					'0%, 100%': { 
						transform: 'translateY(0px) rotate(12deg)' 
					},
					'50%': { 
						transform: 'translateY(-15px) rotate(22deg)' 
					}
				},
				'float-slow': {
					'0%, 100%': { 
						transform: 'translateY(0px) rotate(30deg)' 
					},
					'50%': { 
						transform: 'translateY(-10px) rotate(40deg)' 
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.4s ease-out',
				'fade-out': 'fade-out 0.4s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'slide-in': 'slide-in 0.4s ease-out',
				'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
				'float': 'float 6s ease-in-out infinite',
				'float-delayed': 'float-delayed 8s ease-in-out infinite',
				'float-slow': 'float-slow 10s ease-in-out infinite'
			},
			backdropFilter: {
				'none': 'none',
				'blur': 'blur(20px)'
			},
			padding: {
				'safe': 'env(safe-area-inset-bottom)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
