'use client'

import { useState, useRef, useEffect, useCallback } from "react"

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   CONFIG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const WHATSAPP_NUMBER = "33618565507"
const STORAGE_KEY = "menu-collector-data"

const uid = () => Math.random().toString(36).slice(2, 9)

const LANG_META = {
  fr: { label: "Français", flag: "🇫🇷" },
  en: { label: "English", flag: "🇬🇧" },
  it: { label: "Italiano", flag: "🇮🇹" },
  es: { label: "Español", flag: "🇪🇸" },
}

const DEFAULT_CATEGORIES = ["Entrées", "Plats", "Desserts", "Boissons", "Formules"]

/* ─── localStorage helpers ─── */
function loadState() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
function saveToStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}
function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

/* ─── Components ─── */

function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 4px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? "var(--accent)" : "var(--border)", transition: "background 0.4s ease" }} />
      ))}
    </div>
  )
}

function StepLayout({ title, subtitle, children, step, totalSteps, onBack, onNext, nextLabel, nextDisabled, hideNext }) {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)", maxWidth: 520, margin: "0 auto" }}>
      <div style={{ padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 10, background: "var(--bg)" }}>
        <ProgressBar step={step} total={totalSteps} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, marginBottom: 4 }}>
          {step > 0 && <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, fontSize: 20, color: "var(--text-secondary)", lineHeight: 1 }}>←</button>}
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4 }}>{subtitle}</div>}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, padding: "20px 20px 120px", animation: "fadeUp 0.35s ease forwards" }}>{children}</div>
      {!hideNext && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px", paddingBottom: "max(16px, env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--bg) 70%, transparent)", maxWidth: 520, margin: "0 auto" }}>
          <button onClick={onNext} disabled={nextDisabled} style={{
            width: "100%", padding: "16px 24px",
            background: nextDisabled ? "var(--border)" : "var(--bg-accent)",
            color: nextDisabled ? "var(--text-muted)" : "#fff",
            border: "none", borderRadius: "var(--radius-sm)",
            fontSize: 16, fontWeight: 600, fontFamily: "var(--font-body)",
            cursor: nextDisabled ? "default" : "pointer",
            transition: "var(--transition)", boxShadow: nextDisabled ? "none" : "var(--shadow-md)",
          }}>{nextLabel || "Suivant →"}</button>
        </div>
      )}
    </div>
  )
}

function LangToggle({ code, active, locked, onToggle }) {
  const m = LANG_META[code]
  return (
    <button onClick={() => !locked && onToggle(code)} style={{
      display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 18px",
      background: active ? "var(--accent-light)" : "var(--bg-card)",
      border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
      borderRadius: "var(--radius-sm)", cursor: locked ? "default" : "pointer",
      transition: "var(--transition)", opacity: locked ? 0.85 : 1,
    }}>
      <span style={{ fontSize: 28 }}>{m.flag}</span>
      <span style={{ flex: 1, textAlign: "left", fontSize: 16, fontWeight: 500 }}>{m.label}</span>
      {locked && <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>par défaut</span>}
      {!locked && (
        <div style={{ width: 24, height: 24, borderRadius: 7, background: active ? "var(--accent)" : "var(--bg-subtle)", display: "flex", alignItems: "center", justifyContent: "center", transition: "var(--transition)", fontSize: 14, color: "#fff" }}>
          {active && "✓"}
        </div>
      )}
    </button>
  )
}

function CategoryChip({ name, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 18px", borderRadius: 50,
      background: active ? "var(--bg-accent)" : "var(--bg-card)",
      color: active ? "#fff" : "var(--text)",
      border: `1.5px solid ${active ? "var(--bg-accent)" : "var(--border)"}`,
      fontSize: 15, fontWeight: 500, cursor: "pointer", transition: "var(--transition)",
      fontFamily: "var(--font-body)", whiteSpace: "nowrap",
    }}>
      {active && <span style={{ marginRight: 6 }}>✓</span>}{name}
    </button>
  )
}

