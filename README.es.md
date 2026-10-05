# 5-mods — cinco mods para Claude Code

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

[![5-mods](guia/assets/banner-es.jpg)](https://inematds.github.io/5-mods/guia/es/)

## 📖 Guía de uso

Guía completa (landing + paso a paso): **https://inematds.github.io/5-mods/guia/es/**

Cinco **mods** listos para Claude Code: ahorrar en chats grandes, ocultar datos sensibles mientras grabas, seguir el progreso de un `/goal`, evitar que dos chats editen el mismo archivo y recibir sugerencias de próximo paso al final de cada respuesta.

| Mod | Comandos | Para qué sirve |
|---|---|---|
| **Cache Keeper** | `/cache`, `/keepwarm`, `/board`, `/handoff` | Muestra si el caché del chat está caliente o frío y cuánto costaría empezar de nuevo en frío; mantiene calientes los chats grandes; pregunta antes de un envío caro; tablero con todos los chats; pasa el chat a uno nuevo |
| **Recording Mode** | `/rec`, `/rec strict`, `/rec off`, `/rec config` | Oculta claves, datos personales y números de negocio en la pantalla y cierra archivos privados mientras grabas |
| **Goal Meter** | `/goals` | Barra de progreso para `/goal`, hecha a partir del plan de tareas del propio Claude, con pronóstico de término |
| **Collision Guard** | `/guard` | Pregunta antes de editar un archivo que otro chat abierto cambió en los últimos 30 minutos |
| **Next Steps** | `/next`, `/next on`, `/next off` | Al final de cada respuesta, hasta 3 sugerencias de próximo prompt como botones sobre el prompt |

---

## 1. Qué son los mods

La idea es simple: **si querías que Claude Code hiciera algo distinto, se lo pides y cambia.** Un mod puede:

- **dibujar en pantalla** — una línea sobre el prompt, una etiqueta en el pie, un panel lateral;
- **crear comandos** de barra (`/rec`, `/guard`, `/next`…);
- **entrar antes de que una herramienta se ejecute** (p. ej., antes de un `Edit`) y preguntar algo en la interfaz, en vez de solo bloquear como haría un hook común.

Técnicamente, **los mods viven dentro de plugins**: un archivo JavaScript (`hooks/register.mjs`) que Claude Code carga cuando empieza el chat. Se instala con `/plugin` (o `claude plugin install`) en la terminal o en la pestaña *Code* de la app Desktop. Y se puede crear uno nuevo en lenguaje natural: “quiero un mod que haga X”.

Otras ideas de mod que circulan: medidor de contexto (*token weather*), vista previa de lo que se borraría antes de borrar (*blast radius*), reproducción de las ediciones paso a paso (*replay theater*). Una buena forma de encontrar los tuyos: pídele a Claude que lea tus logs de sesión y sugiera los 5 mods que más ayudarían a tu forma de trabajar.

### Mod × hook × skill: ¿cuál es la diferencia?

| | Qué es | Dónde aparece | Ejemplo |
|---|---|---|---|
| **Skill** | Instrucciones en Markdown que Claude lee cuando la tarea lo pide | Solo en lo que Claude escribe | “cómo hacer un handoff de sesión” |
| **Hook clásico** | Un comando de shell que corre en un evento (antes de una herramienta, al enviar un prompt) | Bloquea, permite o inyecta texto; no dibuja nada | “denegar `rm -rf`” |
| **Mod** | Un módulo JavaScript que corre **dentro** de Claude Code | Dibuja en la interfaz, crea comandos, pregunta con botones, guarda estado | “mostrar una barra de progreso de `/goal`” |

Un mod hace todo lo que hace un hook, pero con interfaz y memoria. Por eso Collision Guard puede **preguntar** “¿editar de todos modos?” con botones, en vez de solo bloquear.

## 2. Conceptos en 2 minutos

Antes de ver cada mod, conviene entender cuatro ideas que usan:

- **Contexto:** todo lo que está en el chat (tus mensajes, respuestas, archivos leídos, salidas de comandos). Con cada mensaje nuevo, el modelo relee ese contexto completo. Un chat largo puede tener 100k, 400k tokens o más.
- **Caché de prompt:** para no cobrar el precio completo en cada relectura, el contexto se guarda en un caché. Leer del caché cuesta ~10 % del precio normal. Pero el caché **expira** si el chat queda detenido: 5 minutos o 1 hora, según la cuenta. Al volver, el primer mensaje debe **regrabar** todo en el caché, hasta a 2× el precio. Es el “reinicio en frío” que Cache Keeper evita.
- **`/goal`:** comando de Claude Code para trabajos largos y autónomos: describes cómo es el “listo” y Claude trabaja hasta llegar, verificando al final de cada ronda si se alcanzó la meta. Goal Meter lo convierte en una barra de progreso.
- **Git worktree:** una segunda carpeta de trabajo del mismo repositorio, en otro branch. Dos chats en worktrees distintos no se pisan los archivos. Es la salida que ofrece Collision Guard.

## 3. Los mods en detalle

### Cache Keeper

Cada mensaje relee el chat completo. Leído del caché, cuesta 1/10 del precio normal de entrada. Cuando el caché expira (5 min o 1 h detenido, según la cuenta), el siguiente mensaje regraba todo hasta a 2× el precio. En un chat de 400 mil tokens esto puede costar unos dólares; mantenerlo caliente cuesta centavos.

- **Línea sobre el prompt:** `● cache warm 42m │ ctx 412k │ rewrite ≈ $3.30 │ session $5.12`. Se pone amarilla 5 min antes de expirar, con el botón `keep warm`. Muestra también los límites de 5 h y semanal del plan (amarillo al 80 %, rojo al 95 %).
- **`/keepwarm [horas|off]`:** mantiene el caché caliente (por defecto 4 h, máx. 24) con un ping pequeño antes de expirar. Si el ping graba en vez de leer, se desactiva y avisa.
- **Protección de envío en frío:** chat de más de 150k tokens con caché expirado → pregunta *Enviar de todos modos*, *Compactar antes* o *Cancelar*.
- **`/board`:** todos los chats locales en un panel — esperándote, trabajando, y los que se enfrían primero.
- **`/handoff`:** ejecuta la skill `/session-handoff` incluida, guarda el resumen, limpia el chat y envía el resumen como primer mensaje del chat nuevo (dos clics en vez de copiar, limpiar y pegar).
- **`/cache`:** estado y ajustes — `ttl 5|60|auto`, `guard on|off`, `big 150k`, `alerts on|off`.

Los valores en dólares vienen de la tabla de precios de la API. **En la suscripción no se vuelven cobro**: aparecen como consumo de tus límites.

### Recording Mode

Ejecuta `/rec` antes de presionar *grabar*. Vale para todos los chats abiertos en hasta 3 s; `/rec off` lo desactiva en todos.

- **Enmascara en pantalla:** claves de API y tokens, todo valor de `.env` de la carpeta del proyecto (y de las carpetas superiores), correos, nombres, teléfonos, direcciones, números de tarjeta/cuenta/documento, montos de dinero y números cerca de palabras de negocio. `/rec strict` enmascara también todo número grande y porcentaje.
- **Oculta resultados completos** de herramientas de correo, chat, tareas, agenda, archivos, CRM y finanzas. Claude recibe el resultado real; solo cambia la pantalla.
- **Cierra archivos:** `.env`, credenciales, claves SSH/nube, la carpeta de memoria de Claude y documentos financieros.
- **Avisa a Claude** (nota oculta en cada prompt) que no cite nombres, números ni planes internos.
- **● REC rojo** sobre el prompt y en el pie.

Ajusta con `/rec config`, que crea `~/.claude/mods-data/recording-mode/config.json`:

```json
{
  "keepNames": ["Tu Nombre", "Tu Marca"],
  "names": ["Un Colega", "Un Cliente"],
  "privatePaths": ["clientes/", "finanzas/", "notas-privadas.md"],
  "businessTools": [],
  "closedTools": []
}
```

> **Atención para uso en Latinoamérica:** las palabras de negocio y los patrones de enmascaramiento están en inglés (*revenue*, *margin*, *payroll*, `$`). Los símbolos de moneda local, los números de identificación nacional (RFC, CUIT, RUT…) y términos de negocio en español como “facturación” pueden pasar. Usa `/rec strict`, completa `names`/`privatePaths` y **revisa el video antes de publicar**. El mod cambia lo que se dibuja, no lo que se almacena, y los títulos de los chats en la barra lateral de la app Desktop no se enmascaran.

### Goal Meter

Escribe `/goal <cómo es el "listo">` normalmente. Claude escribe el plan con la herramienta de tareas del mod (cada tarea P, M o G) y marca inicio y fin de cada una.

- **Línea sobre el prompt:** `5 of 8 tasks · 69%`, barra, tiempo transcurrido, pronóstico (“about 17m left”), cuántas veces creció el plan, agentes en ejecución, últimas tareas y próximas. La tecla `g` abre la lista completa.
- **Pie:** `◎ goal 69% · ~17m`.
- **Cálculo:** P/M/G valen 1/2/3. El pronóstico usa el ritmo del propio goal y aparece tras 2 tareas concluidas. Si surge trabajo nuevo, el plan crece y la barra puede retroceder.
- **`/goals`:** lista de este chat + goals de los otros chats en las últimas 12 h. Ajustes: `/goals hide|show`, `/goals strict on` (sin editar archivos antes de que exista el plan), `/goals clear`.

No hace llamadas extra al modelo.

### Collision Guard

Con varios chats en el mismo proyecto, dos pueden tocar el mismo archivo sin saberlo. Antes de `Edit`/`Write`/`NotebookEdit`, el mod revisa si otro chat abierto modificó ese archivo en los últimos 30 min. Si es así, pregunta:

- **Proceed** — edita de todos modos;
- **Move to a worktree** — mueve el trabajo de este chat a un *git worktree* (cuando el archivo está en git);
- **Cancel** — no toca nada y pregunta cómo seguir.

`/guard` muestra lo que ve, `/guard off` lo desactiva, `/guard window 60` cambia la ventana a 60 min. No se agrega nada al prompt de Claude.

### Next Steps

Cuando una respuesta termina, el mod le pregunta al modelo — reutilizando el historial del propio chat, que ya está en caché — cuáles son los próximos pasos más útiles (corregir un bug antes, ejecutar las pruebas, hacer el commit, la siguiente funcionalidad obvia). Aparecen hasta 3 botones sobre el prompt:

```
→ next steps
  [j] Ejecuta las pruebas del módulo de login
  [k] Haz el commit de los cambios
  [l] Actualiza el README con el nuevo comando
  [d] dismiss
```

- Presionar un botón envía ese texto como tu próximo prompt; `d` lo descarta.
- Escribir tu propio prompt también limpia las sugerencias.
- Las sugerencias salen en el idioma en que escribes.
- **Se queda en silencio mientras Recording Mode esté activo** (para no mostrar nada sensible en pantalla).
- `/next off` lo desactiva (vale para los chats siguientes), `/next on` lo reactiva, `/next` muestra el estado.

**Costo:** una consulta pequeña por respuesta. Como reutiliza el caché del chat, es casi toda lectura de caché; en la suscripción cuenta en tu límite de uso. Si no quieres ese consumo, `/next off`.

## 4. Un día de uso, en la práctica

Un ejemplo de cómo trabajan juntos los cinco:

1. **9h — abres dos chats en el mismo proyecto.** En uno pides “corrige el bug del login”; en el otro, “agrega el sello *más popular* en el plan Pro de la página de precios”.
2. **9h10 — los dos quieren tocar `precios.html`.** El primero ya editó el archivo. Cuando el segundo va a editar, **Collision Guard** pregunta: *Proceed*, *Move to a worktree* o *Cancel*. Eliges y ningún chat sobrescribe al otro sin saberlo.
3. **9h30 — lanzas una tarea larga:** `/goal migrar las pruebas a Vitest y dejar todas pasando`. **Goal Meter** muestra `3 of 7 tasks · 41%` y el pronóstico de término. Con `/goals` ves las metas de todos los chats.
4. **10h — fin de cada respuesta.** **Next Steps** sugiere “Ejecuta la suite completa”, “Haz el commit de la migración”, “Actualiza el CHANGELOG”. Una tecla y el prompt queda enviado.
5. **11h — te vas a almorzar** con un chat de 300k tokens abierto. Antes de que el caché se enfríe, la línea de **Cache Keeper** se pone amarilla. Presionas `keep warm` (o `/keepwarm 2`) y, al volver, el chat sigue barato. Si prefieres empezar limpio, `/handoff` resume todo y abre un chat nuevo con el resumen.
6. **15h — vas a grabar un tutorial.** Escribes `/rec`. Claves, correos, montos y archivos `.env` desaparecen de la pantalla en todos los chats; un **● REC** rojo recuerda que estás grabando. Next Steps se queda en silencio. Al final, `/rec off`.

## 5. Requisitos

- **Claude Code 2.1.287 o más nuevo** (`claude --version`). Funciona en la terminal y en la pestaña *Code* de Desktop (los botones sobre el prompt aparecen en la terminal).
- **Mods habilitados en tu cuenta** (la habilitación es gradual). En una carpeta vacía, ejecuta `claude plugin test`: “no hooks module to load” = puede cargar; “served off” = aún no. Se puede instalar antes; empieza a funcionar cuando se habilite.

## 6. Instalar

### Opción A — pedírselo a Claude

Abre Claude Code y pega, con la ruta real de esta carpeta:

```text
Instala los cinco mods de Claude Code de esta carpeta: <ruta>/5-mods. Sigue el INSTALL-FOR-CLAUDE.md que está en ella.
```

Él revisa la versión, copia a `~/.claude/5-mods`, registra el marketplace, instala los cinco y deja una nota en tu `CLAUDE.md` global. Después **abre un chat nuevo** y escribe `/guard` — si responde, está funcionando.

### Opción B — comandos manuales

```bash
cp -a . ~/.claude/5-mods
claude plugin marketplace add "$HOME/.claude/5-mods"
```

Después, uno a la vez (no en paralelo — todos escriben en el mismo archivo de configuración):

```bash
claude plugin install cache-keeper@5-mods
claude plugin install recording-mode@5-mods
claude plugin install goal-meter@5-mods
claude plugin install collision-guard@5-mods
claude plugin install next-steps@5-mods
```

Abre un chat nuevo: el mod se carga cuando empieza el chat (`/reload-plugins` no recarga).

- **Actualizar:** `claude plugin marketplace update 5-mods` → `claude plugin update <mod>@5-mods` → chat nuevo.
- **Quitar:** `claude plugin uninstall <mod>@5-mods`.

## 7. Personalizar

Pídelo en español, en cualquier chat:

- “En el modo grabación, nunca ocultes mi nombre ni el nombre de la empresa.”
- “Haz que el modo grabación cierre también la carpeta `clientes/`.”
- “Collision guard debe mirar 60 minutos hacia atrás, no 30.”
- “Cache keeper debe avisar antes de un envío en frío desde 100k tokens.”
- “Next steps debe sugerir solo 2 pasos y siempre incluir ejecutar las pruebas.”

Claude sigue el [CUSTOMIZE.md](CUSTOMIZE.md): primero intenta un comando del propio mod, después el archivo de configuración, y solo por último cambia el código (subiendo la versión y reinstalando). Cada cambio queda registrado en `CHANGES.md`.

## 8. Dónde quedan los datos

Todo local, en `~/.claude/mods-data/`: latidos de sesión y handoffs de Cache Keeper, la bandera y la configuración de la grabación, el plan de cada goal, las listas de archivos de Collision Guard y la configuración de Next Steps. **Los mods no hacen llamadas de red propias** (sin `fetch`, sin `child_process`). Las únicas solicitudes al modelo son los pings de `/keepwarm` (solo mientras está activo) y la consulta de sugerencias de Next Steps (solo mientras está activo).

## 9. Cómo crear tu propio mod

No necesitas saber JavaScript. Abre Claude Code (2.1.287+) y describe lo que quieres ver y cuándo:

```text
Quiero un mod que, cuando escriba /pomodoro, muestre sobre el prompt un contador de 25 minutos
y me avise con un toast cuando termine.
```

Claude escribe los tres archivos de un mod y lo carga al instante (te pregunta si quieres activar el *hot reload* de la sesión):

```
mi-mod/
  .claude-plugin/plugin.json   nombre, versión y descripción
  hooks/hooks.json             { "modules": ["./register.mjs"] }
  hooks/register.mjs           el código: export const register = (on) => { ... }
```

Después pregunta: “¿cómo lo activo y desactivo?”, “¿cómo lo instalo en otra computadora?”. Los cinco mods de este repositorio son buenos modelos para copiar: `next-steps/hooks/register.mjs` es el más pequeño (~180 líneas) y muestra comando, evento de fin de respuesta, consulta al modelo y botones sobre el prompt.

Para revisar un mod antes de usarlo:

```bash
claude plugin validate --strict ./mi-mod   # lee el código como lo leerá Claude Code
claude plugin test ./mi-mod                # ejecuta las pruebas *.test.ts del mod
```

## 10. Estructura

```
.claude-plugin/marketplace.json   marketplace "5-mods" con los 5 plugins
cache-keeper/                     hooks/register.mjs + pricing.mjs + skills/session-handoff
recording-mode/                   hooks/register.mjs + privacy.mjs
goal-meter/                       hooks/register.mjs + plan.mjs
collision-guard/                  hooks/register.mjs + coach.mjs
next-steps/                       hooks/register.mjs + tests/parse.test.ts
INSTALL-FOR-CLAUDE.md             paso a paso que Claude sigue para instalar
CUSTOMIZE.md                      cómo Claude modifica un mod después
```

Verificado el 05/10/2026 con Claude Code 2.1.289: `claude plugin validate --strict` pasa en los cinco mods y `claude plugin test next-steps` pasa (2/2).

## 11. Preguntas frecuentes

**Instalé y no aparece nada.** Los mods se cargan cuando el chat **empieza**. Cierra y abre Claude Code (en la terminal, sal y ejecuta `claude` de nuevo; `/clear` no cuenta). Después escribe `/guard`: si responde, los mods están corriendo.

**`claude plugin test` dice “served off”.** Tu cuenta aún no recibió los mods. La instalación queda lista y empieza a funcionar sola cuando llegue la habilitación.

**Un comando no existe (`/next`, `/cache`…).** Otro plugin ya usaba el nombre. El mod registra un nombre alternativo: `/next-steps`, `/ck-cache`, `/ck-keepwarm`, `/ck-board`, `/ck-handoff`, `/recording`, `/goal-meter` o `/collision-guard`.

**¿Se cobran los valores en dólares?** No en la suscripción: ahí se vuelven consumo de tus límites de 5 h y semanal. Los valores son una estimación según el precio de la API, útiles para comparar qué cuesta más.

**¿Puedo usar solo algunos?** Sí. Instala solo los que quieras (`claude plugin install <mod>@5-mods`) o desactiva cada uno con su comando (`/guard off`, `/next off`…).

**¿Funciona en la app Desktop?** Sí, en la pestaña *Code*. La línea sobre el prompt con botones se dibuja en la terminal; en Desktop, Cache Keeper, Recording Mode y Goal Meter muestran una etiqueta en el pie, y los comandos de todos funcionan normalmente.

**¿Recording Mode garantiza que nada se filtre?** No. Enmascara por patrones (correos, claves, montos, palabras de negocio en inglés) y cierra archivos sensibles, pero el texto libre puede escapar. Revisa el video antes de publicar.

**Cambié el código de un mod y nada cambió.** Claude Code ejecuta una **copia** hecha en la instalación. Sube la versión en `plugin.json`, ejecuta `claude plugin marketplace update 5-mods` y `claude plugin update <mod>@5-mods`, y abre un chat nuevo. El [CUSTOMIZE.md](CUSTOMIZE.md) tiene el paso a paso.

## Licencia

MIT — ver [LICENSE](LICENSE).
