package match

import (
	"log"
	"github.com/google/uuid"
)


type keyedChannel struct {
	key  *MatchKey
	peer chan<- *MatchResult
}

type unregistryReq struct {
	key *MatchKey
}


type InMemoryRegistry struct {
	channels            []int
	registerReqBuffer   map[int]chan *keyedChannel
	unregisterReqBuffer map[int]chan *MatchKey
	stops               map[int]chan int
}

func (registry *InMemoryRegistry) Register(channel int, key *MatchKey, peer chan<- *MatchResult) {
	reqBuf := registry.registerReqBuffer[channel]
	reqBuf <- &keyedChannel{key: key, peer: peer}
}

func (registry *InMemoryRegistry) Unregister(channel int, key *MatchKey) {
	registry.unregisterReqBuffer[channel] <- key
}

func (registry *InMemoryRegistry) IsChannelAvailable(channel int) bool {
	for _, c := range registry.channels {
		if channel == c {
			return true;
		}
	}
	return false;
}

func (registry *InMemoryRegistry) Run() {
	for _, channel := range registry.channels {
		go registry.runChannel(channel)
	}
}

func (registry *InMemoryRegistry) runChannel(channel int) {
	logger.Printf("start channel match registry %v", channel)
	regChan := registry.registerReqBuffer[channel]
	unregChan := registry.unregisterReqBuffer[channel]
	stop := registry.stops[channel]

	var pendingMatch *keyedChannel = nil

	for {
		select {
		case <-stop:
			{
				break
			}
		case key := <-unregChan:
			{
				log.Printf("unregister %v", key.Account);
				// only unregister when pending match is owned by current request;
				if pendingMatch != nil && pendingMatch.key == key {
					pendingMatch = nil
					log.Printf("unregister %v success", key.Account);
				}
			}
		case keyedChannel := <-regChan:
			{
				log.Printf("regChan receive %v", keyedChannel.key.Account);
				if pendingMatch == nil {
					pendingMatch = keyedChannel
					continue
				}
				if keyedChannel.key.Account == pendingMatch.key.Account {
					pendingMatch.peer <- &MatchResult{Result: Error, Reason: AnotherSessionOngoing}
					pendingMatch = keyedChannel
					continue
				}
				roomId := uuid.NewString()
				pendingMatch.peer <- &MatchResult{Result: Success, RoomId: roomId, Peer: keyedChannel.key.Account}
				keyedChannel.peer <- &MatchResult{Result: Success, RoomId: roomId, Peer: pendingMatch.key.Account}

				pendingMatch = nil
			}
		}
	}

}

func (registry *InMemoryRegistry) Stop() {
	for _, stop := range registry.stops {
		stop <- 1
	}
}