function ProductRow({ item, onUpdate, onRemove, onDuplicate, index, onEnterNext, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const nameRef = useRef(null)
  const priceRef = useRef(null)

  useEffect(() => { if (isLast && nameRef.current) nameRef.current.focus() }, [])

  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", overflow: "hidden", animation: "scaleIn 0.2s ease forwards", transition: "var(--transition)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px" }}>
        <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600, minWidth: 20 }}>{index + 1}</span>
        <input ref={nameRef} value={item.name.fr}
          onChange={(e) => onUpdate({ ...item, name: { ...item.name, fr: e.target.value } })}
          onKeyDown={(e) => { if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); priceRef.current?.focus() } }}
          placeholder="Nom du produit"
          style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontWeight: 500, fontFamily: "var(--font-body)", background: "transparent", minWidth: 0, color: "var(--text)" }}
        />
        <input ref={priceRef} value={item.price}
          onChange={(e) => onUpdate({ ...item, price: e.target.value })}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onEnterNext() } }}
          placeholder="Prix" inputMode="decimal"
          style={{ width: 72, border: "none", outline: "none", fontSize: 15, fontWeight: 600, fontFamily: "var(--font-body)", background: "var(--bg-subtle)", padding: "6px 10px", borderRadius: "var(--radius-xs)", textAlign: "right", color: "var(--accent)" }}
        />
        <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 500 }}>€</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", borderTop: "1px solid var(--border)", padding: "0 6px" }}>
        <button onClick={() => setExpanded(!expanded)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-body)", textAlign: "left", fontWeight: 500 }}>
          {expanded ? "− masquer" : "+ détails"}
        </button>
        <button onClick={onDuplicate} title="Dupliquer" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 14, color: "var(--text-muted)" }}>⧉</button>
        <button onClick={onRemove} title="Supprimer" style={{ background: "none", border: "none", cursor: "pointer", padding: 8, fontSize: 14, color: "var(--danger)" }}>✕</button>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)", padding: 14, background: "var(--bg-subtle)", animation: "fadeUp 0.2s ease forwards" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Description</label>
          <textarea value={item.description?.fr || ""}
            onChange={(e) => onUpdate({ ...item, description: { ...(item.description || {}), fr: e.target.value } })}
            placeholder="Ingrédients, précisions… (optionnel)" rows={2}
            style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xs)", padding: "8px 10px", fontSize: 14, fontFamily: "var(--font-body)", background: "var(--bg-card)", outline: "none", resize: "vertical", color: "var(--text)" }}
          />
        </div>
      )}
    </div>
  )
}

/* ─── Category Tabs: WRAP instead of scroll ─── */
function CategoryTabs({ categories, activeId, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingBottom: 8 }}>
      {categories.map(c => (
        <button key={c.id} onClick={() => onChange(c.id)} style={{
          padding: "8px 16px", borderRadius: 50,
          background: c.id === activeId ? "var(--bg-accent)" : "var(--bg-card)",
          color: c.id === activeId ? "#fff" : "var(--text-secondary)",
          border: `1.5px solid ${c.id === activeId ? "var(--bg-accent)" : "var(--border)"}`,
          fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "var(--transition)",
        }}>
          {c.name} <span style={{ opacity: 0.6, marginLeft: 4 }}>({c.items.length})</span>
        </button>
      ))}
    </div>
  )
}

function SumStat({ emoji, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: "var(--bg-card)", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-display)" }}>{value}</div>
      </div>
    </div>
  )
}

