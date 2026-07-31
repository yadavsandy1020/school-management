import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { PageHeader, Skeleton, EmptyState } from '../../components/ui'
import Can from '../../components/Can'
import { Plus, Package, RotateCcw, Pencil, Trash2, X } from 'lucide-react'

const InventoryDashboard = () => {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [movements, setMovements] = useState([])
  const [activeTab, setActiveTab] = useState('items')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('item')
  const [formData, setFormData] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchItems(), fetchCategories(), fetchMovements()])
    setLoading(false)
  }

  const fetchItems = async () => { try { const res = await api.get('/inventory'); setItems(res.data.data) } catch (e) { /* ignore */ } }
  const fetchCategories = async () => { try { const res = await api.get('/inventory/categories'); setCategories(res.data.data) } catch (e) { /* ignore */ } }
  const fetchMovements = async () => { try { const res = await api.get('/inventory/movements'); setMovements(res.data.data) } catch (e) { /* ignore */ } }

  const openModal = (type, data = {}) => { setModalType(type); setFormData(data); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setFormData({}) }

  const handleSaveItem = async (e) => {
    e.preventDefault()
    try {
      if (formData._id) {
        await api.put(`/inventory/${formData._id}`, formData)
      } else {
        await api.post('/inventory', formData)
      }
      toast.success('Item saved')
      closeModal()
      fetchAll()
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to save item') }
  }

  const handleMovement = async (e) => {
    e.preventDefault()
    try {
      await api.post('/inventory/movements', formData)
      toast.success('Movement recorded')
      closeModal()
      fetchAll()
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to record movement') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this item?')) return
    try { await api.delete(`/inventory/${id}`); toast.success('Deactivated'); fetchAll() } catch (error) { toast.error('Failed to deactivate') }
  }

  if (loading) return (<div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>)

  const tabs = [
    { id: 'items', label: 'Items', count: items.length, icon: Package },
    { id: 'movements', label: 'Movements', count: movements.length, icon: RotateCcw },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Inventory Management"
        description="Track stock, movements, and low-stock alerts"
        actions={
          <Can permission="INVENTORY_MANAGE">
            <button onClick={() => openModal(activeTab === 'movements' ? 'movement' : 'item')} className="btn btn-primary gap-2"><Plus className="h-4 w-4" /> {activeTab === 'movements' ? 'Record Movement' : 'Add Item'}</button>
          </Can>
        }
      />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <tab.icon className="h-4 w-4" />{tab.label}
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'items' && (
          <div className="overflow-x-auto">
            {items.length === 0 ? <EmptyState title="No inventory items" description="Add items to track stock" /> : (
              <table className="data-table">
                <thead><tr><th>Item</th><th>Code</th><th>Category</th><th>Stock</th><th>Unit Price</th><th>Actions</th></tr></thead>
                <tbody>
                  {items.map(item => {
                    const low = item.quantity <= item.reorderLevel
                    return (
                      <tr key={item._id}>
                        <td className="font-medium">{item.name}</td>
                        <td>{item.code}</td>
                        <td className="capitalize">{item.category}</td>
                        <td>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${low ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td>₹{item.unitPrice}</td>
                        <td>
                          <Can permission="INVENTORY_MANAGE">
                            <button onClick={() => openModal('item', item)} className="icon-button h-8 w-8"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(item._id)} className="icon-button h-8 w-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /></button>
                          </Can>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
            {movements.length === 0 ? <EmptyState title="No movements" description="Record stock in/out movements" /> : (
              <table className="data-table">
                <thead><tr><th>Item</th><th>Type</th><th>Qty</th><th>Reference</th><th>Date</th></tr></thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m._id}>
                      <td>{m.itemId?.name}</td>
                      <td>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${m.type === 'in' || m.type === 'return' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10' : m.type === 'out' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'}`}>
                          {m.type}
                        </span>
                      </td>
                      <td>{m.quantity}</td>
                      <td>{m.reference || '—'}</td>
                      <td className="text-xs">{new Date(m.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{formData._id ? 'Edit Item' : modalType === 'movement' ? 'Record Movement' : 'Add Item'}</h2>
              <button onClick={closeModal} className="icon-button h-8 w-8"><X className="h-4 w-4" /></button>
            </div>
            {modalType === 'item' ? (
              <form onSubmit={handleSaveItem} className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="field" placeholder="Item Name" required />
                  <input value={formData.code || ''} onChange={e => setFormData({ ...formData, code: e.target.value })} className="field" placeholder="Item Code" required />
                </div>
                <input list="categories" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} className="field" placeholder="Category" />
                <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                <div className="grid grid-cols-3 gap-4">
                  <input value={formData.unit || ''} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="field" placeholder="Unit" />
                  <input type="number" value={formData.quantity || ''} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="field" placeholder="Quantity" />
                  <input type="number" value={formData.reorderLevel || ''} onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })} className="field" placeholder="Reorder Level" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={formData.unitPrice || ''} onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })} className="field" placeholder="Unit Price" />
                  <input value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className="field" placeholder="Storage Location" />
                </div>
                <input value={formData.supplier || ''} onChange={e => setFormData({ ...formData, supplier: e.target.value })} className="field" placeholder="Supplier" />
                <textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="field" rows="2" placeholder="Description" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleMovement} className="mt-4 space-y-4">
                <select value={formData.itemId || ''} onChange={e => setFormData({ ...formData, itemId: e.target.value })} className="field" required>
                  <option value="">Select Item</option>
                  {items.map(i => <option key={i._id} value={i._id}>{i.name} ({i.quantity} {i.unit})</option>)}
                </select>
                <select value={formData.type || 'in'} onChange={e => setFormData({ ...formData, type: e.target.value })} className="field" required>
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                  <option value="return">Return</option>
                  <option value="adjustment">Adjustment</option>
                </select>
                <input type="number" value={formData.quantity || ''} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} className="field" placeholder="Quantity" required />
                <input value={formData.reference || ''} onChange={e => setFormData({ ...formData, reference: e.target.value })} className="field" placeholder="Reference / PO No" />
                <textarea value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="field" rows="2" placeholder="Notes" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
                  <button type="submit" className="btn btn-primary">Record</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryDashboard
