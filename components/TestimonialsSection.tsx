'use client';

import { motion } from 'framer-motion';
import { Star, TrendingUp, Briefcase } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  metric: {
    value: string;
    label: string;
  };
  rating: number;
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'Tech Startup',
      image: '👩‍💼',
      quote: 'ResumeIQ helped me land interviews at 3 FAANG companies. The insights were spot-on and completely transformed how I presented my experience.',
      metric: {
        value: '+47%',
        label: 'Interview callbacks',
      },
      rating: 5,
    },
    {
      name: 'Marcus Johnson',
      role: 'Senior Software Engineer',
      company: 'Fortune 500',
      image: '👨‍💻',
      quote: 'The AI analysis revealed gaps I never noticed. Within 2 weeks of implementing the suggestions, I got my dream job offer with a 40% salary increase.',
      metric: {
        value: '2 weeks',
        label: 'To job offer',
      },
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Marketing Director',
      company: 'SaaS Company',
      image: '👩‍🎨',
      quote: 'As someone who reviews hundreds of resumes, I was skeptical. But ResumeIQ\'s insights mirror exactly what I look for in candidates. Incredible tool.',
      metric: {
        value: '92',
        label: 'Resume score',
      },
      rating: 5,
    },
  ];

  const stats = [
    {
      value: '12,000+',
      label: 'Professionals helped',
      icon: Briefcase,
    },
    {
      value: '4.9/5',
      label: 'Average rating (2024)',
      icon: Star,
    },
    {
      value: '+38%',
      label: 'More interviews on average',
      icon: TrendingUp,
    },
  ];

  return (
    <section id="testimonials" className="relative py-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Ambient background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-indigo/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-brand-teal/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-indigo/20 bg-brand-indigo/5 px-4 py-2 mb-6">
            <Star className="w-4 h-4 text-brand-indigo" fill="currentColor" />
            <span className="text-sm font-semibold text-brand-indigo">Trusted by Professionals</span>
          </div>
          <h2 className="font-grotesk text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Helping 12,000+ professionals double their interview callbacks
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join thousands of professionals who&apos;ve transformed their careers with data-driven resume insights
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/10 to-brand-teal/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white border border-slate-200 rounded-2xl p-6 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] hover:shadow-[0_16px_48px_-12px_rgba(15,23,42,0.2)] transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-brand-indigo/10 to-brand-teal/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-brand-indigo" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-slate-900 font-grotesk">{stat.value}</p>
                    <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group relative"
            >
              {/* Card glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-indigo/20 to-brand-teal/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Card */}
              <div className="relative bg-white rounded-3xl border border-slate-200 p-8 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] hover:shadow-[0_20px_48px_-12px_rgba(15,23,42,0.25)] transition-all duration-500 hover:-translate-y-2 h-full flex flex-col">
                {/* Rating stars */}
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-slate-700 leading-relaxed mb-8 flex-grow">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>

                {/* Author info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-brand-indigo/20 to-brand-teal/20 flex items-center justify-center text-3xl border-2 border-white shadow-lg">
                    {testimonial.image}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                    <p className="text-xs text-slate-500">{testimonial.company}</p>
                  </div>
                </div>

                {/* Metric */}
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                  <p className="text-2xl font-bold text-emerald-600 font-grotesk mb-1">
                    {testimonial.metric.value}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    {testimonial.metric.label}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 mb-6">
            Ready to see what ResumeIQ can do for you?
          </p>
          <motion.button
            onClick={() => {
              const uploadSection = document.getElementById('upload-section');
              uploadSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-[0_20px_40px_-16px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1"
          >
            Start your free analysis
            <Star className="w-5 h-5" fill="currentColor" strokeWidth={0} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
