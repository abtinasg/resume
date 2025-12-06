
---
**⚠️ LEGACY DOCUMENT (UPLOADED ARCHIVE)**

This document describes the pre-Agent v2 architecture (4-engine system) and is preserved for historical reference and implementation details.

**Current Architecture:** [Agent Architecture v2](../../agent/agent_architecture_v2.md)  
**Migration Guide:** [Migration Guide](../../agent/migration_guide.md)  
**Status:** Historical reference only  
**Archive Date:** December 7, 2025

---


# System Requirements

This document outlines all system requirements and dependencies needed to run ResumeIQ.

## System Requirements

### Operating System
- **macOS**: 10.15 (Catalina) or later
- **Windows**: 10 or later, or Windows Server 2016 or later
- **Linux**: Any modern distribution (Ubuntu 20.04+, Debian 10+, Fedora 32+, etc.)

### Hardware Requirements

#### Minimum
- **CPU**: Dual-core processor
- **RAM**: 4 GB
- **Disk Space**: 500 MB for project files
- **Network**: Internet connection for package downloads

#### Recommended
- **CPU**: Quad-core processor or better
- **RAM**: 8 GB or more
- **Disk Space**: 1 GB or more
- **Network**: Broadband internet connection

## Software Requirements

### Required Software

#### Node.js
- **Version**: 20.0.0 or higher
- **Download**: [https://nodejs.org/](https://nodejs.org/)
- **Verification**: Run `node --version` in terminal

#### npm
- **Version**: 10.0.0 or higher (included with Node.js)
- **Verification**: Run `npm --version` in terminal

### Optional Software

#### Git
- **Version**: 2.x or higher
- **Purpose**: Version control and cloning the repository
- **Download**: [https://git-scm.com/](https://git-scm.com/)

#### Code Editor
- **Recommended**: [Visual Studio Code](https://code.visualstudio.com/)
- **Alternatives**: WebStorm, Sublime Text, Atom

## Project Dependencies

All project dependencies are managed through npm and defined in `package.json`.

### Production Dependencies

```json
{
  "next": "^14.2.18",
  "react": "^18.3.1",
  "react-dom": "^18.3.1"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20",
  "@types/react": "^18",
  "@types/react-dom": "^18",
  "autoprefixer": "^10.4.20",
  "eslint": "^8",
  "eslint-config-next": "14.2.18",
  "postcss": "^8.4.49",
  "tailwindcss": "^3.4.15",
  "typescript": "^5"
}
```

## Installation Instructions

### 1. Install Node.js

#### macOS
```bash
# Using Homebrew
brew install node@20

# Or download from nodejs.org
```

#### Windows
```bash
# Download installer from nodejs.org
# Or using Chocolatey
choco install nodejs-lts
```

#### Linux
```bash
# Using NodeSource repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using nvm (recommended for all Linux distributions)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 2. Verify Installation

```bash
node --version  # Should output v20.x.x or higher
npm --version   # Should output 10.x.x or higher
```

### 3. Install Project Dependencies

```bash
cd resume
npm install
```

## Environment Configuration

Currently, no environment variables are required for basic operation.

## Browser Compatibility

The application supports the following browsers:

- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

## Port Requirements

- **Development**: Port 3000 (default)
- **Production**: Configurable (default: 3000)

Ensure these ports are available and not blocked by firewalls.

## Troubleshooting

### Node.js Version Issues
If you encounter version-related errors:
```bash
# Check your Node.js version
node --version

# Upgrade Node.js if needed
# Use nvm (recommended) or download from nodejs.org
```

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process using port 3000 (Linux/macOS)
lsof -ti:3000 | xargs kill -9

# Or specify a different port
PORT=3001 npm run dev
```

### Package Installation Errors
If you encounter npm installation errors:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Additional Notes

- This project uses TypeScript, so all type checking is done at build time
- Tailwind CSS requires PostCSS and Autoprefixer, which are included in dev dependencies
- ESLint is configured with Next.js recommended settings

## Updates

To update dependencies:
```bash
# Check for outdated packages
npm outdated

# Update all dependencies (use with caution)
npm update

# Update specific package
npm update <package-name>
```
