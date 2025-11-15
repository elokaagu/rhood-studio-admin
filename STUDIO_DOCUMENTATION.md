# R/HOOD Portal - Complete Documentation

## 🎵 Overview

R/HOOD Portal is a comprehensive music community management platform designed specifically for DJs, producers, and music industry professionals. The platform provides a centralized admin dashboard to manage opportunities, applications, members, mixes, and community interactions.

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: Next.js 15 with App Router, React 18
- **UI Framework**: Tailwind CSS, Radix UI components, Shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Hooks, TanStack Query
- **Styling**: Custom design system with Tailwind CSS
- **Deployment**: Vercel

### **Project Structure**
```
├── app/                          # Next.js App Router
│   ├── admin/                   # Admin dashboard pages
│   │   ├── dashboard/           # Main dashboard overview
│   │   ├── opportunities/      # DJ opportunities management
│   │   ├── applications/       # Application review system
│   │   ├── mixes/              # Music mix management
│   │   ├── members/            # Member management
│   │   ├── communities/        # Community features
│   │   ├── create-opportunity/ # Opportunity creation
│   │   ├── login/              # Admin authentication
│   │   └── layout.tsx          # Admin layout wrapper
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (redirects to admin)
├── src/
│   ├── components/ui/          # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── integrations/           # External service integrations
│   └── lib/                    # Utility functions
├── public/                     # Static assets
└── supabase/                   # Database migrations
```

## 🎯 Core Features

### **1. Dashboard**
**Location**: `/admin/dashboard`

**Purpose**: Central overview of platform activity and key metrics

**Features**:
- **Live Statistics**: Real-time counts of active opportunities, pending applications, total members, and AI matching sessions
- **Recent Activity Feed**: Shows latest applications, opportunities, and user profiles
- **Upcoming Events**: Displays upcoming opportunities with smart date formatting (Today, Tomorrow, specific dates)
- **Loading States**: Skeleton components for smooth user experience
- **Unified Animations**: Fade-in effects for all dashboard elements

**Data Sources**:
- `opportunities` table (active opportunities count)
- `applications` table (pending applications count)
- `user_profiles` table (total members count)
- `ai_matching_sessions` table (AI sessions count)

### **2. Opportunities Management**
**Location**: `/admin/opportunities`

**Purpose**: Create, manage, and track DJ opportunities and gigs

**Features**:
- **Opportunity Creation**: Full form with title, description, location, event date, payment, genre, skill level, organizer name
- **Status Management**: Active/Inactive status with visual indicators
- **Image Upload**: Event artwork with lazy loading and blur effects
- **Search & Filter**: Find opportunities by title, location, or status
- **Bulk Actions**: Mass operations on multiple opportunities
- **Detailed View**: Individual opportunity pages with full details
- **Date Formatting**: Smart date display with relative dates

**Database Schema**:
```sql
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  payment DECIMAL(10,2),
  genre TEXT,
  skill_level TEXT,
  organizer_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **3. Applications Review System**
**Location**: `/admin/applications`

**Purpose**: Review and manage DJ applications for opportunities

**Features**:
- **Application Status**: Pending, Approved, Rejected with visual badges
- **Detailed Review**: Individual application pages with full applicant information
- **Social Media Integration**: Instagram and SoundCloud links
- **Audio ID Routing**: Direct links to applicant's primary mix
- **Status Updates**: Approve/reject applications with notes
- **Search & Filter**: Find applications by status, applicant name, or opportunity
- **Statistics**: Live counts of pending, approved, and rejected applications

**Database Schema**:
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **4. Mix Management**
**Location**: `/admin/mixes`

**Purpose**: Manage DJ mixes and music submissions

**Features**:
- **Mix Upload**: File upload with progress tracking
- **Artwork Management**: Image upload for mix covers
- **Automatic Approval**: All mixes are automatically approved (no manual review)
- **Duration Display**: Accurate time formatting (MM:SS or HH:MM:SS)
- **Genre Classification**: Mix categorization
- **Artist Information**: DJ/producer details
- **File Management**: Secure file storage in Supabase Storage
- **Search & Filter**: Find mixes by title, artist, or genre

**Database Schema**:
```sql
CREATE TABLE mixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  duration TEXT,
  image_url TEXT,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **5. Member Management**
