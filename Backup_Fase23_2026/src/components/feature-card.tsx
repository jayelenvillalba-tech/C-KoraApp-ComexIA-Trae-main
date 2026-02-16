import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  detailedDescription: string;
  actionLabel: string;
  onAction: () => void;
  imageGradient: string;
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  detailedDescription, 
  actionLabel, 
  onAction, 
  imageGradient 
}: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="relative overflow-hidden bg-[#0D2137] border-cyan-900/30 transition-all duration-500 ease-out h-[320px] group cursor-pointer hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(8,145,178,0.2)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onAction}
    >
      {/* Background Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${imageGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
      
      <CardContent className="h-full flex flex-col p-8 relative z-10">
        {/* Top Section: Icon & Title */}
        <div className={`transition-all duration-500 ${isHovered ? 'translate-y-0' : 'translate-y-8'}`}>
          <div className="w-14 h-14 bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-500 group-hover:text-white group-hover:scale-110 transition-all duration-300 border border-cyan-500/20 group-hover:border-cyan-400">
            {icon}
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
            {title}
          </h3>
          <p className={`text-gray-400 text-sm leading-relaxed transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}>
            {description}
          </p>
        </div>

        {/* Bottom "Window" Content - Slides up and fades in */}
        <div className={`mt-auto transform transition-all duration-500 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
           <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mb-4" />
           <p className="text-cyan-100/70 text-xs mb-4 font-light">
             {detailedDescription}
           </p>
           <Button className="w-full bg-cyan-600/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-600 hover:text-white group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-sm">
             {actionLabel} <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
           </Button>
        </div>
      </CardContent>
    </Card>
  );
}
