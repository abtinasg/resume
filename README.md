# ResumeIQ

An AI-powered resume builder designed to help users create professional, tailored resumes with intelligent suggestions and formatting.

## Features

- **AI-Powered Content Suggestions**: Intelligent recommendations for resume content
- **Modern UI/UX**: Built with Tailwind CSS for a clean, responsive design
- **Real-time Preview**: See your resume changes as you make them
- **TypeScript Support**: Fully typed for better development experience
- **Fast Performance**: Powered by Next.js 14 with React 18

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/)
- **Linting**: ESLint with Next.js configuration

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 10.0.0 or higher (comes with Node.js)

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd resume
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

The page auto-updates as you edit files in the `app/` directory.

### Building for Production

Create an optimized production build:

```bash
npm run build
```

### Running Production Build

Start the production server:

```bash
npm run start
```

### Linting

Run ESLint to check for code quality issues:

```bash
npm run lint
```

## Project Structure

```
resume/
├── app/                # Next.js app directory
│   ├── layout.tsx     # Root layout component
│   └── page.tsx       # Home page component
├── public/            # Static assets
├── next.config.js     # Next.js configuration
├── tailwind.config.ts # Tailwind CSS configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Project dependencies
```

## Development Guidelines

- Write TypeScript for all new components and utilities
- Follow the ESLint rules configured in the project
- Use Tailwind CSS utility classes for styling
- Keep components modular and reusable

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the development server on port 3000 |
| `npm run build` | Creates an optimized production build |
| `npm run start` | Runs the production server |
| `npm run lint` | Runs ESLint to check code quality |

## Dependencies

### Core Dependencies
- **next**: ^14.2.18 - React framework for production
- **react**: ^18.3.1 - JavaScript library for building user interfaces
- **react-dom**: ^18.3.1 - React package for working with the DOM

### Development Dependencies
- **typescript**: ^5 - TypeScript language
- **tailwindcss**: ^3.4.15 - Utility-first CSS framework
- **eslint**: ^8 - Linting utility for JavaScript and TypeScript
- **@types/node**, **@types/react**, **@types/react-dom** - TypeScript type definitions

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all linting passes (`npm run lint`)
4. Test your changes thoroughly
5. Submit a pull request

## License

This project is private and proprietary.

## Support

For questions or issues, please contact the development team.
