# R/HOOD Brief Template Guide

This guide explains the structured brief template that brands use to create detailed opportunity briefs in the R/HOOD Studio.

## Overview

The brief system has two parts:
1. **Short Summary** (300 chars max) - Visible to all DJs before they apply
2. **Full Brief** - Only visible to DJs after their application is accepted

## Brief Structure (Based on Example: CROSSFADE x HERCULES)

The full brief follows this structure:

### 1. Concept Proposal / The Idea
**Required field** - Describes the core concept and vision.

**Example:**
> DJing is no longer confined to dark booths or club stages. It's become a social, shareable experience that can happen anywhere. Together with [Brand] and the launch of their [Product], we will showcase just how easy, mobile, and collaborative DJing can be. Our format: fun, cinematic jam sessions where DJs play back-to-back in unexpected, immersive locations. Bringing music and culture directly to the people.

### 2. Format Overview

Three sub-sections that describe the format:

#### Collaborative Sessions
Describe how DJs collaborate: How many DJs? How do they pass the decks? What's the structure?

**Example:**
> 4 DJs play one track each, passing the decks in real time. The challenge: keep the energy alive while blending genres, personalities, and vibes. The result: part jam session, part hangout, part social experiment.

#### Unique Locations
Describe where this takes place and what makes locations special.

**Example:**
> From the back of a Mercedes van cruising through London, to intimate living rooms, rooftops, or surprise pop-up spots. The space becomes both a stage and a character in the experience.

#### Cinematic Content Capture
Describe how content will be captured: Video setup, angles, equipment, etc.

**Example:**
> Professional videographer + multi-angle GoPros. 360° GoPro mounted on the roof to capture the journey through the city. Dynamic storytelling that blends music, community, and location into one.

### 3. Episode Flow
Describe the flow of each episode: Warm-up, introductions, how DJs rotate, duration, etc.

**Example:**
> Warm-up + introductions. DJs rotate tracks, passing the decks. Set builds organically. Capturing both the music and the vibe of DJs hanging out. One-hour episode: entertaining, social, and easy to binge.

### 4. Why It Works?

Four numbered points explaining the value proposition:

#### 1. Accessibility
How does this make DJing more accessible or approachable?

**Example:**
> DJing becomes less intimidating, more playful. Positioned as the tool that makes it possible. Simple, mobile and for everyone.

#### 2. Collaboration
How does this celebrate community and collaboration?

**Example:**
> Celebrates the community side of DJ culture. Not just "1 star DJ" but a collective moment where differences meet on the decks.

#### 3. Content-First Activation
What content will be created? How will it be distributed?

**Example:**
> 3 X premium episodes with short form cut downs for TikTok, IG Reels, and YouTube Shorts. Ready for brand channels, DJ self-promotion, and social amplification.

#### 4. Entertainment Value
What makes this entertaining and watchable for audiences?

**Example:**
> Spontaneous, raw, and unpredictable. Watchable not just for DJs, but for wider audiences who enjoy culture, music, and city backdrops.

### 5. Pilot Episodes
Details about pilot episodes: How many? Where? When? Who's featured? Release schedule?

**Example:**
> 3 Episodes filmed in the back of a Mercedes van across London. Featuring local and international DJs across genres (house, hip hop, amapiano, drum & bass, etc.) for exciting crossover moments. Episodes released weekly to create consistency and build anticipation.

### 6. Deliverables
What will be delivered? Full episodes, social cutdowns, brand integration details, production scope, etc.

**Example:**
> 3 x 1-hour full episodes (filmed, edited, produced). Social cutdowns optimised for TikTok, IG Reels, and YouTube Shorts. Brand integration: featured naturally throughout (hands-on use, subtle placements, organic storytelling). End-to-end production: R/HOOD handles all aspects. Talent programming, logistics, filming, editing, and delivery.

### 7. Investment
Budget/investment details.

**Example:**
> €9,800 + Hercules DJ decks for talent use

## How It Works

1. **Brand creates opportunity** using the step-by-step form in `/admin/create-opportunity`
2. **Short Summary** is filled out (visible to all DJs)
3. **Full Brief** is built from the structured questionnaire (visible only after acceptance)
4. **DJs see** the short summary when browsing opportunities
5. **After acceptance**, DJs see the full formatted brief with all details

## AI Refinement

Brands can use the "Refine with AI" button to:
- Ensure consistency with R/HOOD brand voice
- Improve clarity and structure
- Enhance the brief while preserving all key information

## Display

- **Before application**: DJs see the short summary with a note that full brief is available after acceptance
- **After acceptance**: DJs see the full formatted brief with proper section headers, numbered points, and formatting

## Files

- **Form**: `app/admin/create-opportunity/page.tsx`
- **Brief Generator**: `generateBrief()` function in create-opportunity page
- **Brief Renderer**: `src/components/ui/brief-renderer.tsx`
- **Display Logic**: `app/admin/opportunities/[id]/page.tsx`
