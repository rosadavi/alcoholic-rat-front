import { Camera } from "lucide-react"

export function FeedPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Feed</h1>
        <p className="text-sm text-muted-foreground">
          Os rolês publicados pela galera.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
        <Camera className="size-8 text-muted-foreground" />
        <p className="font-medium">Em breve</p>
        <p className="text-sm text-muted-foreground">
          A publicação de fotos e o feed ainda não existem na API.
        </p>
      </div>
    </div>
  )
}
