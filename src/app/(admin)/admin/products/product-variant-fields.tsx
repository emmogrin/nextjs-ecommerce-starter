"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProductVariant } from "@/types"

type VariantFormValue = {
  id?: string
  name: string
  sku: string
  options: { name: string; value: string }[]
  priceNgn: string
  compareAtPriceNgn: string
  quantity: number
}

function toFormValue(variant: ProductVariant): VariantFormValue {
  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    options: variant.options.map((option) => ({ ...option })),
    priceNgn: (variant.price / 100).toFixed(2),
    compareAtPriceNgn:
      variant.compareAtPrice === undefined
        ? ""
        : (variant.compareAtPrice / 100).toFixed(2),
    quantity: variant.inventory.quantity,
  }
}

const emptyVariant: VariantFormValue = {
  name: "",
  sku: "",
  options: [],
  priceNgn: "",
  compareAtPriceNgn: "",
  quantity: 0,
}

export function ProductVariantFields({
  variants,
}: {
  variants: ProductVariant[]
}) {
  const [values, setValues] = useState<VariantFormValue[]>(
    variants.length > 0 ? variants.map(toFormValue) : [{ ...emptyVariant }]
  )

  function updateVariant(index: number, changes: Partial<VariantFormValue>) {
    setValues((current) =>
      current.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...changes } : variant
      )
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Variants and pricing</h2>
          <p className="text-xs text-muted-foreground">
            Prices are entered in NGN and saved in kobo.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setValues((current) => [...current, { ...emptyVariant }])}
        >
          Add variant
        </Button>
      </div>

      <input type="hidden" name="variants" value={JSON.stringify(values)} />
      {values.map((variant, index) => (
        <fieldset key={variant.id ?? `new-${index}`} className="space-y-4 rounded-md border p-4">
          <legend className="px-1 text-sm font-medium">
            {variant.name || `Variant ${index + 1}`}
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-name`}>Variant name</Label>
              <Input
                id={`variant-${index}-name`}
                value={variant.name}
                onChange={(event) => updateVariant(index, { name: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-sku`}>SKU</Label>
              <Input
                id={`variant-${index}-sku`}
                value={variant.sku}
                onChange={(event) => updateVariant(index, { sku: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-price`}>Price (NGN)</Label>
              <Input
                id={`variant-${index}-price`}
                type="number"
                min="0"
                step="0.01"
                value={variant.priceNgn}
                onChange={(event) => updateVariant(index, { priceNgn: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-compare`}>Compare-at price (NGN)</Label>
              <Input
                id={`variant-${index}-compare`}
                type="number"
                min="0"
                step="0.01"
                value={variant.compareAtPriceNgn}
                onChange={(event) => updateVariant(index, { compareAtPriceNgn: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`variant-${index}-quantity`}>Inventory quantity</Label>
              <Input
                id={`variant-${index}-quantity`}
                type="number"
                min="0"
                step="1"
                value={variant.quantity}
                onChange={(event) => updateVariant(index, { quantity: Number(event.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Options</p>
            {variant.options.map((option, optionIndex) => (
              <div key={optionIndex} className="grid gap-2 sm:grid-cols-2">
                <Input
                  aria-label={`Variant ${index + 1} option ${optionIndex + 1} name`}
                  placeholder="Option (e.g. Size)"
                  value={option.name}
                  onChange={(event) => {
                    const options = variant.options.map((item) => ({ ...item }))
                    options[optionIndex].name = event.target.value
                    updateVariant(index, { options })
                  }}
                />
                <Input
                  aria-label={`Variant ${index + 1} option ${optionIndex + 1} value`}
                  placeholder="Value (e.g. 100 ml)"
                  value={option.value}
                  onChange={(event) => {
                    const options = variant.options.map((item) => ({ ...item }))
                    options[optionIndex].value = event.target.value
                    updateVariant(index, { options })
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateVariant(index, { options: [...variant.options, { name: "", value: "" }] })}
            >
              Add option
            </Button>
          </div>

          {!variant.id && values.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setValues((current) => current.filter((_, itemIndex) => itemIndex !== index))}
            >
              Remove variant
            </Button>
          )}
        </fieldset>
      ))}
    </section>
  )
}
