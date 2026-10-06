import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

// TODO: build the Write Review page — see README.md "Your task".
// This page is already routed at /reviews/new (write) and /reviews/:id (edit),
// and both routes are wrapped in <ProtectedRoute>.

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')

  //used while saving a review and prevents repeated submissions.
  const [loading, setLoading] = useState(false)

  // TODO (edit mode): when there is an `id`, load the review and fill the form.
  useEffect(() => {
    let cancelled = false // prevent setState on unmounted component
    if (!id) {
      setForm(defaults) // reset form when navigating from edit to new
      setError('')
      return
    }

    async function load() {
      setError('')
      try {
        const res = await api.get('/reviews/' + id)
        if (!cancelled) {
          const { courseCode, rating, comment } = res.data.review
          // only set these fields to avoid sending metadata (like _id) back to server
          setForm({ courseCode, rating: Number(rating), comment: comment || '' })
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Could not load review')
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // TODO: update `form` when an input changes (rating should be a number).
  function onChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'rating' ? Number(value) : value })) // rating must be a number
  }

  // TODO: POST a new review, or PATCH the existing one when editing,
  // then go back to /reviews. Show the server's error message on failure.
  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true) // disable button to prevent double-submit

    try {
      const { courseCode, rating, comment } = form
      if (id) {
        await api.patch('/reviews/' + id, { courseCode, rating, comment })
      } else {
        await api.post('/reviews', { courseCode, rating, comment })
      }
      nav('/reviews')
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not save review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto card">
      <h1 className="text-xl font-semibold mb-4">{id ? 'Edit' : 'Write'} Review</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Course Code</label>
          <input
            className="input"
            name="courseCode"
            placeholder="Course code (e.g. CS101)"
            value={form.courseCode}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Rating</label>
          <select className="input" name="rating" value={form.rating} onChange={onChange}>
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n} / 5</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comment</label>
          <textarea
            className="input"
            name="comment"
            placeholder="Comment (optional)"
            value={form.comment}
            onChange={onChange}
            rows={4}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  )
}
