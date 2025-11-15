# R/HOOD Portal - API Documentation

## 🌐 API Overview

The R/HOOD Portal platform uses Supabase as its backend service, providing a comprehensive REST API and real-time subscriptions. This documentation covers all available endpoints, data models, and integration patterns.

## 🔗 Base Configuration

### **Supabase Client Setup**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### **Authentication Headers**
All API requests require authentication:
```typescript
const { data: { session } } = await supabase.auth.getSession()
// Session token is automatically included in requests
```

## 📊 Data Models

### **User Profile**
```typescript
interface UserProfile {
  id: string
  first_name: string
  last_name: string
  dj_name: string
  email: string
  city: string
  genres: string[]
  bio?: string
  instagram?: string
  soundcloud?: string
  profile_image_url?: string
  created_at: string
  updated_at: string
}
```

### **Opportunity**
```typescript
interface Opportunity {
  id: string
  title: string
  description?: string
  location?: string
  event_date?: string
  payment?: number
  genre?: string
  skill_level?: string
  organizer_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### **Application**
```typescript
interface Application {
  id: string
  user_id: string
  opportunity_id: string
  status: 'pending' | 'approved' | 'rejected'
  message?: string
  created_at: string
  updated_at: string
  // Joined data
  applicant?: UserProfile
  opportunity?: Opportunity
}
```

### **Mix**
```typescript
interface Mix {
  id: string
  title: string
  artist: string
  genre: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  file_url: string
  file_name: string
  file_size: number
  duration?: string
  image_url?: string
  uploaded_by?: string
  created_at: string
  updated_at: string
}
```

### **Community**
```typescript
interface Community {
  id: string
  name: string
  description?: string
  creator_id?: string
  created_at: string
  updated_at: string
  // Joined data
  creator?: UserProfile
  member_count?: number
}
```

### **Message**
```typescript
interface Message {
  id: string
  community_id: string
  sender_id: string
  content: string
  edited_at: string
  created_at: string
  // Joined data
  sender?: UserProfile
}
```

## 🔍 API Endpoints

### **User Profiles**

#### **Get All User Profiles**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .order('created_at', { ascending: false })
```

#### **Get User Profile by ID**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

#### **Create User Profile**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .insert({
    first_name: 'John',
    last_name: 'Doe',
    dj_name: 'DJ Johnny',
    email: 'john@example.com',
    city: 'New York',
    genres: ['House', 'Techno'],
    bio: 'Professional DJ'
  })
```

#### **Update User Profile**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .update({
    city: 'Los Angeles',
    genres: ['House', 'Techno', 'Deep House']
  })
  .eq('id', userId)
```

#### **Delete User Profile**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .delete()
  .eq('id', userId)
