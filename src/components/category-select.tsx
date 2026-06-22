"use client";

import { useState, useEffect } from "react";
import { Autocomplete } from "@/components/autocomplete";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  children?: CategoryOption[];
}

interface CategorySelectProps {
  categories: CategoryOption[];
  value?: string;
  onChange: (categoryId: string) => void;
  required?: boolean;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  required,
}: CategorySelectProps) {
  const [parentId, setParentId] = useState("");
  const [childId, setChildId] = useState("");

  useEffect(() => {
    if (!value || categories.length === 0) return;

    for (const parent of categories) {
      if (parent.id === value) {
        setParentId(parent.id);
        setChildId("");
        return;
      }

      const child = parent.children?.find((item) => item.id === value);
      if (child) {
        setParentId(parent.id);
        setChildId(child.id);
        return;
      }
    }
  }, [categories, value]);

  const selectedParent = categories.find((category) => category.id === parentId);
  const children = selectedParent?.children || [];

  function handleParentChange(id: string) {
    setParentId(id);
    setChildId("");
    const parent = categories.find((category) => category.id === id);
    if (parent && (!parent.children || parent.children.length === 0)) {
      onChange(id);
    } else {
      onChange("");
    }
  }

  function handleChildChange(id: string) {
    setChildId(id);
    onChange(id || parentId);
  }

  const parentOptions = categories.map((category) => ({ value: category.id, label: category.name }));
  const childOptions = children.map((child) => ({ value: child.id, label: child.name }));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Autocomplete
        key={`parent-${value ?? ""}`}
        name="parentCategory"
        label="Категория"
        options={parentOptions}
        placeholder="Выберите категорию"
        selectOnly
        required
        defaultValue={parentId}
        onChange={handleParentChange}
      />

      {children.length > 0 ? (
        <Autocomplete
          key={`child-${parentId}`}
          name="childCategory"
          label="Подкатегория"
          options={childOptions}
          placeholder="Выберите подкатегорию"
          selectOnly
          required
          defaultValue={childId}
          onChange={handleChildChange}
        />
      ) : null}

      <input type="hidden" name="categoryId" value={childId || parentId} required={required} />
    </div>
  );
}
