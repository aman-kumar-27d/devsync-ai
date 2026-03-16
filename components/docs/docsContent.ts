export const repoUrl = 'https://github.com/aman-kumar-27d/devsync-ai.git';

export const platformFeatures = [
    {
        title: 'Real-time collaboration',
        description: 'Workspace channels and direct messages keep conversations, replies, and team context in one place.',
    },
    {
        title: 'AI coding assistant',
        description: 'Use chat, code generation, bug-fix, explain, docs, and refactor modes inside the same workspace.',
    },
    {
        title: 'Code snippets and files',
        description: 'Share code, attach files, and ask AI to explain snippets without leaving the conversation flow.',
    },
    {
        title: 'Search and notifications',
        description: 'Jump across messages, files, snippets, and mentions with fast search and in-app activity alerts.',
    },
] as const;

export const userGuideSections = [
    {
        title: 'Get started quickly',
        description: 'Account access is lightweight and cookie-based, so most users can go from registration to collaboration in under a minute.',
        bullets: [
            'Register with email, username, and password to create your account and default workspace.',
            'Log in with the same credentials to restore your session through secure auth cookies.',
            'Use the logout action from the app shell whenever you need to end the current session.',
        ],
    },
    {
        title: 'Workspaces, channels, and DMs',
        description: 'The product is organized around workspaces so each team keeps members, channels, and permissions grouped together.',
        bullets: [
            'Join a workspace with an invite token or enter the one already provisioned for your account.',
            'Move through channels for shared conversations, and open DMs from the members list for private threads.',
            'Reply in threads, react to messages, and keep channel discussions focused without losing context.',
        ],
    },
    {
        title: 'AI and code workflows',
        description: 'The AI panel is built for engineering tasks rather than generic chat, so prompts can stay close to the code you are discussing.',
        bullets: [
            'Open the AI panel to switch between chat, codegen, bugfix, explain, docs, and refactor modes.',
            'Ask AI to explain a snippet, debug a failing block, or generate implementation ideas from a requirement.',
            'Save reusable snippets and attach files directly from the workspace when a discussion needs concrete artifacts.',
        ],
    },
] as const;

export const productivityNotes = [
    'Use Ctrl/Cmd+K to open global search from anywhere inside the workspace shell.',
    'Use Ctrl/Cmd+/ to toggle the AI panel while staying on the active channel or DM.',
    'Use Esc to close panels and overlays without breaking the current conversation context.',
    'Mentions and relevant activity surface through notifications so you can catch up fast after context switching.',
] as const;

export const troubleshootingItems = [
    'Unauthorized responses usually mean the auth cookie expired or the current session is no longer valid.',
    'Forbidden responses usually mean the user is not a member of the target workspace or lacks owner-only permissions.',
    'AI failures usually point to a missing or invalid GEMINI_API_KEY in the local environment.',
    'File upload issues usually come from size limits, unsupported mime types, or missing workspace context.',
] as const;

export const setupSteps = [
    {
        title: 'Clone the repository',
        description: 'Start from the GitHub source so you have the Next.js app, custom server, QA scripts, and local docs together.',
        code: `git clone ${repoUrl}\ncd devsync-ai`,
        label: 'git',
    },
    {
        title: 'Install dependencies',
        description: 'The project uses Next.js 14, React 18, Mongoose, Socket.io, and Gemini-related packages from package.json.',
        code: 'npm install',
        label: 'npm',
    },
    {
        title: 'Create .env.local',
        description: 'Set the required secrets before running the app locally.',
        code: `MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/devsync-ai\nGEMINI_API_KEY=your_gemini_api_key_here\nJWT_SECRET=a_long_random_secret_string_here\nNEXT_PUBLIC_APP_URL=http://localhost:3000`,
        label: '.env.local',
    },
    {
        title: 'Run the app',
        description: 'The custom Node server starts Next.js and Socket.io together for the local development workflow.',
        code: `npm run dev\n# production build\nnpm run build\nnpm start`,
        label: 'scripts',
    },
] as const;

export const environmentVariables = [
    { name: 'MONGODB_URI', description: 'MongoDB connection string for local or Atlas-backed data storage.' },
    { name: 'GEMINI_API_KEY', description: 'Google Gemini API key used by the AI chat and code workflow endpoints.' },
    { name: 'JWT_SECRET', description: 'Secret used to sign and verify authentication cookies.' },
    { name: 'NEXT_PUBLIC_APP_URL', description: 'Public app URL used by the app and realtime configuration, defaulting to http://localhost:3000.' },
    { name: 'GITHUB_TOKEN', description: 'Optional GitHub personal access token for higher API limits in the unfurl integration.' },
    { name: 'WEBHOOK_SECRET', description: 'Optional secret used to validate inbound webhook requests for CI/CD and integrations.' },
    { name: 'PORT', description: 'Optional port override for the custom Node.js server.' },
] as const;

export const scripts = [
    { name: 'npm run dev', description: 'Start the local development server with Next.js and Socket.io together.' },
    { name: 'npm run build', description: 'Compile an optimized production build.' },
    { name: 'npm start', description: 'Run the production server through the custom Node entry point.' },
    { name: 'npm run lint', description: 'Run the project lint checks.' },
    { name: 'npm run qa:api-regression', description: 'Run the PowerShell API regression script against a running local server.' },
] as const;

export const repoHighlights = [
    'Next.js 14 App Router frontend and API routes',
    'Custom Node.js server for persistent Socket.io realtime transport',
    'MongoDB and Mongoose models for users, workspaces, messages, files, snippets, and notifications',
    'Tailwind-based styling with theme variables for light and dark mode',
] as const;