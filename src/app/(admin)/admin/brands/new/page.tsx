import { PageHeader } from "@/components/ui/page-header"
import { BrandForm } from "../brand-form"

export default function NewAdminBrandPage() {
  return (
    <div>
      <PageHeader title="Add Brand" description="Add a brand to your catalog." />
      <BrandForm />
    </div>
  )
}
