import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useAdminData } from '../AdminData.jsx';
import { Modal, Field, PageHead, useConfirm, move, newId } from '../ui.jsx';

export default function Products() {
  const { draft, update } = useAdminData();
  const fams = draft.productFamilies;
  const [selected, setSelected] = useState(fams[0]?.id);
  const [itemForm, setItemForm] = useState(null); // {index|null, item}
  const [famForm, setFamForm] = useState(null);
  const [ask, dialog] = useConfirm();

  const fi = Math.max(0, fams.findIndex((f) => f.id === selected));
  const fam = fams[fi];

  const setFam = (k) => (e) => update((d) => { d.productFamilies[fi][k] = e.target.value; });

  async function removeFamily() {
    const ok = await ask({
      title: 'Delete this product family?',
      message: `"${fam.label}" and its ${fam.items.length} products will be removed once you save.`,
      confirmLabel: 'Delete family',
      danger: true,
    });
    if (!ok) return;
    const next = fams[fi + 1] ?? fams[fi - 1];
    update((d) => { d.productFamilies.splice(fi, 1); });
    setSelected(next?.id);
  }

  async function removeItem(i) {
    const ok = await ask({ title: 'Delete this product?', message: `"${fam.items[i].name}" will be removed once you save.`, confirmLabel: 'Delete product', danger: true });
    if (ok) update((d) => { d.productFamilies[fi].items.splice(i, 1); });
  }

  function addFamily(label) {
    const id = newId('f');
    update((d) => { d.productFamilies.push({ id, label, blurb: '', items: [] }); });
    setSelected(id);
    setFamForm(null);
  }

  function saveItem(item) {
    update((d) => {
      const items = d.productFamilies[fi].items;
      if (itemForm.index === null) items.push(item);
      else items[itemForm.index] = item;
    });
    setItemForm(null);
  }

  return (
    <>
      <PageHead title="Products" intro="The product families and items on the company page.">
        <button className="btn btn-primary" onClick={() => setFamForm(true)}><Plus size={16} /> Add family</button>
      </PageHead>

      {!fam ? (
        <div className="ad-card"><p className="ad-muted">No product families yet. Add one to get started.</p></div>
      ) : (
        <div className="ad-split">
          <aside className="ad-famlist" aria-label="Product families">
            {fams.map((f, i) => (
              <div key={f.id} className={`ad-fam ${f.id === fam.id ? 'on' : ''}`}>
                <button className="ad-fam-main" onClick={() => setSelected(f.id)}>
                  {f.label}<span>{f.items.length}</span>
                </button>
                <div className="ad-fam-move">
                  <button className="icon-btn" disabled={i === 0} aria-label={`Move ${f.label} up`} onClick={() => update((d) => move(d.productFamilies, i, -1))}><ArrowUp size={14} /></button>
                  <button className="icon-btn" disabled={i === fams.length - 1} aria-label={`Move ${f.label} down`} onClick={() => update((d) => move(d.productFamilies, i, 1))}><ArrowDown size={14} /></button>
                </div>
              </div>
            ))}
          </aside>

          <div>
            <section className="ad-card">
              <div className="ad-card-head">
                <h2>Family details</h2>
                <button className="btn btn-sm btn-danger-outline" onClick={removeFamily}><Trash2 size={14} /> Delete family</button>
              </div>
              <div className="ad-form">
                <Field label="Family name"><input value={fam.label} onChange={setFam('label')} maxLength={80} /></Field>
                <Field label="Description" hint="Shown above the product cards."><textarea rows={4} value={fam.blurb} onChange={setFam('blurb')} maxLength={800} /></Field>
              </div>
            </section>

            <section className="ad-card">
              <div className="ad-card-head">
                <h2>Products in {fam.label}</h2>
                <button className="btn btn-sm btn-primary" onClick={() => setItemForm({ index: null, item: { code: '', name: '', note: '' } })}><Plus size={14} /> Add product</button>
              </div>
              {fam.items.length === 0 ? (
                <p className="ad-muted">No products in this family yet.</p>
              ) : (
                <ul className="ad-items">
                  {fam.items.map((p, i) => (
                    <li key={i}>
                      <div>
                        <b>{p.code && <em>{p.code}</em>} {p.name}</b>
                        {p.note && <span>{p.note}</span>}
                      </div>
                      <div className="ad-rowactions">
                        <button className="icon-btn" disabled={i === 0} aria-label={`Move ${p.name} up`} onClick={() => update((d) => move(d.productFamilies[fi].items, i, -1))}><ArrowUp size={15} /></button>
                        <button className="icon-btn" disabled={i === fam.items.length - 1} aria-label={`Move ${p.name} down`} onClick={() => update((d) => move(d.productFamilies[fi].items, i, 1))}><ArrowDown size={15} /></button>
                        <button className="icon-btn" aria-label={`Edit ${p.name}`} onClick={() => setItemForm({ index: i, item: p })}><Pencil size={15} /></button>
                        <button className="icon-btn danger" aria-label={`Delete ${p.name}`} onClick={() => removeItem(i)}><Trash2 size={15} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}

      {itemForm && <ItemModal initial={itemForm.item} isNew={itemForm.index === null} onClose={() => setItemForm(null)} onSave={saveItem} />}
      {famForm && <FamilyModal onClose={() => setFamForm(null)} onSave={addFamily} />}
      {dialog}
    </>
  );
}

function ItemModal({ initial, isNew, onClose, onSave }) {
  const [f, setF] = useState(initial);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Enter the product name.');
    onSave({ code: f.code.trim(), name: f.name.trim(), note: f.note.trim() });
  }
  return (
    <Modal title={isNew ? 'Add product' : 'Edit product'} onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" form="item-form">{isNew ? 'Add product' : 'Apply changes'}</button></>}>
      <form id="item-form" className="ad-form" onSubmit={submit} noValidate>
        <Field label="Model code" hint="Optional, like DH or DL9-U."><input value={f.code} onChange={set('code')} maxLength={40} /></Field>
        <Field label="Product name" error={err}><input value={f.name} onChange={set('name')} maxLength={160} /></Field>
        <Field label="Note" hint="One or two lines on what it is used for."><textarea rows={3} value={f.note} onChange={set('note')} maxLength={500} /></Field>
      </form>
    </Modal>
  );
}

function FamilyModal({ onClose, onSave }) {
  const [label, setLabel] = useState('');
  const [err, setErr] = useState(null);
  function submit(e) {
    e.preventDefault();
    if (!label.trim()) return setErr('Enter a family name.');
    onSave(label.trim());
  }
  return (
    <Modal title="Add product family" size="sm" onClose={onClose}
      footer={<><button className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" form="fam-form">Add family</button></>}>
      <form id="fam-form" className="ad-form" onSubmit={submit} noValidate>
        <Field label="Family name" error={err}><input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} /></Field>
      </form>
    </Modal>
  );
}