**Location**: `/admin/members`

**Purpose**: Manage DJ community members and their profiles

**Features**:
- **Member Profiles**: Complete DJ information including name, city, genres, bio
- **Social Media Links**: Instagram and SoundCloud integration
- **Profile Images**: Avatar management
- **Rating System**: AI matching feedback scores
- **Sorting Options**: Sort by Date Joined, Last Active, Rating
- **Member Details**: Individual member pages with full profile
- **Edit Capabilities**: Update member information
- **Date Formatting**: Smart date display with ordinal suffixes

**Database Schema**:
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dj_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  genres TEXT[],
  bio TEXT,
  instagram TEXT,
  soundcloud TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **6. Community Features**
**Location**: `/admin/communities`

**Purpose**: Manage community interactions and messaging

**Features**:
- **Community Management**: Create and manage DJ communities
- **Member Counts**: Live member counts per community
- **Chat System**: Real-time messaging within communities
- **Community Details**: Individual community pages
- **Message History**: Complete chat history
- **Admin Controls**: Community moderation tools

**Database Schema**:
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🎨 User Interface Design

### **Design System**
- **Color Palette**: Custom brand colors with dark theme
- **Typography**: Custom font system with consistent sizing
- **Components**: Radix UI primitives with custom styling
- **Animations**: Smooth transitions and loading states
- **Responsive**: Mobile-first design approach

### **Key UI Components**
- **Cards**: Information containers with consistent styling
- **Badges**: Status indicators with color coding
- **Buttons**: Primary, secondary, and ghost variants
- **Forms**: Comprehensive form components with validation
- **Modals**: Dialog boxes for detailed views
- **Tables**: Data display with sorting and filtering
- **Skeletons**: Loading state components

### **Navigation**
- **Sidebar**: Collapsible navigation with icons
- **Breadcrumbs**: Clear page hierarchy
- **Active States**: Visual indication of current page
- **Responsive**: Mobile-friendly navigation

## 🔧 Technical Implementation

### **Authentication**
- **Supabase Auth**: Secure admin authentication
- **Session Management**: Persistent login sessions
- **Route Protection**: Admin-only access to dashboard
- **Logout Functionality**: Secure session termination

### **Data Management**
- **Real-time Updates**: Live data synchronization
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Comprehensive error management
- **Loading States**: User-friendly loading indicators

### **File Management**
- **Supabase Storage**: Secure file storage
- **Image Optimization**: Next.js Image component
- **Lazy Loading**: Performance optimization
- **Blur Placeholders**: Smooth loading experience

### **Performance Optimizations**
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: WebP format with fallbacks
- **Caching**: Strategic data caching
- **Bundle Optimization**: Minimal JavaScript bundles

## 📊 Database Architecture

### **Core Tables**
1. **user_profiles**: DJ member information
2. **opportunities**: DJ gig opportunities
3. **applications**: Application submissions
4. **mixes**: Music mix submissions
5. **communities**: Community groups
6. **community_members**: Community membership
7. **messages**: Chat messages
8. **ai_matching_sessions**: AI matching data
9. **ai_matching_feedback**: User feedback scores

### **Relationships**
- **One-to-Many**: Users can have multiple applications
- **One-to-Many**: Opportunities can have multiple applications
- **Many-to-Many**: Users can belong to multiple communities
- **One-to-Many**: Communities can have multiple messages

### **Indexes**
- Email addresses for fast user lookup
- DJ names for search functionality
- Created dates for sorting
- Foreign keys for relationship queries

## 🚀 Deployment & Setup

### **Environment Setup**
1. **Node.js**: Version 18+ required
2. **Package Manager**: npm or yarn
3. **Supabase**: Database and authentication setup
4. **Vercel**: Deployment platform

