import { motion } from 'framer-motion';
import {
  Brain,
  Bell,
  Shield,
  BarChart3,
  Workflow,
  Lock,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Detection',
    description:
      'Advanced machine learning algorithms detect threats in real-time with minimal false positives.',
  },
  {
    icon: Bell,
    title: 'Real-Time Alerts',
    description:
      'Instant notifications for critical security events across your entire infrastructure.',
  },
  {
    icon: Shield,
    title: 'Threat Intelligence',
    description:
      'Integrated threat feeds and IoC correlation for comprehensive threat visibility.',
  },
  {
    icon: BarChart3,
    title: 'Security Analytics',
    description:
      'Powerful dashboards and reports with deep insights into your security posture.',
  },
  {
    icon: Workflow,
    title: 'Automated Response',
    description:
      'Orchestrate incident response workflows with automated playbooks and actions.',
  },
  {
    icon: Lock,
    title: 'Compliance Ready',
    description:
      'Built-in compliance frameworks for SOC 2, ISO 27001, GDPR, and HIPAA.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Enterprise-Grade{' '}
            <span className="gradient-text">Security Features</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to build and operate a modern SOC.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="group relative rounded-xl border border-border/40 bg-card p-6 hover:border-primary/50 transition-colors">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
