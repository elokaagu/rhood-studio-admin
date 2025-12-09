"use client";

import React, { useState, useEffect } from "react";
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
  id: string;
  type: string;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const formId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    opportunity_id: "",
    is_active: true,
  });
  const [fields, setFields] = useState<FormField[]>([]);
  const [availableOpportunities, setAvailableOpportunities] = useState<any[]>(
    []
  );

  // Load form data and opportunities on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch opportunities
        const { data: opportunities, error: oppError } = await supabase
          .from("opportunities")
          .select("id, title")
          .eq("is_active", true)
          .order("title");

        if (oppError) {
          console.error("Error fetching opportunities:", oppError);
        } else {
          setAvailableOpportunities(opportunities || []);
        }

        // Fetch form data
        const { data: form, error: formError } = await supabase
          .from("application_forms")
          .select("*")
          .eq("id", formId as string)
          .single();

        if (formError) {
          throw formError;
        }

        if (form) {
          setFormData({
            title: form.title,
            description: form.description || "",
            opportunity_id: form.opportunity_id || "none",
            is_active: form.is_active,
          });

          // Fetch form fields
          const { data: formFields, error: fieldsError } = await supabase
            .from("application_form_fields")
            .select("*")
            .eq("form_id", formId as string)
            .order("field_order");

          if (fieldsError) {
            console.error("Error fetching form fields:", fieldsError);
          } else {
            const transformedFields = (formFields || []).map((field: any) => ({
              id: field.id,
              type: field.field_type,
              name: field.field_name,
              label: field.field_label,
              placeholder: field.field_placeholder || "",
              required: field.is_required,
              options: field.field_options || [],
            }));
            setFields(transformedFields);
          }
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data. Using demo data.",
          variant: "destructive",
        });

        // Fallback to demo data
        setFormData({
          title: "Barcelona Beach Club",
          description: "Application form for Barcelona Beach Club residency",
          opportunity_id: "none",
          is_active: true,
        });
        setFields([
          {
            id: "field_1",
            type: "text",
            name: "dj_name",
            label: "DJ Name",
            placeholder: "Enter your DJ name",
            required: true,
          },
          {
            id: "field_2",
            type: "select",
            name: "experience",
            label: "Years of Experience",
            required: true,
            options: ["0-1 years", "2-5 years", "5+ years"],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formId, toast]);

  const fieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "textarea", label: "Text Area" },
    { value: "select", label: "Dropdown" },
    { value: "radio", label: "Radio Buttons" },
    { value: "checkbox", label: "Checkboxes" },
    { value: "file", label: "File Upload" },
    { value: "date", label: "Date Picker" },
    { value: "number", label: "Number Input" },
  ];

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: "text",
      name: "",
      label: "",
      placeholder: "",
      required: false,
      options: [],
    };
    setFields([...fields, newField]);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (fieldId: string) => {
    setFields(fields.filter((field) => field.id !== fieldId));
  };

  const addOption = (fieldId: string) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), ""] }
          : field
      )
    );
  };

  const updateOption = (
    fieldId: string,
    optionIndex: number,
    value: string
  ) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId
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

  const removeOption = (fieldId: string, optionIndex: number) => {
    setFields(
      fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              options:
                field.options?.filter((_, idx) => idx !== optionIndex) || [],
            }
          : field
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update the form
      const { error: formError } = await supabase
        .from("application_forms")
        .update({
          title: formData.title,
          description: formData.description,
          opportunity_id:
            formData.opportunity_id === "none"
              ? null
              : formData.opportunity_id || null,
          is_active: formData.is_active,
        })
        .eq("id", formId as string);

      if (formError) {
        throw formError;
      }

      // Delete existing fields
      await supabase
        .from("application_form_fields")
        .delete()
        .eq("form_id", formId as string);

      // Create new form fields
      if (fields.length > 0) {
        const fieldsToInsert = fields.map((field, index) => ({
          form_id: formId as string,
          field_type: field.type,
          field_name: field.name,
          field_label: field.label,
          field_placeholder: field.placeholder,
          field_options:
            field.options && field.options.length > 0 ? field.options : null,
          is_required: field.required,
          field_order: index + 1,
        }));

        const { error: fieldsError } = await supabase
          .from("application_form_fields")
          .insert(fieldsToInsert);

        if (fieldsError) {
          throw fieldsError;
        }
      }

      toast({
        title: "Success",
        description: "Form updated successfully!",
      });

      router.push("/admin/forms");
    } catch (error) {
      console.error("Error updating form:", error);
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
          <p className={textStyles.body.regular}>Loading form...</p>
        </div>
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
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className={textStyles.body.regular}>
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what this form is for..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
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
                  setFormData({ ...formData, opportunity_id: value })
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
                  {availableOpportunities.map((opportunity) => (
                    <SelectItem
                      key={opportunity.id}
                      value={opportunity.id}
                      className="text-foreground hover:bg-accent"
                    >
                      {opportunity.title}
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
                  setFormData({ ...formData, is_active: e.target.checked })
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
                <Card key={field.id} className="bg-secondary border-border">
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
                          onClick={() => removeField(field.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className={textStyles.body.small}>
                            Field Type
                          </Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger className="bg-background border-border text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {fieldTypes.map((type) => (
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
                              updateField(field.id, { name: e.target.value })
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
                            updateField(field.id, { label: e.target.value })
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
                            updateField(field.id, {
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
                                        field.id,
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
                                      removeOption(field.id, optionIndex)
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
                              onClick={() => addOption(field.id)}
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
                          id={`required_${field.id}`}
                          checked={field.required}
                          onChange={(e) =>
                            updateField(field.id, {
                              required: e.target.checked,
                            })
                          }
                          className="rounded border-border"
                        />
                        <Label
                          htmlFor={`required_${field.id}`}
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
