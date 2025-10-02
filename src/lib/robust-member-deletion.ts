// Robust member deletion function
// This is a standalone function that can be imported into the members pages

import { supabase } from "@/integrations/supabase/client";

export interface DeletionResult {
  success: boolean;
  error?: string;
  deletedRecords: {
    communityMembers: number;
    messages: number;
    applications: number;
    connections: number;
    userProfile: boolean;
  };
}

export async function deleteMemberRobust(userId: string): Promise<DeletionResult> {
  const result: DeletionResult = {
    success: false,
    deletedRecords: {
      communityMembers: 0,
      messages: 0,
      applications: 0,
      connections: 0,
      userProfile: false,
    },
  };

  try {
    console.log(`Starting robust deletion for user: ${userId}`);

    // Step 1: Delete from community_members
    console.log("Step 1: Deleting community members...");
    const { data: communityMembersData, error: communityMembersError } = await supabase
      .from("community_members")
      .delete()
      .eq("user_id", userId)
      .select("id");

    if (communityMembersError) {
      console.error("Error deleting community members:", communityMembersError);
      result.error = `Failed to delete community members: ${communityMembersError.message}`;
      return result;
    }
    result.deletedRecords.communityMembers = communityMembersData?.length || 0;
    console.log(`Deleted ${result.deletedRecords.communityMembers} community member records`);

    // Step 2: Delete from messages
    console.log("Step 2: Deleting messages...");
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("sender_id", userId)
      .select("id");

    if (messagesError) {
      console.error("Error deleting messages:", messagesError);
      result.error = `Failed to delete messages: ${messagesError.message}`;
      return result;
    }
    result.deletedRecords.messages = messagesData?.length || 0;
    console.log(`Deleted ${result.deletedRecords.messages} message records`);

    // Step 3: Delete from applications
    console.log("Step 3: Deleting applications...");
    const { data: applicationsData, error: applicationsError } = await supabase
      .from("applications")
      .delete()
      .eq("user_id", userId)
      .select("id");

    if (applicationsError) {
      console.error("Error deleting applications:", applicationsError);
      result.error = `Failed to delete applications: ${applicationsError.message}`;
      return result;
    }
    result.deletedRecords.applications = applicationsData?.length || 0;
    console.log(`Deleted ${result.deletedRecords.applications} application records`);

    // Step 4: Delete from connections (both directions)
    console.log("Step 4: Deleting connections...");
    
    // Delete where user is follower
    const { data: followerData, error: followerError } = await supabase
      .from("connections" as any)
      .delete()
      .eq("follower_id", userId)
      .select("id");

    if (followerError) {
      console.error("Error deleting follower connections:", followerError);
      // Don't fail completely - connections might not exist
      console.log("Continuing despite follower connection error");
    }

    // Delete where user is following
    const { data: followingData, error: followingError } = await supabase
      .from("connections" as any)
      .delete()
      .eq("following_id", userId)
      .select("id");

    if (followingError) {
      console.error("Error deleting following connections:", followingError);
      // Don't fail completely - connections might not exist
      console.log("Continuing despite following connection error");
    }

    result.deletedRecords.connections = (followerData?.length || 0) + (followingData?.length || 0);
    console.log(`Deleted ${result.deletedRecords.connections} connection records`);

    // Step 5: Finally delete the user profile
    console.log("Step 5: Deleting user profile...");
    const { data: userProfileData, error: userProfileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId)
      .select("id");

    if (userProfileError) {
      console.error("Error deleting user profile:", userProfileError);
      result.error = `Failed to delete user profile: ${userProfileError.message}`;
      return result;
    }

    result.deletedRecords.userProfile = userProfileData?.length > 0;
    console.log(`Deleted user profile: ${result.deletedRecords.userProfile}`);

    // Success!
    result.success = true;
    console.log("Member deletion completed successfully");
    console.log("Deletion summary:", result.deletedRecords);

    return result;

  } catch (error) {
    console.error("Unexpected error during member deletion:", error);
    result.error = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
}

// Alternative function for cascade deletion using database constraints
export async function deleteMemberWithCascade(userId: string): Promise<DeletionResult> {
  const result: DeletionResult = {
    success: false,
    deletedRecords: {
      communityMembers: 0,
      messages: 0,
      applications: 0,
      connections: 0,
      userProfile: false,
    },
  };

  try {
    console.log(`Starting cascade deletion for user: ${userId}`);

    // Try direct deletion first - if foreign keys are set to CASCADE, this should work
    const { data: userProfileData, error: userProfileError } = await supabase
      .from("user_profiles")
      .delete()
      .eq("id", userId)
      .select("id");

    if (userProfileError) {
      console.error("Direct deletion failed:", userProfileError);
      
      // If direct deletion fails, fall back to manual deletion
      console.log("Falling back to manual deletion...");
      return await deleteMemberRobust(userId);
    }

    result.deletedRecords.userProfile = userProfileData?.length > 0;
    result.success = true;
    console.log("Cascade deletion completed successfully");

    return result;

  } catch (error) {
    console.error("Unexpected error during cascade deletion:", error);
    result.error = `Unexpected error: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
}
