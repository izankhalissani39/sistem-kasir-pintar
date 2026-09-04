import { supabase } from './supabaseClient.js';

const toProductRow = (p, storeId) => ({
  id: p.id, store_id: storeId, name: p.name, sku: p.sku, barcode: p.barcode || null,
  category: p.category || null, cost_price: p.costPrice || 0, selling_price: p.sellingPrice || 0,
  stock: p.stock || 0, min_stock_alert: p.minStockAlert || 0, unit: p.unit || 'pcs',
  image: p.image || null, color_tag: p.colorTag || null, updated_at: new Date().toISOString(),
});

const fromProductRow = (p) => ({
  id: p.id, name: p.name, sku: p.sku, barcode: p.barcode || undefined, category: p.category || '',
  costPrice: Number(p.cost_price || 0), sellingPrice: Number(p.selling_price || 0), stock: Number(p.stock || 0),
  minStockAlert: Number(p.min_stock_alert || 0), unit: p.unit || 'pcs', image: p.image || undefined, colorTag: p.color_tag || undefined,
});

const fromTransactionRow = (t) => ({
  id: t.id,
  invoiceNumber: t.invoice_number || t.id,
  date: t.transaction_date,
  customername: t.customer_name || 'Pelanggan Umum',
  paymentmethod: t.payment_method || 'chas',
  subtital: Number(t.subtotal || 0),
  discountAmount: Number(t.discount_Amount || 0),
  taxAmount: Number(t.tax_amount || 0),
  totalAmount: Number(t.total_amount || 0),
  paidAmount: Number(t.paid_amount || 0),
  changeAmount: Number(t.change_amount || 0),
  status: t.status || 'completed',
  refoundReason: t.refound_reason || null,
  cashiername: t.cashier_name || '',
  items: t.items || [],
});

export async function ensureStore(storeName = 'TOKO BERKAH JAYA') {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('ensure_my_store', { store_name: storeName });
  if (error) throw error;
  return data;
}

export async function loadDatabase(storeId) {
  const [products, categories, settings, transactions, shifts, heldOrders] = await Promise.all([
    supabase.from('products').select('*').eq('store_id', storeId).order('name'),
    supabase.from('categories').select('name').eq('store_id', storeId).order('name'),
    supabase.from('store_settings').select('settings').eq('store_id', storeId).maybeSingle(),
    supabase.from('transactions').select('*').eq('store_id', storeId).order('transaction_date', { ascending: false }),
    supabase.from('shifts').select('shift').eq('store_id', storeId).eq('status', 'open').order('updated_at', { ascending: false }).limit(1),
    supabase.from('held_orders').select('order_data').eq('store_id', storeId).order('updated_at', { ascending: false }),
  ]);
  for (const result of [products, categories, settings, transactions, shifts, heldOrders]) if (result.error) throw result.error;
  return {
    products: products.data?.map(fromProductRow) || [],
    categories: categories.data?.map((x) => x.name) || [],
    settings: settings.data?.settings || null,
    transactions: transactions.data?.map(fromTransactionRow) || [],
    currentShift: shifts.data?.[0]?.shift || null,
    heldOrders: heldOrders.data?.map((x) => x.order_data) || [],
  };
}

