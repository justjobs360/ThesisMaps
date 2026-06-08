'use client';

import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts';

type DataPoint = { label: string; value: number };

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
};

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-surface border border-border rounded-md p-5 shadow-sm">
      <p className="text-sm font-sans font-semibold text-text-primary mb-4">{title}</p>
      {children}
    </div>
  );
}

const MOCK_SIGNUPS: DataPoint[] = [
  { label: 'May 1', value: 12 }, { label: 'May 8', value: 19 }, { label: 'May 15', value: 15 },
  { label: 'May 22', value: 28 }, { label: 'May 29', value: 22 }, { label: 'Jun 5', value: 35 },
  { label: 'Jun 12', value: 41 }, { label: 'Jun 19', value: 38 }, { label: 'Jun 26', value: 52 },
];

const MOCK_DAU: DataPoint[] = [
  { label: 'Jun 1', value: 87 }, { label: 'Jun 5', value: 102 }, { label: 'Jun 10', value: 95 },
  { label: 'Jun 15', value: 118 }, { label: 'Jun 20', value: 131 }, { label: 'Jun 25', value: 142 },
  { label: 'Jun 30', value: 156 },
];

const MOCK_QUERIES: DataPoint[] = [
  { label: 'transformer architecture', value: 234 },
  { label: 'machine learning survey', value: 189 },
  { label: 'deep learning nlp', value: 156 },
  { label: 'systematic review methods', value: 134 },
  { label: 'bert fine-tuning', value: 112 },
];

export function SignupChart() {
  return (
    <ChartCard title="User Signups (90d)">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={MOCK_SIGNUPS.map((d) => ({ name: d.label, value: d.value }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} />
          <YAxis tick={{ fontSize: 11, fill: '#78716C' }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="value" stroke="#C4973A" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function DauChart() {
  return (
    <ChartCard title="Daily Active Users (30d)">
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={MOCK_DAU.map((d) => ({ name: d.label, value: d.value }))}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} />
          <YAxis tick={{ fontSize: 11, fill: '#78716C' }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="value" stroke="#C4973A" fill="#C4973A22" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function TopQueriesChart() {
  return (
    <ChartCard title="Top Search Queries">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={MOCK_QUERIES.map((d) => ({ name: d.label, value: d.value }))} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#78716C' }} />
          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#78716C' }} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar dataKey="value" fill="#C4973A" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
