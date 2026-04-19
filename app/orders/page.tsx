'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Package, Search, ArrowRight, CheckCircle2, Truck, FileText, 
  RefreshCw, XCircle, Loader2, AlertCircle, ArrowLeft, Camera,
  MapPin, Calendar, CreditCard, ExternalLink
} from 'lucide-react'

// --- Supabase Client Init ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OrderPortal() {
  const [view, setView] = useState<'login' | 'otp' | 'dashboard'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Step: Login (Find Order)
  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Check if order exists first to prevent spamming OTP
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderId)
      .eq('order_phone', phone)
      .single()

    if (error || !data) {
      alert("No order found with these details. Please check your Order ID.")
      setIsLoading(false)
      return
    }

    // Trigger your OTP API
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (res.ok) setView('otp')
    else alert("Error sending OTP. Check your Meta API settings.")
    setIsLoading(false)
  }

  // 2. Step: Verify OTP
  const handleVerifyOtp = async () => {
    setIsLoading(true)
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: otp.join('') }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (res.ok) {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('order_phone', phone)
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setView('dashboard')
    } else {
      alert("Invalid OTP code.")
    }
    setIsLoading(false)
  }

  // UI Helpers
  const getStatusColor = (status: string) => {
    const colors: any = { delivered: 'bg-green-500', cancelled: 'bg-red-500', shipped: 'bg-blue-500' }
    return colors[status.toLowerCase()] || 'bg-slate-400'
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] antialiased">
      {/* Top Trust Strip */}
      <div className="bg-white border-b border-gray-200 py-3 px-6 flex justify-between items-center sticky top-0 z-10">
        <h1 className="font-bold text-xl tracking-tight">Breakfastclub<span className="text-blue-600">.</span></h1>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <CheckCircle2 size={14} className="text-green-500" /> Secure Portal
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3">Track Your Package</h2>
              <p className="text-slate-500">Enter your order details to manage your breakfast delivery.</p>
            </div>
            <form onSubmit={handleInitialLogin} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Order ID</label>
                <input 
                  required
                  placeholder="e.g. BC9842"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  onChange={e => setOrderId(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">WhatsApp Number</label>
                <input 
                  required
                  placeholder="+91"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <button 
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Continue <ArrowRight size={18}/></>}
              </button>
            </form>
          </div>
        )}

        {/* OTP VIEW */}
        {view === 'otp' && (
          <div className="max-w-md mx-auto text-center animate-in zoom-in-95 duration-300">
            <button onClick={() => setView('login')} className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-8 hover:text-slate-900">
              <ArrowLeft size={16}/> Back to login
            </button>
            <h2 className="text-3xl font-extrabold mb-3">Verify it's you</h2>
            <p className="text-slate-500 mb-10">We sent a 6-digit code to your WhatsApp at <span className="text-slate-900 font-bold">{phone}</span></p>
            <div className="flex gap-2 justify-center mb-8">
              {otp.map((digit, i) => (
                <input 
                  key={i}
                  maxLength={1}
                  className="w-12 h-16 text-center text-2xl font-bold rounded-2xl border border-gray-200 bg-white focus:border-blue-500 outline-none"
                  value={digit}
                  onChange={e => {
                    const next = [...otp]; next[i] = e.target.value; setOtp(next);
                    if (e.target.value && e.target.nextSibling) (e.target.nextSibling as any).focus()
                  }}
                />
              ))}
            </div>
            <button 
              onClick={handleVerifyOtp}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold"
            >
              Verify & View Orders
            </button>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-700">
            {/* Amazon Style Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">Your Orders</h2>
                <div className="flex gap-4 overflow-x-auto pt-4 no-scrollbar">
                  {['All', 'Active', 'Delivered', 'Cancelled'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`pb-2 px-1 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
                    >
                      {t} Orders
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                  placeholder="Search by product..."
                  className="pl-12 pr-6 py-3 bg-white border border-gray-200 rounded-full w-full md:w-80 shadow-sm"
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                  <Package className="mx-auto text-slate-200 mb-4" size={64}/>
                  <p className="text-slate-500 font-medium">No orders found for this account.</p>
                </div>
              ) : orders.map(order => (
                <div key={order.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="bg-slate-50/50 px-8 py-4 border-b border-gray-100 flex flex-wrap gap-x-12 gap-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <div>
                      <p className="mb-1">Order Placed</p>
                      <p className="text-slate-900">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="mb-1">Total Amount</p>
                      <p className="text-slate-900">₹{order.total_price}</p>
                    </div>
                    <div>
                      <p className="mb-1">Ship To</p>
                      <p className="text-blue-600 hover:underline cursor-pointer">{order.shipping_address?.first_name || 'Customer'}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="mb-1">Order # {order.order_number}</p>
                      <div className="flex gap-3 text-blue-600 underline lowercase font-normal text-sm">
                        <button>Invoice</button>
                        <button>Details</button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-8 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)} animate-pulse`}></div>
                        <h3 className="text-xl font-extrabold capitalize">{order.status}</h3>
                      </div>
                      
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="flex gap-6">
                          <img src={item.products.image_url} className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800 text-lg hover:text-blue-600 cursor-pointer">{item.products.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">Quantity: {item.quantity}</p>
                            <button className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded-xl text-xs font-black shadow-sm transition-all">Buy it again</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Column */}
                    <div className="w-full md:w-64 flex flex-col gap-3">
                      <button className="w-full py-3 bg-white border border-gray-300 hover:bg-slate-50 rounded-2xl text-sm font-bold shadow-sm transition-all">Track package</button>
                      <button className="w-full py-3 bg-white border border-gray-300 hover:bg-slate-50 rounded-2xl text-sm font-bold shadow-sm transition-all">Return item</button>
                      <button className="w-full py-3 bg-white border border-gray-300 hover:bg-slate-50 rounded-2xl text-sm font-bold shadow-sm transition-all">Replace item</button>
                      {order.status === 'placed' && (
                        <button className="w-full py-3 text-red-600 hover:bg-red-50 rounded-2xl text-sm font-bold transition-all">Cancel order</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
