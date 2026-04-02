import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import { getCurrentUserId, getCurrentUserProfile } from "@/lib/auth-utils";
import type {
  ApplicationListItem,
  ApplicationSourceType,
  ApplicationDetails,
  ApplicationDetailsResult,
  BrandRating,
  ListPortalApplicationsParams,
  ListPortalApplicationsResult,
  UserMix,
} from "@/lib/applications/types";

type RpcResult = { success?: boolean; error?: string } | null;
type RawProfile = {
  dj_name?: string | null;
  first_name?: string | null;
  city?: string | null;
  location?: string | null;
  genres?: string[] | null;
};
type RawOpportunity = { title?: string | null };
type RawForm = { title?: string | null };
type RawSimpleApplication = {
  id: string;
  user_id?: string | null;
  opportunity_id?: string | null;
  created_at?: string | null;
  status?: string | null;
  message?: string | null;
  gig_completed?: boolean | null;
  user_profiles?: RawProfile | null;
  opportunities?: RawOpportunity | null;
};
type RawFormResponse = {
  id: string;
  user_id?: string | null;
  opportunity_id?: string | null;
  submitted_at?: string | null;
  status?: string | null;
  review_notes?: string | null;
  gig_completed?: boolean | null;
  response_data?: { portfolio?: string; soundcloud?: string } | null;
  user_profiles?: RawProfile | null;
  opportunities?: RawOpportunity | null;
  application_forms?: RawForm | null;
};

function getDemoApplications(): ApplicationDetails[] {
  return [
    {
      id: "1",
      applicant: {
        name: "Alex Thompson",
        avatar: "/person1.jpg",
        location: "London, UK",
        genres: ["Techno", "House"],
        email: "alex.thompson@email.com",
        bio: "Passionate techno DJ with 3+ years of experience in underground venues across London.",
        instagram: "https://instagram.com/alexthompson",
        soundcloud: "https://soundcloud.com/alexthompson",
      },
      opportunity: "Underground Warehouse Rave",
      opportunityId: "1",
      appliedDate: "2024-01-15",
      status: "pending",
      coverLetter:
        "I'm excited to apply for this opportunity. I have extensive experience playing techno sets in underground venues and would love to bring my energy to this event.",
      userId: null,
      gigCompleted: false,
      organizerId: null,
    },
    {
      id: "2",
      applicant: {
        name: "Maya Rodriguez",
        avatar: "/person2.jpg",
        location: "Berlin, Germany",
        genres: ["Electronic", "Progressive"],
        email: "maya.rodriguez@email.com",
        bio: "Electronic music producer and DJ based in Berlin, specializing in progressive house and techno.",
        instagram: "https://instagram.com/mayarodriguez",
        soundcloud: "https://soundcloud.com/mayarodriguez",
      },
      opportunity: "Rooftop Summer Sessions",
      opportunityId: "2",
      appliedDate: "2024-01-18",
      status: "approved",
      coverLetter:
        "As a Berlin-based DJ, I bring a unique perspective to house music. I'm excited about the opportunity to play at this rooftop venue.",
      userId: null,
      gigCompleted: false,
      organizerId: null,
    },
    {
      id: "3",
      applicant: {
        name: "James Chen",
        avatar: "/person1.jpg",
        location: "Amsterdam, Netherlands",
        genres: ["Drum & Bass", "Dubstep"],
        email: "james.chen@email.com",
        bio: "Drum & Bass enthusiast with a passion for high-energy sets and crowd interaction.",
        instagram: null,
        soundcloud: "https://soundcloud.com/jcbeats",
      },
      opportunity: "Club Residency Audition",
      opportunityId: "3",
      appliedDate: "2024-01-20",
      status: "rejected",
      coverLetter:
        "I'm applying for this residency opportunity to showcase my drum & bass skills and build a long-term relationship with the venue.",
      userId: null,
      gigCompleted: false,
      organizerId: null,
    },
  ];
}

function getDemoApplicationById(id: string): ApplicationDetails {
  const fallback = getDemoApplications().find((app) => app.id === id);
  return fallback ?? getDemoApplications()[0];
}

