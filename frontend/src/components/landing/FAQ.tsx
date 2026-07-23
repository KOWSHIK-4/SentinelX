import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'What is SentinelX?',
    answer:
      'SentinelX is an AI-powered Security Operations Center (SOC) platform that helps organizations detect, investigate, and respond to security threats in real-time using advanced machine learning algorithms.',
  },
  {
    question: 'How does the AI detection work?',
    answer:
      'Our AI models analyze patterns across millions of security events to identify anomalies and potential threats. The system continuously learns and adapts to new attack vectors, reducing false positives while maintaining high detection accuracy.',
  },
  {
    question: 'Can I integrate with my existing tools?',
    answer:
      'Yes, SentinelX offers 200+ integrations with popular security tools, SIEMs, cloud platforms, and infrastructure monitoring solutions through our open API and pre-built connectors.',
  },
  {
    question: 'Is SentinelX compliant with industry standards?',
    answer:
      'Absolutely. SentinelX is built with compliance in mind, supporting SOC 2, ISO 27001, GDPR, HIPAA, and PCI DSS frameworks with built-in reporting and audit trails.',
  },
  {
    question: 'How long does deployment take?',
    answer:
      'Most customers are up and running within hours. Our cloud-native platform requires minimal setup, and our team provides guided onboarding to ensure a smooth transition.',
  },
  {
    question: 'What kind of support do you offer?',
    answer:
      'We offer 24/7 premium support with dedicated SOC analysts, along with comprehensive documentation, training resources, and a community forum.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 bg-muted/30">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="rounded-xl border border-border/40 bg-card overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="font-medium">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-muted-foreground transition-transform duration-200',
                    openIndex === index && 'rotate-180',
                  )}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 text-sm text-muted-foreground">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
