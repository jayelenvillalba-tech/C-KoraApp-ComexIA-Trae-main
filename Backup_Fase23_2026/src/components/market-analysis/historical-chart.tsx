import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function HistoricalChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return null;

    return (
        <Card className="bg-[#0D2137]/90 border-cyan-900/30 backdrop-blur-md w-full">
            <CardHeader className="py-2 px-4 border-b border-cyan-900/30">
                <CardTitle className="text-sm font-medium text-cyan-400 uppercase tracking-wider flex justify-between items-center">
                    <span>Export Trends & Projections</span>
                    <span className="text-xs text-gray-500 font-normal">USD Value</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis 
                                dataKey="year" 
                                stroke="#94a3b8" 
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                padding={{ left: 10, right: 10 }}
                            />
                            <YAxis 
                                stroke="#94a3b8" 
                                fontSize={10} 
                                tickFormatter={(value) => `$${(value/1000000).toFixed(1)}M`}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: '#0A1929', 
                                    borderColor: '#0891b2',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ padding: 0 }}
                                formatter={(value: number, name: string) => [
                                    `$${value.toLocaleString()}`, 
                                    name === 'value' ? 'Historical' : 'Projected'
                                ]}
                            />
                            {/* Historic Data */}
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#22d3ee" 
                                strokeWidth={2} 
                                dot={{ fill: '#0A1929', stroke: '#22d3ee', strokeWidth: 2, r: 3 }}
                                activeDot={{ r: 5, fill: '#22d3ee' }}
                                connectNulls={false}
                                name="Historical"
                            />
                            {/* Projected Data */}
                            <Line 
                                type="monotone" 
                                dataKey="projected" 
                                stroke="#f472b6" 
                                strokeWidth={2} 
                                strokeDasharray="4 4" 
                                dot={{ fill: '#0A1929', stroke: '#f472b6', strokeWidth: 2, r: 3 }}
                                activeDot={{ r: 5, fill: '#f472b6' }}
                                connectNulls={false}
                                name="Projected"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2 text-xs border-t border-cyan-900/30 pt-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-gray-400">Historical (2018-2024)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-pink-400" />
                        <span className="text-gray-400">AI Projection (2025-2026)</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
