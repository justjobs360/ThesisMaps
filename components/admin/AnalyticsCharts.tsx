'use client';

import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area,
} from 'recharts';

export type DataPoint = { label: string; value: number };

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

function EmptyChart({ hint }: { hint: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center">
      <p className="text-xs font-sans text-text-muted">{hint}</p>
    </div>
  );
}

export function SignupChart({ data = [] }: { data?: DataPoint[] }) {
  return (
    <ChartCard title="User Signups (90d)">
      {data.length === 0 ? (
        <EmptyChart hint="No signups recorded yet." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.map((d) => ({ name: d.label, value: d.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#78716C' }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="#C4973A" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function DauChart({ data = [] }: { data?: DataPoint[] }) {
  return (
    <ChartCard title="Daily Active Users (30d)">
      {data.length === 0 ? (
        <EmptyChart hint="No activity events recorded yet." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data.map((d) => ({ name: d.label, value: d.value }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} />
            <YAxis tick={{ fontSize: 11, fill: '#78716C' }} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="value" stroke="#C4973A" fill="#C4973A22" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

export function TopQueriesChart({ data = [] }: { data?: DataPoint[] }) {
  return (
    <ChartCard title="Top Search Queries (30d)">
      {data.length === 0 ? (
        <EmptyChart hint="No searches recorded yet." />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.map((d) => ({ name: d.label, value: d.value }))} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#78716C' }} allowDecimals={false} />
            <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#78716C' }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Bar dataKey="value" fill="#C4973A" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}
