import { request } from 'umi';
import { matchServerAddress } from '@/config/custom_config';

export interface SessionResponse {
  result: string;
  peerAccount: string;
  peerUserName?: string;
  peerUserId: string;
  roomId: string;
  token: string;
  userId: string;
  userName?: string;
}

export async function requestSession(
  account: string,
  channel: string,
  timeoutInSeconds: number,
): Promise<SessionResponse> {
  return request<SessionResponse>(`${matchServerAddress}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    params: {
      account: account,
      channel: channel,
      timeout: timeoutInSeconds * 1000,
    },
  });
}
