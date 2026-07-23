import { motion } from 'framer-motion';
import { Layers, Database, Cpu, Network } from 'lucide-react';

const layers = [
  {
    icon: Network,
    title: 'Ingestion Layer',
    items: ['Log Collection', 'Network Flow Data', 'Cloud APIs', 'Threat Feeds'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Cpu,
    title: 'AI Engine',
    items: ['ML Detection Models', 'Behavioral Analysis', 'Anomaly Detection', 'Risk Scoring'],
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Database,
    title: 'Data Layer',
    items: ['Time-Series Database', 'Graph Relationships', 'Search Index', 'Data Lake'],
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Layers,
    title: 'Presentation Layer',
    items: ['Dashboard & Visualizations', 'Alert Management', 'Incident Response', 'Reporting'],
    color: 'from-green-500 to-emerald-500',
  },
];

export function Architecture() {
  return (
    <section id="architecture" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Platform <span className="gradient-text">Architecture</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on a modern, scalable architecture designed for enterprise security operations.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden lg:block" />

          <div className="space-y-8 lg:space-y-16">
            {layers.map((layer, index) => (
              <motion.div
                key={layer.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8`}
              >
                <div className="flex-1">
                  <div
                    className={`inline-flex items-center gap-2 rounded-lg bg-gradient-to-r ${layer.color} p-0.5`}
                  >
                    <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2">
                      <layer.icon className="h-5 w-5" />
                      <span className="font-semibold">{layer.title}</span>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {layer.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${layer.color}`}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="hidden lg:block w-4 h-4 rounded-full bg-primary/30 border-2 border-primary flex-shrink-0" />
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