```

#### **Search User Profiles**
```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .or(`dj_name.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
  .order('created_at', { ascending: false })
```

### **Opportunities**

#### **Get All Opportunities**
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .select('*')
  .order('created_at', { ascending: false })
```

#### **Get Active Opportunities**
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .select('*')
  .eq('is_active', true)
  .order('event_date', { ascending: true })
```

#### **Create Opportunity**
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .insert({
    title: 'Summer Beach Party',
    description: 'Outdoor beach party with house music',
    location: 'Miami Beach',
    event_date: '2024-07-15T20:00:00Z',
    payment: 500.00,
    genre: 'House',
    skill_level: 'Intermediate',
    organizer_name: 'Beach Events Inc'
  })
```

#### **Update Opportunity**
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .update({
    is_active: false,
    payment: 600.00
  })
  .eq('id', opportunityId)
```

#### **Filter Opportunities**
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .select('*')
  .eq('genre', 'House')
  .gte('payment', 300)
  .order('event_date', { ascending: true })
```

### **Applications**

#### **Get All Applications**
```typescript
const { data, error } = await supabase
  .from('applications')
  .select(`
    *,
    applicant:user_profiles(*),
    opportunity:opportunities(*)
  `)
  .order('created_at', { ascending: false })
```

#### **Get Applications by Status**
```typescript
const { data, error } = await supabase
  .from('applications')
  .select(`
    *,
    applicant:user_profiles(*),
    opportunity:opportunities(*)
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

#### **Create Application**
```typescript
const { data, error } = await supabase
  .from('applications')
  .insert({
    user_id: userId,
    opportunity_id: opportunityId,
    message: 'I would love to DJ at this event!'
  })
```

#### **Update Application Status**
```typescript
const { data, error } = await supabase
  .from('applications')
  .update({
    status: 'approved'
  })
  .eq('id', applicationId)
```

#### **Get Applications for Opportunity**
```typescript
const { data, error } = await supabase
  .from('applications')
  .select(`
    *,
    applicant:user_profiles(*)
  `)
  .eq('opportunity_id', opportunityId)
  .order('created_at', { ascending: false })
```

### **Mixes**

#### **Get All Mixes**
```typescript
const { data, error } = await supabase
  .from('mixes')
  .select('*')
  .order('created_at', { ascending: false })
```

#### **Upload Mix File**
```typescript
// First upload file to storage
const { data: fileData, error: fileError } = await supabase.storage
  .from('mixes')
  .upload(`${userId}/${fileName}`, file)

if (fileError) throw fileError

// Then create mix record
const { data, error } = await supabase
  .from('mixes')
  .insert({
    title: 'Summer Mix 2024',
    artist: 'DJ Johnny',
    genre: 'House',
    description: 'My latest summer mix',
    file_url: fileData.path,
    file_name: fileName,
    file_size: file.size,
    uploaded_by: userId
  })
```

#### **Update Mix**
```typescript
const { data, error } = await supabase
  .from('mixes')
  .update({
    title: 'Updated Mix Title',
    description: 'Updated description'
  })
  .eq('id', mixId)
```

#### **Search Mixes**
```typescript
const { data, error } = await supabase
  .from('mixes')
  .select('*')
  .or(`title.ilike.%${searchTerm}%,artist.ilike.%${searchTerm}%`)
  .order('created_at', { ascending: false })
```

### **Communities**

#### **Get All Communities**
```typescript
const { data, error } = await supabase
  .from('communities')
  .select(`
    *,
    creator:user_profiles(*)
  `)
  .order('created_at', { ascending: false })
```

#### **Create Community**
```typescript
const { data, error } = await supabase
  .from('communities')
  .insert({
    name: 'House Music Lovers',
    description: 'Community for house music enthusiasts',
    creator_id: userId
  })
```

#### **Get Community Members**
```typescript
const { data, error } = await supabase
  .from('community_members')
  .select(`
    *,
    user:user_profiles(*)
  `)
  .eq('community_id', communityId)
  .order('joined_at', { ascending: false })
```

#### **Add Member to Community**
```typescript
const { data, error } = await supabase
  .from('community_members')
  .insert({
    community_id: communityId,
    user_id: userId
  })
```

### **Messages**

#### **Get Community Messages**
```typescript
const { data, error } = await supabase
  .from('messages')
  .select(`
    *,
    sender:user_profiles(*)
  `)
  .eq('community_id', communityId)
  .order('created_at', { ascending: true })
```

#### **Send Message**
```typescript
const { data, error } = await supabase
  .from('messages')
  .insert({
    community_id: communityId,
    sender_id: userId,
    content: 'Hello everyone!'
  })
```

#### **Update Message**
```typescript
const { data, error } = await supabase
  .from('messages')
  .update({
    content: 'Updated message content',
    edited_at: new Date().toISOString()
  })
  .eq('id', messageId)
```

## 📡 Real-time Subscriptions

### **Subscribe to Applications**
```typescript
const subscription = supabase
  .channel('applications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'applications'
  }, (payload) => {
    console.log('New application:', payload.new)
    // Update UI with new application
  })
  .subscribe()
```

### **Subscribe to Messages**
```typescript
const subscription = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `community_id=eq.${communityId}`
  }, (payload) => {
    console.log('New message:', payload.new)
    // Add new message to chat
  })
  .subscribe()
```

### **Subscribe to Opportunity Updates**
```typescript
const subscription = supabase
  .channel('opportunities')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'opportunities'
  }, (payload) => {
    console.log('Opportunity updated:', payload.new)
    // Update opportunity in UI
  })
  .subscribe()
```

## 🔐 Authentication API

### **Sign In**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@example.com',
  password: 'password'
})
```

### **Sign Out**
```typescript
const { error } = await supabase.auth.signOut()
```

### **Get Current User**
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### **Get Session**
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

## 📁 Storage API

### **Upload File**
```typescript
const { data, error } = await supabase.storage
  .from('mixes')
  .upload('path/to/file.mp3', file)
```

### **Download File**
```typescript
const { data, error } = await supabase.storage
  .from('mixes')
  .download('path/to/file.mp3')
```

