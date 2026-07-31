import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const Field = ({ label, name, type = 'text', required, children, formData, onChange, ...props }) => (
  <div>
    <label className="label">{label}{required && ' *'}</label>
    {children || <input type={type} value={name.split('.').reduce((o, k) => o?.[k], formData) || ''} onChange={onChange(name)} className="input" required={required} {...props} />}
  </div>
)

const emptyForm = {
  studentInfo: {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male',
    bloodGroup: '',
    religion: '',
    caste: '',
    nationality: 'Indian',
    motherTongue: ''
  },
  contactInfo: {
    phone: '',
    email: '',
    address: { street: '', city: '', state: '', pincode: '' }
  },
  parentInfo: {
    fatherName: '',
    fatherPhone: '',
    fatherOccupation: '',
    fatherEmail: '',
    motherName: '',
    motherPhone: '',
    motherOccupation: '',
    motherEmail: ''
  },
  previousEducation: {
    lastSchool: '',
    lastClass: '',
    lastBoard: ''
  },
  feeDiscount: {
    type: 'fixed',
    amount: 0,
    reason: ''
  },
  classApplied: '',
  section: 'A'
}

const AdmissionForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchClasses()
    if (isEdit) fetchAdmission()
  }, [id])

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes?limit=100')
      setClasses(response.data.data || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load classes')
    }
  }

  const fetchAdmission = async () => {
    try {
      const response = await api.get(`/admissions/${id}`)
      const admission = response.data.admission
      setFormData({
        ...emptyForm,
        ...admission,
        classApplied: admission.classApplied?._id || admission.classApplied || '',
        studentInfo: { ...emptyForm.studentInfo, ...admission.studentInfo, dateOfBirth: admission.studentInfo?.dateOfBirth?.slice(0, 10) || '' },
        contactInfo: { ...emptyForm.contactInfo, ...admission.contactInfo, address: { ...emptyForm.contactInfo.address, ...(admission.contactInfo?.address || {}) } },
        parentInfo: { ...emptyForm.parentInfo, ...admission.parentInfo },
        previousEducation: { ...emptyForm.previousEducation, ...(admission.previousEducation || {}) },
        feeDiscount: { ...emptyForm.feeDiscount, ...(admission.feeDiscount || {}) }
      })
    } catch (error) {
      console.error('Failed to fetch admission:', error)
    }
  }

  const handleChange = (path) => (e) => {
    const { value } = e.target
    const parsedValue = path === 'feeDiscount.amount' ? parseFloat(value) || 0 : value
    setFormData((prev) => {
      const keys = path.split('.')
      if (keys.length === 1) return { ...prev, [keys[0]]: parsedValue }
      const [first, ...rest] = keys
      const update = (obj, ks, v) => {
        if (ks.length === 1) return { ...obj, [ks[0]]: v }
        const [k, ...r] = ks
        return { ...obj, [k]: update(obj[k] || {}, r, v) }
      }
      return { ...prev, [first]: update(prev[first] || {}, rest, parsedValue) }
    })
  }

  const selectedClass = classes.find((c) => c._id === formData.classApplied)
  const sections = selectedClass?.sections?.length ? selectedClass.sections : ['A', 'B', 'C']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/admissions/${id}`, formData)
        toast.success('Admission updated successfully')
      } else {
        await api.post('/admissions', formData)
        toast.success('Application submitted successfully')
      }
      navigate('/admissions')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save admission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Admission' : 'New Admission Application'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-8">
        {/* Academic & Class */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field formData={formData} onChange={handleChange} label="Class Applied" name="classApplied" required>
              <select value={formData.classApplied} onChange={handleChange('classApplied')} className="input" required>
                <option value="">Select a class</option>
                {classes.map((classItem) => <option key={classItem._id} value={classItem._id}>{classItem.name}</option>)}
              </select>
            </Field>
            <Field formData={formData} onChange={handleChange} label="Section" name="section" required>
              <select value={formData.section} onChange={handleChange('section')} className="input" required>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field formData={formData} onChange={handleChange} label="First Name" name="studentInfo.firstName" required />
            <Field formData={formData} onChange={handleChange} label="Last Name" name="studentInfo.lastName" required />
            <Field formData={formData} onChange={handleChange} label="Date of Birth" name="studentInfo.dateOfBirth" type="date" required />
            <Field formData={formData} onChange={handleChange} label="Gender" name="studentInfo.gender" required>
              <select value={formData.studentInfo.gender} onChange={handleChange('studentInfo.gender')} className="input" required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field formData={formData} onChange={handleChange} label="Blood Group" name="studentInfo.bloodGroup" />
            <Field formData={formData} onChange={handleChange} label="Religion" name="studentInfo.religion" />
            <Field formData={formData} onChange={handleChange} label="Caste" name="studentInfo.caste" />
            <Field formData={formData} onChange={handleChange} label="Nationality" name="studentInfo.nationality" />
            <Field formData={formData} onChange={handleChange} label="Mother Tongue" name="studentInfo.motherTongue" />
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field formData={formData} onChange={handleChange} label="Phone" name="contactInfo.phone" type="tel" required />
            <Field formData={formData} onChange={handleChange} label="Email" name="contactInfo.email" type="email" />
            <div className="md:col-span-2">
              <Field formData={formData} onChange={handleChange} label="Street Address" name="contactInfo.address.street" />
            </div>
            <Field formData={formData} onChange={handleChange} label="City" name="contactInfo.address.city" />
            <Field formData={formData} onChange={handleChange} label="State" name="contactInfo.address.state" />
            <Field formData={formData} onChange={handleChange} label="Pincode" name="contactInfo.address.pincode" />
          </div>
        </div>

        {/* Parent Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field formData={formData} onChange={handleChange} label="Father's Name" name="parentInfo.fatherName" required />
            <Field formData={formData} onChange={handleChange} label="Father's Phone" name="parentInfo.fatherPhone" type="tel" required />
            <Field formData={formData} onChange={handleChange} label="Father's Occupation" name="parentInfo.fatherOccupation" />
            <Field formData={formData} onChange={handleChange} label="Father's Email" name="parentInfo.fatherEmail" type="email" />
            <Field formData={formData} onChange={handleChange} label="Mother's Name" name="parentInfo.motherName" />
            <Field formData={formData} onChange={handleChange} label="Mother's Phone" name="parentInfo.motherPhone" type="tel" />
            <Field formData={formData} onChange={handleChange} label="Mother's Occupation" name="parentInfo.motherOccupation" />
            <Field formData={formData} onChange={handleChange} label="Mother's Email" name="parentInfo.motherEmail" type="email" />
          </div>
        </div>

        {/* Previous Education */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Education</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field formData={formData} onChange={handleChange} label="Last School" name="previousEducation.lastSchool" />
            <Field formData={formData} onChange={handleChange} label="Last Class" name="previousEducation.lastClass" />
            <Field formData={formData} onChange={handleChange} label="Last Board" name="previousEducation.lastBoard" />
          </div>
        </div>

        {/* Fee Discount */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Discount (Optional)</h3>
          <p className="text-sm text-gray-500 mb-4">Apply a per-student discount on fee invoices. Leave amount as 0 for no discount.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="label">Discount Type</label>
              <select value={formData.feeDiscount.type} onChange={handleChange('feeDiscount.type')} className="input">
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="label">Discount Amount</label>
              <input
                type="number"
                min="0"
                value={formData.feeDiscount.amount}
                onChange={handleChange('feeDiscount.amount')}
                className="input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Reason</label>
              <input
                type="text"
                value={formData.feeDiscount.reason}
                onChange={handleChange('feeDiscount.reason')}
                className="input"
                placeholder="e.g. Sibling concession, scholarship"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/admissions')} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn btn-primary disabled:opacity-50">
            {loading ? 'Saving...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdmissionForm
