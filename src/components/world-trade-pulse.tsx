
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, AlertTriangle, Info, Zap, Search, Filter, ExternalLink } from "lucide-react";
import { format } from 'date-fns';

interface NewsItem {
  _id: string;
  title: string;
  summary: string;
  source: string;
  publishedDate: string;
  type: 'critical' | 'warning' | 'info' | 'opportunity';
  hsCodes: string[];
  countries: string[];
  treaties: string[];
  fullUrl: string;
}

export function WorldTradePulse() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  useEffect(() => {
    fetchNews();
  }, [filterType, search, regionFilter]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (search) params.append('search', search);
      // Region/Country filter logic would ideally be backend supported, 
      // for now we fetch generally or pass param if backend supports.
      
      const res = await fetch(`/api/news?${params}`);
      const data = await res.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Failed to fetch news', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'opportunity': return 'bg-green-500/20 text-green-300 border-green-500/50';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'opportunity': return <Zap className="w-5 h-5 text-green-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-400" />
            World Trade Pulse
          </h2>
          <p className="text-slate-400 mt-1">
            Official regulatory updates, compliance alerts, and trade opportunities.
          </p>
        </div>
        
        <div className="flex gap-2">
           <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
             <Filter className="w-4 h-4 mr-2" /> 
             Customize Feed
           </Button>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
           <div className="flex flex-col md:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
               <Input 
                 placeholder="Search by HS Code, Country, or Treaty (e.g., 'AfCFTA', 'Soy')" 
                 className="pl-9 bg-black/20 border-white/10 text-white placeholder:text-slate-500"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <Select value={filterType} onValueChange={setFilterType}>
               <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white">
                 <SelectValue placeholder="Filter by Type" />
               </SelectTrigger>
               <SelectContent className="bg-slate-900 border-white/10 text-white">
                 <SelectItem value="all">All Types</SelectItem>
                 <SelectItem value="critical">Critical Alerts</SelectItem>
                 <SelectItem value="warning">Warnings</SelectItem>
                 <SelectItem value="opportunity">Opportunities</SelectItem>
                 <SelectItem value="info">General Info</SelectItem>
               </SelectContent>
             </Select>
           </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
               <div className="text-center py-10 text-slate-400">Loading global currents...</div>
            ) : news.length === 0 ? (
               <div className="text-center py-10 text-slate-400">No news found for current filters.</div>
            ) : (
               news.map((item) => (
                 <div key={item._id} className="group relative bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-lg p-5 border border-white/10">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-3">
                          {getIcon(item.type)}
                          <Badge variant="outline" className={getBadgeColor(item.type)}>
                            {item.type.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            {format(new Date(item.publishedDate), 'MMM dd, yyyy')} • {item.source}
                          </span>
                       </div>
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white" onClick={() => window.open(item.fullUrl, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                       </Button>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      {item.summary}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-auto">
                       {item.treaties?.map(t => (
                         <Badge key={t} variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                           {t}
                         </Badge>
                       ))}
                       {item.countries?.map(c => (
                         <Badge key={c} variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20 text-xs">
                           {c}
                         </Badge>
                       ))}
                       {item.hsCodes?.map(hs => (
                         <Badge key={hs} variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/20 text-xs">
                           HS {hs}
                         </Badge>
                       ))}
                    </div>
                 </div>
               ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
