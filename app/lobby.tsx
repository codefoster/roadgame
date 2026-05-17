import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { RelayClient, generateRoomCode } from '../src/lib/relay';

type Role = 'host' | 'guest' | null;

export default function LobbyScreen() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [status, setStatus] = useState('');
  const relayRef = useRef<RelayClient | null>(null);

  useEffect(() => {
    return () => relayRef.current?.stop();
  }, []);

  function createRoom() {
    const code = generateRoomCode();
    setRoomCode(code);
    setRole('host');
    setStatus(`Room created: ${code}\nWaiting for guest…`);

    const client = new RelayClient(code, (msg) => {
      if (msg.type === 'join') {
        setStatus('Guest joined! Starting…');
        client.send('welcome', {});
        setTimeout(() => {
          client.stop();
          router.push({
            pathname: '/game',
            params: { roomCode: code, mpRole: 'host', weather: 'sunny', region: 'forest', activeBadges: '', purchases: '' },
          });
        }, 1000);
      }
    });
    client.start();
    relayRef.current = client;
  }

  function joinRoom() {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6) { setStatus('Enter a 6-character room code.'); return; }
    setRoomCode(code);
    setRole('guest');
    setStatus(`Joining room ${code}…`);

    const client = new RelayClient(code, (msg) => {
      if (msg.type === 'welcome') {
        setStatus('Connected! Starting…');
        setTimeout(() => {
          client.stop();
          router.push({
            pathname: '/game',
            params: { roomCode: code, mpRole: 'guest', weather: 'sunny', region: 'forest', activeBadges: '', purchases: '' },
          });
        }, 1000);
      }
    });
    client.send('join', {});
    client.start();
    relayRef.current = client;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Play</Text>

      {!role && (
        <>
          <TouchableOpacity style={[styles.btn, styles.hostBtn]} onPress={createRoom}>
            <Text style={styles.btnText}>Create Room</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>— or —</Text>

          <TextInput
            style={styles.input}
            placeholder="Room code"
            placeholderTextColor="#555"
            value={joinInput}
            onChangeText={setJoinInput}
            autoCapitalize="characters"
            maxLength={6}
          />
          <TouchableOpacity style={[styles.btn, styles.joinBtn]} onPress={joinRoom}>
            <Text style={styles.btnText}>Join Room</Text>
          </TouchableOpacity>
        </>
      )}

      {status ? <Text style={styles.status}>{status}</Text> : null}
      {roomCode && role === 'host' && (
        <Text style={styles.roomCode}>{roomCode}</Text>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => { relayRef.current?.stop(); router.back(); }}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a', padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#4a9eff', fontSize: 28, fontWeight: 'bold', marginBottom: 40 },
  btn: { width: '80%', padding: 16, borderRadius: 10, alignItems: 'center', marginBottom: 12 },
  hostBtn: { backgroundColor: '#1a4a1a' },
  joinBtn: { backgroundColor: '#1a1a4a' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  orText: { color: '#555', marginVertical: 16, fontSize: 14 },
  input: {
    width: '80%', borderWidth: 1, borderColor: '#334',
    borderRadius: 8, padding: 12, color: '#fff',
    backgroundColor: '#111', fontSize: 18, textAlign: 'center',
    letterSpacing: 4, marginBottom: 12,
  },
  status: { color: '#aaa', textAlign: 'center', marginTop: 24, fontSize: 15 },
  roomCode: {
    color: '#ffd700', fontSize: 36, fontWeight: 'bold',
    letterSpacing: 8, marginTop: 12,
  },
  backBtn: { position: 'absolute', top: 50, left: 24 },
  backText: { color: '#4a9eff', fontSize: 16 },
});
