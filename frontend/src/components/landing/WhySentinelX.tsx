import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const reasons = [
  {
    title: 'AI-First Approach',
    description:
      'Built from the ground up with machine learning at its core, reducing alert fatigue by 95%.',
  },
  {
    title: 'Enterprise Scalability',
    description: 'Handle millions of events per second with our distributed architecture.',
  },
  {
    title: 'Open Integration',
    description:
      'Seamlessly integrate with 200+ security tools, SIEMs, and infrastructure platforms.',
  },
  {
    title: 'Zero Trust Ready',
    description: 'Built-in zero trust architecture principles for maximum security posture.',
  },
  {
    title: 'Cost Effective',
    description: 'Reduce SOC operational costs by up to 60% with AI-powered automation.',
  },
  {
    title: 'Rapid Deployment',
    description:
      'Get up and running in minutes, not months. Cloud-native deployment with flexible options.',
  },
];

export function WhySentinelX() {
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
            Why <span className="gradient-text">SentinelX</span>?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            The modern SOC platform designed for today's threat landscape.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {reasons.map((reason, index) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex gap-4"
            >
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
