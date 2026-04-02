"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  fetchCommunityMembers,
  fetchUsersAvailableForCommunity,
  addCommunityMember,
} from "@/lib/communities/community-detail-api";
import type { UserOptionForCommunity } from "@/lib/communities/community-detail-types";
import { Plus } from "lucide-react";

function matchesUserSearch(user: UserOptionForCommunity, search: string) {
  if (!search) return true;
  const s = search.toLowerCase();
  const name = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
  const djName = (user.dj_name || "").toLowerCase();
  const brandName = (user.brand_name || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  return (
    name.includes(s) ||
    djName.includes(s) ||
    brandName.includes(s) ||
    email.includes(s)
  );
}

type Props = {
  communityId: string;
  onMemberAdded: () => void;
};

export function CommunityAddMemberTrigger({ communityId, onMemberAdded }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserOptionForCommunity[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (!open || !communityId) return;
    (async () => {
      const members = await fetchCommunityMembers(communityId);
      const ids = members.map((m) => m.user_id).filter(Boolean) as string[];
      const available = await fetchUsersAvailableForCommunity(ids);
      setAvailableUsers(available);
    })();
  }, [open, communityId]);

  const handleAdd = async () => {
    if (!selectedUserToAdd) {
      toast({
        title: "Error",
        description: "Please select a user to add",
        variant: "destructive",
      });
      return;
    }

    setIsAddingMember(true);
    try {
      const result = await addCommunityMember(communityId, selectedUserToAdd);
      if (!result.ok) {
        if (result.code === "duplicate") {
          toast({
            title: "Already a Member",
            description: result.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({ title: "Success", description: "Member added successfully" });
      setOpen(false);
      setSelectedUserToAdd(null);
      setSearchTerm("");
      onMemberAdded();
    } finally {
      setIsAddingMember(false);
    }
  };

  const filtered = availableUsers.filter((u) => matchesUserSearch(u, searchTerm));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Search and select a user to add to this community
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-user">Search Users</Label>
            <Input
              id="search-user"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
            />
          </div>
          <div className="space-y-2">
            <Label>Select User</Label>
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
              {filtered.map((user) => {
                const displayName =
                  user.dj_name ||
                  user.brand_name ||
                  `${user.first_name} ${user.last_name}`.trim() ||
                  user.email ||
                  "User";
                return (
                  <div
                    key={user.id}
                    className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-secondary ${
                      selectedUserToAdd === user.id
                        ? "bg-brand-green/20 border border-brand-green"
                        : ""
                    }`}
                    onClick={() => setSelectedUserToAdd(user.id)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profile_image_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {displayName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {displayName}
                      </p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {searchTerm
                    ? "No users found"
                    : "All users are already members"}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedUserToAdd(null);
              setSearchTerm("");
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!selectedUserToAdd || isAddingMember}
          >
            {isAddingMember ? "Adding..." : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
