export type HostEvent =
  | { type: 'theme:update'; payload: string }
  | { type: 'audio:toggle'; payload: boolean }
  | { type: 'quality:update'; payload: string }
  | { type: 'experience:ready'; payload: string }
  | { type: 'experience:loading'; payload: string }
  | { type: 'experience:complete'; payload: string }
  | { type: 'navigate_request'; payload: string }
  | { type: 'favorite:toggle'; payload: string }
  | { type: 'hotspot:click'; payload: string }
