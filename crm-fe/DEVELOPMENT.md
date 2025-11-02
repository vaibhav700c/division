# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

\`\`\`bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
\`\`\`

### Running the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/                    # Next.js app router pages
│   ├── tasks/             # Task management pages
│   ├── approvals/         # Approval workflow pages
│   ├── ai/                # AI features (suggestions, workload, meeting minutes)
│   ├── calendar/          # Calendar view
│   ├── map/               # Location-based tasks
│   ├── dashboard/         # Main dashboard
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (Button, Card, etc.)
│   ├── tasks/            # Task-specific components
│   └── approvals/        # Approval-specific components
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useApprovals.ts
│   ├── useAISuggestions.ts
│   ├── useWorkloadAnalysis.ts
│   └── useMeetingMinutes.ts
├── lib/                  # Utility functions
│   ├── api-client.ts     # API communication
│   ├── mock-data.ts      # Mock data for development
│   └── utils.ts          # Helper functions
├── types/                # TypeScript type definitions
└── __tests__/            # Test files
\`\`\`

## Key Features

### Task Management
- Create, assign, and track tasks
- Priority levels (LOW, MEDIUM, HIGH, URGENT)
- Time estimates and actual hours tracking
- Location tagging for field tasks
- Task status workflow (DRAFT → ASSIGNED → IN_PROGRESS → PENDING_APPROVAL → APPROVED/REJECTED → COMPLETED)

### Approval Workflow
- Role-based approval queues
- Rejection with reason tracking
- Escalation paths
- Approval history and audit trail

### AI Features
- **Task Suggestions**: AI-powered task recommendations based on team capacity
- **Workload Analysis**: Real-time team capacity and burnout detection
- **Meeting Minutes**: Generate structured meeting minutes from raw notes

### Calendar & Location
- Interactive calendar view of scheduled tasks
- Location-based task mapping
- Google Calendar integration (stub)

### Dashboard
- Team overview with key metrics
- Quick access to pending approvals
- In-progress tasks widget
- Navigation to all major features

## API Integration

### Base URL
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

### Available Endpoints (Stubs)

#### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

#### Approvals
- `GET /api/approvals` - List all approvals
- `POST /api/approvals/:id/approve` - Approve task
- `POST /api/approvals/:id/reject` - Reject task
- `POST /api/approvals/:id/escalate` - Escalate approval

#### AI Features
- `POST /api/ai/suggestions` - Generate task suggestions
- `POST /api/ai/workload` - Analyze team workload
- `POST /api/ai/meeting-minutes` - Generate meeting minutes

## Authentication

Currently using JWT-based authentication (stub). To implement:

1. Set up NextAuth.js with your provider
2. Update `hooks/useAuth.ts` with actual authentication logic
3. Add auth middleware for protected routes
4. Configure session management

## Testing

### Run Tests
\`\`\`bash
npm run test
\`\`\`

### Run Tests in Watch Mode
\`\`\`bash
npm run test:watch
\`\`\`

### Generate Coverage Report
\`\`\`bash
npm run test:coverage
\`\`\`

## Styling

The project uses Tailwind CSS v4 with a custom design token system:

### Design Tokens (in `app/globals.css`)
- `--background` / `--foreground` - Main colors
- `--primary` / `--primary-foreground` - Primary brand color
- `--secondary` / `--secondary-foreground` - Secondary color
- `--accent` - Accent color
- `--muted` / `--muted-foreground` - Muted colors
- `--border` - Border color
- `--success`, `--warning`, `--error` - Status colors

### Adding Custom Styles
1. Define tokens in `app/globals.css`
2. Use semantic class names: `bg-primary`, `text-foreground`, etc.
3. Avoid hardcoded colors like `bg-blue-500`

## Deployment

### Deploy to Vercel

\`\`\`bash
# Push to GitHub
git push origin main

# Vercel will automatically deploy
\`\`\`

### Environment Variables
Set these in your Vercel project settings:
- `NEXT_PUBLIC_API_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Troubleshooting

### Port Already in Use
\`\`\`bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
\`\`\`

### Module Not Found
\`\`\`bash
# Clear Next.js cache
rm -rf .next
npm run dev
\`\`\`

### Environment Variables Not Loading
- Ensure `.env.local` exists in project root
- Restart dev server after adding variables
- Use `NEXT_PUBLIC_` prefix for client-side variables

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run tests: `npm run test`
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [React Documentation](https://react.dev)
