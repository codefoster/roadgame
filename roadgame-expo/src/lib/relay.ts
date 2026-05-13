// Thin wrapper around ntfy.sh pub/sub for multiplayer relay.
// Room topic: roadgame-{ROOM_CODE}

export type RelayMessage = {
  type: 'join' | 'welcome' | 'start' | 'sync';
  senderId: string;
  payload?: Record<string, unknown>;
};

type MessageCallback = (msg: RelayMessage) => void;

export class RelayClient {
  private roomCode: string;
  private senderId: string;
  private lastId = '0';
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private onMessage: MessageCallback;

  constructor(roomCode: string, onMessage: MessageCallback) {
    this.roomCode = roomCode;
    this.senderId = Math.random().toString(36).slice(2, 10);
    this.onMessage = onMessage;
  }

  get topic(): string {
    return `roadgame-${this.roomCode}`;
  }

  start() {
    this.pollInterval = setInterval(() => this.poll(), 3000);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async send(type: RelayMessage['type'], payload?: Record<string, unknown>) {
    const body = JSON.stringify({ type, senderId: this.senderId, payload });
    try {
      await fetch(`https://ntfy.sh/${this.topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch {
      // network errors silently ignored
    }
  }

  private async poll() {
    try {
      const res = await fetch(
        `https://ntfy.sh/${this.topic}/json?since=${this.lastId}&poll=1`
      );
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.id) this.lastId = event.id;
          if (event.message) {
            const msg: RelayMessage = JSON.parse(event.message);
            if (msg.senderId !== this.senderId) {
              this.onMessage(msg);
            }
          }
        } catch {
          // malformed event
        }
      }
    } catch {
      // network error
    }
  }
}

export function generateRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}
