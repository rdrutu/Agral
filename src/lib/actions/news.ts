"use server";

import Parser from "rss-parser";
import { unstable_cache } from "next/cache";

const parser = new Parser();

const FEEDS = [
  { name: "Agrointeligența", url: "https://agrointel.ro/feed/", category: "General" },
  { name: "Lumea Satului", url: "https://www.lumeasatului.ro/rss.xml", category: "Actualitate" }
];

export interface AgriNewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  url: string;
  source: string;
}

function calculateSimilarity(s1: string, s2: string): number {
  const words1 = s1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = s2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const intersection = words1.filter(w => words2.includes(w));
  return (2.0 * intersection.length) / (words1.length + words2.length);
}

export const getAgriNews = unstable_cache(
  async (): Promise<AgriNewsItem[]> => {
    try {
      const feedPromises = FEEDS.map(async (feedSource) => {
        try {
          const feed = await parser.parseURL(feedSource.url);
          return feed.items.map(item => ({
            id: item.guid || item.link || Math.random().toString(),
            title: item.title || "",
            summary: (item.contentSnippet || item.content || "").substring(0, 200) + "...",
            date: item.isoDate || new Date().toISOString(),
            category: feedSource.category,
            url: item.link || "#",
            source: feedSource.name,
          }));
        } catch (err) {
          console.error(`Error fetching feed from ${feedSource.name}:`, err);
          return [];
        }
      });

      const results = await Promise.all(feedPromises);
      let allNews = results.flat();

      // Sort by date descending
      allNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Deduplicate based on title similarity
      const uniqueNews: AgriNewsItem[] = [];
      for (const item of allNews) {
        const isDuplicate = uniqueNews.some(existing => 
          calculateSimilarity(item.title, existing.title) > 0.7 // 70% similarity threshold
        );
        
        if (!isDuplicate) {
          uniqueNews.push(item);
        }
      }

      return uniqueNews;
    } catch (error) {
      console.error("Error in getAgriNews:", error);
      return [];
    }
  },
  ['agri-news-feed'],
  { revalidate: 3600 }
);
