// =========================================================================
// 🎨 MONOPOLY CANVAS RENDERER — Patrón: MVC View & Flyweight Renderer
// Renderiza el tablero perimetral 8x8 (28 casillas), dados, casas y fichas
// =========================================================================
(function() {
  const { TILES, GROUPS } = window.MonopolyConfig;

  class MonopolyRenderer {
    constructor(canvas, onTileClick) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.onTileClick = onTileClick;
      this.room = null;
      this.selectedTileId = 0;
      this.tileRects = [];
      this.animFrame = 0;

      this.canvas.addEventListener('click', (e) => this.handlePointer(e));
    }

    // Mapea el índice 0..27 a coordenadas (col, row) en una grilla 8x8
    getGridCoord(index) {
      if (index <= 7) return { col: 7 - index, row: 7 };          // Fila inferior (Der -> Izq)
      if (index <= 14) return { col: 0, row: 7 - (index - 7) };   // Columna izquierda (Abajo -> Arriba)
      if (index <= 21) return { col: index - 14, row: 0 };        // Fila superior (Izq -> Der)
      return { col: 7, row: index - 21 };                         // Columna derecha (Arriba -> Abajo)
    }

    handlePointer(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      for (const tr of this.tileRects) {
        if (x >= tr.x && x <= tr.x + tr.w && y >= tr.y && y <= tr.y + tr.h) {
          this.selectedTileId = tr.id;
          if (this.onTileClick) this.onTileClick(TILES[tr.id]);
          break;
        }
      }
    }

    setRoom(room) {
      this.room = room;
    }

    render() {
      this.animFrame++;
      const ctx = this.ctx;
      const W = this.canvas.width;
      const H = this.canvas.height;
      const cell = W / 8;

      ctx.clearRect(0, 0, W, H);

      // Fondo central del tablero estilo consola Cyberpunk/Retro
      const grad = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, W * 0.6);
      grad.addColorStop(0, '#141e33');
      grad.addColorStop(1, '#090d18');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Grilla decorativa en el centro
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let i = cell; i < W - cell; i += 24) {
        ctx.beginPath(); ctx.moveTo(i, cell); ctx.lineTo(i, H - cell); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cell, i); ctx.lineTo(W - cell, i); ctx.stroke();
      }

      this.tileRects = [];

      // Dibujar las 28 casillas perimetrales
      TILES.forEach((tile) => {
        const { col, row } = this.getGridCoord(tile.id);
        const x = col * cell;
        const y = row * cell;
        this.tileRects.push({ id: tile.id, x, y, w: cell, h: cell });
        this.drawTile(ctx, tile, x, y, cell);
      });

      // Dibujar consola central (Logo, Dados, Última Carta y Estado del Turno)
      this.drawCenterConsole(ctx, cell, W - cell * 2);

      // Dibujar fichas de jugadores
      if (this.room && Array.isArray(this.room.players)) {
        this.drawPlayers(ctx, cell);
      }
    }

    drawTile(ctx, tile, x, y, size) {
      const isSelected = this.selectedTileId === tile.id;
      const prop = this.room?.properties?.[tile.id];
      const owner = prop?.ownerId ? this.room?.players?.find(p => p.id === prop.ownerId) : null;

      ctx.fillStyle = isSelected ? '#1e2c4a' : '#101726';
      ctx.fillRect(x, y, size, size);

      ctx.strokeStyle = isSelected ? '#ffd700' : 'rgba(0, 243, 255, 0.28)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);

      // Franja de color de grupo
      if (tile.group && GROUPS[tile.group]) {
        ctx.fillStyle = GROUPS[tile.group].color;
        ctx.fillRect(x + 2, y + 2, size - 4, 15);

        // Dibujar casas / hotel sobre la franja
        const houses = prop?.houses || 0;
        if (houses > 0) {
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          const icons = houses === 5 ? '🏨' : '🏠'.repeat(houses);
          ctx.fillText(icons, x + size / 2, y + 13);
        }
      }

      // Indicador de propietario (borde inferior del color del jugador)
      if (owner) {
        ctx.fillStyle = owner.color || '#00f3ff';
        ctx.fillRect(x + 2, y + size - 7, size - 4, 5);
      }

      // Icono o tipo
      ctx.textAlign = 'center';
      if (tile.icon) {
        ctx.font = '18px sans-serif';
        ctx.fillText(tile.icon, x + size / 2, y + 36);
      }

      // Nombre corto de casilla
      ctx.fillStyle = '#e6f1ff';
      ctx.font = 'bold 8.5px "Share Tech Mono", monospace';
      const parts = tile.name.split(' ');
      const line1 = parts[0] || '';
      const line2 = parts.slice(1).join(' ');
      const textY = tile.icon ? y + 51 : y + 33;
      ctx.fillText(line1.substring(0, 10), x + size / 2, textY);
      if (line2) {
        ctx.fillText(line2.substring(0, 10), x + size / 2, textY + 10);
      }

      // Precio o subtexto
      if (tile.price) {
        ctx.fillStyle = owner ? owner.color : '#ffd700';
        ctx.font = 'bold 9px "Fira Code", monospace';
        ctx.fillText(`$${tile.price}`, x + size / 2, y + size - 11);
      } else if (tile.sub) {
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '7.5px "Share Tech Mono", monospace';
        ctx.fillText(tile.sub.substring(0, 11), x + size / 2, y + size - 11);
      }
    }

    drawCenterConsole(ctx, offset, innerSize) {
      const cx = offset + innerSize / 2;
      const cy = offset + innerSize / 2;

      // Marco interior neon
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.strokeRect(offset + 10, offset + 10, innerSize - 20, innerSize - 20);

      // Título Retro
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00f3ff';
      ctx.font = 'bold 13px "Share Tech Mono", monospace';
      ctx.fillText('🕹️ RETRO EMULATOR // MULTIPLAYER EDITION', cx, offset + 38);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 26px "Press Start 2P", monospace';
      ctx.fillText('MONOPOLY', cx, offset + 76);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Share Tech Mono", monospace';
      ctx.fillText('CYBER-PERÚ & SAP ENTERPRISE BOARD [ROM v2.4]', cx, offset + 98);

      if (!this.room) return;

      // Mostrar Dados grandes en el centro
      const [d1, d2] = this.room.dice || [1, 1];
      this.drawDie(ctx, cx - 54, cy - 26, 46, d1);
      this.drawDie(ctx, cx + 8, cy - 26, 46, d2);

      // Mostrar turno actual
      const activePlayer = this.room.players?.[this.room.turnIndex];
      if (activePlayer) {
        ctx.fillStyle = activePlayer.color || '#00f3ff';
        ctx.font = 'bold 14px "Fira Code", monospace';
        ctx.fillText(
          `TURNO ACTIVO: ${activePlayer.token} ${activePlayer.name} ($${activePlayer.money})`,
          cx,
          cy + 46
        );

        const phaseLabel = {
          ROLL: '🎲 PRESIONA [A / LANZAR DADOS]',
          DECIDE: '🏢 [A: COMPRAR PROPIEDad] o [B: PASAR]',
          END: '⏭️ [START: TERMINAR TURNO] o CONSTRUIR CASAS'
        }[this.room.turnPhase] || '';

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11.5px "Share Tech Mono", monospace';
        ctx.fillText(phaseLabel, cx, cy + 68);
      }

      // Mostrar última carta de Casualidad / Arca Comunal si existe
      if (this.room.lastCard) {
        const cardY = cy + 86;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.12)';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.fillRect(cx - 175, cardY, 350, 48);
        ctx.strokeRect(cx - 175, cardY, 350, 48);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 11px "Fira Code", monospace';
        ctx.fillText(`🃏 ${this.room.lastCard.title}`, cx, cardY + 18);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '10px "Share Tech Mono", monospace';
        ctx.fillText(this.room.lastCard.text.substring(0, 54), cx, cardY + 36);
      }

      // Ticker con el último evento de la partida
      const lastLog = this.room.logs?.[this.room.logs.length - 1];
      if (lastLog) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px "Share Tech Mono", monospace';
        ctx.fillText(lastLog.substring(0, 62), cx, offset + innerSize - 24);
      }
    }

    drawDie(ctx, x, y, size, val) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 2;
      ctx.fillRect(x, y, size, size);
      ctx.strokeRect(x, y, size, size);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(val), x + size / 2, y + size / 2 + 8);
    }

    drawPlayers(ctx, cell) {
      const grouped = {};
      this.room.players.forEach((p, idx) => {
        if (p.bankrupt) return;
        const pos = p.position || 0;
        if (!grouped[pos]) grouped[pos] = [];
        grouped[pos].push({ player: p, idx });
      });

      Object.keys(grouped).forEach(posKey => {
        const list = grouped[posKey];
        const { col, row } = this.getGridCoord(Number(posKey));
        const baseX = col * cell;
        const baseY = row * cell;

        list.forEach((item, slot) => {
          const offsetX = (slot % 2 === 0 ? -13 : 13);
          const offsetY = (slot < 2 ? -8 : 12);
          const px = baseX + cell / 2 + offsetX;
          const py = baseY + cell / 2 + offsetY;

          // Halo circular con color del jugador
          ctx.beginPath();
          ctx.arc(px, py, 12, 0, Math.PI * 2);
          ctx.fillStyle = item.player.color || '#00f3ff';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#090d18';
          ctx.stroke();

          ctx.font = '13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.player.token || '🛺', px, py + 4.5);
        });
      });
    }
  }

  window.MonopolyRenderer = MonopolyRenderer;
})();
