"use client";
import { useState } from "react";
import { categoryLabels } from "@/lib/ai-contract";
import { publicationSections } from "@/lib/publication";
import styles from "./publication-fields.module.css";
export function PublicationFields({
  disabled,
  onChange,
}: {
  disabled: boolean;
  onChange: () => void;
}) {
  const [categories, setCategories] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  return (
    <fieldset disabled={disabled} className={styles.panel} onChange={onChange}>
      <legend>
        Información pública adicional <span>(opcional)</span>
      </legend>
      <p className="help">
        Solo se publicarán los apartados que completes y apruebes. No se
        incluyen notas privadas ni respuestas de IA automáticamente.
      </p>
      <fieldset className={styles.categories}>
        <legend>Categorías públicas · hasta 4</legend>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <label className="checkbox" key={key}>
            <input
              type="checkbox"
              name="public-categories"
              value={key}
              checked={categories.includes(key)}
              disabled={
                disabled ||
                (categories.length >= 4 && !categories.includes(key))
              }
              onChange={(e) =>
                setCategories((old) =>
                  e.target.checked
                    ? [...old, key]
                    : old.filter((x) => x !== key),
                )
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
      <div className={styles.grid}>
        {publicationSections.map((field) => (
          <div key={field.key}>
            <label htmlFor={`public-${field.key}`}>
              {field.label}
              {field.key === "limitations" && analysis.trim()
                ? " (requerido al incluir análisis)"
                : ""}
            </label>
            <textarea
              id={`public-${field.key}`}
              name={`public-${field.key}`}
              maxLength={field.max}
              rows={field.key === "summary" ? 3 : 4}
              required={field.key === "limitations" && !!analysis.trim()}
              minLength={
                field.key === "limitations" && analysis.trim() ? 10 : undefined
              }
              onChange={
                field.key === "analysis"
                  ? (e) => setAnalysis(e.target.value)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}
