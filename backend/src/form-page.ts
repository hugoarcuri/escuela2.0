export function getFormPage(token: string, error?: string, success?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Formulario de Inscripción</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
.card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.1); padding: 40px; width: 100%; max-width: 420px; }
h1 { font-size: 22px; color: #1f2937; margin-bottom: 8px; text-align: center; }
p { font-size: 14px; color: #6b7280; margin-bottom: 24px; text-align: center; }
.form-group { margin-bottom: 16px; }
label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 4px; }
input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; outline: none; transition: border-color .2s; }
input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background .2s; margin-top: 8px; }
button:hover { background: #1d4ed8; }
button:disabled { opacity: .6; cursor: not-allowed; }
.msg { padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; text-align: center; }
.msg.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.msg.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
.footer { text-align: center; margin-top: 20px; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="card">
  <h1>Formulario de Inscripción</h1>
  <p>Completá tus datos para registrarte en el curso</p>
  ${error ? `<div class="msg error">${error}</div>` : ""}
  ${success ? `<div class="msg success">${success}</div>` : ""}
  <form id="form" method="POST" action="/form/${token}">
    <div class="form-group">
      <label for="apellido">Apellido</label>
      <input type="text" id="apellido" name="apellido" required autocomplete="family-name" placeholder="García">
    </div>
    <div class="form-group">
      <label for="nombre">Nombre</label>
      <input type="text" id="nombre" name="nombre" required autocomplete="given-name" placeholder="Juan">
    </div>
    <button type="submit" id="btn">Enviar</button>
  </form>
  <div class="footer">Sistema de Gestión Escolar</div>
</div>
<script>
document.getElementById('form')?.addEventListener('submit', function(e) {
  document.getElementById('btn').disabled = true;
  document.getElementById('btn').textContent = 'Enviando...';
});
</script>
</body>
</html>`;
}
