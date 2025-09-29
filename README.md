# Rhood Studio - Admin Dashboard

A music community management platform for DJs and producers, built with Next.js, React, and Tailwind CSS.

## Features

- **Admin Dashboard**: Comprehensive management interface
- **Opportunities Management**: Create, edit, and manage DJ opportunities and gigs
- **Applications Review**: Review and approve/reject DJ applications
- **Members Management**: Manage DJ community members and their profiles
- **Mixes Management**: Review and manage DJ mixes and submissions
- **Authentication**: Secure admin login with Supabase Auth

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 18, Tailwind CSS, Radix UI components
- **Database**: Supabase
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom design system

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up Supabase connection:

   a. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

   b. Get your Supabase credentials:

   - Go to your Supabase project dashboard
   - Click on "Settings" in the sidebar
   - Click on "API"
   - Copy the "Project URL" and "anon public" key

   c. Update `.env.local` with your credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   │   ├── dashboard/     # Admin dashboard
│   │   ├── opportunities/ # Manage opportunities
│   │   ├── applications/  # Review applications
│   │   ├── mixes/         # Manage mixes
│   │   ├── members/       # Manage members
│   │   ├── create-opportunity/ # Create new opportunities
│   │   ├── login/         # Admin login
│   │   └── layout.tsx     # Admin layout
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects to admin)
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # External service integrations
│   └── lib/              # Utility functions
├── public/               # Static assets
└── supabase/            # Database migrations
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Migration from Vite

This project has been migrated from Vite to Next.js. Key changes include:

- **Routing**: React Router → Next.js App Router
- **Build System**: Vite → Next.js
- **Asset Handling**: Vite imports → Next.js Image component
- **Configuration**: Vite config → Next.js config
- **File Structure**: Pages moved to `app/` directory
- **Focus**: Consumer app → Admin-only dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
