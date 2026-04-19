'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { DM_Sans } from 'next/font/google'
import { 
  Package, Search, ArrowRight, CheckCircle2, 
  Truck, FileText, RefreshCw, XCircle, 
  ChevronRight, Upload, Loader2, AlertCircle,
  ArrowLeft, Camera
} from 'lucide-react'

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '500', '700'] })

// --- Supabase Client ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// --- Types ---
type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface Product {
  id: string
  name: string
  image_url: string
  price: number
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: Product
}

interface Order {
  id: string
  shopify_order_id: string
  order_number: string
  status: OrderStatus
  total_price: number
  created_at: string
  order_phone: string
  shipping_address: any
  order_items: OrderItem[]
}

// --- Components ---

const SkeletonOrder = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4 animate-pulse">
    <div className="h-4 bg-gray-100 rounded w-1/4 mb-4" />
    <div className="flex gap-4">
      <div className="w-20 h-20 bg-gray-100 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  </div>
)

export default function OrderPortal() {
  const [step, setStep] = useState<'login' | 'otp' | 'dashboard'>('login')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modals
  const [modal, setModal] = useState<{ type: 'return' | 'replace' | 'cancel' | 'track', order: Order | null }>({ type: 'track', order: null })
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Auth Flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Check if order exists
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderId)
      .eq('order_phone', phone)
      .single()

    if (error || !data) {
      alert("Order not found with these details.")
      setLoading(false)
      return
    }

    // Trigger WhatsApp OTP via API Route
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    })

    if (res.ok) {
      setStep('otp')
    } else {
      alert("Failed to send OTP. Try again.")
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    setLoading(true)
    const enteredOtp = otp.join('')
    
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp: enteredOtp })
    })

    if (res.ok) {
      fetchOrders()
      setStep('dashboard')
    } else {
      alert("Invalid OTP")
    }
    setLoading(false)
  }

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id, quantity, price,
          products (*)
        )
      `)
      .eq('order_phone', phone)
      .order('created_at', { ascending: false })
    
    setOrders(data || [])
  }

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'All' || o.status.toLowerCase() === activeTab.toLowerCase()
    const matchesSearch = o.order_number.includes(searchQuery) || 
                         o.order_items.some(i => i.products.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesTab && matchesSearch
  })

  return (
    <div className={`min-h-screen bg-gray-50 text-slate-900 ${dmSans.className}`}>
      {/* Header Strip */}
      {step === 'dashboard' && orders.some(o => o.status === 'shipped') && (
        <div className="bg-blue-600 text-white py-2.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2">
          <Truck size={16} /> Arriving Tomorrow by 9 PM <button className="underline ml-2">Track Package</button>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {step === 'login' && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Find Your Order</h1>
              <p className="text-slate-500">Enter your details to manage returns, tracking, and more.</p>
            </div>
            
            <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Order ID</label>
                <input 
                  required
                  placeholder="BC12345"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Phone Number</label>
                <input 
                  required
                  placeholder="+91XXXXXXXXXX"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <button 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Continue'} <ArrowRight size={18} />
              </button>

              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500" /> Secure OTP Verification
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-green-500" /> Order updates via WhatsApp
                </div>
              </div>
            </form>
          </div>
        )}

        {step === 'otp' && (
          <div className="max-w-md mx-auto">
            <button onClick={() => setStep('login')} className="flex items-center gap-1 text-slate-500 mb-6 hover:text-slate-800 transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Verify WhatsApp OTP</h1>
              <p className="text-slate-500">Sent to {phone}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex justify-between gap-2 mb-8">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={digit}
                    onChange={e => {
                      const newOtp = [...otp]
                      newOtp[idx] = e.target.value
                      setOtp(newOtp)
                      if (e.target.nextSibling && e.target.value) (e.target.nextSibling as HTMLInputElement).focus()
                    }}
                  />
                ))}
              </div>
              <button 
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verify OTP'}
              </button>
            </div>
          </div>
        )}

        {step === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Trust Section */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2">Manage Your Orders Easily</h2>
                <p className="text-slate-500 max-w-md">Track packages, request returns, and manage your replacements in one secure portal.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                  <Package size={32} />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Orders</div>
                  <div className="text-3xl font-bold">{orders.length}</div>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex bg-white border border-gray-200 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-gray-50'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  placeholder="Search order id or product..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Order Cards */}
            <div className="space-y-6">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <div key={order.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Header Row */}
                  <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between gap-4 text-sm">
                    <div className="flex gap-8">
                      <div>
                        <div className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-0.5">Ordered On</div>
                        <div className="font-semibold">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric'})}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-0.5">Total</div>
                        <div className="font-semibold">₹{order.total_price}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-0.5">Ship To</div>
                        <div className="font-semibold text-blue-600 hover:underline cursor-pointer">{order.shipping_address?.first_name || 'Customer'}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mb-0.5 text-right">Order # {order.order_number}</div>
                      <div className="flex gap-3 font-semibold text-blue-600">
                        <button className="hover:underline">View Details</button>
                        <span className="text-gray-300">|</span>
                        <button className="hover:underline flex items-center gap-1"><FileText size={14} /> Invoice</button>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex flex-col md:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        <h3 className="font-bold text-lg capitalize">{order.status}</h3>
                      </div>
                      
                      {order.order_items.map(item => (
                        <div key={item.id} className="flex gap-4">
                          <img 
                            src={item.products.image_url} 
                            alt={item.products.name} 
                            className="w-24 h-24 object-cover rounded-xl border border-gray-100" 
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 leading-tight mb-1">{item.products.name}</h4>
                            <p className="text-sm text-slate-500 mb-2">Qty: {item.quantity}</p>
                            <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                              <RefreshCw size={12} /> Buy it again
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions Panel */}
                    <div className="w-full md:w-56 space-y-2">
                      <button 
                        onClick={() => { setModal({ type: 'track', order }); setIsModalOpen(true); }}
                        className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold shadow-sm transition-all"
                      >
                        Track package
                      </button>
                      
                      {order.status === 'delivered' && (
                        <>
                          <button 
                            onClick={() => { setModal({ type: 'return', order }); setIsModalOpen(true); }}
                            className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold shadow-sm transition-all"
                          >
                            Return items
                          </button>
                          <button 
                             onClick={() => { setModal({ type: 'replace', order }); setIsModalOpen(true); }}
                             className="w-full py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl text-sm font-semibold shadow-sm transition-all"
                          >
                            Replace items
                          </button>
                        </>
                      )}

                      {(order.status === 'placed' || order.status === 'processing') && (
                        <button 
                          onClick={() => { setModal({ type: 'cancel', order }); setIsModalOpen(true); }}
                          className="w-full py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all"
                        >
                          Cancel order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Package size={32} />
                  </div>
                  <h3 className="text-xl font-bold">No orders found</h3>
                  <p className="text-slate-500">We couldn't find any orders matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Global Modal System */}
      {isModalOpen && <ActionModal modal={modal} onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}

// --- Action Modal Component ---

function ActionModal({ modal, onClose }: { modal: any, onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImages([...images, ...files])
      const newPreviews = files.map(f => URL.createObjectURL(f))
      setPreviews([...previews, ...newPreviews])
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    // Upload Logic to Supabase Storage or external
    // Insert into aftersale_requests table
    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {step === 'form' ? (
          <>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold">{modal.type === 'return' ? 'Return Items' : modal.type === 'replace' ? 'Replace Item' : 'Manage Order'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle size={20} className="text-slate-400" /></button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Product Info */}
              <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                <img src={modal.order.order_items[0].products.image_url} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-sm">{modal.order.order_items[0].products.name}</h4>
                  <p className="text-xs text-slate-500">Ordered: {new Date(modal.order.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Reason for {modal.type}</label>
                  <select className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Damaged item</option>
                    <option>Wrong item received</option>
                    <option>Missing parts</option>
                    <option>Defective product</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Upload Images (Minimum 2)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {previews.map((p, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gray-200 relative">
                        <img src={p} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-gray-50 transition-colors">
                      <Camera size={20} />
                      <span className="text-[10px] font-bold uppercase mt-1">Add</span>
                      <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5">Additional Details</label>
                  <textarea 
                    placeholder="Tell us more about the issue..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl text-blue-800 text-xs">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>Our team will verify the details and contact you on WhatsApp within 48 hours for the next steps.</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-600">Cancel</button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : `Submit ${modal.type}`}
              </button>
            </div>
          </>
        ) : (
          <div className="p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold">Request Submitted!</h2>
            <p className="text-slate-500">Your {modal.type} request was received. We will update you via WhatsApp and Email within 48 hours.</p>
            <button 
              onClick={onClose}
              className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl mt-6 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
