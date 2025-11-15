# R/HOOD Portal - Admin Dashboard

A comprehensive music community management platform for DJs and producers, built with Next.js, React, and Tailwind CSS.

## 📚 Documentation

- **[Complete Portal Documentation](./PORTAL_DOCUMENTATION.md)** - Comprehensive overview of all features and functionality
- **[Admin User Guide](./ADMIN_USER_GUIDE.md)** - Step-by-step guide for admin users
- **[Technical Architecture](./TECHNICAL_ARCHITECTURE.md)** - System architecture and implementation details
- **[Database Schema Guide](./DATABASE_SCHEMA_GUIDE.md)** - Complete database structure and setup
- **[API Documentation](./API_DOCUMENTATION.md)** - REST API endpoints and integration guide

## 🎯 Features

- **Admin Dashboard**: Comprehensive management interface with live statistics
- **Opportunities Management**: Create, edit, and manage DJ opportunities and gigs
- **Applications Review**: Review and approve/reject DJ applications with detailed profiles
- **Members Management**: Manage DJ community members with social media integration
- **Mixes Management**: Handle DJ mix submissions with automatic approval
- **Community Features**: Real-time chat and community management
- **Authentication**: Secure admin login with Supabase Auth
- **Real-time Updates**: Live data synchronization across all features

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **UI**: React 18, Tailwind CSS, Radix UI components, Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query, React Hooks
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/rhood-studio.git
   cd rhood-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Supabase credentials to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Set up the database:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the database setup scripts from [Database Schema Guide](./DATABASE_SCHEMA_GUIDE.md)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard pages
│   │   ├── dashboard/     # Main dashboard overview
│   │   ├── opportunities/ # Manage opportunities
│   │   ├── applications/  # Review applications
│   │   ├── mixes/         # Manage mixes
│   │   ├── members/       # Manage members
│   │   ├── communities/   # Community features
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

## 🎨 Key Features

### **Dashboard**
- Live statistics (opportunities, applications, members, AI sessions)
- Recent activity feed
- Upcoming events with smart date formatting
- Unified animations and loading states

### **Opportunities Management**
- Create and manage DJ gig opportunities
- Image upload with lazy loading
- Status management (active/inactive)
- Search and filtering capabilities
- Payment and skill level tracking

### **Applications Review**
- Review DJ applications with full profiles
- Social media integration (Instagram, SoundCloud)
- Audio ID routing to primary mixes
- Status management (pending/approved/rejected)
- Detailed applicant information

### **Mix Management**
- Automatic approval workflow
- Artwork display and management
- File upload with progress tracking
- Duration formatting and genre classification
- Search and filter capabilities

### **Member Management**
- Complete DJ profiles with social links
- AI matching feedback scores
- Sorting options (date joined, last active, rating)
- Profile editing capabilities
- Smart date formatting

### **Community Features**
- Real-time chat messaging
- Community creation and management
- Member count tracking
- Message history and moderation

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

## 🗄️ Database Setup

The platform uses PostgreSQL via Supabase. See the [Database Schema Guide](./DATABASE_SCHEMA_GUIDE.md) for:

- Complete table structures
- Indexes for performance
- Row Level Security policies
- Storage bucket configuration
- Sample data insertion
- Maintenance procedures

## 🔐 Security Features

- **Authentication**: Supabase Auth with secure sessions
- **Row Level Security**: Database-level access control
- **Input Validation**: Comprehensive form validation
- **File Security**: Secure file uploads and storage
- **XSS Protection**: Content sanitization

## 📊 Performance Optimizations

- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Caching**: Strategic data caching with React Query
- **Database Indexes**: Optimized queries for better performance
- **Bundle Optimization**: Minimal JavaScript bundles

## 🚀 Deployment

The platform is deployed on Vercel with automatic deployments from GitHub:

1. **Push to main branch** triggers automatic deployment
2. **Environment variables** are managed securely
3. **Custom domain** configuration available
4. **SSL certificates** are automatically provisioned

## 🔮 Future Enhancements

- **AI Matching**: Advanced DJ-opportunity matching algorithms
- **Analytics Dashboard**: Comprehensive reporting and insights
- **Mobile App**: Native mobile application
- **Payment Integration**: Stripe payment processing
- **Calendar Integration**: Event scheduling and management
- **Advanced Search**: Elasticsearch integration
- **Real-time Notifications**: Push notifications system

## 📞 Support

- **Documentation**: Comprehensive guides and API reference
- **User Guides**: Step-by-step tutorials
- **Technical Support**: Developer assistance and troubleshooting
- **Community**: Connect with other admins and developers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Supabase** for backend services
- **Vercel** for deployment platform
- **Radix UI** for accessible components
- **Tailwind CSS** for styling framework
- **Next.js** for React framework

---

For detailed information about specific features, technical implementation, or API usage, please refer to the comprehensive documentation linked above.
