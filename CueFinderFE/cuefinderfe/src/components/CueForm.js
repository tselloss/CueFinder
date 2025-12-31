import React, { useState } from 'react';

const empty = {
  title: '',
  brand: '',
  price: '',
  condition: 'Used',
  material: '',
  weight: '',
  length: '',
  tip_size: '',
  description: '',
  image: '',
  images: [],
  seller_name: '',
  seller_email: '',
  seller_phone: '',
  location: '',
  is_sold: false,
};

export default function CueForm({ onCancel, onSave }) {
  const [form, setForm] = useState(empty);
  const [previews, setPreviews] = useState([]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const readers = files.map((file) => {
      return new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res({ name: file.name, data: r.result });
        r.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((arr) => {
      setPreviews(arr);
      setForm((f) => ({ ...f, images: arr.map((a) => a.data) }));
    });
  };

  const submit = (e) => {
    e.preventDefault();
    // normalize price/number fields
    const payload = { ...form, price: parseFloat(form.price || 0), weight: form.weight, length: form.length };
    onSave(payload);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onCancel}></div>
      <div className="drawer">
        <div className="drawer-header">
          <h3>Add New Billiard Cue</h3>
          <button className="btn close-btn" onClick={onCancel}>✕</button>
        </div>

        <form className="cue-form" onSubmit={submit}>
          <label>
            title
            <small>Name/title of the cue</small>
            <input name="title" value={form.title} onChange={change} />
          </label>

          <label>
            brand
            <small>Brand of the cue</small>
            <input name="brand" value={form.brand} onChange={change} />
          </label>

          <label>
            price
            <small>Asking price in USD</small>
            <input name="price" type="number" step="0.01" value={form.price} onChange={change} />
          </label>

          <label>
            condition
            <small>Condition of the cue</small>
            <select name="condition" value={form.condition} onChange={change}><option>New</option><option>Used</option></select>
          </label>

          <label>
            material
            <small>Main shaft material (maple, ash, carbon fiber, etc.)</small>
            <input name="material" value={form.material} onChange={change} />
          </label>

          <label>
            weight
            <small>Weight in oz (e.g., 19oz)</small>
            <input name="weight" value={form.weight} onChange={change} />
          </label>

          <label>
            length
            <small>Length in inches (e.g., 58")</small>
            <input name="length" value={form.length} onChange={change} />
          </label>

          <label>
            tip_size
            <small>Tip diameter (e.g., 12mm)</small>
            <input name="tip_size" value={form.tip_size} onChange={change} />
          </label>

          <label>
            description
            <small>Additional details</small>
            <textarea name="description" value={form.description} onChange={change} />
          </label>

          <label>
            photos
            <small>Upload one or more photos (preview shown)</small>
            <input name="photos" type="file" accept="image/*" multiple onChange={handleFiles} />
            <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
              {previews.length ? previews.map((p,idx)=> (
                <div key={idx} style={{width:70, height:70, borderRadius:6, overflow:'hidden', background:'#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <img src={p.data} alt={p.name} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                </div>
              )) : <div style={{color:'#64748b', fontSize:'0.9rem'}}>No photos selected</div>}
            </div>
          </label>

          <label>
            seller_name
            <small>Seller's display name</small>
            <input name="seller_name" value={form.seller_name} onChange={change} />
          </label>

          <label>
            seller_email
            <small>Seller's contact email</small>
            <input name="seller_email" value={form.seller_email} onChange={change} />
          </label>

          <label>
            seller_phone
            <small>Seller's phone (optional)</small>
            <input name="seller_phone" value={form.seller_phone} onChange={change} />
          </label>

          <label>
            location
            <small>General location/city</small>
            <input name="location" value={form.location} onChange={change} />
          </label>

          <label style={{display:'flex', alignItems:'center', gap:8}}>
            <input name="is_sold" type="checkbox" checked={form.is_sold} onChange={(e)=> setForm(f=>({...f, is_sold: e.target.checked}))} />
            <div>
              is_sold
              <small>Whether the cue has been sold</small>
            </div>
          </label>

          <div className="form-actions">
            <button type="button" className="btn" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn primary">Save</button>
          </div>
        </form>
      </div>
    </>
  );
}
