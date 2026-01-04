# R/HOOD Brief Template Guide

This guide explains the structured brief template that brands use to create detailed opportunity briefs in the R/HOOD Studio.

## Overview

The brief system has two parts:
1. **Short Summary** (300 chars max) - Visible to all DJs before they apply
2. **Full Brief** - Only visible to DJs after their application is accepted

## Brief Structure (Designed for Gigs, Brand Sponsorships & Opportunities)

The full brief follows this structure:

### 1. Concept Proposal / The Idea
**Required field** - Describes the core concept and vision.

**Example:**
> We're launching a new product line and want to create an immersive brand experience through music. This opportunity brings together our brand values with underground music culture, creating an authentic connection with our target audience. We're looking for DJs who can help us tell our story through their unique sound and style.

### 2. Event Details
**Required field** - Provides comprehensive information about the event or gig.

**What to include:**
- Date, time, and duration
- Venue/location details
- Expected audience size
- Event type (club night, festival, brand activation, pop-up, etc.)
- Special requirements or unique aspects
- Setup and soundcheck times

**Example:**
> **Date & Time:** Saturday, March 15th, 2025, 10 PM - 2 AM  
> **Venue:** Warehouse venue in Shoreditch, London  
> **Capacity:** 500 people  
> **Event Type:** Brand launch party with live DJ performances  
> **Setup:** Soundcheck at 6 PM, doors open at 9 PM

### 3. Requirements & Expectations
**Required field** - Details what's expected from the DJ.

**What to include:**
- Equipment requirements (provided vs. bring your own)
- Set duration and format
- Genre preferences or restrictions
- Technical requirements (sound system, lighting, etc.)
- Dress code or style guidelines
- Arrival time and schedule
- Any other obligations or expectations

**Example:**
> **Set Duration:** 90-minute set  
> **Equipment:** Full DJ setup provided (CDJs, mixer, monitors)  
> **Genre:** House, Techno, or Deep House preferred  
> **Arrival:** 8 PM for briefing and setup  
> **Dress Code:** Smart casual, brand colors encouraged  
> **Social Media:** Required to post 3 times before event (content provided)

### 4. Brand Integration
**Required field** - Explains how the brand will be integrated into the opportunity.

**What to include:**
- Product placement requirements
- Brand mentions or messaging
- Social media requirements
- Content creation expectations
- Exclusivity agreements
- Brand guidelines to follow

**Example:**
> Our brand will be naturally integrated throughout the event. DJs will have our products visible on stage, and we'll provide branded materials for social media content. We require 3 Instagram posts (1 before, 1 during, 1 after) tagging our brand and using our event hashtag. Content guidelines and assets will be provided.

### 5. Why This Opportunity?
**Required field** - Explains the value proposition for DJs.

**What to include:**
- Exposure and audience reach
- Networking opportunities
- Career growth potential
- Creative freedom
- Media coverage
- Other benefits

**Example:**
> This opportunity offers significant exposure through our brand channels (500K+ followers), media coverage in music publications, and networking with industry professionals. DJs will be featured in our campaign content, receive professional photography and videography, and gain access to our network of venues and events.

### 6. Deliverables
**Required field** - Lists what's expected to be delivered.

**What to include:**
- Performance requirements
- Content creation (photos, videos, social posts)
- Exclusivity periods
- Usage rights
- Any other deliverables

**Example:**
> **Performance:** 90-minute DJ set at the event  
> **Content:** 5 high-quality photos and 1 short video clip for social media  
> **Social Posts:** 3 Instagram posts (content guidelines provided)  
> **Exclusivity:** No competing brand events for 30 days  
> **Usage Rights:** Brand can use content for marketing for 12 months

### 7. Compensation
**Required field** - Details payment and benefits.

**What to include:**
- Fee amount
- Payment schedule
- Additional benefits (travel, accommodation, meals, equipment)
- Royalties or residuals
- What's included

**Example:**
> **Fee:** £1,500  
> **Payment:** 50% deposit on acceptance, 50% on completion  
> **Additional:** Travel expenses covered, accommodation provided for out-of-town DJs, meals included on event day, professional photography and videography included

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
- **After acceptance**: DJs see the full formatted brief with proper section headers and formatting

## Files

- **Form**: `app/admin/create-opportunity/page.tsx`
- **Brief Generator**: `generateBrief()` function in create-opportunity page
- **Brief Renderer**: `src/components/ui/brief-renderer.tsx`
- **Display Logic**: `app/admin/opportunities/[id]/page.tsx`
