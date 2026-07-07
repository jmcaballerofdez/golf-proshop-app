import { useState, useEffect, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, addDoc, deleteDoc, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy, Timestamp, runTransaction,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  LayoutDashboard, Clock, Package, ShoppingCart, Tag, Users,
  Plus, Pencil, Trash2, X, Menu, LogIn, LogOut, KeyRound,
  Minus, Trash, Receipt, AlertTriangle,
} from "lucide-react";

// ─── Firebase Config ───────────────────────────────────────────────
// Usa el MISMO proyecto Firebase que Golf B (golf-ciudad-real-50819).
// Las colecciones llevan el prefijo "proshop_" para no mezclarse con
// Academia ni Mantenimiento.
const firebaseConfig = {
  apiKey: "AIzaSyDQMYwKTt05hfSPW-Trl7NYPGyDFKA76dQ",
  authDomain: "golf-ciudad-real-50819.firebaseapp.com",
  projectId: "golf-ciudad-real-50819",
  storageBucket: "golf-ciudad-real-50819.firebasestorage.app",
  messagingSenderId: "447720199984",
  appId: "1:447720199984:web:312a8a1140d95554821af5",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Resolución del club (multi-cliente) ───────────────────────────
function resolverClubId() {
  const host = window.location.hostname;
  if (host.endsWith(".golfb.es")) {
    const sub = host.split(".")[0];
    if (sub && sub !== "www") return sub;
  }
  return "ciudad-real";
}
const CLUB_ID = resolverClubId();

// ─── Paleta "Refined Golf Club" (idéntica a la app de Replit) ───────
const PRIMARY = "#22593D";       // pino profundo — botones, sidebar activo, títulos
const PRIMARY_DARK = "#1B4531";  // hover/active del primario
const BACKGROUND = "#F8FAF9";    // fondo general de página
const CARD_BORDER = "#E9EFEC";   // borde sutil de tarjetas
const BORDER = "#E2E9E4";        // borde general (inputs, separadores)
const SECONDARY_BG = "#F0F4F2";  // fondo pill/secundario (salvia muy claro)
const ACCENT_BG = "#E7EFEB";     // fondo hover, chips
const MUTED_TEXT = "#66796F";    // texto secundario/gris-verde
const FOREGROUND = "#1B2621";    // texto principal (casi negro con base verde)
const DESTRUCTIVE = "#C32222";   // rojo de aviso/borrar
const FONT_SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

// ─── Datos iniciales (solo se crean la primera vez, colección vacía) ──
const EMPLEADOS_INICIALES = [
  { nombre: "Isabel Heredia Martín", rol: "Recepción / Proshop" },
  { nombre: "Cristina Pérez Rodríguez", rol: "Recepción / Proshop" },
  { nombre: "Vicente José Jurado Pérez", rol: "Recepción / Proshop" },
];

const CATEGORIAS_INICIALES = ["Palos", "Bolas", "Guantes", "Ropa", "Calzado", "Accesorios"];

const IVA_DEFECTO = 21;
const METODOS_PAGO = ["Efectivo", "Tarjeta", "Bono/Socio"];

// ─── Utilidades ─────────────────────────────────────────────────────
function cx(...args) { return args.filter(Boolean).join(" "); }

function fechaCorta(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function horaCorta(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function euros(n) {
  return (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// ─── Badge corporativo ───────────────────────────────────────────────
function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#E7EFEB] text-[#374842]",
    verde: "bg-[#E7EFEB] text-[#22593D]",
    ambar: "bg-[#FBF0DD] text-[#8A6416]",
    rojo: "bg-[#FBEAEA] text-[#C32222]",
    dorado: "bg-[#FBF0DD] text-[#8A6416]",
  };
  return (
    <span className={cx("px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
}

// ─── Cabecera de sección reutilizable ────────────────────────────────
function Cabecera({ titulo, subtitulo, children }) {
  return (
    <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1B2621]">{titulo}</h1>
        {subtitulo && <p className="text-[#66796F] mt-2 font-medium">{subtitulo}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ─── Botones corporativos ────────────────────────────────────────────
function BotonPrimario({ children, onClick, icon: Icon = Plus, type = "button", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm hover:opacity-90 active:scale-[0.99] transition disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: PRIMARY }}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}
function BotonSecundario({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-[#D8E2DC] text-[#1B2621] bg-white hover:bg-[#F0F4F2] transition"
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  );
}
function PillFiltro({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-3.5 py-1.5 rounded-lg text-sm font-medium border transition",
        activo ? "text-white border-transparent" : "text-[#374842] border-[#D8E2DC] bg-white hover:bg-[#F0F4F2]"
      )}
      style={activo ? { background: PRIMARY } : {}}
    >
      {children}
    </button>
  );
}

// ─── Tarjeta base ─────────────────────────────────────────────────────
function Tarjeta({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "bg-white rounded-2xl border border-[#E9EFEC] shadow-md",
        onClick && "cursor-pointer hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Tarjeta de estadística grande (panel principal) ─────────────────
function TarjetaStat({ titulo, valor, subtitulo, Icon, tintClass = "bg-[#22593D]/10 text-[#22593D]", valorClass = "text-[#1B2621]" }) {
  return (
    <Tarjeta className="p-6 group">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold tracking-wide text-[#66796F]">{titulo}</p>
        <div className={cx("p-2.5 rounded-xl group-hover:scale-110 transition-transform", tintClass)}>
          <Icon size={19} />
        </div>
      </div>
      <p className={cx("text-4xl font-semibold", valorClass)}>{valor}</p>
      {subtitulo && <p className="text-sm font-medium text-[#66796F] mt-2">{subtitulo}</p>}
    </Tarjeta>
  );
}

// ─── Modal genérico ──────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={cx("bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto", wide ? "max-w-2xl" : "max-w-md")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9EFEC]">
          <h3 className="font-semibold text-lg" style={{ color: PRIMARY }}>{title}</h3>
          <button onClick={onClose} className="text-[#8A9A93] hover:text-[#1B2621] rounded-md p-1 hover:bg-[#E7EFEB] transition">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[13px] font-medium text-[#374842] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full border border-[#D8E2DC] rounded-lg px-3 py-2 text-sm text-[#1B2621] focus:outline-none focus:ring-2 focus:ring-[#22593D]/15 focus:border-[#22593D] transition";

// ─── Rutas de Firestore ancladas al club (multi-cliente) ─────────────
function coleccionClub(nombre) { return collection(db, "clubes", CLUB_ID, nombre); }
function docClub(nombre, id) { return doc(db, "clubes", CLUB_ID, nombre, id); }

function useColeccion(nombre, ordenarPor = "creadoEn", dir = "desc") {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const q = query(coleccionClub(nombre), orderBy(ordenarPor, dir));
    const unsub = onSnapshot(q, (snap) => {
      setDatos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }, (err) => { console.error(`Error leyendo ${nombre}:`, err); setCargando(false); });
    return () => unsub();
  }, [nombre, ordenarPor, dir]);
  return { datos, cargando };
}
async function crearDoc(coleccion, data) { return addDoc(coleccionClub(coleccion), { ...data, creadoEn: serverTimestamp() }); }
async function actualizarDoc(coleccion, id, data) { return updateDoc(docClub(coleccion, id), data); }
async function borrarDoc(coleccion, id) { return deleteDoc(docClub(coleccion, id)); }

// ─── Semillas iniciales (empleados y categorías) ─────────────────────
function useSemillas(empleados, categorias) {
  useEffect(() => {
    if (empleados.cargando || empleados.datos.length > 0) return;
    EMPLEADOS_INICIALES.forEach((e) => crearDoc("proshop_empleados", { ...e, activo: true, pin: "" }));
  }, [empleados.cargando, empleados.datos.length]);
  useEffect(() => {
    if (categorias.cargando || categorias.datos.length > 0) return;
    CATEGORIAS_INICIALES.forEach((nombre, i) => crearDoc("proshop_categorias", { nombre, orden: i }));
  }, [categorias.cargando, categorias.datos.length]);
}

// ─── Cálculo de IVA sobre un producto/línea ──────────────────────────
function calcularLinea(precioSinIVA, iva, cantidad) {
  const base = Number(precioSinIVA) * Number(cantidad);
  const cuota = base * (Number(iva) / 100);
  return { baseImponible: base, cuotaIVA: cuota, subtotal: base + cuota };
}

// ════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════
const NAV_GROUPS = [
  { label: "Principal", items: [{ id: "panel", label: "Panel", Icon: LayoutDashboard }] },
  { label: "Operativa", items: [
    { id: "ventas", label: "Ventas (TPV)", Icon: ShoppingCart },
    { id: "historial", label: "Historial de ventas", Icon: Receipt },
    { id: "fichajes", label: "Fichajes", Icon: Clock },
  ]},
  { label: "Catálogo", items: [
    { id: "productos", label: "Productos", Icon: Package },
    { id: "ofertas", label: "Ofertas", Icon: Tag },
  ]},
  { label: "Sistema", items: [{ id: "equipo", label: "Equipo", Icon: Users }] },
];

function Sidebar({ vista, setVista, abierto, setAbierto }) {
  return (
    <>
      {abierto && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setAbierto(false)} />}
      <aside
        className={cx(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 bg-white border-r border-[#E2E9E4] flex flex-col transition-transform",
          abierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-8 pb-4">
          <p className="text-[#1B2621] text-xl font-semibold tracking-tight">Golf B</p>
          <p className="text-[#66796F] text-xs uppercase tracking-widest mt-1.5 font-medium">Proshop &amp; Recepción</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 space-y-6 mt-2">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="text-[#8A9A93] text-[11px] font-semibold uppercase tracking-wider px-4 mb-2">{g.label}</p>
              <div className="space-y-1">
                {g.items.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setVista(id); setAbierto(false); }}
                    className={cx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      vista === id
                        ? "text-white shadow-sm"
                        : "text-[#1B2621] hover:bg-[#F0F4F2]"
                    )}
                    style={vista === id ? { background: PRIMARY } : {}}
                  >
                    <Icon size={18} strokeWidth={1.9} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-6 border-t border-[#E2E9E4] bg-[#F0F4F2]/50 mt-auto">
          <p className="text-[10px] text-[#66796F] uppercase font-semibold mb-0.5 tracking-wider">Club</p>
          <p className="font-medium text-sm text-[#1B2621] truncate">Golf Ciudad Real C.D.</p>
        </div>
      </aside>
    </>
  );
}

function TopBar({ setAbierto, titulo }) {
  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#E9EFEC] bg-white sticky top-0 z-20">
      <button onClick={() => setAbierto(true)} className="p-1.5 rounded-md hover:bg-[#E7EFEB]"><Menu size={20} /></button>
      <p className="text-sm text-[#66796F]">Golf B · {titulo}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PANEL (Dashboard)
// ════════════════════════════════════════════════════════════════════
function Panel({ ventas, productos, fichajes }) {
  const hoy = new Date().toDateString();
  const ventasHoy = ventas.datos.filter((v) => v.creadoEn?.toDate?.().toDateString() === hoy);
  const totalHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const ticketMedio = ventasHoy.length ? totalHoy / ventasHoy.length : 0;
  const bajoStock = productos.datos.filter((p) => (p.stockActual ?? 0) <= (p.stockMinimo ?? 0));
  const fichadosAhora = fichajes.datos.filter((f) => f.entrada && !f.salida);

  return (
    <div>
      <Cabecera titulo="Panel de Proshop" subtitulo="Vista general de ventas, stock y personal." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <TarjetaStat titulo="Ventas Hoy" valor={euros(totalHoy)} subtitulo={`${ventasHoy.length} ticket(s)`} Icon={ShoppingCart} tintClass="bg-[#22593D]/10 text-[#22593D]" />
        <TarjetaStat titulo="Ticket Medio" valor={euros(ticketMedio)} Icon={Receipt} tintClass="bg-blue-500/10 text-blue-600" />
        <TarjetaStat
          titulo="Bajo Stock" valor={bajoStock.length} subtitulo={bajoStock.length === 1 ? "producto bajo mínimo" : "productos bajo mínimo"}
          Icon={AlertTriangle}
          tintClass={bajoStock.length > 0 ? "bg-[#C32222]/10 text-[#C32222]" : "bg-emerald-500/10 text-emerald-600"}
          valorClass={bajoStock.length > 0 ? "text-[#C32222]" : "text-[#1B2621]"}
        />
        <TarjetaStat titulo="En Jornada Ahora" valor={fichadosAhora.length} Icon={Clock} tintClass="bg-amber-500/10 text-amber-600" />
      </div>

      {bajoStock.length > 0 && (
        <Tarjeta className="p-6 mb-8">
          <p className="font-medium text-[#1B2621] mb-3">Productos por reponer</p>
          <div className="space-y-2">
            {bajoStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#E9EFEC] last:border-0">
                <span className="text-[#1B2621]">{p.nombre}</span>
                <Badge tone="ambar">{p.stockActual ?? 0} / mín. {p.stockMinimo ?? 0}</Badge>
              </div>
            ))}
          </div>
        </Tarjeta>
      )}

      <Tarjeta className="p-6">
        <p className="font-medium text-[#1B2621] mb-3">Últimas ventas</p>
        <div className="space-y-2">
          {ventas.datos.slice(0, 6).map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#E9EFEC] last:border-0">
              <span className="text-[#66796F]">#{v.numeroTicket} · {v.empleadoNombre} · {horaCorta(v.creadoEn)}</span>
              <span className="font-medium" style={{ color: PRIMARY }}>{euros(v.total)}</span>
            </div>
          ))}
          {ventas.datos.length === 0 && <p className="text-sm text-[#8A9A93]">Todavía no hay ventas registradas.</p>}
        </div>
      </Tarjeta>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// FICHAJES
// ════════════════════════════════════════════════════════════════════
function ModalPin({ open, onClose, empleado, onConfirmar }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setPin(""); setError(""); }, [open]);
  if (!open) return null;
  function confirmar() {
    if (pin.length !== 4) { setError("El PIN debe tener 4 dígitos."); return; }
    const ok = !empleado.pin || pin === empleado.pin;
    if (!ok) { setError("PIN incorrecto."); return; }
    onConfirmar();
  }
  return (
    <Modal open={open} onClose={onClose} title={`PIN de ${empleado?.nombre || ""}`}>
      <Field label="Introduce tu PIN de 4 dígitos">
        <input autoFocus type="password" inputMode="numeric" maxLength={4} value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className={cx(inputCls, "text-center text-lg tracking-widest")} />
      </Field>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <BotonPrimario icon={KeyRound} onClick={confirmar}>Confirmar</BotonPrimario>
    </Modal>
  );
}

function Fichajes({ empleados, fichajes }) {
  const [modalPin, setModalPin] = useState(null); // { empleado, accion: "entrada"|"salida" }

  const abiertoPara = useCallback((empId) => fichajes.datos.find((f) => f.empleadoId === empId && f.entrada && !f.salida), [fichajes.datos]);

  async function registrar() {
    const { empleado, accion, abierto } = modalPin;
    if (accion === "entrada") {
      await crearDoc("proshop_fichajes", { empleadoId: empleado.id, empleadoNombre: empleado.nombre, entrada: serverTimestamp(), salida: null });
    } else {
      await actualizarDoc("proshop_fichajes", abierto.id, { salida: serverTimestamp() });
    }
    setModalPin(null);
  }

  return (
    <div>
      <Cabecera titulo="Fichajes" subtitulo="Control de jornada del equipo de Proshop y Recepción." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {empleados.datos.map((e) => {
          const abierto = abiertoPara(e.id);
          return (
            <Tarjeta key={e.id} className="p-6">
              <p className="font-medium text-[#1B2621]">{e.nombre}</p>
              <p className="text-xs text-[#8A9A93] mb-3">{e.rol}</p>
              {abierto ? (
                <>
                  <Badge tone="verde">En jornada desde {horaCorta(abierto.entrada)}</Badge>
                  <div className="mt-3">
                    <BotonSecundario icon={LogOut} onClick={() => setModalPin({ empleado: e, accion: "salida", abierto })}>Registrar salida</BotonSecundario>
                  </div>
                </>
              ) : (
                <div className="mt-1">
                  <BotonPrimario icon={LogIn} onClick={() => setModalPin({ empleado: e, accion: "entrada" })}>Registrar entrada</BotonPrimario>
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta className="p-6">
        <p className="font-medium text-[#1B2621] mb-3">Historial reciente</p>
        <div className="space-y-2">
          {fichajes.datos.slice(0, 15).map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#E9EFEC] last:border-0">
              <span className="text-[#1B2621]">{f.empleadoNombre}</span>
              <span className="text-[#66796F]">{fechaCorta(f.entrada)} · {horaCorta(f.entrada)} → {f.salida ? horaCorta(f.salida) : "—"}</span>
            </div>
          ))}
          {fichajes.datos.length === 0 && <p className="text-sm text-[#8A9A93]">Sin fichajes todavía.</p>}
        </div>
      </Tarjeta>

      <ModalPin open={!!modalPin} onClose={() => setModalPin(null)} empleado={modalPin?.empleado} onConfirmar={registrar} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PRODUCTOS
// ════════════════════════════════════════════════════════════════════
function ModalProducto({ open, onClose, producto, categorias }) {
  const vacio = { nombre: "", categoria: categorias[0]?.nombre || "", precioVentaSinIVA: "", porcentajeIVA: IVA_DEFECTO, codigoBarras: "", stockActual: 0, stockMinimo: 3, unidad: "ud", proveedor: "", activo: true };
  const [form, setForm] = useState(vacio);
  useEffect(() => { setForm(producto ? { ...vacio, ...producto } : vacio); }, [producto, open]);

  async function guardar() {
    if (!form.nombre.trim()) return;
    const data = { ...form, precioVentaSinIVA: Number(form.precioVentaSinIVA) || 0, porcentajeIVA: Number(form.porcentajeIVA) || 0, stockActual: Number(form.stockActual) || 0, stockMinimo: Number(form.stockMinimo) || 0 };
    if (producto) await actualizarDoc("proshop_productos", producto.id, data);
    else await crearDoc("proshop_productos", data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={producto ? "Editar producto" : "Nuevo producto"} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Nombre del producto">
          <input className={inputCls} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </Field>
        <Field label="Categoría">
          <select className={inputCls} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </Field>
        <Field label="Precio de venta sin IVA (€)">
          <input type="number" step="0.01" className={inputCls} value={form.precioVentaSinIVA} onChange={(e) => setForm({ ...form, precioVentaSinIVA: e.target.value })} />
        </Field>
        <Field label="IVA (%)">
          <input type="number" className={inputCls} value={form.porcentajeIVA} onChange={(e) => setForm({ ...form, porcentajeIVA: e.target.value })} />
        </Field>
        <Field label="Código de barras / SKU (opcional)">
          <input className={inputCls} value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} />
        </Field>
        <Field label="Proveedor (opcional)">
          <input className={inputCls} value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
        </Field>
        <Field label="Stock actual">
          <input type="number" className={inputCls} value={form.stockActual} onChange={(e) => setForm({ ...form, stockActual: e.target.value })} />
        </Field>
        <Field label="Stock mínimo (aviso de reposición)">
          <input type="number" className={inputCls} value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} />
        </Field>
      </div>
      <div className="pt-2"><BotonPrimario onClick={guardar}>Guardar producto</BotonPrimario></div>
    </Modal>
  );
}

function Productos({ productos, categorias }) {
  const [modal, setModal] = useState(null); // null | {} | producto
  const [filtro, setFiltro] = useState("Todas");
  const lista = filtro === "Todas" ? productos.datos : productos.datos.filter((p) => p.categoria === filtro);

  return (
    <div>
      <Cabecera titulo="Productos" subtitulo="Catálogo, precios e IVA del Proshop.">
        <BotonPrimario onClick={() => setModal({})}>Nuevo producto</BotonPrimario>
      </Cabecera>

      <div className="flex flex-wrap gap-2 mb-5">
        <PillFiltro activo={filtro === "Todas"} onClick={() => setFiltro("Todas")}>Todas</PillFiltro>
        {categorias.datos.map((c) => (
          <PillFiltro key={c.id} activo={filtro === c.nombre} onClick={() => setFiltro(c.nombre)}>{c.nombre}</PillFiltro>
        ))}
      </div>

      <Tarjeta className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F0F4F2] text-[#66796F] text-left">
            <tr>
              <th className="px-5 py-3.5 font-medium">Producto</th>
              <th className="px-5 py-3.5 font-medium">Categoría</th>
              <th className="px-5 py-3.5 font-medium">Precio (IVA incl.)</th>
              <th className="px-5 py-3.5 font-medium">Stock</th>
              <th className="px-5 py-3.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const conIVA = (p.precioVentaSinIVA || 0) * (1 + (p.porcentajeIVA || 0) / 100);
              const bajo = (p.stockActual ?? 0) <= (p.stockMinimo ?? 0);
              return (
                <tr key={p.id} className="border-t border-[#E9EFEC] hover:bg-[#F0F4F2]/60">
                  <td className="px-5 py-3.5 text-[#1B2621]">{p.nombre}</td>
                  <td className="px-5 py-3.5 text-[#66796F]">{p.categoria}</td>
                  <td className="px-5 py-3.5 text-[#1B2621]">{euros(conIVA)}</td>
                  <td className="px-5 py-3.5"><Badge tone={bajo ? "ambar" : "neutral"}>{p.stockActual ?? 0} {p.unidad}</Badge></td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => setModal(p)} className="p-1.5 text-[#8A9A93] hover:text-[#1B2621] rounded-md hover:bg-[#E7EFEB]"><Pencil size={15} /></button>
                    <button onClick={() => confirm(`¿Eliminar "${p.nombre}"?`) && borrarDoc("proshop_productos", p.id)} className="p-1.5 text-[#8A9A93] hover:text-[#C32222] rounded-md hover:bg-[#E7EFEB]"><Trash2 size={15} /></button>
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8A9A93]">No hay productos en esta categoría todavía.</td></tr>
            )}
          </tbody>
        </table>
      </Tarjeta>

      <ModalProducto open={!!modal} onClose={() => setModal(null)} producto={modal?.id ? modal : null} categorias={categorias.datos} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// VENTAS (TPV)
// ════════════════════════════════════════════════════════════════════
function TPV({ productos, empleados, siguienteTicket }) {
  const [carrito, setCarrito] = useState([]); // [{producto, cantidad}]
  const [empleadoId, setEmpleadoId] = useState(empleados.datos[0]?.id || "");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);

  const disponibles = productos.datos.filter((p) => p.activo !== false && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  function añadir(p) {
    setCarrito((c) => {
      const existe = c.find((l) => l.producto.id === p.id);
      if (existe) return c.map((l) => l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...c, { producto: p, cantidad: 1 }];
    });
  }
  function cambiarCantidad(id, delta) {
    setCarrito((c) => c.map((l) => l.producto.id === id ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l).filter((l) => l.cantidad > 0));
  }
  function quitar(id) { setCarrito((c) => c.filter((l) => l.producto.id !== id)); }

  const lineas = carrito.map((l) => {
    const { baseImponible, cuotaIVA, subtotal } = calcularLinea(l.producto.precioVentaSinIVA, l.producto.porcentajeIVA, l.cantidad);
    return { ...l, baseImponible, cuotaIVA, subtotal };
  });
  const baseImponibleTotal = lineas.reduce((s, l) => s + l.baseImponible, 0);
  const cuotaIVATotal = lineas.reduce((s, l) => s + l.cuotaIVA, 0);
  const total = baseImponibleTotal + cuotaIVATotal;

  async function cobrar() {
    if (lineas.length === 0 || guardando) return;
    setGuardando(true);
    const empleado = empleados.datos.find((e) => e.id === empleadoId);
    const numeroTicket = await siguienteTicket();
    await crearDoc("proshop_ventas", {
      numeroTicket,
      empleadoId, empleadoNombre: empleado?.nombre || "—",
      metodoPago,
      baseImponibleTotal, cuotaIVATotal, total,
      items: lineas.map((l) => ({
        productoId: l.producto.id, nombre: l.producto.nombre, cantidad: l.cantidad,
        precioUnitarioSinIVA: l.producto.precioVentaSinIVA, porcentajeIVA: l.producto.porcentajeIVA,
        baseImponible: l.baseImponible, cuotaIVA: l.cuotaIVA, subtotal: l.subtotal,
      })),
    });
    for (const l of lineas) {
      await actualizarDoc("proshop_productos", l.producto.id, { stockActual: Math.max(0, (l.producto.stockActual || 0) - l.cantidad) });
      await crearDoc("proshop_movimientosStock", { productoId: l.producto.id, tipo: "venta", cantidad: -l.cantidad, motivo: `Venta #${numeroTicket}`, empleadoId });
    }
    setCarrito([]);
    setGuardando(false);
  }

  return (
    <div>
      <Cabecera titulo="Ventas (TPV)" subtitulo="Registro rápido de ventas con IVA desglosado." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <input placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={cx(inputCls, "mb-4")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {disponibles.map((p) => (
              <Tarjeta key={p.id} className="p-4 cursor-pointer" onClick={() => añadir(p)}>
                <p className="text-sm font-medium text-[#1B2621] line-clamp-2">{p.nombre}</p>
                <p className="text-xs text-[#8A9A93] mb-1">{p.categoria}</p>
                <p className="text-sm font-semibold" style={{ color: PRIMARY }}>{euros((p.precioVentaSinIVA || 0) * (1 + (p.porcentajeIVA || 0) / 100))}</p>
              </Tarjeta>
            ))}
            {disponibles.length === 0 && <p className="text-sm text-[#8A9A93] col-span-full py-6 text-center">Sin resultados.</p>}
          </div>
        </div>

        <Tarjeta className="p-5 self-start">
          <p className="font-medium text-[#1B2621] mb-3">Ticket</p>
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {lineas.map((l) => (
              <div key={l.producto.id} className="flex items-center justify-between text-sm gap-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[#1B2621]">{l.producto.nombre}</p>
                  <p className="text-xs text-[#8A9A93]">{euros(l.subtotal)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(l.producto.id, -1)} className="p-1 rounded-md hover:bg-[#E7EFEB]"><Minus size={13} /></button>
                  <span className="w-5 text-center text-[#1B2621]">{l.cantidad}</span>
                  <button onClick={() => cambiarCantidad(l.producto.id, 1)} className="p-1 rounded-md hover:bg-[#E7EFEB]"><Plus size={13} /></button>
                  <button onClick={() => quitar(l.producto.id)} className="p-1 rounded-md hover:bg-[#FBEAEA] text-[#8A9A93] hover:text-[#C32222]"><Trash size={13} /></button>
                </div>
              </div>
            ))}
            {lineas.length === 0 && <p className="text-sm text-[#8A9A93]">Añade productos al ticket.</p>}
          </div>

          <Field label="Empleado">
            <select className={inputCls} value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
              {empleados.datos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </Field>
          <Field label="Método de pago">
            <select className={inputCls} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>

          <div className="border-t border-[#E9EFEC] pt-3 mt-3 text-sm space-y-1">
            <div className="flex justify-between text-[#66796F]"><span>Base imponible</span><span>{euros(baseImponibleTotal)}</span></div>
            <div className="flex justify-between text-[#66796F]"><span>IVA</span><span>{euros(cuotaIVATotal)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-1" style={{ color: PRIMARY }}><span>Total</span><span>{euros(total)}</span></div>
          </div>

          <div className="mt-4">
            <BotonPrimario icon={Receipt} onClick={cobrar} disabled={lineas.length === 0 || guardando}>{guardando ? "Guardando…" : "Cobrar y guardar ticket"}</BotonPrimario>
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HISTORIAL DE VENTAS
// ════════════════════════════════════════════════════════════════════
function HistorialVentas({ ventas }) {
  const [abierta, setAbierta] = useState(null);
  return (
    <div>
      <Cabecera titulo="Historial de ventas" subtitulo="Todos los tickets emitidos, con IVA desglosado." />
      <Tarjeta className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F0F4F2] text-[#66796F] text-left">
            <tr>
              <th className="px-5 py-3.5 font-medium">Ticket</th>
              <th className="px-5 py-3.5 font-medium">Fecha</th>
              <th className="px-5 py-3.5 font-medium">Empleado</th>
              <th className="px-5 py-3.5 font-medium">Pago</th>
              <th className="px-5 py-3.5 font-medium">Base</th>
              <th className="px-5 py-3.5 font-medium">IVA</th>
              <th className="px-5 py-3.5 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.datos.map((v) => (
              <tr key={v.id} className="border-t border-[#E9EFEC] hover:bg-[#F0F4F2]/60 cursor-pointer" onClick={() => setAbierta(v)}>
                <td className="px-5 py-3.5 text-[#1B2621]">#{v.numeroTicket}</td>
                <td className="px-5 py-3.5 text-[#66796F]">{fechaCorta(v.creadoEn)} · {horaCorta(v.creadoEn)}</td>
                <td className="px-5 py-3.5 text-[#374842]">{v.empleadoNombre}</td>
                <td className="px-5 py-3.5"><Badge>{v.metodoPago}</Badge></td>
                <td className="px-5 py-3.5 text-[#66796F]">{euros(v.baseImponibleTotal)}</td>
                <td className="px-5 py-3.5 text-[#66796F]">{euros(v.cuotaIVATotal)}</td>
                <td className="px-5 py-3.5 font-medium" style={{ color: PRIMARY }}>{euros(v.total)}</td>
              </tr>
            ))}
            {ventas.datos.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-[#8A9A93]">Sin ventas registradas todavía.</td></tr>}
          </tbody>
        </table>
      </Tarjeta>

      <Modal open={!!abierta} onClose={() => setAbierta(null)} title={abierta ? `Ticket #${abierta.numeroTicket}` : ""}>
        {abierta && (
          <div className="text-sm">
            <p className="text-[#66796F] mb-3">{fechaCorta(abierta.creadoEn)} · {horaCorta(abierta.creadoEn)} · {abierta.empleadoNombre} · {abierta.metodoPago}</p>
            <div className="space-y-1.5 mb-3">
              {abierta.items?.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[#1B2621]">{it.cantidad}× {it.nombre}</span>
                  <span className="text-[#66796F]">{euros(it.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E9EFEC] pt-2 space-y-1">
              <div className="flex justify-between text-[#66796F]"><span>Base imponible</span><span>{euros(abierta.baseImponibleTotal)}</span></div>
              <div className="flex justify-between text-[#66796F]"><span>IVA</span><span>{euros(abierta.cuotaIVATotal)}</span></div>
              <div className="flex justify-between font-semibold" style={{ color: PRIMARY }}><span>Total</span><span>{euros(abierta.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// OFERTAS
// ════════════════════════════════════════════════════════════════════
function ModalOferta({ open, onClose, oferta, productos }) {
  const vacio = { productoId: productos[0]?.id || "", tipoDescuento: "porcentaje", valor: "", fechaInicio: "", fechaFin: "", activa: true };
  const [form, setForm] = useState(vacio);
  useEffect(() => { setForm(oferta ? { ...vacio, ...oferta } : vacio); }, [oferta, open]);

  async function guardar() {
    if (!form.productoId || !form.valor) return;
    const data = { ...form, valor: Number(form.valor) };
    if (oferta) await actualizarDoc("proshop_ofertas", oferta.id, data);
    else await crearDoc("proshop_ofertas", data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={oferta ? "Editar oferta" : "Nueva oferta"}>
      <Field label="Producto">
        <select className={inputCls} value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })}>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </Field>
      <Field label="Tipo de descuento">
        <select className={inputCls} value={form.tipoDescuento} onChange={(e) => setForm({ ...form, tipoDescuento: e.target.value })}>
          <option value="porcentaje">Porcentaje (%)</option>
          <option value="importe">Importe fijo (€)</option>
        </select>
      </Field>
      <Field label="Valor del descuento">
        <input type="number" step="0.01" className={inputCls} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde">
          <input type="date" className={inputCls} value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
        </Field>
        <Field label="Hasta">
          <input type="date" className={inputCls} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
        </Field>
      </div>
      <div className="pt-2"><BotonPrimario onClick={guardar}>Guardar oferta</BotonPrimario></div>
    </Modal>
  );
}

function Ofertas({ ofertas, productos }) {
  const [modal, setModal] = useState(null);
  const nombreProducto = (id) => productos.datos.find((p) => p.id === id)?.nombre || "—";

  return (
    <div>
      <Cabecera titulo="Ofertas" subtitulo="Promociones y descuentos activos.">
        <BotonPrimario onClick={() => setModal({})}>Nueva oferta</BotonPrimario>
      </Cabecera>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ofertas.datos.map((o) => (
          <Tarjeta key={o.id} className="p-6">
            <p className="font-medium text-[#1B2621]">{nombreProducto(o.productoId)}</p>
            <p className="text-sm text-[#66796F] mb-2">
              {o.tipoDescuento === "porcentaje" ? `-${o.valor}%` : `-${euros(o.valor)}`}
            </p>
            <p className="text-xs text-[#8A9A93] mb-3">{o.fechaInicio || "—"} → {o.fechaFin || "—"}</p>
            <div className="flex items-center gap-2">
              <Badge tone={o.activa ? "verde" : "neutral"}>{o.activa ? "Activa" : "Inactiva"}</Badge>
              <button onClick={() => setModal(o)} className="p-1.5 text-[#8A9A93] hover:text-[#1B2621] rounded-md hover:bg-[#E7EFEB]"><Pencil size={15} /></button>
              <button onClick={() => confirm("¿Eliminar esta oferta?") && borrarDoc("proshop_ofertas", o.id)} className="p-1.5 text-[#8A9A93] hover:text-[#C32222] rounded-md hover:bg-[#E7EFEB]"><Trash2 size={15} /></button>
            </div>
          </Tarjeta>
        ))}
        {ofertas.datos.length === 0 && <p className="text-sm text-[#8A9A93] col-span-full py-6 text-center">No hay ofertas creadas todavía.</p>}
      </div>
      <ModalOferta open={!!modal} onClose={() => setModal(null)} oferta={modal?.id ? modal : null} productos={productos.datos} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// EQUIPO
// ════════════════════════════════════════════════════════════════════
function ModalEmpleado({ open, onClose, empleado }) {
  const vacio = { nombre: "", rol: "Recepción / Proshop", pin: "", activo: true };
  const [form, setForm] = useState(vacio);
  useEffect(() => { setForm(empleado ? { ...vacio, ...empleado } : vacio); }, [empleado, open]);
  async function guardar() {
    if (!form.nombre.trim()) return;
    if (empleado) await actualizarDoc("proshop_empleados", empleado.id, form);
    else await crearDoc("proshop_empleados", form);
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={empleado ? "Editar empleado" : "Nuevo empleado"}>
      <Field label="Nombre completo">
        <input className={inputCls} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </Field>
      <Field label="Rol">
        <input className={inputCls} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} />
      </Field>
      <Field label="PIN de fichaje (4 dígitos)">
        <input inputMode="numeric" maxLength={4} className={inputCls} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
      </Field>
      <div className="pt-2"><BotonPrimario onClick={guardar}>Guardar</BotonPrimario></div>
    </Modal>
  );
}

function Equipo({ empleados }) {
  const [modal, setModal] = useState(null);
  return (
    <div>
      <Cabecera titulo="Equipo" subtitulo="Personal de Proshop y Recepción.">
        <BotonPrimario onClick={() => setModal({})}>Nuevo empleado</BotonPrimario>
      </Cabecera>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {empleados.datos.map((e) => (
          <Tarjeta key={e.id} className="p-6">
            <p className="font-medium text-[#1B2621]">{e.nombre}</p>
            <p className="text-xs text-[#8A9A93] mb-3">{e.rol}</p>
            <div className="flex items-center gap-2">
              <Badge tone={e.pin ? "verde" : "neutral"}>{e.pin ? "PIN configurado" : "Sin PIN"}</Badge>
              <button onClick={() => setModal(e)} className="p-1.5 text-[#8A9A93] hover:text-[#1B2621] rounded-md hover:bg-[#E7EFEB]"><Pencil size={15} /></button>
            </div>
          </Tarjeta>
        ))}
      </div>
      <ModalEmpleado open={!!modal} onClose={() => setModal(null)} empleado={modal?.id ? modal : null} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [vista, setVista] = useState("panel");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const empleados = useColeccion("proshop_empleados", "nombre", "asc");
  const categorias = useColeccion("proshop_categorias", "orden", "asc");
  const productos = useColeccion("proshop_productos", "nombre", "asc");
  const ventas = useColeccion("proshop_ventas", "creadoEn", "desc");
  const fichajes = useColeccion("proshop_fichajes", "entrada", "desc");
  const ofertas = useColeccion("proshop_ofertas", "creadoEn", "desc");

  useSemillas(empleados, categorias);

  const siguienteTicket = useCallback(async () => {
    // Numeración secuencial simple basada en el nº de ventas existentes.
    return (ventas.datos.length || 0) + 1001;
  }, [ventas.datos.length]);

  const titulos = {
    panel: "Panel", ventas: "Ventas (TPV)", historial: "Historial de ventas",
    fichajes: "Fichajes", productos: "Productos", ofertas: "Ofertas", equipo: "Equipo",
  };

  return (
    <div className="min-h-screen flex" style={{ background: BACKGROUND }}>
      <Sidebar vista={vista} setVista={setVista} abierto={sidebarAbierto} setAbierto={setSidebarAbierto} />
      <div className="flex-1 min-w-0">
        <TopBar setAbierto={setSidebarAbierto} titulo={titulos[vista]} />
        <main className="p-4 md:p-10 max-w-6xl mx-auto">
          {vista === "panel" && <Panel ventas={ventas} productos={productos} fichajes={fichajes} />}
          {vista === "ventas" && <TPV productos={productos} empleados={empleados} siguienteTicket={siguienteTicket} />}
          {vista === "historial" && <HistorialVentas ventas={ventas} />}
          {vista === "fichajes" && <Fichajes empleados={empleados} fichajes={fichajes} />}
          {vista === "productos" && <Productos productos={productos} categorias={categorias} />}
          {vista === "ofertas" && <Ofertas ofertas={ofertas} productos={productos} />}
          {vista === "equipo" && <Equipo empleados={empleados} />}
        </main>
      </div>
    </div>
  );
}