async function fetchLatestUserMix(userId: string): Promise<UserMix | null> {
  const { data: uploadedByMix } = await supabase
    .from("mixes")
    .select("id, file_url")
    .eq("uploaded_by", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (uploadedByMix) return uploadedByMix;

  // Fallback for schemas that still use user_id
  const { data: userIdMix } = await supabase
    .from("mixes")
    .select("id, file_url")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return userIdMix ?? null;
}

export async function getApplicationDetails(
  applicationId: string
): Promise<ApplicationDetailsResult> {
  const profile = await getCurrentUserProfile();
  const currentUserRole = profile?.role ?? null;

  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
          *,
          opportunities!inner(title, organizer_id),
          user_profiles!inner(dj_name, city, genres, email, bio, profile_image_url, instagram, soundcloud)
        `
      )
      .eq("id", applicationId)
      .single();

    if (error) {
      const relationMissing =
        error.message?.includes("relation") && error.message?.includes("does not exist");
      if (relationMissing) {
        return {
          application: getDemoApplicationById(applicationId),
          userMix: null,
          currentUserRole,
          existingBrandRating: null,
          usedDemoFallback: true,
        };
      }
      throw error;
    }

    const application: ApplicationDetails = {
      id: data.id,
      applicant: {
        name: data.user_profiles?.dj_name || "Unknown",
        avatar: data.user_profiles?.profile_image_url || "/person1.jpg",
        location: data.user_profiles?.city || "Unknown",
        genres: data.user_profiles?.genres || [],
        email: data.user_profiles?.email || "Unknown",
        bio: data.user_profiles?.bio || "No bio available",
        instagram: data.user_profiles?.instagram || null,
        soundcloud: data.user_profiles?.soundcloud || null,
      },
      opportunity: data.opportunities?.title || "Unknown Opportunity",
      opportunityId: data.opportunity_id || null,
      appliedDate: data.created_at ? formatDate(data.created_at) : "Unknown",
      status: data.status || "pending",
      coverLetter: data.message || "No cover letter provided",
      userId: data.user_id || null,
      gigCompleted: Boolean(
        (data as { gig_completed?: boolean | null }).gig_completed
      ),
      organizerId: data.opportunities?.organizer_id || null,
    };

    const userMix = data.user_id ? await fetchLatestUserMix(data.user_id) : null;

    let existingBrandRating: BrandRating | null = null;
    if (application.gigCompleted && currentUserRole === "dj") {
      const currentUserId = await getCurrentUserId();
      if (currentUserId) {
        const { data: ratingData } = await supabase
          .from("ratings")
          .select("stars, comment")
          .eq("application_id", data.id)
          .eq("rating_type", "brand_rating")
          .eq("rater_id", currentUserId)
          .maybeSingle();
        existingBrandRating = ratingData ?? null;
      }
    }

    return {
      application,
      userMix,
      currentUserRole,
      existingBrandRating,
      usedDemoFallback: false,
    };
  } catch {
    return {
      application: getDemoApplicationById(applicationId),
      userMix: null,
      currentUserRole,
      existingBrandRating: null,
      usedDemoFallback: true,
    };
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "approved" | "rejected"
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    "admin_update_application_status",
    {
      p_application_id: applicationId,
      p_new_status: status,
    }
  );

  if (rpcError) {
    return {
      ok: false,
      message: `RPC function error: ${rpcError.message}. Please verify the migration was run and your user has role='admin' in user_profiles.`,
    };
  }

  const result = rpcResult as RpcResult;
  if (result && result.success !== true) {
    const errorMsg = result.error || "RPC function returned unsuccessful result";
    return {
      ok: false,
      message:
        errorMsg === "Only admins can use this function"
          ? "You don't have admin permissions. Please verify your user has role='admin' in user_profiles."
          : errorMsg,
    };
  }

  return { ok: true };
}

export async function submitBrandRating(params: {
  applicationId: string;
  organizerId: string;
  stars: number;
  comment: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: "Missing user information." };
  }

  const { error } = await supabase.from("ratings").insert({
    application_id: params.applicationId,
    rater_id: userId,
    ratee_id: params.organizerId,
    rating_type: "brand_rating",
    stars: params.stars,
    comment: params.comment.trim() || null,
  });

  if (error) {
    return { ok: false, message: error.message || "Failed to submit rating." };
  }

  return { ok: true };
}

function toDateLabel(dateValue: string | null | undefined): string {
  return dateValue ? formatDate(dateValue) : "Unknown";
}

function buildDemoPortalApplications(): ApplicationListItem[] {
  return [
    {
      id: "1",
      type: "simple",
      applicant: {
        name: "Alex Thompson",
        djName: "DJ AlexT",
        avatar: "/person1.jpg",
        location: "London, UK",
        genres: ["Techno", "House"],
      },
      opportunity: "Underground Warehouse Rave",
      opportunityId: "1",
      appliedDate: "2024-01-15",
      appliedAt: "2024-01-15T00:00:00.000Z",
      status: "pending",
      portfolio: "soundcloud.com/alexthompson",
      message: "",
      userId: null,
      gig_completed: false,
    },
    {
      id: "2",
      type: "simple",
      applicant: {
        name: "Maya Rodriguez",
        djName: "Maya R",
        avatar: "/person2.jpg",
        location: "Berlin, Germany",
        genres: ["Electronic", "Progressive"],
      },
      opportunity: "Rooftop Summer Sessions",
      opportunityId: "2",
      appliedDate: "2024-01-18",
      appliedAt: "2024-01-18T00:00:00.000Z",
      status: "approved",
      portfolio: "soundcloud.com/mayarodriguez",
      message: "",
      userId: null,
      gig_completed: false,
    },
  ];
}

function mapSimpleApplication(app: RawSimpleApplication): ApplicationListItem {
  return {
    id: app.id,
    type: "simple",
    applicant: {
      name: app.user_profiles?.dj_name || app.user_profiles?.first_name || "Unknown",
      djName: app.user_profiles?.dj_name || app.user_profiles?.first_name || "Unknown",
      avatar: "/person1.jpg",
      location: app.user_profiles?.city || app.user_profiles?.location || "Unknown",
      genres: app.user_profiles?.genres || [],
    },
    opportunity: app.opportunities?.title || "Unknown Opportunity",
    opportunityId: app.opportunity_id || null,
    appliedDate: toDateLabel(app.created_at),
    appliedAt: app.created_at || null,
    status: app.status || "pending",
    portfolio: "Unknown",
    message: app.message || "",
    userId: app.user_id || null,
    gig_completed: Boolean(app.gig_completed),
  };
}

function mapFormResponse(response: RawFormResponse): ApplicationListItem {
  return {
    id: response.id,
    type: "form_response",
    applicant: {
      name:
        response.user_profiles?.dj_name || response.user_profiles?.first_name || "Unknown",
      djName:
        response.user_profiles?.dj_name || response.user_profiles?.first_name || "Unknown",
      avatar: "/person1.jpg",
      location: response.user_profiles?.city || response.user_profiles?.location || "Unknown",
      genres: response.user_profiles?.genres || [],
    },
    opportunity:
      response.opportunities?.title ||
      response.application_forms?.title ||
      "Form Submission",
    opportunityId: response.opportunity_id || null,
    appliedDate: toDateLabel(response.submitted_at),
    appliedAt: response.submitted_at || null,
    status: response.status || "pending",
    portfolio:
      response.response_data?.portfolio || response.response_data?.soundcloud || "Unknown",
    message: response.review_notes || "",
    userId: response.user_id || null,
    gig_completed: Boolean(response.gig_completed),
  };
}

export async function listPortalApplications(
  params: ListPortalApplicationsParams
): Promise<ListPortalApplicationsResult> {
  try {
    const userProfile = await getCurrentUserProfile();
    const userId = await getCurrentUserId();

    let brandOpportunityIds: string[] | null = null;
    if (userProfile?.role === "brand" && userId) {
      const { data: brandOpportunities } = await supabase
        .from("opportunities")
        .select("id")
        .eq("organizer_id", userId);
      brandOpportunityIds = brandOpportunities?.map((opportunity) => opportunity.id) || [];
    }

    let applicationsQuery = supabase.from("applications").select(`
        *,
        opportunities(title, organizer_id),
        user_profiles(dj_name, first_name, last_name, city, location, genres, email)
      `);
    let formResponsesQuery = supabase.from("application_form_responses").select(`
        *,
        opportunities(title, organizer_id),
        user_profiles(dj_name, first_name, last_name, city, location, genres, email),
        application_forms(title)
      `);

    if (params.opportunityId) {
      applicationsQuery = applicationsQuery.eq("opportunity_id", params.opportunityId);
      formResponsesQuery = formResponsesQuery.eq("opportunity_id", params.opportunityId);
    }

    if (userProfile?.role === "brand" && brandOpportunityIds) {
      if (brandOpportunityIds.length === 0) {
        return { applications: [], usedDemoFallback: false };
      }
      applicationsQuery = applicationsQuery.in("opportunity_id", brandOpportunityIds);
      formResponsesQuery = formResponsesQuery.in("opportunity_id", brandOpportunityIds);
    }

    const [applicationsResult, formResponsesResult] = await Promise.all([
      applicationsQuery.order("created_at", { ascending: false }),
      formResponsesQuery.order("submitted_at", { ascending: false }),
    ]);

    const combined: ApplicationListItem[] = [
      ...(applicationsResult.data ?? []).map(mapSimpleApplication),
      ...(formResponsesResult.data ?? []).map(mapFormResponse),
    ];

    combined.sort((a, b) => {
      const aTime = a.appliedAt ? new Date(a.appliedAt).getTime() : 0;
      const bTime = b.appliedAt ? new Date(b.appliedAt).getTime() : 0;
      return bTime - aTime;
    });

    return { applications: combined, usedDemoFallback: false };
  } catch {
    return { applications: buildDemoPortalApplications(), usedDemoFallback: true };
  }
}

export async function updatePortalApplicationStatus(params: {
  applicationId: string;
  applicationType: ApplicationSourceType;
  status: "approved" | "rejected";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const rpcFunctionName =
    params.applicationType === "form_response"
      ? "admin_update_form_response_status"
      : "admin_update_application_status";

  const { data: rpcResult, error: rpcError } = await supabase.rpc(rpcFunctionName, {
    p_application_id: params.applicationId,
    p_new_status: params.status,
  });

  if (rpcError) {
    return {
      ok: false,
      message: `RPC function error: ${rpcError.message}. Please verify the migration was run and your user has role='admin' in user_profiles.`,
    };
  }

  const result = rpcResult as RpcResult;
  if (result && result.success !== true) {
    const errorMsg = result.error || "RPC function returned unsuccessful result";
    return {
      ok: false,
      message:
        errorMsg === "Only admins can use this function"
          ? "You don't have admin permissions. Please verify your user has role='admin' in user_profiles."
          : errorMsg,
    };
  }

  return { ok: true };
}

export async function completeGigAndRateDj(params: {
  applicationId: string;
  applicationType: ApplicationSourceType;
  djUserId: string;
  stars: number;
  comment: string;
}): Promise<{ ok: true; ratingSaved: boolean } | { ok: false; message: string }> {
  const userId = await getCurrentUserId();
  const userProfile = await getCurrentUserProfile();
  const userRole = userProfile?.role;

  if (!userId || (userRole !== "admin" && userRole !== "brand")) {
    return {
      ok: false,
      message: "Only admins or brands can mark gigs as completed.",
    };
  }

  const tableName =
    params.applicationType === "form_response"
      ? "application_form_responses"
      : "applications";

  const { error: updateError } = await supabase
    .from(tableName)
    .update({
      gig_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.applicationId);

  if (updateError) {
    return { ok: false, message: updateError.message || "Failed to complete gig." };
  }

  const { error: ratingError } = await supabase.from("ratings").insert({
    application_id: params.applicationId,
    rater_id: userId,
    ratee_id: params.djUserId,
    rating_type: "dj_rating",
    stars: params.stars,
    comment: params.comment.trim() || null,
  });

  if (ratingError) {
    return { ok: true, ratingSaved: false };
  }

  return { ok: true, ratingSaved: true };
}
