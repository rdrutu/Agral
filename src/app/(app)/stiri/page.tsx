import { getAgriNews } from "@/lib/actions/news";
import NewsClient from "@/components/stiri/NewsClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight">Știri Agrobusiness</h1>
        <p className="text-muted-foreground">Ultimele noutăți, subvenții și tehnologii agricole din România.</p>
      </div>
      <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
        <NewsDynamicContent />
      </Suspense>
    </div>
  );
}

async function NewsDynamicContent() {
  const news = await getAgriNews();
  
  return <NewsClient initialNews={news} />;
}
