import { motion } from 'framer-motion';
import { Activity, AlertTriangle, Shield, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const stats = [
  { icon: Activity, label: 'Active Alerts', value: '24', variant: 'warning' as const },
  { icon: AlertTriangle, label: 'Critical', value: '3', variant: 'destructive' as const },
  { icon: Shield, label: 'Threats Blocked', value: '1,847', variant: 'success' as const },
  { icon: Server, label: 'Assets Monitored', value: '156', variant: 'default' as const },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SOC Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here is your security overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  severity: 'critical',
                  title: 'Suspicious outbound traffic detected',
                  time: '2 min ago',
                },
                {
                  severity: 'warning',
                  title: 'Failed login attempts from unknown IP',
                  time: '15 min ago',
                },
                {
                  severity: 'warning',
                  title: 'Unusual database query pattern',
                  time: '1 hour ago',
                },
                {
                  severity: 'info',
                  title: 'SSL certificate expiring in 7 days',
                  time: '3 hours ago',
                },
              ].map((incident) => (
                <div
                  key={incident.title}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        incident.severity === 'critical'
                          ? 'bg-destructive'
                          : incident.severity === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                      }`}
                    />
                    <span className="text-sm">{incident.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={incident.severity as 'destructive' | 'warning' | 'default'}>
                      {incident.severity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{incident.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Threat Intelligence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'APT-29', status: 'Active', severity: 'Critical' },
                { name: 'Ransomware X', status: 'Monitoring', severity: 'High' },
                { name: 'Phishing Campaign', status: 'Blocked', severity: 'Medium' },
              ].map((threat) => (
                <div
                  key={threat.name}
                  className="flex items-center justify-between rounded-lg border border-border/40 p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{threat.name}</div>
                    <div className="text-xs text-muted-foreground">{threat.severity}</div>
                  </div>
                  <Badge variant={threat.status === 'Active' ? 'destructive' : 'success'}>
                    {threat.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
