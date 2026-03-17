import { getAgriNews } from "@/lib/actions/news";
import NewsClient from "@/components/stiri/NewsClient";

export default async function NewsPage() {
  const news = await getAgriNews();
  
  return (
    <div className="p-6">
      <NewsClient initialNews={news} />
    </div>
  );
}
