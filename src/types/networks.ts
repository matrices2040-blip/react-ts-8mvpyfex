export type ModuleId = 
  | 'intro'
  | 'components'
  | 'topologies'
  | 'media'
  | 'sharing'
  | 'security'
  | 'sandbox'
  | 'quiz';

export type DeviceType = 'pc' | 'switch' | 'hub' | 'router' | 'server' | 'printer';

export interface NetworkNode {
  id: string;
  name: string;
  type: DeviceType;
  x: number;
  y: number;
  ip: string;
  mac: string;
  status: 'online' | 'offline' | 'transmitting' | 'error';
}

export interface NetworkLink {
  id: string;
  from: string;
  to: string;
  type: 'utp' | 'fiber' | 'coaxial';
  speedMbps: number;
  status: 'active' | 'broken' | 'congested';
}

export interface Packet {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  currentNodeId: string;
  progress: number; // 0 to 1
  dataPayload: string;
  color: string;
}

export interface RJ45ColorPin {
  pinNumber: number;
  expectedColor: string;
  colorNameAr: string;
}