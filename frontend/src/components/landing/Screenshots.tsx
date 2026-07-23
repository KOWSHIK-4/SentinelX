import { motion } from 'framer-motion';
import { BarChart3, Shield, Activity } from 'lucide-react';

const screenshots = [
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time security analytics and threat visualization.',
  },
  {
    icon: Shield,
    title: 'Incident Management',
    description: 'Centralized incident tracking and response coordination.',
  },
  {
    icon: Activity,
    title: 'Threat Monitoring',
    description: 'Continuous monitoring with AI-powered threat detection.',
  },
];

export function Screenshots() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            See It In <span className="gradient-text">Action</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful interfaces designed for security operations teams.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {screenshots.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="rounded-xl border border-border/40 bg-card overflow-hidden group hover:border-primary/50 transition-all duration-300">
                <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
                  <item.icon className="h-16 w-16 text-primary/30 group-hover:text-primary/50 transition-colors" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
