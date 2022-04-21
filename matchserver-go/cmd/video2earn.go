package main

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"video2earn/matchserver/internal/match"
)

var (
	matchRegistry match.MatchRegistry = nil
)

func main() {
	matchRegistry = match.NewMatchingRegistry([]int{1, 2})
	matchRegistry.Run()

	router := gin.Default()

	router.POST("/sessions", requestSessions)

	router.Run(":3000")
}

type SessionResponse struct {
	Result     string `json:"result"`
	PeerUserId string `json:"peerUserId"`
	UserId     string `json:"userId"`
	RoomId     string `json:"roomId"`
	Token      string `json:"token"`
}

func requestSessions(c *gin.Context) {
	account := c.Query("account")
	channelStr := c.Query("channel")
	timeoutStr := c.Query("timeout")

	if account == "" || channelStr == "" || timeoutStr == "" {
		c.String(400, "required query params: account, channel, timeout")
		return
	}

	channel, err := strconv.Atoi(channelStr)
	if err != nil {
		c.String(400, "channel not number")
		return
	}

	if !matchRegistry.IsChannelAvailable(channel) {
		c.String(400, "channel not availble")
		return
	}

	timeout, err := strconv.Atoi(timeoutStr)
	if err != nil {
		c.String(400, "timeout not number")
		return
	}

	matchKey := &match.MatchKey{Account: account}
	peerChannel := make(chan *match.MatchResult, 1)

	matchRegistry.Register(channel, matchKey, peerChannel)

	select {
	case <-c.Request.Context().Done():
		{
			matchRegistry.Unregister(channel, matchKey)
			break
		}
	case result := <-peerChannel:
		{
			if result.Result == match.Error {
				switch result.Reason {
				case match.AnotherSessionOngoing:
					c.String(400, "another session ongoing")
				default:
					c.String(500, "unknown match error")
				}
				return
			}

			roomId := result.RoomId
			peerAccount := result.Peer

			c.JSON(200, &SessionResponse{Result: "ok", PeerUserId: peerAccount, UserId: account, RoomId: roomId})
		}
	case <-time.After(time.Second * time.Duration(timeout)):
		{
			matchRegistry.Unregister(channel, matchKey)
			c.JSON(200, &SessionResponse{Result: "none"})
		}
	}

}
