import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { Plus, Edit, DollarSign } from 'lucide-react'

const FeeStructureList = () => {
  const [structures, setStructures] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStructures()
  }, [])

  const fetchStructures = async () => {
    try {
      const response = await api.get('/fees/structure')
      setStructures(response.data.feeStructures || [])
    } catch (error) {
      console.error('Failed to fetch fee structures:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Structures</h1>
          <p className="text-gray-600 mt-1">Manage fee structures for classes</p>
        </div>
        <Link to="/fees/structure/new" className="btn btn-primary inline-flex items-center">
          <Plus className="w-4 h-4 mr-2" /> Add Fee Structure
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(structures) && structures.length > 0 ? (
          structures.map((structure) => (
            <div key={structure._id} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{structure.name}</h3>
                <Link to={`/fees/structure/${structure._id}/edit`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">Class:</span> {structure.classId?.name || '-'}</p>
                <p><span className="text-gray-500">Session:</span> {structure.academicSession}</p>
                <p className="text-lg font-bold text-primary-600">₹{structure.totalAmount}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-500">No fee structures found</div>
        )}
      </div>
    </div>
  )
}

export default FeeStructureList
