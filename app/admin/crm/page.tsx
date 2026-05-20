"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { textStyles } from "@/lib/typography";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  Music2,
  Building2,
  MessageCircle,
  Database,
} from "lucide-react";
import Link from "next/link";
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
  seedContacts,
  CATEGORY_OPTIONS,
  ONBOARDING_STATUS_OPTIONS,
  type CrmContact,
  type CrmCategory,
  type OnboardingStatus,
} from "@/lib/crm/service";

const PIPELINE_STAGES: OnboardingStatus[] = [
  "Not Contacted",
  "Contacted",
  "Responded",
  "Onboarded",
  "Active",
];

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  category: "DJ" as CrmCategory,
  phone_number: "",
  email: "",
  onboarding_status: "Not Contacted" as OnboardingStatus,
  notes: "",
};

function StatusBadge({ status }: { status: OnboardingStatus }) {
  const opt = ONBOARDING_STATUS_OPTIONS.find((o) => o.value === status);
  return (
    <Badge variant="outline" className={`text-xs ${opt?.color ?? ""}`}>
      {status}
    </Badge>
  );
}

function CategoryIcon({ category }: { category: CrmCategory }) {
  return category === "Brand" ? (
    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
  ) : (
    <Music2 className="h-3.5 w-3.5 text-muted-foreground" />
  );
}

