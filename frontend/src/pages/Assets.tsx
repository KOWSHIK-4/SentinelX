import { Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Assets() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
        <p className="text-muted-foreground mt-1">Monitor and manage your infrastructure assets.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            Asset Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Asset monitoring and management will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
