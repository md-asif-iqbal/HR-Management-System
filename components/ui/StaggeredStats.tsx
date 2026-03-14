'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import CountUp from 'react-countup';
import { Card, CardContent } from '@/components/ui/card';

interface StatCard {
  label: string;
  value: number;
  color?: string;
  suffix?: string;
}

interface StaggeredStatsProps {
  cards: StatCard[];
  className?: string;
}

export function StaggeredStats({ cards, className }: StaggeredStatsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {cards.map((stat, i) => (
        <motion.div key={stat.label} variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:pt-4">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold ${stat.color || 'text-slate-900'}`}>
                <CountUp end={stat.value} duration={1.2} delay={i * 0.1} preserveValue />
                {stat.suffix || ''}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}

export function StaggeredStatsCentered({ cards, className }: StaggeredStatsProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {cards.map((stat, i) => (
        <motion.div key={stat.label} variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Card className="h-full">
            <CardContent className="p-3 sm:p-4 text-center">
              <p className={`text-xl sm:text-2xl font-bold ${stat.color || 'text-slate-900'}`}>
                <CountUp end={stat.value} duration={1.2} delay={i * 0.1} preserveValue />
                {stat.suffix || ''}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