### **Installation Steps**
```bash
# Clone repository
git clone https://github.com/your-username/rhood-studio.git
cd rhood-portal

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

### **Database Setup**
1. Create Supabase project
2. Run SQL migration scripts
3. Setup Row Level Security policies
4. Configure storage buckets
5. Test database connections

### **Deployment**
- **Vercel**: Automatic deployments from GitHub
- **Environment Variables**: Secure credential management
- **Domain**: Custom domain configuration
- **SSL**: Automatic HTTPS certificates

## 🔒 Security Features

### **Authentication**
- **Supabase Auth**: Industry-standard authentication
- **Session Management**: Secure session handling
- **Route Protection**: Admin-only access controls

### **Data Protection**
- **Row Level Security**: Database-level access control
- **Input Validation**: Comprehensive form validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content sanitization

### **File Security**
- **Secure Uploads**: File type validation
- **Storage Policies**: Access-controlled file storage
- **Image Processing**: Safe image handling

## 📈 Analytics & Monitoring

### **Performance Metrics**
- **Page Load Times**: Core Web Vitals tracking
- **User Interactions**: Click tracking and analytics
- **Error Monitoring**: Comprehensive error logging
- **Database Performance**: Query optimization

### **User Analytics**
- **Member Growth**: User registration tracking
- **Application Rates**: Opportunity application metrics
- **Community Engagement**: Chat and interaction data
- **Mix Uploads**: Content creation statistics

## 🛠️ Development Workflow

### **Code Standards**
- **TypeScript**: Type-safe development
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit validation

### **Testing Strategy**
- **Unit Tests**: Component testing
- **Integration Tests**: API testing
- **E2E Tests**: User flow testing
- **Performance Tests**: Load testing

### **Version Control**
- **Git**: Version control system
- **GitHub**: Repository hosting
- **Branch Strategy**: Feature branch workflow
- **Pull Requests**: Code review process

## 🔮 Future Enhancements

### **Planned Features**
- **AI Matching**: Advanced DJ-opportunity matching
- **Analytics Dashboard**: Comprehensive reporting
- **Mobile App**: Native mobile application
- **API Integration**: Third-party service integration
- **Advanced Search**: Elasticsearch integration
- **Real-time Notifications**: Push notifications
- **Payment Integration**: Stripe payment processing
- **Calendar Integration**: Event scheduling

### **Technical Improvements**
- **Performance Optimization**: Further speed improvements
- **Accessibility**: WCAG compliance
- **Internationalization**: Multi-language support
- **Offline Support**: Progressive Web App features
- **Advanced Caching**: Redis integration
- **Microservices**: Service-oriented architecture

## 📞 Support & Maintenance

### **Documentation**
- **API Documentation**: Comprehensive API reference
- **User Guides**: Step-by-step tutorials
- **Developer Docs**: Technical implementation guides
- **Troubleshooting**: Common issue resolution

### **Monitoring**
- **Error Tracking**: Real-time error monitoring
- **Performance Monitoring**: Application performance tracking
- **Uptime Monitoring**: Service availability tracking
- **Security Monitoring**: Threat detection and prevention

### **Maintenance**
- **Regular Updates**: Security and feature updates
- **Database Maintenance**: Performance optimization
- **Backup Strategy**: Data protection and recovery
- **Disaster Recovery**: Business continuity planning

---

## 📝 Quick Reference

### **Key URLs**
- **Dashboard**: `/admin/dashboard`
- **Opportunities**: `/admin/opportunities`
- **Applications**: `/admin/applications`
- **Mixes**: `/admin/mixes`
- **Members**: `/admin/members`
- **Communities**: `/admin/communities`
- **Login**: `/admin/login`

### **Key Commands**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **Database Commands**
```sql
-- Check table structure
\d table_name

-- View all tables
\dt

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

This documentation provides a comprehensive overview of the R/HOOD Portal platform, its features, technical implementation, and operational procedures. For specific technical details or implementation questions, refer to the individual component documentation or contact the development team.
