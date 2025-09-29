# Hamburger Menu Navigation Instructions

## Overview
Replace the top right navigation icons with a hamburger menu dropdown containing all navigation options.

## Required Imports
Add these imports to your HomeFeed component:

```tsx
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react'; // Add Menu to existing lucide imports
```

## Implementation
Replace the existing top right navigation section with this code:

### Original Code (to replace):
```tsx
<div className="flex items-center space-x-4">
  <Button variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
    <Bell className="h-5 w-5" />
  </Button>
  <Button variant="ghost" size="icon" onClick={() => navigate('/community')}>
    <Users className="h-5 w-5" />
  </Button>
  <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
    <User className="h-5 w-5" />
  </Button>
  <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
    <Settings className="h-5 w-5" />
  </Button>
</div>
```

### New Code (hamburger menu):
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <Menu className="h-5 w-5" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
    <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer">
      <Bell className="h-4 w-4 mr-2" />
      Notifications
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate('/community')} className="cursor-pointer">
      <Users className="h-4 w-4 mr-2" />
      Community
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
      <User className="h-4 w-4 mr-2" />
      Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
      <Settings className="h-4 w-4 mr-2" />
      Settings
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Key Features
- **Trigger**: Single hamburger menu icon (Menu component)
- **Alignment**: `align="end"` positions dropdown to the right
- **Width**: `w-48` sets consistent dropdown width
- **Styling**: Uses semantic tokens (`bg-popover`, `border-border`)
- **Icons**: Each menu item has its corresponding icon (h-4 w-4 with mr-2 spacing)
- **Navigation**: Each item uses the same `navigate()` function calls as before
- **Cursor**: `cursor-pointer` class makes items clearly clickable

## Component Dependencies
Ensure these UI components are available:
- `DropdownMenu` from `@/components/ui/dropdown-menu`
- `Button` from `@/components/ui/button`
- Icons from `lucide-react`