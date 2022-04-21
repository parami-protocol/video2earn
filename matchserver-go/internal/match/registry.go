package match

import (
	"log"
)

var (
	logger = log.Default()
)

func NewMatchingRegistry(channels []int) MatchRegistry {
	registerReqBuffer := make(map[int]chan *keyedChannel)
	unregisterReqBuffer := make(map[int]chan *MatchKey)
	stops := make(map[int]chan int)

	for _, channel := range channels {
		registerReqBuffer[channel] = make(chan *keyedChannel, 100)
		unregisterReqBuffer[channel] = make(chan *MatchKey, 100)
		stops[channel] = make(chan int)
	}

	return &InMemoryRegistry{
		registerReqBuffer:   registerReqBuffer,
		unregisterReqBuffer: unregisterReqBuffer,
		stops:               stops,
		channels:            channels,
	}
}

type MatchResultType int
type MatchErrorReason int

const (
	Success               MatchResultType  = 1
	Error                 MatchResultType  = 2
	AnotherSessionOngoing MatchErrorReason = 1
)

type MatchResult struct {
	Result MatchResultType
	RoomId string
	Peer   string

	Reason MatchErrorReason
}

type MatchKey struct {
	Account string
}

type MatchRegistry interface {
	Register(channel int, key *MatchKey, peer chan<- *MatchResult)

	Unregister(channel int, key *MatchKey)

	IsChannelAvailable(channel int) bool;

	Run()

	Stop()
}
