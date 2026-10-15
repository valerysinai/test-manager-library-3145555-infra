# Aceptación ampliada de pantallas y teclado

El [plan previo](final-acceptance-plan.md) se publicó en `f83505a`, antes de ampliar los checks.
La primera inspección sobre App main `b5ef195` produjo el [informe anterior](acceptance/before.json):
34 vistas, teclado correcto, sin desbordamiento ni controles sin nombre, pero 227 observaciones
de contraste insuficiente en instancias repetidas de los textos. La aceptación falló, no se omitió.

App publicó el plan `7ad0aad` antes de corregir colores en `a9b74f9`. Se oscurecen textos de ayuda,
encabezados, estados, placeholders y pie; no cambia producto, disposición ni comportamiento.
Las comprobaciones usan colores/fondos computados, con composición alfa y sin redondear para
aceptar. Referencias: [contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
y [foco visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). El contraste de
texto normal/grande usa 4,5:1/3:1; disabled y decoración quedan excluidos. No certifica todo WCAG.

## Revisiones ejecutadas

- Infra/verificador: `7f6ee241e1597af46df1a026cb49389cda564934`.
- App corregida: `a9b74f90d6d1e6152bbd2d421a1143fe914ea1e7`, rama pendiente de fusionar.
- API main: `60bbcdd8c45637d426455d4e24b028ea1af76157`.
- Mismos motores/imagenes fijados y CA local confiable de T-20, sin omitir validación TLS.

Se ejecutó `npm run verify` con API_CONTEXT/APP_CONTEXT absolutos a esas fuentes, en proyecto
generado `library-check-1792034031186-50a05dcd`. No utiliza el despliegue operativo.

La ejecución local terminó con salida 0, persistencia de datos/portada y limpieza confirmadas.
La [CI independiente sobre 7f6ee24](https://github.com/valerysinai/test-manager-library-3145555-infra/actions/runs/38675186829)
también terminó con éxito, incluidas ambas fases de navegador y persistencia. La
[CI de App sobre a9b74f9](https://github.com/valerysinai/test-manager-library-3145555-app/actions/runs/38674670975)
pasó con trece pruebas, build y control de secretos. El último commit de infra solo conserva
documentación e informes/capturas seguros, sin cambiar el código verificado.

## Resultado de pantalla e interacción

El [informe normal](acceptance/after.json) cubre 18 estados en dos tamaños (36 vistas):
login vacío y error de acceso, catálogo vacío, crear libro, sin/con portada, editar, crear/detallar socio,
duplicado, selección de préstamo, devolución/cerrado, vencidos vacíos, reporte con filas, rango
inválido y rango vacío, cuenta librarian vacía y catálogo librarian. No se capturan campos de
autenticación rellenados. La clave de prueba, login y token permanecen en memoria/entorno.

El [informe de vencidos](acceptance/overdue.json) añade tres estados en dos tamaños (6 vistas):
vencido real, préstamo bloqueado y devolución. El runner recrea solo API en demo/Septiembre,
crea una línea por HTTPS, recrea API en Octubre y comprueba rechazo del token anterior. Chromium
inicia sesión de nuevo, muestra un día de atraso, recibe 409 MEMBER_HAS_OVERDUE al intentar prestar
y devuelve la línea mediante UI. El stock vuelve a dos y el listado queda sin vencidos.
No se añade endpoint, fecha de préstamo de entrada ni SQL de siembra.

En las 42 vistas (21 estados × móvil/escritorio) no quedan observaciones del detector de contraste,
controles sin nombre ni desbordamiento del documento. Ambos recorridos verifican foco/enlace
de salto, campo → select → Buscar con Tab/Enter y último enlace del menú alcanzable, a 390 y
1440 px. Se comprueba desplazamiento interno alcanzable en diez tablas/vistas que lo necesitan;
esto se distingue del ancho de documento y de una tabla sin scroll.

Se inspeccionaron muestras visuales del mismo código corregido: login desktop, alta móvil,
detalle de libro, error de socio, préstamo cerrado, reporte y vencidos/bloqueo. Se conservan
[login](acceptance/login-desktop.png), [error móvil](acceptance/member-error-mobile.png) y
[vencidos móvil](acceptance/overdue-mobile.png). Las demás capturas se generan en artifacts y CI.
La comparación anterior/final aumenta cobertura (34 → 42 vistas); no se presenta como muestras
idénticas ni como auditoría de todos los dispositivos/lectores de pantalla.

## Reproducción y alcance

Preparar configuración/TLS según README, usar los contextos de esas revisiones y ejecutar
`npm run verify` desde infra. Se comprueban base vacía, migraciones propiedad de API, permisos,
HTTPS real, pantallas, reloj demo, devolución y recreación con persistencia de datos/portada.
Los informes son selectores, colores, conteos y booleanos, sin valores de campos ni credenciales.
CI conserva solo PNG e informes explícitos; no sube el checkpoint privado de persistencia.

Las nuevas ramas necesitan revisión/fusión. La guía humana está en Docs y conserva su registro
sin completar: esta automatización no es una presentación ante el evaluador ni cambia el plazo
original. Las pruebas de carga, dominio y concurrencia de API mantienen sus propias evidencias.
