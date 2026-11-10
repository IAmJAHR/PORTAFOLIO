// =========================================================================
// ⚙️ MONOPOLY GAME ENGINE — Patrón: Command, State Machine & Strategy
// Motor determinista de reglas de Monopoly + IA Bot Strategy
// =========================================================================
(function() {
  const { TILES, GROUPS, CARDS } = window.MonopolyConfig;

  class MonopolyEngine {
    // Calcula el alquiler de una casilla según dueño, monopolio de color y casas
    static calculateRent(room, tile, diceSum = 7) {
      const propState = room.properties[tile.id];
      if (!propState || !propState.ownerId) return 0;

      if (tile.type === 'RAIL') {
        const ownedRails = TILES.filter(t => t.type === 'RAIL' && room.properties[t.id]?.ownerId === propState.ownerId).length;
        return tile.rent[Math.min(ownedRails - 1, 3)] || 25;
      }

      if (tile.type === 'UTILITY') {
        const ownedUtils = TILES.filter(t => t.type === 'UTILITY' && room.properties[t.id]?.ownerId === propState.ownerId).length;
        const mult = ownedUtils >= 2 ? tile.rent[1] : tile.rent[0];
        return diceSum * mult;
      }

      const level = propState.houses || 0;
      let baseRent = tile.rent[level] || tile.rent[0];

      // Si no tiene casas pero el dueño posee todo el grupo de color, renta x2
      if (level === 0 && tile.group) {
        const groupTiles = TILES.filter(t => t.group === tile.group);
        const ownsAll = groupTiles.every(t => room.properties[t.id]?.ownerId === propState.ownerId);
        if (ownsAll) baseRent *= 2;
      }
      return baseRent;
    }

    // Verifica si un jugador posee todo un grupo de color para construir casas
    static ownsFullGroup(room, playerId, groupKey) {
      if (!groupKey || groupKey === 'RAIL' || groupKey === 'UTILITY') return false;
      const groupTiles = TILES.filter(t => t.group === groupKey);
      return groupTiles.length > 0 && groupTiles.every(t => room.properties[t.id]?.ownerId === playerId);
    }

    // Comando: Lanzar Dados y Resolver Casilla
    static executeRoll(room) {
      const player = room.players[room.turnIndex];
      if (!player || player.bankrupt || room.turnPhase !== 'ROLL') return null;

      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2;
      room.dice = [d1, d2];
      room.lastCard = null;

      // Manejo de Cárcel
      if (player.inJail) {
        if (d1 === d2) {
          player.inJail = false;
          player.jailTurns = 0;
          room.logs.push(`🎲 ${player.name} sacó dobles (${d1}+${d2}) y sale libre de la Cárcel.`);
        } else {
          player.jailTurns = (player.jailTurns || 0) + 1;
          if (player.jailTurns >= 3) {
            player.money -= 50;
            player.inJail = false;
            player.jailTurns = 0;
            room.logs.push(`⛓️ ${player.name} pagó fianza obligatoria de $50 tras 3 turnos.`);
          } else {
            room.logs.push(`⛓️ ${player.name} sigue en la Cárcel (${d1}+${d2}). Turno ${player.jailTurns}/3.`);
            room.turnPhase = 'END';
            this.checkBankruptcy(room, player);
            return { d1, d2, moved: false };
          }
        }
      }

      const oldPos = player.position;
      const newPos = (oldPos + sum) % TILES.length;
      if (oldPos + sum >= TILES.length) {
        player.money += 200;
        room.logs.push(`🚀 ${player.name} pasó por SALIDA GO y cobró +$200.`);
      }
      player.position = newPos;

      const tile = TILES[newPos];
      room.logs.push(`🎲 ${player.name} lanzó ${d1}+${d2}=${sum} → cayó en [${tile.name}].`);

      this.resolveTileLanding(room, player, tile, sum);
      return { d1, d2, moved: true, tile };
    }

    static resolveTileLanding(room, player, tile, diceSum) {
      if (tile.type === 'PROP' || tile.type === 'RAIL' || tile.type === 'UTILITY') {
        const prop = room.properties[tile.id];
        if (!prop || !prop.ownerId) {
          room.turnPhase = player.money >= tile.price ? 'DECIDE' : 'END';
        } else if (prop.ownerId !== player.id) {
          const owner = room.players.find(p => p.id === prop.ownerId);
          if (owner && !owner.bankrupt) {
            const rent = this.calculateRent(room, tile, diceSum);
            player.money -= rent;
            owner.money += rent;
            room.logs.push(`💸 ${player.name} pagó $${rent} de alquiler a ${owner.name} en ${tile.name}.`);
          }
          room.turnPhase = 'END';
        } else {
          room.turnPhase = 'END';
        }
      } else if (tile.type === 'TAX') {
        player.money -= tile.amount;
        room.logs.push(`🏛️ ${player.name} pagó $${tile.amount} a ${tile.name}.`);
        room.turnPhase = 'END';
      } else if (tile.type === 'GOTO_JAIL') {
        player.position = 7;
        player.inJail = true;
        player.jailTurns = 0;
        room.logs.push(`🚨 ¡${player.name} fue enviado directo a la CÁRCEL!`);
        room.turnPhase = 'END';
      } else if (tile.type === 'CHANCE' || tile.type === 'CHEST') {
        const deck = CARDS[tile.type];
        const card = deck[Math.floor(Math.random() * deck.length)];
        room.lastCard = { deck: tile.type, ...card };
        if (card.money) {
          player.money += card.money;
          room.logs.push(`🃏 [${card.title}]: ${player.name} ${card.money > 0 ? 'recibe +$' + card.money : 'paga $' + Math.abs(card.money)}.`);
        }
        if (card.moveTo !== undefined) {
          player.position = card.moveTo;
          if (card.collectGo) player.money += 200;
          room.logs.push(`🃏 [${card.title}]: ${player.name} avanza a SALIDA GO (+$200).`);
        }
        if (card.gotoJail) {
          player.position = 7;
          player.inJail = true;
          player.jailTurns = 0;
          room.logs.push(`🃏 [${card.title}]: ${player.name} va a la Cárcel.`);
        }
        room.turnPhase = 'END';
      } else {
        room.turnPhase = 'END';
      }

      this.checkBankruptcy(room, player);
    }

    // Comando: Comprar Propiedad
    static executeBuy(room) {
      const player = room.players[room.turnIndex];
      const tile = TILES[player.position];
      if (!tile || (tile.type !== 'PROP' && tile.type !== 'RAIL' && tile.type !== 'UTILITY')) return false;
      if (room.properties[tile.id]?.ownerId || player.money < tile.price) return false;

      player.money -= tile.price;
      room.properties[tile.id] = { ownerId: player.id, houses: 0 };
      room.logs.push(`🏢 ${player.name} compró [${tile.name}] por $${tile.price}.`);
      
      // Tras comprar, avanza automáticamente al turno del siguiente jugador
      this.executeEndTurn(room);
      return true;
    }

    // Comando: Construir Casa / Hotel
    static executeBuild(room, tileId) {
      const player = room.players[room.turnIndex];
      const tile = TILES[tileId];
      const prop = room.properties[tileId];
      if (!tile || !prop || prop.ownerId !== player.id || tile.type !== 'PROP') return false;
      if (!this.ownsFullGroup(room, player.id, tile.group)) return false;
      if ((prop.houses || 0) >= 5) return false;

      const cost = GROUPS[tile.group].houseCost || 100;
      if (player.money < cost) return false;

      player.money -= cost;
      prop.houses = (prop.houses || 0) + 1;
      const label = prop.houses === 5 ? 'un HOTEL 🏨' : `Casa #${prop.houses} 🏠`;
      room.logs.push(`🔨 ${player.name} construyó ${label} en ${tile.name} (-$${cost}).`);
      return true;
    }

    // Comando: Pagar Fianza de Cárcel ($50)
    static executePayBail(room) {
      const player = room.players[room.turnIndex];
      if (!player || !player.inJail || player.money < 50 || room.turnPhase !== 'ROLL') return false;
      player.money -= 50;
      player.inJail = false;
      player.jailTurns = 0;
      room.logs.push(`🔓 ${player.name} pagó $50 de fianza y salió de la Cárcel.`);
      return true;
    }

    // Comando: Terminar Turno y pasar al siguiente jugador activo
    static executeEndTurn(room) {
      const activePlayers = room.players.filter(p => !p.bankrupt);
      if (activePlayers.length <= 1) {
        room.status = 'FINISHED';
        room.winner = activePlayers[0] || room.players[0];
        return;
      }

      let next = room.turnIndex;
      for (let i = 0; i < room.players.length; i++) {
        next = (next + 1) % room.players.length;
        if (!room.players[next].bankrupt) break;
      }
      room.turnIndex = next;
      room.turnPhase = 'ROLL';
    }

    static checkBankruptcy(room, player) {
      if (player.money >= 0) return;
      player.bankrupt = true;
      player.money = 0;
      Object.keys(room.properties).forEach(tid => {
        if (room.properties[tid]?.ownerId === player.id) {
          delete room.properties[tid];
        }
      });
      room.logs.push(`💥 ¡${player.name} ha declarado BANCARROTA! Sus propiedades vuelven al banco.`);

      const alive = room.players.filter(p => !p.bankrupt);
      if (alive.length === 1) {
        room.status = 'FINISHED';
        room.winner = alive[0];
        room.logs.push(`🏆 ¡${alive[0].name} domina el monopolio y GANA LA PARTIDA!`);
      }
    }

    // Strategy Pattern: Decisión automática para Bots CPU
    static runBotStep(room) {
      const bot = room.players[room.turnIndex];
      if (!bot || !bot.isBot || room.status !== 'PLAYING') return false;

      if (room.turnPhase === 'ROLL') {
        if (bot.inJail && bot.money >= 250) {
          this.executePayBail(room);
        }
        this.executeRoll(room);
        return true;
      }

      if (room.turnPhase === 'DECIDE') {
        const tile = TILES[bot.position];
        if (tile && bot.money >= tile.price + 120) {
          this.executeBuy(room);
        } else {
          room.turnPhase = 'END';
        }
        return true;
      }

      if (room.turnPhase === 'END') {
        // Intentar construir una casa si tiene monopolio y buen capital
        for (const t of TILES) {
          if (t.type === 'PROP' && room.properties[t.id]?.ownerId === bot.id) {
            const cost = GROUPS[t.group]?.houseCost || 100;
            if (this.ownsFullGroup(room, bot.id, t.group) && (room.properties[t.id].houses || 0) < 5 && bot.money >= cost + 300) {
              this.executeBuild(room, t.id);
              break;
            }
          }
        }
        this.executeEndTurn(room);
        return true;
      }
      return false;
    }
  }

  window.MonopolyEngine = MonopolyEngine;
})();
