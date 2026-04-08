"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateFormPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    opportunity_id: "",
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

  // Load opportunities on component mount
  React.useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const { data, error } = await supabase
          .from("opportunities")
          .select("id, title")
          .eq("is_active", true)
          .order("title");

        if (error) {
          console.error("Error fetching opportunities:", error);
        } else {
          setAvailableOpportunities((data ?? []) as OpportunityOption[]);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
      }
    };

    fetchOpportunities();
  }, []);

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

  const validateBeforeSave = (isActive: boolean): FormValidationError[] => {
    const errors: FormValidationError[] = [];

    if (isActive && !formData.title.trim()) {
      errors.push({ fieldId: "__form__", message: "Brief title is required." });
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

  const persistForm = async (isActive: boolean) => {
    const errors = validateBeforeSave(isActive);
    setValidationErrors(errors);
    if (errors.length > 0) {
      toast({
        title: "Fix validation errors",
        description: errors[0]?.message ?? "Please review and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: createdForm, error: formError } = await supabase
        .from("application_forms")
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          opportunity_id:
            formData.opportunity_id === "none"
              ? null
              : formData.opportunity_id || null,
          is_active: isActive,
        })
        .select()
        .single();

      if (formError) {
        throw formError;
      }

      if (fields.length > 0) {
        const fieldsToInsert = fields.map((field: FormField, index: number) => ({
          form_id: createdForm.id,
          field_type: field.type,
          field_name: field.name.trim(),
          field_label: field.label.trim(),
          field_placeholder: field.placeholder?.trim() || null,
          field_options: OPTION_FIELD_TYPES.has(field.type)
            ? (field.options ?? [])
                .map((opt: string) => opt.trim())
                .filter(Boolean)
            : null,
          is_required: field.required,
          field_order: index + 1,
        }));

        const { error: fieldsError } = await supabase
          .from("application_form_fields")
          .insert(fieldsToInsert);

        if (fieldsError) {
          await supabase
            .from("application_forms")
            .delete()
            .eq("id", createdForm.id);
          throw fieldsError;
        }
      }

      toast({
        title: isActive ? "Success" : "Draft Saved",
        description: isActive
          ? "Application form created successfully!"
          : "Form and fields saved as draft successfully!",
      });

      router.push("/admin/forms");
    } catch {
      toast({
        title: "Error",
        description: isActive
          ? "Failed to create form. Please try again."
          : "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await persistForm(true);
    setIsSubmitting(false);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    await persistForm(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            Create Application Brief
          </h1>
          <p className={textStyles.body.regular}>
            Build a custom application brief for DJs
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
                Brief Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., DJ Application Brief"
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
                placeholder="Describe what this brief is for..."
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
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={textStyles.subheading.small}>
                Brief Fields
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
                  building your brief.
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
                              (option, optionIndex) => (
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
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="submit"
            className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Form"}
          </Button>
        </div>
      </form>
    </div>
  );
}
