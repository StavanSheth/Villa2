"use client";

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export function RevenueChart({ data }: { data: any[] }) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#141B22', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#fff' }}
            itemStyle={{ color: '#D4AF37' }}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} activeDot={{ r: 8 }} name="Revenue (₹)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BookingsChart({ data }: { data: any[] }) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#141B22', borderColor: 'rgba(212, 175, 55, 0.3)', color: '#fff' }}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Legend />
          <Bar dataKey="bookings" fill="#4ade80" radius={[4, 4, 0, 0]} name="Total Bookings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
