"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { deleteArticleAction } from "./actions"

export function DeleteArticleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm("Delete this article? This cannot be undone.")) return
    startTransition(() => {
      deleteArticleAction(id)
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      {isPending ? "Deleting…" : "Delete"}
    </Button>
  )
}
