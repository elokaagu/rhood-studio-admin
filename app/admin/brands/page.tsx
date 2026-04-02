"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchBrandsWithStats } from "@/lib/brands/fetch-brands-with-stats";
import { deleteBrandWithRelations } from "@/lib/brands/delete-brand";
import type {
  BrandMember,
  BrandsAggregateStats,
  BrandsSortOption,
} from "@/lib/brands/types";
import { textStyles } from "@/lib/typography";
import { BrandInviteSection } from "@/components/admin/brands/BrandInviteSection";
import { BrandStatsCards } from "@/components/admin/brands/BrandStatsCards";
import { BrandFiltersToolbar } from "@/components/admin/brands/BrandFiltersToolbar";
import { BrandMemberList } from "@/components/admin/brands/BrandMemberList";
import { BrandDeleteDialog } from "@/components/admin/brands/BrandDeleteDialog";
import { BrandMessageDialog } from "@/components/admin/brands/BrandMessageDialog";

const emptyStats: BrandsAggregateStats = {
  totalBrands: 0,
  totalOpportunities: 0,
  totalApplications: 0,
  totalPending: 0,
};

export default function BrandsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<BrandsSortOption>("date_joined_newest");
  const [members, setMembers] = useState<BrandMember[]>([]);
  const [totalStats, setTotalStats] = useState<BrandsAggregateStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<BrandMember | null>(null);
  const [messageContent, setMessageContent] = useState("");

  const loadBrands = async () => {
    try {
      setIsLoading(true);
      const result = await fetchBrandsWithStats(sortBy);

      if (!result.ok) {
        if (result.code === "table_missing") {
          console.warn(
            "User profiles table doesn't exist yet. Using demo data."
          );
          toast({
            title: "Database Setup Required",
            description:
              "User profiles table not found. Please create it in Supabase dashboard.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Database Error",
            description: result.message,
            variant: "destructive",
          });
        }
        setMembers([]);
        setTotalStats(emptyStats);
        return;
      }

      setMembers(result.members);
      setTotalStats(result.aggregateStats);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast({
        title: "Database Error",
        description: "Failed to load brands from database.",
        variant: "destructive",
      });
      setMembers([]);
      setTotalStats(emptyStats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [sortBy]);

  const filteredMembers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return members.filter((member: BrandMember) => {
      const matchesSearch =
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.location ?? "").toLowerCase().includes(q) ||
        (member.brandName?.toLowerCase().includes(q) ?? false);

      const matchesFilter =
        activeFilter === "all" || member.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [members, searchTerm, activeFilter]);

  const handleMessageMember = (member: BrandMember) => {
    setSelectedMember(member);
    setMessageContent("");
    setMessageModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedMember) return;

    const subject = encodeURIComponent(`Message from R/HOOD Admin`);
    const body = encodeURIComponent(messageContent);
    window.location.href = `mailto:${selectedMember.email}?subject=${subject}&body=${body}`;

    toast({
      title: "Message Sent",
      description: `Opening email client to send message to ${selectedMember.name}`,
    });

    setMessageModalOpen(false);
    setMessageContent("");
    setSelectedMember(null);
  };

  const handleDeleteRequest = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setDeleteModalOpen(true);
  };

  const cancelDeleteMember = () => {
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;
    const deletedId = memberToDelete.id;
    const deletedName = memberToDelete.name;

    try {
      const result = await deleteBrandWithRelations(deletedId);
      if (!result.ok) {
        toast({
          title: "Delete Failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      const refreshed = await fetchBrandsWithStats(sortBy);
      if (refreshed.ok) {
        setMembers(refreshed.members);
        setTotalStats(refreshed.aggregateStats);
      } else {
        setMembers((prev: BrandMember[]) =>
          prev.filter((m: BrandMember) => m.id !== deletedId)
        );
      }

      toast({
        title: "Brand Deleted",
        description: `"${deletedName}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      cancelDeleteMember();
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-green text-lg sm:text-xl md:text-2xl">
            BRANDS
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            View brand activity, opportunities, and applications
          </p>
        </div>
        <BrandInviteSection />
      </div>

      {!isLoading && members.length > 0 && (
        <BrandStatsCards stats={totalStats} />
      )}

      <BrandFiltersToolbar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <BrandMemberList
        members={filteredMembers}
        isLoading={isLoading}
        onMessage={handleMessageMember}
        onDeleteRequest={handleDeleteRequest}
      />

      <BrandDeleteDialog
        open={deleteModalOpen}
        onOpenChange={(open: boolean) => {
          setDeleteModalOpen(open);
          if (!open) setMemberToDelete(null);
        }}
        memberName={memberToDelete?.name ?? null}
        onConfirm={confirmDeleteMember}
        onCancel={cancelDeleteMember}
      />

      <BrandMessageDialog
        open={messageModalOpen}
        onOpenChange={(open: boolean) => {
          setMessageModalOpen(open);
          if (!open) {
            setMessageContent("");
            setSelectedMember(null);
          }
        }}
        member={selectedMember}
        messageContent={messageContent}
        onMessageContentChange={setMessageContent}
        onSend={handleSendMessage}
        onCancel={() => {
          setMessageModalOpen(false);
          setMessageContent("");
          setSelectedMember(null);
        }}
      />
    </div>
  );
}
