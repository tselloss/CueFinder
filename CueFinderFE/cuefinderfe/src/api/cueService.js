let _id = 3;
const store = [
  { id: 1, title: 'REVO', brand: 'Predator', price: 599.99, description: 'High-end carbon cue.', condition: 'Used', location: 'NY, USA', images: [], seller_name: 'Mike', seller_email: 'mike@example.com', seller_phone: '', is_sold: false },
  { id: 2, title: 'Classic', brand: 'Meucci', price: 249.0, description: 'Popular two-piece cue.', condition: 'New', location: 'CA, USA', images: [], seller_name: 'Sara', seller_email: 'sara@example.com', seller_phone: '', is_sold: false },
];

export async function getCues() {
  // simulate network
  return new Promise((res) => setTimeout(() => res([...store]), 200));
}

export async function getCueById(id) {
  return new Promise((res) => setTimeout(() => res(store.find((s) => s.id === id) || null), 150));
}

export async function createCue(cue) {
  const item = { 
    id: ++_id,
    title: cue.title || `${cue.brand || 'Cue'} ${_id}`,
    brand: cue.brand || '',
    price: Number(cue.price) || 0,
    description: cue.description || '',
    condition: cue.condition || 'Used',
    material: cue.material || '',
    weight: cue.weight || '',
    length: cue.length || '',
    tip_size: cue.tip_size || '',
  images: Array.isArray(cue.images) ? cue.images : (cue.image ? [cue.image] : []),
    seller_name: cue.seller_name || '',
    seller_email: cue.seller_email || '',
    seller_phone: cue.seller_phone || '',
    location: cue.location || '',
    is_sold: !!cue.is_sold,
  };
  store.unshift(item);
  return new Promise((res) => setTimeout(() => res(item), 120));
}

export async function deleteCue(id) {
  const idx = store.findIndex((s) => s.id === id);
  if (idx >= 0) store.splice(idx, 1);
  return new Promise((res) => setTimeout(() => res({ success: idx >= 0 }), 100));
}

export async function updateCue(id, patch) {
  const item = store.find((s) => s.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  return new Promise((res) => setTimeout(() => res(item), 100));
}
