import { motion } from 'framer-motion';
import {
  SiReact,
  SiTypescript,
  SiNodedotjs,
  SiPostgresql,
  SiDocker,
  SiTailwindcss,
} from 'react-icons/si';

const techItems = [
  { icon: SiReact, label: 'React', color: 'text-cyan-400' },
  { icon: SiTypescript, label: 'TypeScript', color: 'text-blue-400' },
  { icon: SiNodedotjs, label: 'Node.js', color: 'text-green-400' },
  { icon: SiPostgresql, label: 'PostgreSQL', color: 'text-blue-500' },
  { icon: SiDocker, label: 'Docker', color: 'text-blue-400' },
  { icon: SiTailwindcss, label: 'Tailwind CSS', color: 'text-cyan-400' },
];

export function TechStack() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Powered By <span className="gradient-text">Modern Tech</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with industry-leading technologies for performance and reliability.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-4xl mx-auto">
          {techItems.map((tech, index) => (
            <motion.div
              key={tech.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/40 bg-card hover:border-primary/50 transition-colors"
            >
              <tech.icon className={`h-10 w-10 ${tech.color}`} />
              <span className="text-sm font-medium">{tech.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