### **Get Public URL**
```typescript
const { data } = supabase.storage
  .from('mixes')
  .getPublicUrl('path/to/file.mp3')
```

### **Delete File**
```typescript
const { data, error } = await supabase.storage
  .from('mixes')
  .remove(['path/to/file.mp3'])
```

## 🔍 Advanced Queries

### **Complex Joins**
```typescript
// Get applications with full details
const { data, error } = await supabase
  .from('applications')
  .select(`
    *,
    applicant:user_profiles(
      id,
      dj_name,
      city,
      genres,
      instagram,
      soundcloud
    ),
    opportunity:opportunities(
      id,
      title,
      location,
      event_date,
      payment,
      genre
    )
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false })
```

### **Aggregate Queries**
```typescript
// Get opportunity statistics
const { data, error } = await supabase
  .from('applications')
  .select('opportunity_id, status')
  .then(result => {
    // Process data to get counts
    const stats = result.data?.reduce((acc, app) => {
      if (!acc[app.opportunity_id]) {
        acc[app.opportunity_id] = { total: 0, pending: 0, approved: 0, rejected: 0 }
      }
      acc[app.opportunity_id].total++
      acc[app.opportunity_id][app.status]++
      return acc
    }, {})
    return { data: stats, error: null }
  })
```

### **Pagination**
```typescript
const pageSize = 20
const page = 1
const from = (page - 1) * pageSize
const to = from + pageSize - 1

const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .range(from, to)
  .order('created_at', { ascending: false })
```

### **Filtering and Sorting**
```typescript
const { data, error } = await supabase
  .from('opportunities')
  .select('*')
  .eq('is_active', true)
  .gte('event_date', new Date().toISOString())
  .in('genre', ['House', 'Techno'])
  .gte('payment', 300)
  .order('event_date', { ascending: true })
  .limit(10)
```

## 🛠️ Error Handling

### **Standard Error Handling**
```typescript
const handleApiCall = async (apiCall: () => Promise<any>) => {
  try {
    const { data, error } = await apiCall()
    
    if (error) {
      console.error('API Error:', error)
      throw new Error(error.message)
    }
    
    return data
  } catch (error) {
    console.error('Unexpected error:', error)
    throw error
  }
}

// Usage
const opportunities = await handleApiCall(() => 
  supabase.from('opportunities').select('*')
)
```

### **Retry Logic**
```typescript
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data, error } = await apiCall()
      
      if (error && error.code === 'PGRST301') {
        // Rate limit error, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      
      if (error) throw error
      return data
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 📊 Performance Optimization

### **Query Optimization**
```typescript
// Use specific column selection
const { data, error } = await supabase
  .from('user_profiles')
  .select('id, dj_name, city, genres')
  .eq('city', 'New York')

// Use indexes effectively
const { data, error } = await supabase
  .from('applications')
  .select('*')
  .eq('status', 'pending') // Uses index on status column
  .order('created_at', { ascending: false }) // Uses index on created_at
```

### **Caching Strategy**
```typescript
// React Query for client-side caching
import { useQuery } from '@tanstack/react-query'

const useOpportunities = () => {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_active', true)
      
      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

## 🔧 Development Tools

### **API Testing**
```typescript
// Test API endpoints
const testApiEndpoints = async () => {
  const tests = [
    () => supabase.from('user_profiles').select('count'),
    () => supabase.from('opportunities').select('count'),
    () => supabase.from('applications').select('count'),
    () => supabase.from('mixes').select('count'),
  ]
  
  for (const test of tests) {
    try {
      const { data, error } = await test()
      console.log('✅ Test passed:', data)
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }
}
```

### **Database Health Check**
```typescript
const checkDatabaseHealth = async () => {
  const checks = [
    { name: 'User Profiles', query: () => supabase.from('user_profiles').select('count') },
    { name: 'Opportunities', query: () => supabase.from('opportunities').select('count') },
    { name: 'Applications', query: () => supabase.from('applications').select('count') },
    { name: 'Mixes', query: () => supabase.from('mixes').select('count') },
    { name: 'Communities', query: () => supabase.from('communities').select('count') },
  ]
  
  const results = await Promise.allSettled(
    checks.map(check => check.query())
  )
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ ${checks[index].name}: OK`)
    } else {
      console.error(`❌ ${checks[index].name}: ${result.reason}`)
    }
  })
}
```

This comprehensive API documentation provides everything needed to integrate with the R/HOOD Portal platform. It covers all endpoints, data models, real-time features, and best practices for effective API usage.
