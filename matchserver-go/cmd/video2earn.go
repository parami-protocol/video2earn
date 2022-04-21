package main

import (
	"encoding/json"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"

	"video2earn/matchserver/internal/match"
	"video2earn/matchserver/internal/token/token04"
)

const (
	appId = 573234333
)

var (
	matchRegistry    match.MatchRegistry = nil
	zegoServerSecret                     = ""
)

func init() {
	zegoServerSecret = os.Getenv("ZEGO_SERVER_SECRET")
}

func main() {
	if zegoServerSecret == "" {
		panic("no zego server secret is set")
	}

	matchRegistry = match.NewMatchingRegistry([]int{1, 2})
	matchRegistry.Run()

	router := gin.Default()
	router.Use(cors.Default())

	router.POST("/sessions", requestSessions)

	router.Run(":3000")
}

type SessionResponse struct {
	Result      string `json:"result"`
	PeerUserId  string `json:"peerUserId"`
	PeerAccount string `json:"peerAccount"`
	UserId      string `json:"userId"`
	RoomId      string `json:"roomId"`
	Token       string `json:"token"`
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

			c.JSON(200, &SessionResponse{Result: "ok", PeerUserId: peerAccount, PeerAccount: peerAccount, UserId: account, RoomId: roomId, Token: generateToken(account, roomId)})
		}
	case <-time.After(time.Second * time.Duration(timeout)):
		{
			matchRegistry.Unregister(channel, matchKey)
			c.JSON(200, &SessionResponse{Result: "none"})
		}
	}

}

func generateToken(userId string, roomId string) string {
	privilege := make(map[int]int)
	privilege[token04.PrivilegeKeyLogin] = token04.PrivilegeEnable
	privilege[token04.PrivilegeKeyPublish] = token04.PrivilegeEnable

	payloadData := &token04.RtcRoomPayLoad{
		RoomId:       roomId,
		Privilege:    privilege,
		StreamIdList: nil,
	}

	payload, err := json.Marshal(payloadData)
	if err != nil {
		panic(err)
	}

	token, err := token04.GenerateToken04(appId, userId, zegoServerSecret, 300, string(payload))
	if err != nil {
		panic(err)
	}
	return token
}
