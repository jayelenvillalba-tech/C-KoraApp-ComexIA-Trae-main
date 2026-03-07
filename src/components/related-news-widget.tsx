import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Newspaper, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { format } from 'date-fns';

interface RelatedNewsWidgetProps {
  hsCode?: string;
  country?: string;
  treaty?: string;
  limit?: number;
}

export function RelatedNewsWidget({ hsCode, country, treaty, limit = 3 }: RelatedNewsWidgetProps) {
  const { data: newsData, isLoading } = useQuery({
    queryKey: ['related-news', hsCode, country, treaty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (hsCode) params.append('hsCode', hsCode);
      if (country) params.append('country', country);
      if (treaty) params.append('treaty', treaty);
      params.append('limit', limit.toString());
      
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    enabled: !!(hsCode || country || treaty)
  });

  const news = newsData?.news || [];

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Related News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white/5 h-16 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (news.length === 0) {
    return null; // Don't show widget if no related news
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical':
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'opportunity': return 'bg-green-500/20 text-green-300 border-green-500/50';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-blue-400" />
          Related News & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {news.map((item: any) => (
            <div 
              key={item._id} 
              className="group bg-white/5 hover:bg-white/10 transition-all p-3 rounded-lg border border-white/10 cursor-pointer"
              onClick={() => window.open(item.fullUrl, '_blank')}
            >
              <div className="flex items-start gap-3">
                {getTypeIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`${getTypeBadge(item.type)} text-xs`}>
                      {item.type}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {format(new Date(item.publishedDate), 'MMM dd')}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-2 mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {item.source}
                  </p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="link" 
          className="w-full mt-4 text-blue-400 hover:text-blue-300"
          onClick={() => window.location.href = '/news'}
        >
          View All News →
        </Button>
      </CardContent>
    </Card>
  );
}
