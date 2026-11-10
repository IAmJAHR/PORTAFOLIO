// =========================================================================
// 📡 MONOPOLY NETWORK SYNC — Patrón: Observer (Pub/Sub) & Adapter
// Sincroniza salas en espera y partidas en tiempo real vía REST + BroadcastChannel
// =========================================================================
(function() {
  class MonopolyNetwork {
    constructor() {
      this.listeners = [];
      this.currentRoomCode = null;
      this.lastVersion = 0;
      this.pollTimer = null;
      this.pingMs = 18;
      this.bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('monopoly_emu_sync') : null;

      if (this.bc) {
        this.bc.onmessage = (ev) => {
          if (ev.data && ev.data.room && ev.data.room.code === this.currentRoomCode) {
            this.lastVersion = ev.data.room.version || 0;
            this.notify('room_updated', ev.data.room);
          } else if (ev.data && ev.data.type === 'lobby_refresh') {
            this.fetchRoomsList();
          }
        };
      }
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notify(event, payload) {
      this.listeners.forEach(fn => fn(event, payload));
    }

    async fetchRoomsList() {
      const t0 = performance.now();
      try {
        const res = await fetch(`/api/monopoly/rooms?_t=${Date.now()}`);
        this.pingMs = Math.max(8, Math.round(performance.now() - t0));
        if (!res.ok) return [];
        const data = await res.json();
        const rooms = data.rooms || [];
        this.notify('rooms_list', rooms);
        return rooms;
      } catch (e) {
        return [];
      }
    }

    async createRoom( { name, hostId, hostName, token, color } ) {
      const res = await fetch('/api/monopoly/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hostId, hostName, token, color })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error creando sala');
      this.connectToRoom(data.room.code, data.room);
      if (this.bc) this.bc.postMessage({ type: 'lobby_refresh' });
      return data.room;
    }

    async joinRoom(code, { playerId, playerName, token, color }) {
      const cleanCode = String(code || '').toUpperCase().trim();
      const res = await fetch(`/api/monopoly/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, playerName, token, color })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'No se pudo unir a la sala');
      this.connectToRoom(data.room.code, data.room);
      if (this.bc) {
        this.bc.postMessage({ room: data.room });
        this.bc.postMessage({ type: 'lobby_refresh' });
      }
      return data.room;
    }

    connectToRoom(code, initialRoom = null) {
      this.currentRoomCode = code;
      if (initialRoom) {
        this.lastVersion = initialRoom.version || 1;
        this.notify('room_updated', initialRoom);
      }
      clearInterval(this.pollTimer);
      this.pollTimer = setInterval(() => this.pollRoomState(), 1400);
    }

    leaveRoom() {
      this.currentRoomCode = null;
      this.lastVersion = 0;
      clearInterval(this.pollTimer);
      this.fetchRoomsList();
    }

    async pollRoomState() {
      if (!this.currentRoomCode) return;
      const t0 = performance.now();
      try {
        const res = await fetch(`/api/monopoly/rooms/${this.currentRoomCode}?_t=${Date.now()}`);
        this.pingMs = Math.max(6, Math.round(performance.now() - t0));
        if (!res.ok) return;
        const data = await res.json();
        if (data.room && (data.room.version || 0) >= this.lastVersion) {
          this.lastVersion = data.room.version || 0;
          this.notify('room_updated', data.room);
        }
      } catch (e) {}
    }

    async pushState(room, logEntry = null) {
      if (!room || !room.code) return;
      try {
        const res = await fetch(`/api/monopoly/rooms/${room.code}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nextState: room, logEntry })
        });
        const data = await res.json();
        if (data.room) {
          this.lastVersion = data.room.version || 0;
          this.notify('room_updated', data.room);
          if (this.bc) this.bc.postMessage({ room: data.room });
        }
      } catch (e) {
        // Fallback local inmediato si hay micro-corte
        this.notify('room_updated', room);
      }
    }
  }

  window.MonopolyNetwork = new MonopolyNetwork();
})();
