document.addEventListener('DOMContentLoaded', () => {
  const escenaFija = document.getElementById('escena-fija');
  const ANCHO_BASE = 570;
  const ALTO_BASE = 460;
  let escalaActual = 1;

  function ajustarEscalaEscena() {
    if (!escenaFija) return;
    const escalaX = window.innerWidth / ANCHO_BASE;
    const escalaY = window.innerHeight / ALTO_BASE;
    escalaActual = Math.min(escalaX, escalaY);
    escenaFija.style.transform = `scale(${escalaActual})`;
    document.documentElement.style.setProperty('--escala-ui', escalaActual);
  }

  ajustarEscalaEscena();
  window.addEventListener('resize', ajustarEscalaEscena);

  const style = document.createElement('style');
  style.innerHTML = `
    #menu-nota-overlay, #lista-tareas-menu {
      scrollbar-width: none; 
      -ms-overflow-style: none; 
    }
    #menu-nota-overlay::-webkit-scrollbar, #lista-tareas-menu::-webkit-scrollbar {
      display: none; 
    }
    .slot {
      border: none !important;
    }
    .nota-pegada:not(.flotando):hover, #btn-abrir-menu:hover {
      border: 0px solid white !important;
      border-radius: 8px;
      box-sizing: border-box;
    }
    .slot .nota-pegada:not(.flotando):hover {
      border: none !important;
    }
    .nota-pegada.flotando, .nota-pegada.flotando:hover {
      border: none !important;
    }
  `;
  document.head.appendChild(style);

  const gridSlotsContainer = document.getElementById('grid-slots');
  for (let i = 0; i < 20; i++) {
    const slot = document.createElement('div');
    slot.dataset.index = i;
    if (i !== 4) {
      slot.classList.add('slot');
    }
    gridSlotsContainer.appendChild(slot);
  }

  const btnAbrirMenu = document.getElementById('btn-abrir-menu');
  const menuOverlay = document.getElementById('menu-nota-overlay');
  const listaTareasMenu = document.getElementById('lista-tareas-menu');
  const btnCheckNota = document.getElementById('btn-check-nota');
  const inputTitulo = document.getElementById('input-titulo');
  const tableroContenedor = document.getElementById('tablero-contenedor');

  let notaEnEdicion = null;
  let notaActualDatos = {
    titulo: "enfoque de hoy",
    tareas: [{ texto: '', completada: false }]
  };

  function guardarEstadoTablero() {
    const slots = document.querySelectorAll('.slot');
    const estado = {};
    slots.forEach(slot => {
      const nota = slot.querySelector('.nota-pegada');
      if (nota && nota.datosNota) {
        estado[slot.dataset.index] = nota.datosNota;
      }
    });
    localStorage.setItem('tablero_notas', JSON.stringify(estado));
  }

  function cargarEstadoTablero() {
    const guardado = localStorage.getItem('tablero_notas');
    if (!guardado) return;
    try {
      const estado = JSON.parse(guardado);
      const slots = document.querySelectorAll('.slot');
      slots.forEach(slot => {
        const index = slot.dataset.index;
        if (estado[index]) {
          const datosNota = estado[index];
          const notaDiv = document.createElement('div');
          notaDiv.classList.add('nota-pegada');
          notaDiv.datosNota = datosNota;
          notaDiv.style.position = 'absolute';
          notaDiv.style.left = '0';
          notaDiv.style.top = '0';
          notaDiv.currentSlot = slot;

          actualizarHTMLNotaDiv(notaDiv, datosNota);
          slot.appendChild(notaDiv);
          configurarEventosNota(notaDiv, datosNota);
        }
      });
    } catch (e) {
      console.error("Error al cargar las notas guardadas", e);
    }
  }

  function actualizarHTMLNotaDiv(notaDiv, datos) {
    notaDiv.innerHTML = `
      <img src="images/notapegada.png" alt="Nota Pegada">
    `;
  }

  btnAbrirMenu.addEventListener('click', () => {
    notaEnEdicion = null;
    notaActualDatos = {
      titulo: "enfoque de hoy",
      tareas: [{ texto: '', completada: false }]
    };
    inputTitulo.value = notaActualDatos.titulo;
    menuOverlay.classList.remove('oculto');
    renderizarTareasMenu();
  });

  function renderizarTareasMenu() {
    listaTareasMenu.innerHTML = '';
    
    notaActualDatos.tareas.forEach((tarea, index) => {
      const fila = document.createElement('div');
      fila.classList.add('tarea-item-menu');
      
      const containerClass = tarea.completada ? 'input-anim-container completada' : 'input-anim-container';

      fila.innerHTML = `
        <input type="checkbox" ${tarea.completada ? 'checked' : ''} data-index="${index}" class="chk-menu">
        <div class="${containerClass}">
          <input type="text" value="${tarea.texto}" data-index="${index}" class="txt-menu" placeholder="toca para añadir...">
        </div>
      `;
      listaTareasMenu.appendChild(fila);

      const chk = fila.querySelector('.chk-menu');
      const txt = fila.querySelector('.txt-menu');
      const animContainer = fila.querySelector('.input-anim-container');

      chk.addEventListener('change', (e) => {
        notaActualDatos.tareas[index].completada = e.target.checked;
        if (e.target.checked) {
          animContainer.classList.add('completada');
        } else {
          animContainer.classList.remove('completada');
        }
      });

      txt.addEventListener('input', (e) => {
        notaActualDatos.tareas[index].texto = e.target.value;
      });

      txt.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && txt.value === '' && notaActualDatos.tareas.length > 1) {
          e.preventDefault();
          notaActualDatos.tareas.splice(index, 1);
          renderizarTareasMenu();
          const inputs = listaTareasMenu.querySelectorAll('.txt-menu');
          if (inputs[index - 1]) {
            inputs[index - 1].focus();
            inputs[index - 1].setSelectionRange(inputs[index - 1].value.length, inputs[index - 1].value.length);
          }
        } else if (e.key === 'Enter') {
          e.preventDefault();
          
          const inputs = listaTareasMenu.querySelectorAll('.txt-menu');
          if (inputs[index + 1]) {
            inputs[index + 1].focus();
          } else if (notaActualDatos.tareas.length < 5) {
            notaActualDatos.tareas.push({ texto: '', completada: false });
            renderizarTareasMenu();
            const nuevasInputs = listaTareasMenu.querySelectorAll('.txt-menu');
            if (nuevasInputs[index + 1]) {
              nuevasInputs[index + 1].focus();
            }
          }
        }
      });
    });
  }

  inputTitulo.addEventListener('input', (e) => {
    notaActualDatos.titulo = e.target.value;
  });

  btnCheckNota.addEventListener('click', () => {
    notaActualDatos.tareas = notaActualDatos.tareas.filter(t => t.texto.trim() !== '');

    if (notaActualDatos.tareas.length === 0) {
      menuOverlay.classList.add('oculto');
      return;
    }

    menuOverlay.classList.add('oculto');

    if (notaEnEdicion) {
      actualizarNotaVisual(notaEnEdicion, notaActualDatos);
      guardarEstadoTablero();
    } else {
      iniciarColocacionNotaNueva(notaActualDatos);
    }
  });

  function actualizarNotaVisual(elementoNota, datos) {
    elementoNota.datosNota = datos;
    actualizarHTMLNotaDiv(elementoNota, datos);
  }

  function verificarSlotBajoCursor(clientX, clientY) {
    const slots = document.querySelectorAll('.slot');
    let slotEncontrado = null;
    slots.forEach(slot => {
      const rSlot = slot.getBoundingClientRect();
      if (
        clientX >= rSlot.left &&
        clientX <= rSlot.right &&
        clientY >= rSlot.top &&
        clientY <= rSlot.bottom
      ) {
        slotEncontrado = slot;
      }
    });
    return slotEncontrado;
  }

  function actualizarPosicionFlotante(notaDiv, clientX, clientY, lastX, currentRot) {
    const deltaX = clientX - lastX;
    let rot = -deltaX * 2.2;
    rot = Math.max(-35, Math.min(35, rot));
    if (deltaX === 0) rot = currentRot;

    notaDiv.style.left = (clientX - 32) + 'px';
    notaDiv.style.top = (clientY - 32) + 'px';

    const slotBajo = verificarSlotBajoCursor(clientX, clientY);
    let scale = 0.6 * escalaActual;
    if (slotBajo) {
      notaDiv.classList.add('sobre-slot');
      scale = 1 * escalaActual;
    } else {
      notaDiv.classList.remove('sobre-slot');
      scale = 0.6 * escalaActual;
    }

    notaDiv.style.transform = `scale(${scale}) rotate(${rot}deg)`;
    return rot;
  }

  function fijarNotaEnSlot(notaDiv, slotDestino, datosNota) {
    slotDestino.innerHTML = '';
    slotDestino.appendChild(notaDiv);
    notaDiv.classList.remove('flotando', 'sobre-slot');
    notaDiv.style.position = 'absolute';
    notaDiv.style.left = '0';
    notaDiv.style.top = '0';
    notaDiv.style.zIndex = '';
    notaDiv.style.transform = '';
    notaDiv.currentSlot = slotDestino;

    configurarEventosNota(notaDiv, datosNota);
    guardarEstadoTablero();
  }

  function iniciarColocacionNotaNueva(datosNota) {
    const notaDiv = document.createElement('div');
    notaDiv.classList.add('nota-pegada', 'flotando');
    notaDiv.datosNota = datosNota;
    notaDiv.style.position = 'fixed';
    notaDiv.style.zIndex = '1000';

    actualizarHTMLNotaDiv(notaDiv, datosNota);
    let currentX = window.innerWidth / 2;
    let currentY = window.innerHeight / 2;
    notaDiv.style.left = (currentX - 32) + 'px';
    notaDiv.style.top = (currentY - 32) + 'px';
    notaDiv.style.transform = `scale(${0.6 * escalaActual})`;
    document.body.appendChild(notaDiv);

    let lastX = currentX;
    let currentRotation = 0;

    function onPointerMove(clientX, clientY) {
      currentX = clientX;
      currentY = clientY;
      currentRotation = actualizarPosicionFlotante(notaDiv, clientX, clientY, lastX, currentRotation);
      lastX = clientX;
    }

    function onMouseMove(e) {
      onPointerMove(e.clientX, e.clientY);
    }

    function onTouchMove(e) {
      if (e.touches.length > 0) {
        e.preventDefault();
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }

    function finalizarColocacion(clientX, clientY) {
      const slotDestino = verificarSlotBajoCursor(clientX, clientY);
      if (slotDestino) {
        fijarNotaEnSlot(notaDiv, slotDestino, datosNota);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('click', onClick);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
      }
    }

    function onClick(e) {
      finalizarColocacion(e.clientX, e.clientY);
    }

    function onTouchEnd(e) {
      const touch = e.changedTouches[0];
      if (touch) {
        finalizarColocacion(touch.clientX, touch.clientY);
      }
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    setTimeout(() => {
      window.addEventListener('click', onClick);
      window.addEventListener('touchend', onTouchEnd);
    }, 50);
  }

  function configurarEventosNota(notaDiv, datos) {
    let startX, startY;
    let isDragging = false;
    let lastX = 0;
    let currentRotation = 0;
    let rectOriginal;

    function iniciarArrastre(clientX, clientY) {
      startX = clientX;
      startY = clientY;
      lastX = clientX;
      isDragging = false;
      rectOriginal = notaDiv.getBoundingClientRect();
    }

    function moverArrastre(clientX, clientY, isTouch) {
      const dist = Math.hypot(clientX - startX, clientY - startY);
      if (dist > 5) {
        if (!isDragging) {
          isDragging = true;
          notaDiv.classList.add('flotando');
          notaDiv.style.position = 'fixed';
          notaDiv.style.zIndex = '1000';
          notaDiv.style.left = rectOriginal.left + 'px';
          notaDiv.style.top = rectOriginal.top + 'px';
          document.body.appendChild(notaDiv);
        }

        currentRotation = actualizarPosicionFlotante(notaDiv, clientX, clientY, lastX, currentRotation);
        lastX = clientX;
      }
      return isDragging && isTouch;
    }

    function soltarArrastre(clientX, clientY) {
      if (isDragging) {
        const slotDestinoNuevo = verificarSlotBajoCursor(clientX, clientY);
        const rectTablero = tableroContenedor.getBoundingClientRect();
        const dentroDelTablero = (
          clientX >= rectTablero.left &&
          clientX <= rectTablero.right &&
          clientY >= rectTablero.top &&
          clientY <= rectTablero.bottom
        );

        notaDiv.classList.remove('flotando', 'sobre-slot');
        notaDiv.style.transform = '';

        if (slotDestinoNuevo) {
          if (slotDestinoNuevo !== notaDiv.currentSlot) {
            slotDestinoNuevo.innerHTML = '';
          }
          slotDestinoNuevo.appendChild(notaDiv);
          notaDiv.currentSlot = slotDestinoNuevo;
          notaDiv.style.position = 'absolute';
          notaDiv.style.left = '0';
          notaDiv.style.top = '0';
          notaDiv.style.zIndex = '';
          guardarEstadoTablero();
        } else if (dentroDelTablero && notaDiv.currentSlot) {
          notaDiv.currentSlot.appendChild(notaDiv);
          notaDiv.style.position = 'absolute';
          notaDiv.style.left = '0';
          notaDiv.style.top = '0';
          notaDiv.style.zIndex = '';
          guardarEstadoTablero();
        } else {
          notaDiv.remove();
          guardarEstadoTablero();
        }
      } else {
        notaEnEdicion = notaDiv;
        notaActualDatos = JSON.parse(JSON.stringify(notaDiv.datosNota));
        inputTitulo.value = notaActualDatos.titulo;
        menuOverlay.classList.remove('oculto');
        renderizarTareasMenu();
      }
    }

    notaDiv.addEventListener('mousedown', (e) => {
      iniciarArrastre(e.clientX, e.clientY);

      function onMouseMove(event) {
        moverArrastre(event.clientX, event.clientY, false);
      }

      function onMouseUp(event) {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        soltarArrastre(event.clientX, event.clientY);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    notaDiv.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY);
      }

      function onTouchMove(event) {
        if (event.touches.length > 0) {
          const debeBloquearScroll = moverArrastre(event.touches[0].clientX, event.touches[0].clientY, true);
          if (debeBloquearScroll) {
            event.preventDefault();
          }
        }
      }

      function onTouchEnd(event) {
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        const touch = event.changedTouches[0];
        if (touch) {
          soltarArrastre(touch.clientX, touch.clientY);
        }
      }

      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
    }, { passive: true });
  }

  cargarEstadoTablero();

  // --- LÓGICA DEL CALENDARIO: DÍA ACTUAL, SELECTOR DE MES/AÑO Y MARCADOS ---
  const imgCalendario = document.querySelector('.imagen-calendario');
  const menuCalendarioOverlay = document.getElementById('menu-calendario-overlay');
  
  if (imgCalendario && menuCalendarioOverlay) {
    const anioTexto = document.getElementById('calendario-anio');
    const tituloMes = document.getElementById('calendario-titulo-mes');
    const titulosCentro = document.getElementById('calendario-titulos-centro');
    const diasSemanaContainer = document.getElementById('dias-semana-grande');
    const diasCuadricula = document.getElementById('dias-cuadricula-grande');
    const hojaMovil = document.getElementById('calendario-hoja-movil');
    const btnAnterior = document.getElementById('btn-mes-anterior');
    const btnSiguiente = document.getElementById('btn-mes-siguiente');

    const selectorMesAnio = document.getElementById('selector-mes-anio');
    const btnAnioMenos = document.getElementById('btn-anio-menos');
    const btnAnioMas = document.getElementById('btn-anio-mas');
    const inputSelectorAnio = document.getElementById('input-selector-anio');
    const gridMesesSelector = document.getElementById('grid-meses-selector');
    const btnCerrarSelectorFecha = document.getElementById('btn-cerrar-selector-fecha');

    const panelDia = document.getElementById('calendario-panel-dia');
    const fechaSeleccionadaTexto = document.getElementById('calendario-fecha-seleccionada');
    const btnCerrarPanelDia = document.getElementById('btn-cerrar-panel-dia');
    const inputNuevoMarcado = document.getElementById('input-nuevo-marcado');
    const btnAgregarMarcado = document.getElementById('btn-agregar-marcado');
    const listaMarcados = document.getElementById('calendario-lista-marcados');

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const inicialesDias = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

    let fechaActual = new Date();
    let anioBorrador = fechaActual.getFullYear();
    let claveFechaActiva = null;

    function cargarMarcados() {
      try {
        return JSON.parse(localStorage.getItem('calendario_marcados')) || {};
      } catch (e) {
        return {};
      }
    }

    function guardarMarcados(datos) {
      localStorage.setItem('calendario_marcados', JSON.stringify(datos));
    }

    function formatearClaveFecha(anio, mes, dia) {
      const m = String(mes + 1).padStart(2, '0');
      const d = String(dia).padStart(2, '0');
      return `${anio}-${m}-${d}`;
    }

    inicialesDias.forEach(dia => {
      const div = document.createElement('div');
      div.textContent = dia;
      diasSemanaContainer.appendChild(div);
    });

    function pintarBotonesMeses() {
      if (!gridMesesSelector) return;
      gridMesesSelector.innerHTML = '';
      const mesActivo = fechaActual.getMonth();
      const anioActivo = fechaActual.getFullYear();

      nombresMeses.forEach((nombre, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-opcion-mes';
        btn.textContent = nombre.slice(0, 3);
        btn.title = nombre;
        if (idx === mesActivo && anioBorrador === anioActivo) {
          btn.classList.add('activo');
        }
        btn.addEventListener('click', () => {
          const nuevoAnio = parseInt(inputSelectorAnio.value, 10) || anioBorrador;
          fechaActual = new Date(nuevoAnio, idx, 1);
          selectorMesAnio.classList.add('oculto');
          animarCambioHoja(() => {
            renderizarMes(fechaActual);
          });
        });
        gridMesesSelector.appendChild(btn);
      });
    }

    function abrirSelectorMesAnio() {
      if (!selectorMesAnio || !inputSelectorAnio) return;
      if (panelDia) panelDia.classList.add('oculto');
      anioBorrador = fechaActual.getFullYear();
      inputSelectorAnio.value = anioBorrador;
      pintarBotonesMeses();
      selectorMesAnio.classList.remove('oculto');
    }

    if (titulosCentro) {
      titulosCentro.addEventListener('click', abrirSelectorMesAnio);
    }

    if (btnAnioMenos && inputSelectorAnio) {
      btnAnioMenos.addEventListener('click', () => {
        anioBorrador = (parseInt(inputSelectorAnio.value, 10) || anioBorrador) - 1;
        inputSelectorAnio.value = anioBorrador;
        pintarBotonesMeses();
      });
    }

    if (btnAnioMas && inputSelectorAnio) {
      btnAnioMas.addEventListener('click', () => {
        anioBorrador = (parseInt(inputSelectorAnio.value, 10) || anioBorrador) + 1;
        inputSelectorAnio.value = anioBorrador;
        pintarBotonesMeses();
      });
    }

    if (inputSelectorAnio) {
      inputSelectorAnio.addEventListener('input', () => {
        const val = parseInt(inputSelectorAnio.value, 10);
        if (!Number.isNaN(val)) {
          anioBorrador = val;
          pintarBotonesMeses();
        }
      });
    }

    if (btnCerrarSelectorFecha && selectorMesAnio) {
      btnCerrarSelectorFecha.addEventListener('click', () => {
        selectorMesAnio.classList.add('oculto');
      });
    }

    function abrirPanelDia(anio, mes, dia) {
      if (!panelDia || !fechaSeleccionadaTexto || !inputNuevoMarcado) return;
      if (selectorMesAnio) selectorMesAnio.classList.add('oculto');
      claveFechaActiva = formatearClaveFecha(anio, mes, dia);
      fechaSeleccionadaTexto.textContent = `${dia} de ${nombresMeses[mes]} ${anio}`;
      inputNuevoMarcado.value = '';
      panelDia.classList.remove('oculto');
      renderizarListaMarcados();
      inputNuevoMarcado.focus();
    }

    function renderizarListaMarcados() {
      if (!claveFechaActiva || !listaMarcados) return;
      const todos = cargarMarcados();
      const items = todos[claveFechaActiva] || [];
      listaMarcados.innerHTML = '';

      if (items.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'sin-marcados-texto';
        vacio.textContent = 'Nada marcado este día todavía';
        listaMarcados.appendChild(vacio);
        return;
      }

      items.forEach((item, idx) => {
        const fila = document.createElement('div');
        fila.className = 'item-marcado-fecha';

        const izq = document.createElement('div');
        izq.className = 'item-marcado-izq';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = Boolean(item.hecho);

        const span = document.createElement('span');
        span.className = 'texto-marcado-fecha' + (item.hecho ? ' hecho' : '');
        span.textContent = item.texto;

        chk.addEventListener('change', () => {
          const datosActuales = cargarMarcados();
          if (datosActuales[claveFechaActiva] && datosActuales[claveFechaActiva][idx]) {
            datosActuales[claveFechaActiva][idx].hecho = chk.checked;
            guardarMarcados(datosActuales);
            span.classList.toggle('hecho', chk.checked);
          }
        });

        const btnBorrar = document.createElement('button');
        btnBorrar.type = 'button';
        btnBorrar.className = 'btn-borrar-marcado';
        btnBorrar.textContent = '×';
        btnBorrar.title = 'Eliminar';
        btnBorrar.addEventListener('click', () => {
          const datosActuales = cargarMarcados();
          if (datosActuales[claveFechaActiva]) {
            datosActuales[claveFechaActiva].splice(idx, 1);
            if (datosActuales[claveFechaActiva].length === 0) {
              delete datosActuales[claveFechaActiva];
            }
            guardarMarcados(datosActuales);
            renderizarListaMarcados();
            renderizarMes(fechaActual);
          }
        });

        izq.appendChild(chk);
        izq.appendChild(span);
        fila.appendChild(izq);
        fila.appendChild(btnBorrar);
        listaMarcados.appendChild(fila);
      });
    }

    function agregarMarcadoActual() {
      if (!claveFechaActiva || !inputNuevoMarcado) return;
      const texto = inputNuevoMarcado.value.trim();
      if (!texto) return;

      const datosActuales = cargarMarcados();
      if (!datosActuales[claveFechaActiva]) {
        datosActuales[claveFechaActiva] = [];
      }
      datosActuales[claveFechaActiva].push({ texto, hecho: false });
      guardarMarcados(datosActuales);

      inputNuevoMarcado.value = '';
      renderizarListaMarcados();
      renderizarMes(fechaActual);
      inputNuevoMarcado.focus();
    }

    if (btnAgregarMarcado) {
      btnAgregarMarcado.addEventListener('click', agregarMarcadoActual);
    }

    if (inputNuevoMarcado) {
      inputNuevoMarcado.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          agregarMarcadoActual();
        }
      });
    }

    if (btnCerrarPanelDia && panelDia) {
      btnCerrarPanelDia.addEventListener('click', () => {
        panelDia.classList.add('oculto');
        claveFechaActiva = null;
      });
    }

    imgCalendario.addEventListener('click', () => {
      if (selectorMesAnio) selectorMesAnio.classList.add('oculto');
      if (panelDia) panelDia.classList.add('oculto');
      menuCalendarioOverlay.classList.remove('oculto');
      renderizarMes(fechaActual);
    });

    menuCalendarioOverlay.addEventListener('click', (e) => {
      if (e.target === menuCalendarioOverlay) {
        if (selectorMesAnio) selectorMesAnio.classList.add('oculto');
        if (panelDia) panelDia.classList.add('oculto');
        menuCalendarioOverlay.classList.add('oculto');
      }
    });

    function animarCambioHoja(callback) {
      hojaMovil.classList.add('pasar-hoja-suave');

      setTimeout(() => {
        callback();
        hojaMovil.classList.remove('pasar-hoja-suave');
      }, 350);
    }

    btnAnterior.addEventListener('click', () => {
      animarCambioHoja(() => {
        fechaActual.setMonth(fechaActual.getMonth() - 1);
        renderizarMes(fechaActual);
      });
    });

    btnSiguiente.addEventListener('click', () => {
      animarCambioHoja(() => {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
        renderizarMes(fechaActual);
      });
    });

    function renderizarMes(fecha) {
      const anio = fecha.getFullYear();
      const mes = fecha.getMonth();

      anioTexto.textContent = anio;
      tituloMes.textContent = nombresMeses[mes];
      diasCuadricula.innerHTML = '';

      const hoy = new Date();
      const esMesActual = hoy.getFullYear() === anio && hoy.getMonth() === mes;
      const diaActual = hoy.getDate();

      const primerDia = new Date(anio, mes, 1).getDay();
      const diasEnMes = new Date(anio, mes + 1, 0).getDate();
      const marcados = cargarMarcados();

      for (let i = 0; i < primerDia; i++) {
        const hueco = document.createElement('div');
        diasCuadricula.appendChild(hueco);
      }

      for (let i = 1; i <= diasEnMes; i++) {
        const diaDiv = document.createElement('div');
        diaDiv.textContent = i;
        diaDiv.classList.add('dia-con-numero');

        if (esMesActual && i === diaActual) {
          diaDiv.classList.add('dia-actual');
        }

        const clave = formatearClaveFecha(anio, mes, i);
        if (marcados[clave] && marcados[clave].length > 0) {
          diaDiv.classList.add('dia-marcado');
        }

        diaDiv.addEventListener('click', () => {
          abrirPanelDia(anio, mes, i);
        });

        diasCuadricula.appendChild(diaDiv);
      }
    }
  }
});