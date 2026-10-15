# Plan previo de aceptación ampliada

Base infra main `f694448`; rama `feature/final-acceptance`. Referencias fusionadas:
API `60bbcdd`, App `b5ef195`, Docs `eba3a91`. Se conserva el producto de los seis repositorios.

Se amplía la verificación T-22 existente antes de dar por cerrada la revisión de pantallas:
login y sus errores, catálogo vacío/formulario/detalle/edición, socios/alta/detalle,
préstamos/selección/detalle, vencidos vacíos, reporte válido/vacío/invertido y cuenta librarian.
Usar solo fixtures sintéticas, API real, base efímera y HTTPS confiable. No capturar credenciales,
tokens, headers ni formularios de acceso/cuenta con valores de autenticación introducidos.

Capturar vistas desktop/móvil y comprobar ancho de documento, controles con nombre accesible,
contraste de texto visible (4,5:1 normal; 3:1 grande; disabled/decorativo excluido), y recorrido
de teclado con foco visible/enlace de salto. Registrar únicamente selectores/colores/conteos,
nunca contenido de campos. Una detección se reproduce antes de una corrección mínima de App.
No se declara que esta comprobación cubra lectores de pantalla, todos los dispositivos o WCAG.

También se comprueban rechazos visibles de duplicados/edición de existencias, reportes y roles,
sin reemplazar la autorización del servidor. Los datos y portadas deben persistir tras recreación.
Una fase fallida conserva informe seguro y el runner limpia solo su proyecto generado.
Se añade una guía de demostración manual en Docs, marcando la presentación ante el evaluador
como pendiente: el agente no puede certificar que la usuaria la haya realizado.

El CI debe fijar las revisiones efectivamente verificadas, y la evidencia distingue fuentes
fusionadas, ramas de corrección y pruebas ejecutadas. El plazo original permanece intacto.
