"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, X, Plus, ArrowLeft, FileText } from "lucide-react";

interface FormField {
  clientId: string;
  dbId: string | null;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

type OpportunityOption = {
  id: string;
  title: string | null;
};

type FormValidationError = {
  fieldId: string;
  message: string;
};

const FIELD_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "textarea", label: "Text Area" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date Picker" },
  { value: "number", label: "Number Input" },
] as const;

const OPTION_FIELD_TYPES = new Set(["select", "radio", "checkbox"]);

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const formIdParam = params.id;
  const formId = Array.isArray(formIdParam) ? formIdParam[0] : formIdParam;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    opportunity_id: "",
    is_active: true,
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [availableOpportunities, setAvailableOpportunities] = useState<
    OpportunityOption[]
  >(
    []
  );
  const [validationErrors, setValidationErrors] = useState<FormValidationError[]>(
    []
  );

  // Load form data and opportunities on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!formId) {
        setLoadError("Invalid form id");
        setIsLoading(false);
        return;
      }

      try {
        const [opportunitiesRes, formRes, fieldsRes] = await Promise.all([
          supabase
            .from("opportunities")
            .select("id, title")
            .eq("is_active", true)
            .order("title"),
          supabase
            .from("application_forms")
            .select("*")
            .eq("id", formId)
            .single(),
          supabase
            .from("application_form_fields")
            .select("*")
            .eq("form_id", formId)
            .order("field_order"),
        ]);

        if (opportunitiesRes.error) {
          throw opportunitiesRes.error;
        }

        setAvailableOpportunities((opportunitiesRes.data ?? []) as OpportunityOption[]);

        if (formRes.error) {
          throw formRes.error;
        }

        const form = formRes.data;
        if (form) {
          setFormData({
            title: form.title,
            description: form.description || "",
            opportunity_id: form.opportunity_id || "none",
            is_active: form.is_active,
          });
        }

        if (fieldsRes.error) {
          throw fieldsRes.error;
        }

        const transformedFields = (fieldsRes.data || []).map((field: {
          id: string;
          field_type: string;
          field_name: string;
          field_label: string;
          field_placeholder: string | null;
          is_required: boolean;
          field_options: string[] | null;
        }) => ({
          clientId: field.id,
          dbId: field.id,
          type: field.field_type,
          name: field.field_name,
          label: field.field_label,
          placeholder: field.field_placeholder || "",
          required: field.is_required,
          options: Array.isArray(field.field_options) ? field.field_options : [],
        }));
        setFields(transformedFields);
        setLoadError(null);
      } catch (error) {
        setLoadError("Failed to load form editor data.");
        toast({
          title: "Error",
          description: "Failed to load form data. Please retry.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formId, toast]);

  const validationErrorMap = useMemo(() => {
    const map = new Map<string, string>();
    validationErrors.forEach((err: FormValidationError) =>
      map.set(err.fieldId, err.message)
    );
    return map;
  }, [validationErrors]);

  const addField = () => {
    const newField: FormField = {
      clientId: `local_${crypto.randomUUID()}`,
      dbId: null,
      type: "text",
      name: "",
      label: "",
      placeholder: "",
      required: false,
      options: [],
    };
    setFields((prev) => [...prev, newField]);
  };

  const updateField = (fieldClientId: string, updates: Partial<FormField>) => {
    setFields((prev) =>
      prev.map((field) =>
        field.clientId === fieldClientId ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (fieldClientId: string) => {
    setFields((prev) => prev.filter((field) => field.clientId !== fieldClientId));
  };

  const addOption = (fieldClientId: string) => {
    setFields((prev) =>
      prev.map((field) =>
        field.clientId === fieldClientId
          ? { ...field, options: [...(field.options || []), ""] }
          : field
      )
    );
  };

  const updateOption = (
    fieldClientId: string,
    optionIndex: number,
    value: string
  ) => {
    setFields((prev) =>
      prev.map((field) =>
        field.clientId === fieldClientId
          ? {
              ...field,
              options:
                field.options?.map((opt, idx) =>
                  idx === optionIndex ? value : opt
                ) || [],
            }
          : field
      )
    );
  };

  const removeOption = (fieldClientId: string, optionIndex: number) => {
    setFields((prev) =>
      prev.map((field) =>
        field.clientId === fieldClientId
          ? {
              ...field,
              options:
                field.options?.filter((_, idx) => idx !== optionIndex) || [],
            }
          : field
      )
    );
  };

  const validateBeforeSubmit = (): FormValidationError[] => {
    const errors: FormValidationError[] = [];

    if (!formData.title.trim()) {
      errors.push({ fieldId: "__form__", message: "Form title is required." });
    }

    const seenNames = new Set<string>();
    fields.forEach((field) => {
      if (!field.name.trim()) {
        errors.push({
          fieldId: field.clientId,
          message: "Field name is required.",
        });
      }
      if (!field.label.trim()) {
        errors.push({
          fieldId: field.clientId,
          message: "Field label is required.",
        });
      }

      const normalizedName = field.name.trim().toLowerCase();
      if (normalizedName) {
        if (seenNames.has(normalizedName)) {
          errors.push({
            fieldId: field.clientId,
            message: "Field names must be unique.",
          });
        }
        seenNames.add(normalizedName);
      }

      if (OPTION_FIELD_TYPES.has(field.type)) {
        const nonEmptyOptions = (field.options ?? []).filter((opt: string) =>
          opt.trim()
        );
        if (nonEmptyOptions.length === 0) {
          errors.push({
            fieldId: field.clientId,
            message: "This field type needs at least one option.",
          });
        }
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId) return;

    const errors = validateBeforeSubmit();
    setValidationErrors(errors);
    if (errors.length > 0) {
      toast({
        title: "Fix validation errors",
        description: errors[0]?.message ?? "Please review the form and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update the form
      const { error: formError } = await supabase
        .from("application_forms")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          opportunity_id:
            formData.opportunity_id === "none"
              ? null
              : formData.opportunity_id || null,
          is_active: formData.is_active,
        })
        .eq("id", formId);

      if (formError) {
        throw formError;
      }

      const payload = fields.map((field, index) => ({
        id: field.dbId ?? undefined,
        form_id: formId,
        field_type: field.type,
        field_name: field.name.trim(),
        field_label: field.label.trim(),
        field_placeholder: field.placeholder?.trim() || null,
        field_options: OPTION_FIELD_TYPES.has(field.type)
          ? (field.options ?? [])
              .map((o: string) => o.trim())
              .filter(Boolean)
          : null,
        is_required: field.required,
        field_order: index + 1,
      }));

      const existingDbIds = fields
        .map((field) => field.dbId)
        .filter((id): id is string => Boolean(id));

      const { data: existingRows, error: existingRowsError } = await supabase
        .from("application_form_fields")
        .select("id")
        .eq("form_id", formId);

      if (existingRowsError) {
        throw existingRowsError;
      }

      const existingIdsInDb = (existingRows ?? []).map((row: { id: string }) => row.id);
      const idsToDelete = existingIdsInDb.filter(
        (id: string) => !existingDbIds.includes(id)
      );

      if (idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("application_form_fields")
          .delete()
          .in("id", idsToDelete);
        if (deleteError) {
          throw deleteError;
        }
      }

      if (payload.length > 0) {
        const { error: upsertError } = await supabase
          .from("application_form_fields")
          .upsert(payload, { onConflict: "id" });

        if (upsertError) {
          throw upsertError;
        }
      }

      toast({
        title: "Success",
        description: "Form updated successfully!",
      });

      router.push("/admin/forms");
    } catch {
      toast({
        title: "Error",
        description: "Failed to update form. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6 animate-blur-in">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Couldn&apos;t load form editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className={textStyles.body.regular}>{loadError}</p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/forms")}>
                Back to forms
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            Edit Application Brief
          </h1>
          <p className={textStyles.body.regular}>
            Modify the brief details and fields
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={textStyles.body.regular}>
                Form Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., DJ Application Form"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
            {validationErrorMap.get("__form__") && (
              <p className="text-sm text-red-400">{validationErrorMap.get("__form__")}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="description" className={textStyles.body.regular}>
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this form is for..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="opportunity" className={textStyles.body.regular}>
                Link to Opportunity (Optional)
              </Label>
              <Select
                value={formData.opportunity_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, opportunity_id: value }))
                }
              >
                <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select an opportunity (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="none"
                    className="text-foreground hover:bg-accent"
                  >
                    No specific opportunity
                  </SelectItem>
                  {availableOpportunities.map((opportunity: OpportunityOption) => (
                    <SelectItem
                      key={opportunity.id}
                      value={opportunity.id}
                      className="text-foreground hover:bg-accent"
                    >
                      {opportunity.title ?? "Untitled opportunity"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                }
                className="rounded border-border"
              />
              <Label htmlFor="is_active" className={textStyles.body.regular}>
                Active form
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={textStyles.subheading.small}>
                Form Fields
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                onClick={addField}
                className="text-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className={textStyles.body.regular}>
                  No fields added yet. Click &quot;Add Field&quot; to start
                  building your form.
                </p>
              </div>
            ) : (
              fields.map((field, index) => (
                <Card key={field.clientId} className="bg-secondary border-border">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className={textStyles.body.regular}>
                          Field {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeField(field.clientId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {validationErrorMap.get(field.clientId) && (
                        <p className="text-sm text-red-400">
                          {validationErrorMap.get(field.clientId)}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className={textStyles.body.small}>
                            Field Type
                          </Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) =>
                              updateField(field.clientId, { type: value })
                            }
                          >
                            <SelectTrigger className="bg-background border-border text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {FIELD_TYPES.map((type) => (
                                <SelectItem
                                  key={type.value}
                                  value={type.value}
                                  className="text-foreground hover:bg-accent"
                                >
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className={textStyles.body.small}>
                            Field Name
                          </Label>
                          <Input
                            placeholder="e.g., dj_name"
                            value={field.name}
                            onChange={(e) =>
                              updateField(field.clientId, { name: e.target.value })
                            }
                            className="bg-background border-border text-foreground"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={textStyles.body.small}>
                          Field Label
                        </Label>
                        <Input
                          placeholder="e.g., DJ Name"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.clientId, { label: e.target.value })
                          }
                          className="bg-background border-border text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className={textStyles.body.small}>
                          Placeholder (Optional)
                        </Label>
                        <Input
                          placeholder="e.g., Enter your DJ name"
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(field.clientId, {
                              placeholder: e.target.value,
                            })
                          }
                          className="bg-background border-border text-foreground"
                        />
                      </div>

                      {/* Options for select, radio, checkbox */}
                      {(field.type === "select" ||
                        field.type === "radio" ||
                        field.type === "checkbox") && (
                        <div className="space-y-2">
                          <Label className={textStyles.body.small}>
                            Options
                          </Label>
                          <div className="space-y-2">
                            {(field.options || []).map(
                              (option: string, optionIndex: number) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <Input
                                    placeholder={`Option ${optionIndex + 1}`}
                                    value={option}
                                    onChange={(e) =>
                                      updateOption(
                                        field.clientId,
                                        optionIndex,
                                        e.target.value
                                      )
                                    }
                                    className="bg-background border-border text-foreground"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      removeOption(field.clientId, optionIndex)
                                    }
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addOption(field.clientId)}
                              className="text-foreground"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`required_${field.clientId}`}
                          checked={field.required}
                          onChange={(e) =>
                            updateField(field.clientId, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded border-border"
                        />
                        <Label
                          htmlFor={`required_${field.clientId}`}
                          className={textStyles.body.small}
                        >
                          Required field
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="submit"
            className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Updating..." : "Update Form"}
          </Button>
        </div>
      </form>
    </div>
  );
}