export default function CrmPage() {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CrmCategory>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | OnboardingStatus>("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CrmContact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<CrmContact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    const result = await listContacts();
    if (!result.ok) {
      toast({ title: "Error", description: result.message, variant: "destructive" });
      setContacts([]);
    } else {
      setContacts(result.contacts);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const handleSeed = async () => {
    setIsSeeding(true);
    const result = await seedContacts();
    if (!result.ok) {
      toast({ title: "Seed failed", description: result.message, variant: "destructive" });
    } else {
      toast({ title: "Beta testers seeded", description: "12 contacts added." });
      fetchContacts();
    }
    setIsSeeding(false);
  };

  const openAdd = () => {
    setEditingContact(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (contact: CrmContact) => {
    setEditingContact(contact);
    setForm({
      first_name:        contact.first_name,
      last_name:         contact.last_name ?? "",
      category:          contact.category,
      phone_number:      contact.phone_number ?? "",
      email:             contact.email ?? "",
      onboarding_status: contact.onboarding_status,
      notes:             contact.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.first_name.trim()) {
      toast({ title: "First name required", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      if (editingContact) {
        const result = await updateContact(editingContact.id, {
          first_name:        form.first_name,
          last_name:         form.last_name || null,
          category:          form.category,
          phone_number:      form.phone_number || null,
          email:             form.email || null,
          onboarding_status: form.onboarding_status,
          notes:             form.notes || null,
        });
        if (!result.ok) throw new Error(result.message);
        setContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? result.contact : c))
        );
        toast({ title: "Contact updated" });
      } else {
        const result = await createContact({
          first_name:        form.first_name,
          last_name:         form.last_name || null,
          category:          form.category,
          phone_number:      form.phone_number || null,
          email:             form.email || null,
          onboarding_status: form.onboarding_status,
          notes:             form.notes || null,
        });
        if (!result.ok) throw new Error(result.message);
        setContacts((prev) => [...prev, result.contact]);
        toast({ title: "Contact added" });
      }
      setDialogOpen(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteContact(deleteTarget.id);
    if (!result.ok) {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast({ title: "Contact deleted" });
      setDeleteTarget(null);
    }
    setIsDeleting(false);
  };

  const handleStatusChange = async (contact: CrmContact, status: OnboardingStatus) => {
    const result = await updateContact(contact.id, { onboarding_status: status });
    if (!result.ok) {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    } else {
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? result.contact : c)));
    }
  };

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        (c.phone_number ?? "").includes(q);
      const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
      const matchStatus = statusFilter === "all" || c.onboarding_status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [contacts, searchTerm, categoryFilter, statusFilter]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<OnboardingStatus, number> = {
      "Not Contacted": 0, Contacted: 0, Responded: 0, Onboarded: 0, Active: 0, Inactive: 0,
    };
    contacts.forEach((c) => { counts[c.onboarding_status] = (counts[c.onboarding_status] ?? 0) + 1; });
    return counts;
  }, [contacts]);

  const updateForm = <K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-green text-lg sm:text-xl md:text-2xl">
            Beta CRM
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Track beta testers through the onboarding pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contacts.length === 0 && !isLoading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={isSeeding}
              className="border-border text-muted-foreground hover:text-foreground"
            >
              <Database className="h-4 w-4 mr-2" />
              {isSeeding ? "Seeding..." : "Seed beta testers"}
            </Button>
          )}
          <Link href="/admin/feedback">
            <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:text-foreground">
              <MessageCircle className="h-4 w-4 mr-2" />
              Feedback log
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={openAdd}
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add contact
          </Button>
        </div>
      </div>

      {/* Onboarding Pipeline */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-brand-green" />
            Onboarding Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-0">
            {PIPELINE_STAGES.map((stage, idx) => {
              const opt = ONBOARDING_STATUS_OPTIONS.find((o) => o.value === stage)!;
              const count = pipelineCounts[stage] ?? 0;
              const isActive = statusFilter === stage;
              return (
                <div key={stage} className="flex items-center flex-1 min-w-[110px]">
                  <button
                    onClick={() => setStatusFilter(isActive ? "all" : stage)}
                    className={`flex-1 min-w-[100px] flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-brand-green/15 ring-1 ring-brand-green/40"
                        : "hover:bg-secondary/60"
                    }`}
                  >
                    <span
                      className={`text-2xl font-bold tabular-nums ${
                        isActive ? "text-brand-green" : "text-foreground"
                      }`}
                    >
                      {count}
                    </span>
                    <Badge variant="outline" className={`text-xs pointer-events-none ${opt.color}`}>
                      {stage}
                    </Badge>
                  </button>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="flex items-center px-0.5 text-muted-foreground/40 self-center">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Click a stage to filter contacts below
          </p>
        </CardContent>
      </Card>

      {/* Filters + Contact List */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-secondary border-border"
              />
            </div>
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
            >
              <SelectTrigger className="w-full sm:w-[160px] bg-secondary border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {ONBOARDING_STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-secondary/60" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {contacts.length === 0
                ? "No contacts yet — seed beta testers or add one manually."
                : "No contacts match your filters."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((contact) => (
                <div
                  key={contact.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  {/* Left: name + meta */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <CategoryIcon category={contact.category} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {contact.first_name} {contact.last_name ?? ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        {contact.email && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone_number && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone_number}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className="text-xs border-border text-muted-foreground"
                        >
                          {contact.category}
                        </Badge>
                      </div>
                      {contact.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                    <Select
                      value={contact.onboarding_status}
                      onValueChange={(v) => handleStatusChange(contact, v as OnboardingStatus)}
                    >
                      <SelectTrigger className="h-8 w-[150px] bg-background border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ONBOARDING_STATUS_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => openEdit(contact)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(contact)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <p className="text-xs text-muted-foreground text-right mt-3">
              {filtered.length} of {contacts.length} contacts
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit contact" : "Add contact"}</DialogTitle>
            <DialogDescription>
              {editingContact
                ? "Update this beta tester's details."
                : "Add a new beta tester to the CRM."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name *</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => updateForm("first_name", e.target.value)}
                className="bg-secondary border-border"
                placeholder="Selecta"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => updateForm("last_name", e.target.value)}
                className="bg-secondary border-border"
                placeholder="Suave"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateForm("category", v as CrmCategory)}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Onboarding status</Label>
              <Select
                value={form.onboarding_status}
                onValueChange={(v) => updateForm("onboarding_status", v as OnboardingStatus)}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ONBOARDING_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="bg-secondary border-border"
                placeholder="dj@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone_number}
                onChange={(e) => updateForm("phone_number", e.target.value)}
                className="bg-secondary border-border"
                placeholder="+44 7700 900000"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateForm("notes", e.target.value)}
                className="bg-secondary border-border"
                placeholder="Any context about this contact..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            >
              {isSaving ? "Saving..." : editingContact ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="text-foreground font-medium">
                {deleteTarget?.first_name} {deleteTarget?.last_name ?? ""}
              </span>{" "}
              from the CRM. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