/* ─── Main App ─── */
export default function MenuCollector() {
  const [step, setStep] = useState(0)
  const [restaurantName, setRestaurantName] = useState("")
  const [languages, setLanguages] = useState(["fr"])
  const [categories, setCategories] = useState([])
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [activeCatId, setActiveCatId] = useState(null)
  const [newCatName, setNewCatName] = useState("")
  const [loaded, setLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const newCatRef = useRef(null)
  const saveTimeout = useRef(null)

  /* ─── Load ─── */
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      if (saved.restaurantName) setRestaurantName(saved.restaurantName)
      if (saved.languages) setLanguages(saved.languages)
      if (saved.categories) setCategories(saved.categories)
      if (saved.notes) setNotes(saved.notes)
      if (typeof saved.step === "number") setStep(saved.step)
      if (saved.activeCatId) setActiveCatId(saved.activeCatId)
    }
    setLoaded(true)
  }, [])

  /* ─── Autosave ─── */
  const doSave = useCallback(() => {
    if (!loaded) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      saveToStorage({ restaurantName, languages, categories, notes, step, activeCatId })
    }, 400)
  }, [restaurantName, languages, categories, notes, step, activeCatId, loaded])

  useEffect(() => { doSave() }, [doSave])

  /* ─── Submit: send PDF via email + WhatsApp notification ─── */
  const handleSubmit = async () => {
    setSending(true)
    try {
      // Send data to API route → generates PDF → emails it
      await fetch('/api/send-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName, languages, categories, notes }),
      })
    } catch (e) {
      console.error('Send error:', e)
    }

    // Open WhatsApp with simple confirmation message
    const msg = `Le formulaire est envoyé ! 😊`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank")

    clearStorage()
    setSending(false)
    setSubmitted(true)
  }

  /* ─── Reset ─── */
  const handleReset = () => {
    clearStorage()
    setStep(0); setRestaurantName(""); setLanguages(["fr"]); setCategories([]); setNotes(""); setActiveCatId(null); setSubmitted(false)
  }

  const toggleLang = (code) => setLanguages(prev => prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code])

  const toggleDefaultCat = (name) => {
    setCategories(prev => {
      const exists = prev.find(c => c.name === name)
      if (exists) return prev.filter(c => c.name !== name)
      return [...prev, { id: uid(), name, order: prev.length, items: [] }]
    })
  }

  const addCustomCat = () => {
    const n = newCatName.trim()
    if (!n) return
    setCategories(prev => [...prev, { id: uid(), name: n, order: prev.length, items: [] }])
    setNewCatName("")
    newCatRef.current?.focus()
  }

  const removeCat = (id) => setCategories(prev => prev.filter(c => c.id !== id))
  const activeCategory = categories.find(c => c.id === activeCatId)

  const addProduct = () => {
    setCategories(prev => prev.map(c =>
      c.id === activeCatId ? { ...c, items: [...c.items, { id: uid(), name: { fr: "" }, price: "", description: {} }] } : c
    ))
  }

  const updateProduct = (itemId, updated) => {
    setCategories(prev => prev.map(c =>
      c.id === activeCatId ? { ...c, items: c.items.map(it => it.id === itemId ? updated : it) } : c
    ))
  }

  const removeProduct = (itemId) => {
    setCategories(prev => prev.map(c =>
      c.id === activeCatId ? { ...c, items: c.items.filter(it => it.id !== itemId) } : c
    ))
  }

  const duplicateProduct = (itemId) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== activeCatId) return c
      const idx = c.items.findIndex(it => it.id === itemId)
      if (idx === -1) return c
      const copy = { ...JSON.parse(JSON.stringify(c.items[idx])), id: uid() }
      const items = [...c.items]
      items.splice(idx + 1, 0, copy)
      return { ...c, items }
    }))
  }

  const totalProducts = categories.reduce((s, c) => s + c.items.length, 0)

  useEffect(() => {
    if (step === 2 && categories.length > 0 && !activeCatId) setActiveCatId(categories[0].id)
  }, [step, categories])

  if (!loaded) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text-muted)" }}>Chargement…</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: "var(--bg)", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--success-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, marginBottom: 24, animation: "checkPop 0.4s ease forwards" }}>✓</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Menu envoyé !</div>
        <div style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.5, maxWidth: 300, marginBottom: 32 }}>
          Merci ! Votre carte a été transmise. Nous revenons vers vous très rapidement.
        </div>
        <button onClick={handleReset} style={{
          padding: "12px 24px", background: "none", border: "1.5px solid var(--border)",
          borderRadius: "var(--radius-sm)", fontSize: 14, fontWeight: 600, cursor: "pointer",
          fontFamily: "var(--font-body)", color: "var(--text-secondary)",
        }}>Créer une nouvelle carte</button>
      </div>
    )
  }

  return (
    <>
      {/* Step 0: Restaurant + Languages */}
      {step === 0 && (
        <StepLayout step={0} totalSteps={5} title="Votre carte" subtitle="Commençons par les bases"
          onNext={() => setStep(1)} nextLabel="Suivant →" nextDisabled={!restaurantName.trim()}>
          <div style={{ marginTop: 16, marginBottom: 28 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Nom du restaurant
            </label>
            <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Ex : Le Petit Bistrot" autoFocus
              style={{ width: "100%", padding: "14px 16px", border: "2px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 17, fontWeight: 600, fontFamily: "var(--font-body)", outline: "none", background: "var(--bg-card)", color: "var(--text)", transition: "var(--transition)" }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />
          </div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Langues de la carte
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <LangToggle code="fr" active locked onToggle={() => {}} />
            <LangToggle code="en" active={languages.includes("en")} onToggle={toggleLang} />
            <LangToggle code="it" active={languages.includes("it")} onToggle={toggleLang} />
            <LangToggle code="es" active={languages.includes("es")} onToggle={toggleLang} />
          </div>
        </StepLayout>
      )}

      {/* Step 1: Categories */}
      {step === 1 && (
        <StepLayout step={1} totalSteps={5} title="Catégories" subtitle="Choisissez ou créez vos rubriques"
          onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Suivant →" nextDisabled={categories.length === 0}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            {DEFAULT_CATEGORIES.map(name => (
              <CategoryChip key={name} name={name} active={!!categories.find(c => c.name === name)} onClick={() => toggleDefaultCat(name)} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 20, alignItems: "center" }}>
            <input ref={newCatRef} value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomCat()}
              placeholder="Catégorie personnalisée…"
              style={{ flex: 1, padding: "12px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xs)", fontSize: 15, fontFamily: "var(--font-body)", outline: "none", background: "var(--bg-card)", color: "var(--text)" }}
            />
            <button onClick={addCustomCat} style={{ padding: "12px 18px", background: "var(--bg-subtle)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xs)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text)", whiteSpace: "nowrap" }}>+ Ajouter</button>
          </div>
          {categories.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sélectionnées ({categories.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {categories.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xs)" }}>
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{c.name}</span>
                    <button onClick={() => removeCat(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 16, padding: 4 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </StepLayout>
      )}

      {/* Step 2: Products */}
      {step === 2 && (
        <StepLayout step={2} totalSteps={5} title="Produits" subtitle="Ajoutez vos produits par catégorie"
          onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Suivant →">
          <CategoryTabs categories={categories} activeId={activeCatId} onChange={setActiveCatId} />
          {activeCategory && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeCategory.items.map((item, idx) => (
                  <ProductRow key={item.id} item={item} index={idx}
                    isLast={idx === activeCategory.items.length - 1}
                    onUpdate={(u) => updateProduct(item.id, u)}
                    onRemove={() => removeProduct(item.id)}
                    onDuplicate={() => duplicateProduct(item.id)}
                    onEnterNext={addProduct}
                  />
                ))}
              </div>
              <button onClick={addProduct} style={{
                width: "100%", marginTop: 12, padding: 14, background: "var(--bg-card)",
                border: "2px dashed var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer",
                fontSize: 15, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-body)", transition: "var(--transition)",
              }}>+ Ajouter un produit</button>
            </div>
          )}
        </StepLayout>
      )}

      {/* Step 3: Notes */}
      {step === 3 && (
        <StepLayout step={3} totalSteps={5} title="Remarque" subtitle="Une précision à nous donner ?"
          onBack={() => setStep(2)} onNext={() => setStep(4)} nextLabel="Suivant →">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Allergènes, horaires, remarques particulières… (optionnel)" rows={5}
            style={{ width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "14px 16px", fontSize: 15, fontFamily: "var(--font-body)", background: "var(--bg-card)", outline: "none", resize: "vertical", marginTop: 16, lineHeight: 1.6, color: "var(--text)" }}
          />
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>Entièrement optionnel — vous pouvez passer directement.</div>
        </StepLayout>
      )}

      {/* Step 4: Summary */}
      {step === 4 && (
        <StepLayout step={4} totalSteps={5} title="Résumé" subtitle="Vérifiez avant d'envoyer" onBack={() => setStep(3)} hideNext>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
            <SumStat emoji="🏠" label="Restaurant" value={restaurantName} />
            <SumStat emoji="📂" label="Catégories" value={categories.length} />
            <SumStat emoji="🍽️" label="Produits" value={totalProducts} />
            <SumStat emoji="🌍" label="Langues" value={languages.map(l => LANG_META[l].flag).join(" ")} />
            {notes && <SumStat emoji="💬" label="Remarque" value="✓" />}
          </div>
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Détail par catégorie</div>
            {categories.map(c => (
              <div key={c.id} style={{ padding: "12px 16px", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-xs)", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 500, fontSize: 15 }}>{c.name}</span>
                <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>{c.items.length} produit{c.items.length !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 32, paddingBottom: 32 }}>
            <button onClick={() => setStep(0)} style={{ flex: 1, padding: 14, background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text)" }}>Modifier</button>
            <button onClick={handleSubmit} disabled={sending} style={{
              flex: 2, padding: 14,
              background: sending ? "var(--border)" : "#25D366",
              border: "none", borderRadius: "var(--radius-sm)", fontSize: 15, fontWeight: 700,
              cursor: sending ? "default" : "pointer",
              fontFamily: "var(--font-body)", color: "#fff", boxShadow: "var(--shadow-md)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {sending ? "Envoi en cours…" : "Envoyer ma carte ✓"}
            </button>
          </div>
        </StepLayout>
      )}
    </>
  )
}
