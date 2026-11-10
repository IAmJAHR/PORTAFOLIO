// =========================================================================
// 🎮 MONOPOLY EMULATOR CONTROLLER — Patrón: Mediator & Controller
// Coordina el Emulador Web, Sala de Espera Multiplayer, Botones Arcade y Turnos
// =========================================================================
(function() {
  const { TOKENS, GROUPS, TILES } = window.MonopolyConfig;
  const Engine = window.MonopolyEngine;
  const Net = window.MonopolyNetwork;
  const Audio = window.EmulatorAudio;

  class EmulatorController {
    constructor() {
      this.playerId = localStorage.getItem('mnp_player_id') || ('PLY-' + Math.random().toString(36).substring(2, 8).toUpperCase());
      localStorage.setItem('mnp_player_id', this.playerId);

      this.playerName = localStorage.getItem('mnp_player_name') || ('Player_' + this.playerId.slice(-3));
      this.selectedToken = TOKENS[0];
      this.room = null;
      this.botTimer = null;

      this.initDOM();
      this.bindEvents();
      this.bootSequence();
    }

    initDOM() {
      this.bootOverlay = document.getElementById('emu-boot-overlay');
      this.lobbyOverlay = document.getElementById('emu-lobby-overlay');
      this.waitingOverlay = document.getElementById('emu-waiting-overlay');
      this.winnerOverlay = document.getElementById('emu-winner-overlay');

      this.nameInput = document.getElementById('emu-player-name');
      this.roomNameInput = document.getElementById('emu-room-name');
      this.joinCodeInput = document.getElementById('emu-join-code');
      this.roomsListEl = document.getElementById('emu-rooms-list');
      this.tokenSelectorEl = document.getElementById('emu-token-selector');

      this.waitRoomCodeEl = document.getElementById('wait-room-code');
      this.waitRoomTitleEl = document.getElementById('wait-room-title');
      this.waitPlayersListEl = document.getElementById('wait-players-list');
      this.btnStartMatch = document.getElementById('btn-start-match');
      this.btnAddBot = document.getElementById('btn-add-bot');

      this.playersHudEl = document.getElementById('emu-players-hud');
      this.logsEl = document.getElementById('emu-game-logs');
      this.deedCardEl = document.getElementById('emu-deed-inspector');
      this.pingBadgeEl = document.getElementById('emu-ping');
      this.romStatusEl = document.getElementById('emu-rom-status');

      this.btnRoll = document.getElementById('btn-act-roll');
      this.btnBuy = document.getElementById('btn-act-buy');
      this.btnBail = document.getElementById('btn-act-bail');
      this.btnEnd = document.getElementById('btn-act-end');

      if (this.nameInput) this.nameInput.value = this.playerName;
      this.renderTokenChips();

      const canvas = document.getElementById('monopolyCanvas');
      this.renderer = new window.MonopolyRenderer(canvas, (tile) => {
        Audio.beep(520, 0.04, 'square', 0.04);
        this.renderDeedInspector(tile);
      });
      this.renderDeedInspector(TILES[1]);

      const loop = () => {
        this.renderer.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    renderTokenChips() {
      if (!this.tokenSelectorEl) return;
      this.tokenSelectorEl.innerHTML = TOKENS.map((t, idx) => `
        <button type="button" class="token-chip ${idx === 0 ? 'active' : ''}" data-id="${t.id}">
          <span class="t-icon">${t.icon}</span>
          <span class="t-name">${t.name}</span>
        </button>
      `).join('');

      this.tokenSelectorEl.querySelectorAll('.token-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          this.tokenSelectorEl.querySelectorAll('.token-chip').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedToken = TOKENS.find(t => t.id === btn.dataset.id) || TOKENS[0];
          Audio.beep(660, 0.05);
        });
      });
    }

    bootSequence() {
      setTimeout(() => {
        Audio.bootRom();
        if (this.bootOverlay) this.bootOverlay.classList.add('hidden');
        if (this.lobbyOverlay) this.lobbyOverlay.classList.remove('hidden');
        Net.fetchRoomsList();
      }, 1100);

      setInterval(() => {
        if (this.pingBadgeEl) this.pingBadgeEl.textContent = `${Net.pingMs}ms`;
        if (!this.room) Net.fetchRoomsList();
      }, 3000);
    }

    bindEvents() {
      Net.subscribe((event, payload) => {
        if (event === 'rooms_list') this.renderRoomsList(payload);
        if (event === 'room_updated') this.onRoomUpdated(payload);
      });

      // Crear Sala
      document.getElementById('btn-create-room')?.addEventListener('click', async () => {
        this.saveProfileName();
        try {
          Audio.beep(780, 0.08);
          await Net.createRoom({
            name: this.roomNameInput?.value || `Sala de ${this.playerName}`,
            hostId: this.playerId,
            hostName: this.playerName,
            token: this.selectedToken.icon,
            color: this.selectedToken.color
          });
        } catch (err) {
          alert(err.message);
        }
      });

      // Unirse por Código
      document.getElementById('btn-join-code')?.addEventListener('click', async () => {
        const code = this.joinCodeInput?.value?.trim();
        if (!code) return;
        await this.joinRoomByCode(code);
      });

      // Partida Rápida Instantánea (Crea sala con 1 Bot listo o entra directo)
      document.getElementById('btn-quick-play')?.addEventListener('click', async () => {
        this.saveProfileName();
        const room = await Net.createRoom({
          name: `Arcade Express // ${this.playerName}`,
          hostId: this.playerId,
          hostName: this.playerName,
          token: this.selectedToken.icon,
          color: this.selectedToken.color
        });
        this.addCpuBot(room);
      });

      // Refrescar lista de salas
      document.getElementById('btn-refresh-rooms')?.addEventListener('click', () => {
        Audio.beep(600, 0.05);
        Net.fetchRoomsList();
      });

      // Botones de Sala de Espera
      this.btnAddBot?.addEventListener('click', () => {
        if (this.room) this.addCpuBot(this.room);
      });

      this.btnStartMatch?.addEventListener('click', () => {
        if (!this.room) return;
        if (this.room.players.length < 2) {
          this.addCpuBot(this.room, false);
        }
        this.room.status = 'PLAYING';
        this.room.turnIndex = 0;
        this.room.turnPhase = 'ROLL';
        this.room.logs.push('🚀 ¡EMULACIÓN INICIADA! Comienza la carrera por el monopolio.');
        Audio.bootRom();
        Audio.startBGM();
        Net.pushState(this.room);
      });

      document.getElementById('btn-leave-waiting')?.addEventListener('click', () => {
        Net.leaveRoom();
        this.room = null;
        this.waitingOverlay.classList.add('hidden');
        this.lobbyOverlay.classList.remove('hidden');
      });

      // Controles de Juego y Gamepad del Emulador
      this.btnRoll?.addEventListener('click', () => this.handleRoll());
      this.btnBuy?.addEventListener('click', () => this.handleBuy());
      this.btnBail?.addEventListener('click', () => this.handleBail());
      this.btnEnd?.addEventListener('click', () => this.handleEndTurn());

      // Botones físicos del Emulador (A, B, START, SELECT, D-PAD)
      document.getElementById('pad-btn-a')?.addEventListener('click', () => {
        if (!this.room || this.room.status !== 'PLAYING') return;
        if (this.room.turnPhase === 'ROLL') this.handleRoll();
        else if (this.room.turnPhase === 'DECIDE') this.handleBuy();
        else this.handleEndTurn();
      });

      document.getElementById('pad-btn-b')?.addEventListener('click', () => {
        if (!this.room || this.room.status !== 'PLAYING') return;
        if (this.room.turnPhase === 'DECIDE' || this.room.turnPhase === 'END') this.handleEndTurn();
      });

      document.getElementById('pad-btn-start')?.addEventListener('click', () => {
        if (this.room?.status === 'WAITING') this.btnStartMatch?.click();
        else if (this.room?.status === 'PLAYING') this.handleEndTurn();
      });

      document.getElementById('pad-btn-select')?.addEventListener('click', () => {
        this. stepInspector(1);
      });

      document.getElementById('dpad-right')?.addEventListener('click', () => this.stepInspector(1));
      document.getElementById('dpad-left')?.addEventListener('click', () => this.stepInspector(-1));
      document.getElementById('dpad-up')?.addEventListener('click', () => this.stepInspector(7));
      document.getElementById('dpad-down')?.addEventListener('click', () => this.stepInspector(-7));

      // Audio & CRT Scanlines Toggles
      document.getElementById('btn-emu-audio')?.addEventListener('click', (e) => {
        const muted = Audio.toggleMute();
        e.currentTarget.innerHTML = muted ? '<i class="fas fa-volume-mute"></i> MUTE' : '<i class="fas fa-music"></i> 8-BIT';
      });

      document.getElementById('btn-emu-crt')?.addEventListener('click', () => {
        document.querySelector('.emu-crt-screen')?.classList.toggle('crt-off');
        Audio.beep(700, 0.04);
      });

      document.getElementById('btn-emu-lobby')?.addEventListener('click', () => {
        Net.leaveRoom();
        this.room = null;
        Audio.stopBGM();
        this.winnerOverlay?.classList.add('hidden');
        this.waitingOverlay?.classList.add('hidden');
        this.lobbyOverlay?.classList.remove('hidden');
      });

      document.getElementById('btn-winner-lobby')?.addEventListener('click', () => {
        document.getElementById('btn-emu-lobby')?.click();
      });
    }

    stepInspector(delta) {
      const nextId = (this.renderer.selectedTileId + delta + TILES.length) % TILES.length;
      this.renderer.selectedTileId = nextId;
      this.renderDeedInspector(TILES[nextId]);
      Audio.beep(480, 0.03);
    }

    saveProfileName() {
      const val = this.nameInput?.value?.trim();
      if (val) {
        this.playerName = val.substring(0, 18);
        localStorage.setItem('mnp_player_name', this.playerName);
      }
    }

    async joinRoomByCode(code) {
      this.saveProfileName();
      try {
        Audio.beep(720, 0.08);
        await Net.joinRoom(code, {
          playerId: this.playerId,
          playerName: this.playerName,
          token: this.selectedToken.icon,
          color: this.selectedToken.color
        });
      } catch (err) {
        alert(err.message);
      }
    }

    addCpuBot(room, push = true) {
      if (!room || room.players.length >= 4) return;
      const botNames = ['CPU_SENKU', 'CPU_HANA', 'CPU_TORITO', 'CPU_MICHI'];
      const usedTokens = new Set(room.players.map(p => p.token));
      const availToken = TOKENS.find(t => !usedTokens.has(t.icon)) || TOKENS[room.players.length % TOKENS.length];
      const botNum = room.players.filter(p => p.isBot).length + 1;

      room.players.push({
        id: 'BOT-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        name: botNames[(botNum - 1) % botNames.length],
        token: availToken.icon,
        color: availToken.color,
        ready: true,
        isBot: true,
        money: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        bankrupt: false
      });
      room.logs.push(`🤖 Bot ${availToken.icon} se unió a la sala.`);
      Audio.beep(640, 0.07);
      if (push) Net.pushState(room);
    }

    renderRoomsList(rooms) {
      if (!this.roomsListEl) return;
      if (!rooms || rooms.length === 0) {
        this.roomsListEl.innerHTML = `<div class="empty-rooms">No hay salas en espera activas. ¡Crea una sala nueva o inicia Partida Rápida!</div>`;
        return;
      }

      this.roomsListEl.innerHTML = rooms.map(r => `
        <div class="room-item">
          <div class="room-meta">
            <span class="room-code-pill">${r.code}</span>
            <strong>${r.name}</strong>
            <span class="room-status ${r.status === 'WAITING' ? 'st-wait' : 'st-play'}">
              ${r.status === 'WAITING' ? '🟢 EN ESPERA' : '🔥 EN JUEGO'} (${r.playerCount}/${r.maxPlayers})
            </span>
          </div>
          <button class="emu-btn-sm" data-join="${r.code}">
            ${r.status === 'WAITING' ? 'UNIRSE ▶' : 'ESPECTAR 👁️'}
          </button>
        </div>
      `).join('');

      this.roomsListEl.querySelectorAll('[data-join]').forEach(btn => {
        btn.addEventListener('click', () => this.joinRoomByCode(btn.dataset.join));
      });
    }

    onRoomUpdated(room) {
      this.room = room;
      this.renderer.setRoom(room);

      if (this.romStatusEl) {
        this.romStatusEl.textContent = `SALA: ${room.code} // ${room.status}`;
      }

      if (room.status === 'WAITING') {
        this.lobbyOverlay?.classList.add('hidden');
        this.waitingOverlay?.classList.remove('hidden');
        this.winnerOverlay?.classList.add('hidden');
        this.renderWaitingRoom(room);
      } else if (room.status === 'PLAYING') {
        this.lobbyOverlay?.classList.add('hidden');
        this.waitingOverlay?.classList.add('hidden');
        this.winnerOverlay?.classList.add('hidden');
        this.renderGameHUD(room);
        this.scheduleBotIfNeeded(room);
      } else if (room.status === 'FINISHED') {
        this.waitingOverlay?.classList.add('hidden');
        this.renderGameHUD(room);
        this.showWinnerModal(room);
      }
    }

    renderWaitingRoom(room) {
      if (this.waitRoomCodeEl) this.waitRoomCodeEl.textContent = room.code;
      if (this.waitRoomTitleEl) this.waitRoomTitleEl.textContent = room.name;

      if (this.waitPlayersListEl) {
        this.waitPlayersListEl.innerHTML = room.players.map((p, i) => `
          <div class="wait-player-card" style="border-color:${p.color}">
            <div class="wp-avatar" style="background:${p.color}22">${p.token}</div>
            <div class="wp-info">
              <strong>${p.name} ${p.id === this.playerId ? '(TÚ)' : ''}</strong>
              <span>${i === 0 ? '👑 ANFITRIÓN' : (p.isBot ? '🤖 IA BOT' : '👾 JUGADOR ONLINE')}</span>
            </div>
            <span class="wp-ready">LISTO ✔</span>
          </div>
        `).join('');
      }

      const isHost = room.hostId === this.playerId;
      if (this.btnStartMatch) {
        this.btnStartMatch.disabled = !isHost;
        this.btnStartMatch.textContent = isHost
          ? (room.players.length < 2 ? '▶ INICIAR (AUTO +1 BOT)' : '▶ INICIAR PARTIDA MULTIPLAYER')
          : '⏳ ESPERANDO AL ANFITRIÓN...';
      }
      if (this.btnAddBot) {
        this.btnAddBot.style.display = isHost && room.players.length < 4 ? 'inline-flex' : 'none';
      }
    }

    renderGameHUD(room) {
      const activePlayer = room.players[room.turnIndex];
      const isMyTurn = activePlayer && activePlayer.id === this.playerId && !activePlayer.isBot;

      // Lista de jugadores y sus finanzas
      if (this.playersHudEl) {
        this.playersHudEl.innerHTML = room.players.map((p, idx) => {
          const propCount = Object.values(room.properties || {}).filter(pr => pr.ownerId === p.id).length;
          return `
            <div class="hud-player-card ${idx === room.turnIndex ? 'active-turn' : ''} ${p.bankrupt ? 'is-bankrupt' : ''}" style="border-left: 4px solid ${p.color}">
              <div class="hp-top">
                <span class="hp-name">${p.token} ${p.name} ${p.id === this.playerId ? '<small>(TÚ)</small>' : ''}</span>
                <span class="hp-money">$${p.money}</span>
              </div>
              <div class="hp-sub">
                <span>🏢 Propiedades: ${propCount}</span>
                <span>📍 ${TILES[p.position || 0]?.name}</span>
                ${p.inJail ? '<span class="jail-pill">⛓️ CÁRCEL</span>' : ''}
              </div>
            </div>
          `;
        }).join('');
      }

      // Estado de botones de acción
      if (activePlayer) {
        const currentTile = TILES[activePlayer.position || 0];
        const canBuy = isMyTurn && room.turnPhase === 'DECIDE' &&
          !room.properties?.[currentTile.id]?.ownerId &&
          activePlayer.money >= (currentTile.price || 9999);

        if (this.btnRoll) this.btnRoll.disabled = !(isMyTurn && room.turnPhase === 'ROLL');
        if (this.btnBuy) {
          this.btnBuy.disabled = !canBuy;
          this.btnBuy.textContent = canBuy ? `🏢 COMPRAR ($${currentTile.price})` : '🏢 COMPRAR';
        }
        if (this.btnBail) {
          this.btnBail.style.display = (isMyTurn && activePlayer.inJail && room.turnPhase === 'ROLL') ? 'inline-flex' : 'none';
        }
        if (this.btnEnd) {
          this.btnEnd.disabled = !(isMyTurn && (room.turnPhase === 'DECIDE' || room.turnPhase === 'END'));
        }
      }

      // Actualizar bitácora
      if (this.logsEl && Array.isArray(room.logs)) {
        this.logsEl.innerHTML = room.logs.slice(-12).reverse().map(l => `<div class="log-line">${l}</div>`).join('');
      }

      // Actualizar inspector de título de propiedad
      this.renderDeedInspector(TILES[this.renderer.selectedTileId]);
    }

    renderDeedInspector(tile) {
      if (!this.deedCardEl || !tile) return;
      const group = tile.group ? GROUPS[tile.group] : null;
      const propState = this.room?.properties?.[tile.id];
      const owner = propState?.ownerId ? this.room?.players?.find(p => p.id === propState.ownerId) : null;

      const activePlayer = this.room?.players?.[this.room?.turnIndex];
      const canBuild = this.room &&
        this.room.status === 'PLAYING' &&
        activePlayer &&
        activePlayer.id === this.playerId &&
        propState?.ownerId === this.playerId &&
        tile.type === 'PROP' &&
        Engine.ownsFullGroup(this.room, this.playerId, tile.group) &&
        (propState.houses || 0) < 5 &&
        activePlayer.money >= (group?.houseCost || 100);

      this.deedCardEl.innerHTML = `
        <div class="deed-header" style="background:${group ? group.color : '#1e293b'}">
          <span>${group ? group.name.toUpperCase() : 'CASILLA ESPECIAL'}</span>
          <strong>${tile.icon || '🏢'} ${tile.name}</strong>
        </div>
        <div class="deed-body">
          ${tile.price ? `<div class="deed-row"><span>Valor de Compra:</span><strong>$${tile.price}</strong></div>` : ''}
          ${tile.rent ? `<div class="deed-row"><span>Alquiler Base:</span><strong>$${tile.rent[0]}</strong></div>` : ''}
          ${tile.type === 'PROP' ? `
            <div class="deed-row"><span>Con 1 / 2 / 3 Casas:</span><span>$${tile.rent[1]} / $${tile.rent[2]} / $${tile.rent[3]}</span></div>
            <div class="deed-row"><span>Con Hotel 🏨:</span><strong>$${tile.rent[5]}</strong></div>
            <div class="deed-row"><span>Costo Edificar:</span><span>$${group?.houseCost}/nivel</span></div>
          ` : ''}
          <div class="deed-owner">
            Propietario: <strong style="color:${owner ? owner.color : '#94a3b8'}">${owner ? `${owner.token} ${owner.name}` : 'Disponible (Banco)'}</strong>
          </div>
          ${canBuild ? `<button id="btn-build-house" class="emu-btn-primary" style="width:100%;margin-top:6px;">🔨 CONSTRUIR CASA ($${group.houseCost})</button>` : ''}
        </div>
      `;

      document.getElementById('btn-build-house')?.addEventListener('click', () => {
        if (Engine.executeBuild(this.room, tile.id)) {
          Audio.buyProperty();
          Net.pushState(this.room);
        }
      });
    }

    handleRoll() {
      if (!this.room) return;
      const res = Engine.executeRoll(this.room);
      if (res) {
        Audio.diceRoll();
        if (res.tile) {
          this.renderer.selectedTileId = res.tile.id;
        }
        Net.pushState(this.room);
      }
    }

    handleBuy() {
      if (!this.room) return;
      if (Engine.executeBuy(this.room)) {
        Audio.buyProperty();
        Net.pushState(this.room);
      }
    }

    handleBail() {
      if (!this.room) return;
      if (Engine.executePayBail(this.room)) {
        Audio.beep(880, 0.1);
        Net.pushState(this.room);
      }
    }

    handleEndTurn() {
      if (!this.room) return;
      Engine.executeEndTurn(this.room);
      Audio.stepHop();
      Net.pushState(this.room);
    }

    scheduleBotIfNeeded(room) {
      clearTimeout(this.botTimer);
      const current = room.players[room.turnIndex];
      if (!current || !current.isBot || room.status !== 'PLAYING') return;

      // El anfitrión (o el primer jugador humano activo) ejecuta el paso del Bot
      const firstHuman = room.players.find(p => !p.isBot && !p.bankrupt);
      if (firstHuman && firstHuman.id !== this.playerId) return;

      this.botTimer = setTimeout(() => {
        if (Engine.runBotStep(this.room)) {
          Audio.stepHop();
          Net.pushState(this.room);
        }
      }, 950);
    }

    showWinnerModal(room) {
      if (!this.winnerOverlay) return;
      this.winnerOverlay.classList.remove('hidden');
      const w = room.winner || room.players[0];
      const titleEl = document.getElementById('winner-title');
      if (titleEl && w) {
        titleEl.textContent = `${w.token} ¡${w.name} GANA EL MONOPOLIO CON $${w.money}!`;
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.MonopolyApp = new EmulatorController();
  });
})();
