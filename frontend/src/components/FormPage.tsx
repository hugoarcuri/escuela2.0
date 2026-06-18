import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getFormLink, submitForm } from "../api";

export default function FormPage() {
  const { token } = useParams<{ token: string }>();
  const [apellido, setApellido] = useState("");
  const [nombre, setNombre] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (token) getFormLink(token).then(l => setValid(!!l)).catch(() => setValid(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !apellido || !nombre) return;
    setLoading(true); setError(""); setMsg("");
    try {
      const result = await submitForm(token, apellido, nombre);
      if (result.duplicado) setMsg(result.message);
      else { setMsg("Alumno agregado correctamente"); setApellido(""); setNombre(""); }
    } catch { setError("Error al registrar. Intentalo de nuevo."); }
    setLoading(false);
  }

  if (!valid) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,.1)", padding: 40, maxWidth: 420, width: "100%", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, color: "#1f2937", marginBottom: 8 }}>Formulario no encontrado</h1>
        <p style={{ fontSize: 14, color: "#6b7280" }}>El enlace es inválido o expiró.</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6", padding: 20 }}>
      <div style={{ background: "white", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,.1)", padding: 40, maxWidth: 420, width: "100%" }}>
        <h1 style={{ fontSize: 22, color: "#1f2937", marginBottom: 8, textAlign: "center" }}>Formulario de Inscripción</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24, textAlign: "center" }}>Completá tus datos para registrarte en el curso</p>
        {error && <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: "center", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>{error}</div>}
        {msg && <div style={{ padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16, textAlign: "center", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>{msg}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Apellido</label>
            <input value={apellido} onChange={e => setApellido(e.target.value)} required
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }}
              placeholder="García" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} required
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }}
              placeholder="Juan" />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 12, background: loading ? "#93c5fd" : "#2563eb", color: "white", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginTop: 8 }}>
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </form>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "#9ca3af" }}>Sistema de Gestión Escolar</div>
      </div>
    </div>
  );
}
