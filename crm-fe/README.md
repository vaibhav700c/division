# TaskFlow CRM - AI-Powered Task Management

A full-stack Next.js application for intelligent task assignment, approval workflows, and team collaboration.

## Features

- **Task Management**: Create, assign, and track tasks with priority, time estimates, and location tagging
- **Approval Workflows**: Role-based approval queues with escalation and audit trails
- **AI Assistance**: Task suggestions, meeting minute generation, burnout detection
- **Workload Analytics**: Real-time team capacity planning and heatmaps
- **Calendar Integration**: Google Calendar sync and scheduling
- **Role-Based Access**: Admin, Team Leader, and Team Member permissions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Data Fetching**: SWR for client-side caching
- **Authentication**: NextAuth.js with JWT
- **State Management**: React Context / Zustand (optional)
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in your values
3. Install dependencies:

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Deploy

\`\`\`bash
npm run build
npm start
\`\`\`

Deploy to Vercel:

\`\`\`bash
vercel deploy
\`\`\`

## Project Structure

\`\`\`
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard
│   ├── tasks/             # Task pages
│   ├── approvals/         # Approval queue
│   ├── teams/             # Team management
│   ├── calendar/          # Calendar view
│   ├── reports/           # Analytics
│   └── auth/              # Authentication
├── components/            # Reusable React components
│   ├── ui/               # Base UI components
│   └── role-guard.tsx    # Role-based access control
├── hooks/                # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   └── useSWRFetcher.ts # Data fetching hook
├── lib/                  # Utilities and helpers
│   ├── api-client.ts    # API wrapper
│   └── mock-data.ts     # Development mock data
├── types/               # TypeScript type definitions
├── styles/              # Global styles
└── tests/               # Unit and integration tests
\`\`\`

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `GET /api/users?teamId=` - Get team members

### Tasks
- `GET /api/tasks?teamId=&status=&assignedTo=` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks/:id/assign` - Assign task
- `POST /api/tasks/:id/request-approval` - Request approval

### Approvals
- `GET /api/approvals?status=pending` - List pending approvals
- `POST /api/tasks/:id/approve` - Approve task
- `POST /api/tasks/:id/reject` - Reject task

### AI Features
- `POST /api/ai/suggest-task` - Get AI task suggestions
- `POST /api/ai/generate-minutes` - Generate meeting minutes

### Reports
- `GET /api/reports/workload?teamId=` - Get workload analytics

## Development Notes

- Mock data is available in `lib/mock-data.ts` for local development
- Use `/_internal/api-test` page to test API endpoints
- TODO comments indicate areas requiring backend integration
- Environment variables are required for production deployment

## Testing

\`\`\`bash
npm test
npm run test:watch
\`\`\`

## Next Steps (2-Day Sprint)

1. **Phase 1**: Setup & Auth (✓ Complete)
2. **Phase 2**: Tasks List & Detail Pages
3. **Phase 3**: Approval Queue & Workflow
4. **Phase 4**: AI Features & Hooks
5. **Phase 5**: Calendar, Map & Advanced UI
6. **Phase 6**: Tests, Polish & Documentation

## License

MIT
