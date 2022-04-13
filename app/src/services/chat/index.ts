import {request} from "umi";

export interface SessionResponse {
  peerAccount: string,
  peerUserName?: string,
  peerUserId: string,
  roomId: string,
  token: string,
  userId: string,
  userName?: string,
}

export async function requestSession(
  account: string,
  channel: string,
  timeoutInSeconds: number
) : Promise<SessionResponse> {
  return request<SessionResponse>('/sessions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        account: account,
        channel: channel,
        timeout: timeoutInSeconds
      }
    }
  )
}
