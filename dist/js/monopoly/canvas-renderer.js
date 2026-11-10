// =========================================================================
// 🎨 MONOPOLY CANVAS RENDERER v3.0 — Estilo Monopoly Clásico + Animaciones
// - Tablero claro de alto contraste estilo Monopoly Real
// - Dados 3D con puntos (pips) que ruedan, giran y rebotan
// - Movimiento paso a paso (casilla por casilla) con salto parabólico y rastro
// - Textos flotantes de dinero (+$200 / -$150) y foco luminoso en ficha activa
// =========================================================================
(function() {
  const { TILES, GROUPS } = window.MonopolyConfig;

  class MonopolyRenderer {
    constructor(canvas, callbacks = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onTileClick = callbacks.onTileClick || null;
      this.onCenterClick = callbacks.onCenterClick || null;

      this.room = null;
      this.selectedTileId = 1;
      this.tileRects = [];
      this.tick = 0;

      // Posiciones visuales interpoladas por jugador (para caminar casilla por casilla)
      this.visualPositions = {};
      this.hopAnimations = {}; // { [playerId]: { path: [...], stepIdx, progress, onDone } }
      this.highlightedTile = null;

      // Estado de animación de dados 3D
      this.diceAnim = {
        active: false,
        framesLeft: 0,
        tempD1: 1,
        tempD2: 1,
        angle1: 0,
        angle2: 0,
        bounceY: 0
      };

      // Textos flotantes (+200, -60, etc.)
      this.floatingTexts = [];

      this.canvas.addEventListener('click', (e) => this.handlePointer(e));
    }

    // Mapea el índice 0..27 a coordenadas (col, row) en la grilla 8x8
    getGridCoord(index) {
      const idx = ((index % 28) + 28) % 28;
      if (idx <= 7) return { col: 7 - idx, row: 7 };          // Fila inferior (Der -> Izq)
      if (idx <= 14) return { col: 0, row: 7 - (idx - 7) };   // Columna izquierda (Abajo -> Arriba)
      if (idx <= 21) return { col: idx - 14, row: 0 };        // Fila superior (Izq -> Der)
      return { col: 7, row: idx - 21 };                       // Columna derecha (Arriba -> Abajo)
    }

    getTileCenter(index, cell) {
      const { col, row } = this.getGridCoord(index);
      return { x: col * cell + cell / 2, y: row * cell + cell / 2 };
    }

    handlePointer(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      // Verificar clic en una casilla del perímetro
      for (const tr of this.tileRects) {
        if (x >= tr.x && x <= tr.x + tr.w && y >= tr.y && y <= tr.y + tr.h) {
          this.selectedTileId = tr.id;
          if (this.onTileClick) this.onTileClick(TILES[tr.id]);
          return;
        }
      }

      // Clic en el centro del tablero (para lanzar dados rápidamente)
      if (this.onCenterClick) {
        this.onCenterClick();
      }
    }

    // Dispara la animación de dados rodando + ficha saltando casilla por casilla
    playRollAndMove(playerId, fromPos, toPos, stepsCount, finalDice, onComplete) {
      const Audio = window.EmulatorAudio;
      this.diceAnim.active = true;
      this.diceAnim.framesLeft = 36; // ~600ms a 60fps

      // Construir ruta casilla por casilla
      const path = [];
      const totalSteps = stepsCount || ((toPos - fromPos + 28) % 28) || 1;
      for (let s = 1; s <= totalSteps; s++) {
        path.push((fromPos + s) % 28);
      }

      this.visualPositions[playerId] = fromPos;

      // Cuando terminen de rodar los dados, iniciar el salto casilla por casilla
      setTimeout(() => {
        this.diceAnim.active = false;
        if (this.room) this.room.dice = finalDice;

        this.hopAnimations[playerId] = {
          fromTile: fromPos,
          path,
          stepIdx: 0,
          progress: 0,
          onDone: () => {
            this.visualPositions[playerId] = toPos;
            this.highlightedTile = toPos;
            this.selectedTileId = toPos;
            if (onComplete) onComplete();
          }
        };
        if (Audio) Audio.stepHop();
      }, 620);
    }

    addFloatingText(tileId, text, color = '#16a34a') {
      const cell = this.canvas.width / 8;
      const center = this.getTileCenter(tileId, cell);
      this.floatingTexts.push({
        x: center.x,
        y: center.y - 10,
        text,
        color,
        alpha: 1.0,
        vy: -1.4
      });
    }

    isAnimating() {
      return this.diceAnim.active || Object.keys(this.hopAnimations).length > 0;
    }

    setRoom(room) {
      this.room = room;
      if (room && Array.isArray(room.players)) {
        room.players.forEach(p => {
          if (this.visualPositions[p.id] === undefined && !this.hopAnimations[p.id]) {
            this.visualPositions[p.id] = p.position || 0;
          } else if (!this.hopAnimations[p.id]) {
            this.visualPositions[p.id] = p.position || 0;
          }
        });
      }
    }

    render() {
      this.tick++;
      const ctx = this.ctx;
      const W = this.canvas.width;
      const H = this.canvas.height;
      const cell = W / 8;

      ctx.clearRect(0, 0, W, H);

      // 1. Fondo central verde menta clásico de Monopoly Real
      const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.55);
      bgGrad.addColorStop(0, '#d8f0de');
      bgGrad.addColorStop(1, '#b8dfc4');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Actualizar animaciones de salto casilla por casilla
      this.updateHopAnimations();

      // 3. Dibujar las 28 casillas del perímetro
      this.tileRects = [];
      TILES.forEach((tile) => {
        const { col, row } = this.getGridCoord(tile.id);
        const x = col * cell;
        const y = row * cell;
        this.tileRects.push({ id: tile.id, x, y, w: cell, h: cell });
        this.drawTile(ctx, tile, x, y, cell);
      });

      // 4. Dibujar el centro del tablero (Logo Monopoly, Mazos de Cartas y Dados 3D)
      this.drawCenterBoard(ctx, cell, W - cell * 2);

      // 5. Dibujar fichas grandes y vistosas de los jugadores
      if (this.room && Array.isArray(this.room.players)) {
        this.drawPlayers(ctx, cell);
      }

      // 6. Dibujar textos flotantes (+$200, -$150, etc.)
      this.drawFloatingTexts(ctx);
    }

    updateHopAnimations() {
      const Audio = window.EmulatorAudio;
      Object.keys(this.hopAnimations).forEach(pid => {
        const anim = this.hopAnimations[pid];
        anim.progress += 0.12; // ~8 frames por casilla (muy claro a la vista)
        const targetTile = anim.path[anim.stepIdx];
        this.highlightedTile = targetTile;

        if (anim.progress >= 1) {
          anim.fromTile = targetTile;
          this.visualPositions[pid] = targetTile;
          anim.stepIdx++;
          anim.progress = 0;

          if (anim.stepIdx >= anim.path.length) {
            const doneCb = anim.onDone;
            delete this.hopAnimations[pid];
            if (doneCb) doneCb();
          } else {
            if (Audio) Audio.stepHop();
          }
        }
      });
    }

    drawTile(ctx, tile, x, y, size) {
      const isSelected = this.selectedTileId === tile.id;
      const isStepped = this.highlightedTile === tile.id;
      const isCorner = (tile.id % 7 === 0);
      const prop = this.room?.properties?.[tile.id];
      const owner = prop?.ownerId ? this.room?.players?.find(p => p.id === prop.ownerId) : null;

      // Fondo crema claro estilo tablero Monopoly físico
      if (isStepped) {
        ctx.fillStyle = '#fef08a'; // Iluminación dorada cuando la ficha pisa la casilla
      } else if (isSelected) {
        ctx.fillStyle = '#ffffff';
      } else if (isCorner) {
        ctx.fillStyle = '#e2f2e6';
      } else {
        ctx.fillStyle = '#f4f9f5';
      }
      ctx.fillRect(x, y, size, size);

      // Borde nítido de casilla
      ctx.strokeStyle = isStepped ? '#eab308' : (isSelected ? '#2563eb' : '#1e293b');
      ctx.lineWidth = (isStepped || isSelected) ? 3.5 : 1.8;
      ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);

      // Franja superior de color de propiedad (color original del grupo de Monopoly)
      if (tile.group && GROUPS[tile.group]) {
        const headerH = 24;
        ctx.fillStyle = GROUPS[tile.group].color;
        ctx.fillRect(x + 2, y + 2, size - 4, headerH);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 2, y + 2, size - 4, headerH);

        // Casas / Hotel en la franja
        const houses = prop?.houses || 0;
        if (houses > 0) {
          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          const icons = houses === 5 ? '🏨' : '🏠'.repeat(houses);
          ctx.fillText(icons, x + size / 2, y + 19);
        }
      }

      // Si tiene dueño, mostrar badge sutil del propietario en la base sin cambiar el color de la casilla
      if (owner) {
        ctx.fillStyle = owner.color;
        ctx.fillRect(x + 2, y + size - 7, size - 4, 5);
      }
      ctx.textAlign = 'center';
      if (tile.icon) {
        ctx.font = isCorner ? '30px sans-serif' : '22px sans-serif';
        ctx.fillText(tile.icon, x + size / 2, y + (tile.group ? 48 : 42));
      }

      // Nombre de la casilla en negro/azul oscuro muy legible
      ctx.fillStyle = '#0f172a';
      ctx.font = isCorner ? 'bold 11.5px "Fira Code", sans-serif' : 'bold 10.5px "Fira Code", sans-serif';
      const words = tile.name.split(' ');
      const line1 = words[0] || '';
      const line2 = words.slice(1).join(' ');
      const baseTextY = tile.icon ? (tile.group ? y + 66 : y + 64) : y + 48;

      ctx.fillText(line1.substring(0, 11), x + size / 2, baseTextY);
      if (line2) {
        ctx.fillText(line2.substring(0, 12), x + size / 2, baseTextY + 13);
      }

      // Precio grande y claro en la parte inferior
      if (tile.price) {
        ctx.fillStyle = owner ? '#0f172a' : '#b45309';
        ctx.font = 'bold 12.5px "Fira Code", monospace';
        ctx.fillText(`$${tile.price}`, x + size / 2, y + size - 13);
      } else if (tile.sub) {
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 9.5px "Fira Code", sans-serif';
        ctx.fillText(tile.sub.substring(0, 13), x + size / 2, y + size - 13);
      }
    }

    drawCenterBoard(ctx, offset, innerSize) {
      const cx = offset + innerSize / 2;
      const cy = offset + innerSize / 2;

      // Marco interior clásico doble
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(offset + 4, offset + 4, innerSize - 8, innerSize - 8);

      // Mazo ARCA COMUNAL (Arriba-Izquierda)
      this.drawCardDeck(ctx, offset + 28, offset + 28, 135, 82, '#0284c7', '📦 ARCA COMUNAL', 'TESORO');

      // Mazo CASUALIDAD (Abajo-Derecha)
      this.drawCardDeck(ctx, offset + innerSize - 163, offset + innerSize - 110, 135, 82, '#ea580c', '❓ CASUALIDAD', 'FORTUNA');

      // Banner Rojo Clásico de MONOPOLY en el centro superior
      ctx.save();
      ctx.translate(cx, offset + 76);
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.fillRect(-165, -30, 330, 56);
      ctx.strokeRect(-165, -30, 330, 56);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 4;
      ctx.fillText('MONOPOLY', 0, 10);
      ctx.restore();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 12px "Fira Code", sans-serif';
      ctx.fillText('EDICIÓN PERÚ & TECH EMPIRE // MULTIPLAYER', cx, offset + 122);

      // Arena central de Dados 3D
      this.drawDiceArena(ctx, cx, cy + 5);

      if (!this.room) return;

      // Indicador grande del jugador en turno
      const activePlayer = this.room.players?.[this.room.turnIndex];
      if (activePlayer) {
        const bannerY = cy + 90;
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = activePlayer.color || '#eab308';
        ctx.lineWidth = 3;
        ctx.fillRect(cx - 210, bannerY, 420, 62);
        ctx.strokeRect(cx - 210, bannerY, 420, 62);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Fira Code", sans-serif';
        ctx.fillText(
          `TURNO DE: ${activePlayer.token} ${activePlayer.name.toUpperCase()} — $${activePlayer.money}`,
          cx,
          bannerY + 25
        );

        const hint = {
          ROLL: '🎲 ¡HAZ CLIC EN LOS DADOS O EN "LANZAR DADOS"!',
          DECIDE: '🏢 DECIDE SI COMPRAS LA PROPIEDAD O PASAS',
          END: '⏭️ CONSTRUYE CASAS O PRESIONA "TERMINAR TURNO"'
        }[this.room.turnPhase] || '';

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 12px "Fira Code", sans-serif';
        ctx.fillText(hint, cx, bannerY + 47);
      }

      // Último evento en la parte inferior del centro
      const lastLog = this.room.logs?.[this.room.logs.length - 1];
      if (lastLog) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(cx - 235, offset + innerSize - 42, 470, 30);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 11.5px "Fira Code", monospace';
        ctx.fillText(lastLog.substring(0, 58), cx, offset + innerSize - 22);
      }
    }

    drawCardDeck(ctx, x, y, w, h, color, title, sub) {
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px "Fira Code", sans-serif';
      ctx.fillText(title, x + w / 2, y + 36);
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.fillText(sub, x + w / 2, y + 56);
      ctx.restore();
    }

    drawDiceArena(ctx, cx, cy) {
      // Alfombra verde oscura de tiro de dados
      ctx.fillStyle = '#14532d';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx - 115, cy - 58, 230, 116, 18);
      ctx.fill();
      ctx.stroke();

      let [d1, d2] = this.room?.dice || [6, 6];
      let rot1 = 0;
      let rot2 = 0;
      let offsetY = 0;

      if (this.diceAnim.active) {
        this.diceAnim.framesLeft--;
        if (this.tick % 3 === 0) {
          this.diceAnim.tempD1 = Math.floor(Math.random() * 6) + 1;
          this.diceAnim.tempD2 = Math.floor(Math.random() * 6) + 1;
        }
        d1 = this.diceAnim.tempD1;
        d2 = this.diceAnim.tempD2;
        rot1 = Math.sin(this.tick * 0.65) * 0.45;
        rot2 = -Math.cos(this.tick * 0.65) * 0.45;
        offsetY = Math.abs(Math.sin(this.tick * 0.5)) * -18;
      }

      this.draw3DDieWithPips(ctx, cx - 52, cy + offsetY, 68, d1, rot1);
      this.draw3DDieWithPips(ctx, cx + 52, cy - offsetY * 0.7, 68, d2, rot2);

      // Suma total debajo de los dados
      if (!this.diceAnim.active && this.room) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 12px "Fira Code", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`SUMA: ${d1 + d2}${d1 === d2 ? ' (¡DOBLES!)' : ''}`, cx, cy + 50);
      }
    }

    // Dibuja un dado blanco 3D real con sus puntos negros/rojos (pips 1..6)
    draw3DDieWithPips(ctx, centerX, centerY, size, value, angle = 0) {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      const half = size / 2;

      // Sombra 3D
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(-half + 5, -half + 6, size, size, 12);
      ctx.fill();

      // Cuerpo marfil/blanco del dado
      const grad = ctx.createLinearGradient(-half, -half, half, half);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, 12);
      ctx.fill();
      ctx.stroke();

      // Posiciones de los puntos (pips)
      const o = size * 0.26;
      const pipCoords = {
        1: [[0, 0]],
        2: [[-o, -o], [o, o]],
        3: [[-o, -o], [0, 0], [o, o]],
        4: [[-o, -o], [o, -o], [-o, o], [o, o]],
        5: [[-o, -o], [o, -o], [0, 0], [-o, o], [o, o]],
        6: [[-o, -o], [o, -o], [-o, 0], [o, 0], [-o, o], [o, o]]
      }[value] || [[0, 0]];

      pipCoords.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, value === 1 ? 7.5 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = value === 1 ? '#dc2626' : '#0f172a';
        ctx.fill();
      });

      ctx.restore();
    }

    drawPlayers(ctx, cell) {
      // Calcular coordenadas exactas de cada jugador (incluyendo interpolación durante el salto)
      this.room.players.forEach((p, idx) => {
        if (p.bankrupt) return;

        let px = 0;
        let py = 0;
        let jumpArc = 0;
        const hop = this.hopAnimations[p.id];

        if (hop) {
          const fromIdx = hop.fromTile;
          const toIdx = hop.path[hop.stepIdx];
          const c1 = this.getTileCenter(fromIdx, cell);
          const c2 = this.getTileCenter(toIdx, cell);
          px = c1.x + (c2.x - c1.x) * hop.progress;
          py = c1.y + (c2.y - c1.y) * hop.progress;
          jumpArc = Math.sin(hop.progress * Math.PI) * 26; // Salto parabólico alto y claro
        } else {
          const pos = this.visualPositions[p.id] !== undefined ? this.visualPositions[p.id] : (p.position || 0);
          const c = this.getTileCenter(pos, cell);
          // Pequeño desplazamiento por slot para que no se tapen entre sí
          const offsets = [
            { dx: -18, dy: -10 },
            { dx: 18,  dy: -10 },
            { dx: -18, dy: 16 },
            { dx: 18,  dy: 16 }
          ];
          const off = offsets[idx % 4];
          px = c.x + off.dx;
          py = c.y + off.dy;
        }

        const isTurnPlayer = (idx === this.room.turnIndex);

        // Si es el jugador en turno, dibujar un anillo dorado pulsante debajo de su ficha
        if (isTurnPlayer) {
          const pulseR = 23 + Math.sin(this.tick * 0.15) * 4;
          ctx.beginPath();
          ctx.arc(px, py, pulseR, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.35)';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#eab308';
          ctx.stroke();
        }

        // Sombra de la ficha en el tablero
        ctx.beginPath();
        ctx.ellipse(px, py + 12, 16, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fill();

        // Cuerpo 3D de la ficha (grande: radio 18px)
        const tokenY = py - jumpArc;
        ctx.beginPath();
        ctx.arc(px, tokenY, 18, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#0284c7';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Icono del jugador
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.token || '🛺', px, tokenY + 7);

        // Etiqueta flotante con el nombre sobre la ficha en turno
        if (isTurnPlayer) {
          const tagY = tokenY - 28 + Math.sin(this.tick * 0.12) * 3;
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(px - 38, tagY - 14, 76, 18, 5);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 9.5px "Fira Code", sans-serif';
          ctx.fillText(`▼ ${p.name.substring(0, 8)}`, px, tagY - 1);
        }
      });
    }

    drawFloatingTexts(ctx) {
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.y += ft.vy;
        ft.alpha -= 0.016;
        if (ft.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 18px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }
    }
  }

  window.MonopolyRenderer = MonopolyRenderer;
})();
