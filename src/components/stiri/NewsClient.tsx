"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Calendar, ArrowRight, Filter, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AgriNewsItem } from "@/lib/actions/news";
import { Button } from "@/components/ui/button";

interface NewsClientProps {
  initialNews: AgriNewsItem[];
}

export default function NewsClient({ initialNews }: NewsClientProps) {
  const [activeDateFilter, setActiveDateFilter] = useState<"today" | "yesterday" | "2days" | "all">("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Load preferences
  useEffect(() => {
    const saved = localStorage.getItem("agral_news_per_page");
    if (saved) setItemsPerPage(parseInt(saved));
  }, []);

  const handleItemsPerPageChange = (val: number) => {
    setItemsPerPage(val);
    localStorage.setItem("agral_news_per_page", val.toString());
    setCurrentPage(1);
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && 
    d1.getMonth() === d2.getMonth() && 
    d1.getDate() === d2.getDate();

  const filteredNews = initialNews.filter(item => {
    const newsDate = new Date(item.date);
    const today = new Date();
    
    if (activeDateFilter === "today") return isSameDay(newsDate, today);
    if (activeDateFilter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return isSameDay(newsDate, yesterday);
    }
    if (activeDateFilter === "2days") {
      const dayBefore = new Date();
      dayBefore.setDate(dayBefore.getDate() - 2);
      return isSameDay(newsDate, dayBefore);
    }
    return true;
  });

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const paginatedNews = filteredNews.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl agral-gradient flex items-center justify-center text-white shadow-lg shrink-0">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Știri Agricole</h1>
            <p className="text-muted-foreground font-medium text-sm">Sincronizat în timp real din surse oficiale</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
          <button 
            onClick={() => { setActiveDateFilter("all"); setCurrentPage(1); }}
            className={cn("px-4 py-1.5 text-xs font-bold transition-all rounded-lg", activeDateFilter === "all" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Toate
          </button>
          <button 
            onClick={() => { setActiveDateFilter("today"); setCurrentPage(1); }}
            className={cn("px-4 py-1.5 text-xs font-bold transition-all rounded-lg", activeDateFilter === "today" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Astăzi
          </button>
          <button 
            onClick={() => { setActiveDateFilter("yesterday"); setCurrentPage(1); }}
            className={cn("px-4 py-1.5 text-xs font-bold transition-all rounded-lg", activeDateFilter === "yesterday" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            Ieri
          </button>
          <button 
            onClick={() => { setActiveDateFilter("2days"); setCurrentPage(1); }}
            className={cn("px-4 py-1.5 text-xs font-bold transition-all rounded-lg", activeDateFilter === "2days" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            -2 Zile
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-border/50">
        <div className="text-sm font-medium text-muted-foreground">
          Afișare <span className="text-foreground font-bold">{paginatedNews.length}</span> din <span className="text-foreground font-bold">{filteredNews.length}</span> știri
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Per pagină:</label>
          <select 
            value={itemsPerPage} 
            onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
            className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedNews.map((news) => (
          <Card key={news.id} className="group hover:shadow-xl transition-all duration-300 border-none bg-white/70 backdrop-blur-md overflow-hidden flex flex-col shadow-sm">
            <CardHeader className="p-6 pb-2">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black tracking-widest">
                    {news.category}
                  </Badge>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground border-muted-foreground/20">
                    {news.source}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(news.date).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' })}
                </div>
              </div>
              <CardTitle className="text-lg font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {news.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                {news.summary}
              </p>
              <Link 
                href={news.url} 
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all mt-auto"
              >
                Citește tot articolul <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        ))}

        {filteredNews.length === 0 && (
          <div className="col-span-full py-24 text-center">
            <Newspaper className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-muted-foreground">Nicio știre găsită pentru acest interval.</h3>
            <p className="text-muted-foreground font-medium">Încearcă să schimbi filtrul de dată.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-8">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="font-bold gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Înapoi
          </Button>
          <div className="text-sm font-black">
            Pagina {currentPage} din {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="font-bold gap-1"
          >
            Înainte <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