export async function seedDatabase(storeId, { products, categories, settings, transactions }) {
  const productRows = products.map((p) => toProductRow(p, storeId));
  if (productRows.length) {
    const { error } = await supabase.from('products').upsert(productRows, { onConflict: 'id' });
    if (error) throw error;
  }
  if (categories?.length) {
    const { error } = await supabase.from('categories').upsert(categories.map((name) => ({ store_id: storeId, name })), { onConflict: 'store_id,name' });
    if (error) throw error;
  }
  if (settings) {
    const { error } = await supabase.from('store_settings').upsert({ store_id: storeId, settings });
    if (error) throw error;
  }
  if (transactions?.length) {
    const rows = transactions.map((t) => ({
      id: t.id, store_id: storeId, transaction_date: t.date || new Date().toISOString(), customer_name: t.customerName,
      payment_method: t.paymentMethod || 'cash', subtotal: t.subtotal || 0, discount_amount: t.discountAmount || 0,
      tax_amount: t.taxAmount || 0, total_amount: t.totalAmount || 0, paid_amount: t.paidAmount || 0, change_amount: t.changeAmount || 0,
      status: t.status || 'completed', refund_reason: t.refundReason || null, cashier_name: t.cashierName || '', items: t.items || [],
    }));
    const { error } = await supabase.from('transactions').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function uploadProductImage(storeId, product) {
  if (!product.image || !product.image.startsWith('data:image/')) return product.image || null;
  const match = product.image.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return product.image;
  const ext = match[1].split('/')[1].replace('jpeg', 'jpg');
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  const path = `${storeId}/${product.id}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, new Blob([bytes], { type: match[1] }), { upsert: true, contentType: match[1] });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

export async function upsertProduct(storeId, product) {
  const image = await uploadProductImage(storeId, product);
  const row = toProductRow({ ...product, image }, storeId);
  const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
  if (error) throw error;
}
export async function deleteProduct(storeId, id) {
  const { error } = await supabase.from('products').delete().eq('store_id', storeId).eq('id', id);
  if (error) throw error;
}
export async function syncCategories(storeId, categories) {
  const { data: existing, error: readError } = await supabase.from('categories').select('id,name').eq('store_id', storeId);
  if (readError) throw readError;
  const keep = new Set(categories);
  const remove = (existing || []).filter((x) => !keep.has(x.name)).map((x) => x.id);
  if (remove.length) { const { error } = await supabase.from('categories').delete().in('id', remove); if (error) throw error; }
  if (categories.length) { const { error } = await supabase.from('categories').upsert(categories.map((name) => ({ store_id: storeId, name })), { onConflict: 'store_id,name' }); if (error) throw error; }
}
export async function saveSettings(storeId, settings) {
  const { error } = await supabase.from('store_settings').upsert({ store_id: storeId, settings, updated_at: new Date().toISOString() });
  if (error) throw error;
}
export async function saveShift(storeId, shift) {
  if (!shift) return;
  const { error } = await supabase.from('shifts').upsert({ id: shift.id, store_id: storeId, shift, status: shift.status, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw error;
}
export async function syncHeldOrders(storeId, orders) {
  const { error: delError } = await supabase.from('held_orders').delete().eq('store_id', storeId);
  if (delError) throw delError;
  if (orders.length) {
    const { error } = await supabase.from('held_orders').insert(orders.map((order) => ({ id: order.id, store_id: storeId, order_data: order, updated_at: new Date().toISOString() })));
    if (error) throw error;
  }
}
export async function commitSale(storeId, transaction) {
  const { data, error } = await supabase.rpc('commit_sale', { p_store_id: storeId, p_transaction: transaction });
  if (error) throw error;
  return fromTransactionRow(data);
}
export async function upsertTransaction(storeId, transaction) {
  const { error } = await supabase.from('transactions').upsert({
    id: transaction.id, store_id: storeId, transaction_date: transaction.date || new Date().toISOString(), customer_name: transaction.customerName,
    payment_method: transaction.paymentMethod || 'cash', subtotal: transaction.subtotal || 0, discount_amount: transaction.discountAmount || 0,
    tax_amount: transaction.taxAmount || 0, total_amount: transaction.totalAmount || 0, paid_amount: transaction.paidAmount ?? transaction.amountPaid ?? 0,
    change_amount: transaction.changeAmount ?? transaction.change ?? 0, status: transaction.status || 'completed', refund_reason: transaction.refundReason || null,
    cashier_name: transaction.cashierName || '', items: transaction.items || [],
  }, { onConflict: 'id' });
  if (error) throw error;
}

export async function refundSale(storeId, transactionId, reason) {
  const { data, error } = await supabase.rpc('refund_sale', { p_store_id: storeId, p_transaction_id: transactionId, p_reason: reason || '' });
  if (error) throw error;
  return fromTransactionRow(data);
}
